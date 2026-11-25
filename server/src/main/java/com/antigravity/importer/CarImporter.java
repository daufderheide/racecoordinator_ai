package com.antigravity.importer;

import com.antigravity.context.DatabaseContext;
import com.antigravity.importer.CarImportParser.ParsedCar;
import com.antigravity.importer.CarImportParser.ParsedFile;
import com.antigravity.importer.model.CarImportCommitRequest;
import com.antigravity.importer.model.CarImportPreview;
import com.antigravity.importer.model.CarImportPreview.FieldChange;
import com.antigravity.importer.model.CarImportResult;
import com.antigravity.importer.model.CarImportRow;
import com.antigravity.models.Car;
import com.antigravity.models.CarField;
import com.antigravity.proto.AssetMessage;
import com.antigravity.repository.SqliteRepository;
import com.antigravity.service.AssetService;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Imports slotcars (#1210, step 6b) in two steps, like the driver import: {@link #preview} reads
 * the file and says what would happen; {@link #commit} saves the rows the user sends back.
 *
 * <ul>
 *   <li>Cars are matched by name (ignoring case); ids in the file are ignored.
 *   <li>A column that isn't a car detail is an own field, matched by name. A field that doesn't
 *       exist yet is created: as text, or with the type a JSON export gives it.
 *   <li>A choice value that isn't one of the field's options is added as an option.
 *   <li>Overwriting a car changes only what the file has; other own-field values stay.
 * </ul>
 */
public class CarImporter {

  private static final Logger logger = LoggerFactory.getLogger(CarImporter.class);

  static final Set<String> YES =
      new HashSet<>(Arrays.asList("yes", "true", "1", "x", "y", "ja", "oui", "si", "sí", "sim"));

  private final AssetService assetService;
  private final SqliteRepository<Car> carRepository;
  private final SqliteRepository<CarField> fieldRepository;

  public CarImporter(DatabaseContext databaseContext, AssetService assetService) {
    this.assetService = assetService;
    this.carRepository = new SqliteRepository<>(databaseContext, "cars", Car.class);
    this.fieldRepository = new SqliteRepository<>(databaseContext, "car_fields", CarField.class);
  }

  // ---------------------------------------------------------------- preview

  /**
   * Reads the file and checks every car. The pictures in it are saved as assets now (identical
   * pictures are stored once), so the preview can show them.
   */
  public CarImportPreview preview(byte[] data, String fileName, Map<String, byte[]> companions)
      throws IOException {
    ParsedFile file = CarImportParser.parse(data, fileName, companions);
    CarImportPreview preview = new CarImportPreview();

    Map<String, String> savedPictures = new LinkedHashMap<>();
    List<Car> existing = carRepository.findAll();
    for (Car car : existing) {
      preview
          .getExistingCars()
          .add(new CarImportPreview.ExistingCar(car.getEntityId(), car.getName()));
    }

    Set<String> namesInFile = new HashSet<>();
    int index = 0;
    for (ParsedCar parsed : file.cars) {
      CarImportRow row = toRow(parsed, ++index, file.pictures, savedPictures);
      checkName(row, existing, namesInFile);
      preview.getRows().add(row);
    }
    preview.setImportedAssetNames(new ArrayList<>(savedPictures.keySet()));
    describeFieldChanges(preview, file.fields);

    for (CarImportRow row : preview.getRows()) {
      switch (row.getStatus()) {
        case CarImportRow.STATUS_ERROR:
          preview.setErrorCount(preview.getErrorCount() + 1);
          break;
        case CarImportRow.STATUS_CONFLICT:
          preview.setConflictCount(preview.getConflictCount() + 1);
          break;
        default:
          preview.setValidCount(preview.getValidCount() + 1);
      }
    }
    preview.setTotalRows(preview.getRows().size());
    return preview;
  }

  private CarImportRow toRow(
      ParsedCar parsed, int index, Map<String, byte[]> pictures, Map<String, String> saved) {
    CarImportRow row = new CarImportRow();
    row.setRowIndex(index);
    String name = parsed.values.getOrDefault(CarImportParser.KEY_NAME, "").trim();
    row.setRawName(name);
    row.setResolvedName(name);
    for (String key : CarImportParser.VALUE_KEYS) {
      if (parsed.values.containsKey(key)) {
        row.getValues().put(key, parsed.values.get(key));
      }
    }
    row.setCustomValues(parsed.customValues);

    String picture = row.getValues().get(CarImportParser.KEY_PICTURE);
    if (picture != null && !picture.isEmpty()) {
      String url = resolvePicture(picture, pictures, saved);
      if (url != null) {
        row.getValues().put(CarImportParser.KEY_PICTURE, url);
      } else {
        // Keep the car's picture rather than pointing at a file that isn't there.
        row.getValues().remove(CarImportParser.KEY_PICTURE);
        row.setMessage("Picture not found: " + picture);
      }
    }
    return row;
  }

  /** The asset URL for a picture value: a file from the ZIP, or an existing /assets/ URL. */
  private String resolvePicture(
      String value, Map<String, byte[]> pictures, Map<String, String> saved) {
    String clean = value.trim().replace('\\', '/');
    if (clean.startsWith("/assets/")
        || clean.startsWith("http://")
        || clean.startsWith("https://")) {
      return clean;
    }
    String lower = clean.toLowerCase(Locale.ROOT);
    while (lower.startsWith("./") || lower.startsWith("/")) {
      lower = lower.substring(lower.startsWith("./") ? 2 : 1);
    }
    String simple = DriverImportParserHelper.getSimpleFileName(lower);
    byte[] bytes = pictures.containsKey(lower) ? pictures.get(lower) : pictures.get(simple);
    if (bytes == null || assetService == null) {
      return null;
    }
    if (saved.containsKey(simple)) {
      return saved.get(simple);
    }
    try {
      AssetMessage asset =
          assetService.saveAsset(DriverImportParserHelper.getSimpleFileName(clean), "image", bytes);
      saved.put(simple, asset.getUrl());
      return asset.getUrl();
    } catch (IOException e) {
      logger.warn("Could not save the picture {} of a car import", clean, e);
      return null;
    }
  }

  private static void checkName(CarImportRow row, List<Car> existing, Set<String> namesInFile) {
    String name = row.getResolvedName();
    if (name.isEmpty()) {
      row.setStatus(CarImportRow.STATUS_ERROR);
      row.setMessage("Name is required");
      return;
    }
    String lower = name.toLowerCase(Locale.ROOT);
    if (!namesInFile.add(lower)) {
      row.setStatus(CarImportRow.STATUS_CONFLICT);
      row.setConflictType(CarImportRow.CONFLICT_IN_FILE);
      row.setSelectedResolution(CarImportRow.RESOLUTION_SKIP);
      return;
    }
    for (Car car : existing) {
      if (car.getName() != null && car.getName().trim().equalsIgnoreCase(name)) {
        row.setStatus(CarImportRow.STATUS_CONFLICT);
        row.setConflictType(CarImportRow.CONFLICT_NAME);
        row.setSelectedResolution(CarImportRow.RESOLUTION_SKIP);
        row.setExistingCarId(car.getEntityId());
        return;
      }
    }
  }

  /** Fills newFields (fields the import creates) and newOptions (options it adds). */
  private void describeFieldChanges(CarImportPreview preview, List<FieldChange> jsonFields) {
    Map<String, CarField> fields = fieldsByName(fieldRepository.findAll());
    Map<String, FieldChange> types = new LinkedHashMap<>();
    for (FieldChange f : jsonFields) {
      types.put(f.getName().toLowerCase(Locale.ROOT), f);
    }
    Map<String, FieldChange> created = new LinkedHashMap<>();
    Map<String, FieldChange> options = new LinkedHashMap<>();
    for (CarImportRow row : preview.getRows()) {
      if (CarImportRow.STATUS_ERROR.equals(row.getStatus())) continue;
      for (Map.Entry<String, String> e : row.getCustomValues().entrySet()) {
        String lower = e.getKey().toLowerCase(Locale.ROOT);
        CarField field = fields.get(lower);
        if (field == null) {
          FieldChange change =
              created.computeIfAbsent(lower, k -> newFieldFor(e.getKey(), types.get(k)));
          addOptionIfNew(change, e.getValue());
        } else if (CarField.TYPE_CHOICE.equals(field.getType())
            && !e.getValue().isEmpty()
            && !containsIgnoreCase(field.getOptions(), e.getValue())) {
          FieldChange change =
              options.computeIfAbsent(
                  lower, k -> new FieldChange(field.getName(), field.getType(), new ArrayList<>()));
          if (!containsIgnoreCase(change.getOptions(), e.getValue())) {
            change.getOptions().add(e.getValue());
          }
        }
      }
    }
    preview.setNewFields(new ArrayList<>(created.values()));
    preview.setNewOptions(new ArrayList<>(options.values()));
  }

  private static FieldChange newFieldFor(String name, FieldChange fromJson) {
    if (fromJson != null && CarField.TYPES.contains(fromJson.getType())) {
      return new FieldChange(name, fromJson.getType(), fromJson.getOptions());
    }
    return new FieldChange(name, CarField.TYPE_TEXT, null);
  }

  private static void addOptionIfNew(FieldChange change, String value) {
    if (CarField.TYPE_CHOICE.equals(change.getType())
        && value != null
        && !value.isEmpty()
        && !containsIgnoreCase(change.getOptions(), value)) {
      change.getOptions().add(value);
    }
  }

  // ---------------------------------------------------------------- commit

  /** Saves the rows as the user left them in the preview. */
  public CarImportResult commit(CarImportCommitRequest request) {
    CarImportResult result = new CarImportResult();
    List<CarImportRow> rows = request.getRows();
    Map<String, CarField> fields = ensureFields(rows, request.getNewFields(), result);
    addMissingOptions(rows, fields);

    Set<String> taken = new HashSet<>();
    for (Car car : carRepository.findAll()) {
      if (car.getName() != null) taken.add(car.getName().trim().toLowerCase(Locale.ROOT));
    }

    for (CarImportRow row : rows) {
      String status = row.getStatus();
      String resolution = row.getSelectedResolution();
      if (CarImportRow.STATUS_ERROR.equals(status) || row.getResolvedName().trim().isEmpty()) {
        continue;
      }
      if (CarImportRow.STATUS_CONFLICT.equals(status)) {
        if (CarImportRow.RESOLUTION_OVERWRITE.equals(resolution)
            && row.getExistingCarId() != null) {
          Car existing = carRepository.findByEntityId(row.getExistingCarId());
          if (existing != null) {
            Car updated = apply(Car.Builder.from(existing), existing, row, fields).build();
            carRepository.replace(existing.getEntityId(), updated);
            result.getUpdatedCarIds().add(existing.getEntityId());
            result.setUpdatedCount(result.getUpdatedCount() + 1);
            continue;
          }
        }
        if (!CarImportRow.RESOLUTION_AUTO_RENAME.equals(resolution)) {
          result.setSkippedCount(result.getSkippedCount() + 1);
          continue;
        }
      }
      String name = uniqueName(row.getResolvedName().trim(), taken);
      String id = carRepository.getNextSequence();
      Car car =
          apply(new Car.Builder(), null, row, fields)
              .withName(name)
              .withEntityId(id)
              .withId(null)
              .build();
      carRepository.insert(car);
      result.getCreatedCarIds().add(id);
      result.setImportedCount(result.getImportedCount() + 1);
    }
    result.setSuccess(true);
    return result;
  }

  /**
   * The own fields by lower-case name, creating the ones the rows use that don't exist yet (with
   * the type the preview gave, text otherwise).
   */
  private Map<String, CarField> ensureFields(
      List<CarImportRow> rows, List<FieldChange> newFields, CarImportResult result) {
    List<CarField> all = fieldRepository.findAll();
    Map<String, CarField> fields = fieldsByName(all);
    Map<String, FieldChange> types = new LinkedHashMap<>();
    for (FieldChange f : newFields) {
      if (f.getName() != null) types.put(f.getName().trim().toLowerCase(Locale.ROOT), f);
    }
    int position = all.stream().mapToInt(CarField::getPosition).max().orElse(-1);
    for (CarImportRow row : rows) {
      if (!willSave(row)) continue;
      for (String name : row.getCustomValues().keySet()) {
        String trimmed = name.trim();
        String lower = trimmed.toLowerCase(Locale.ROOT);
        if (trimmed.isEmpty() || fields.containsKey(lower)) continue;
        FieldChange type = newFieldFor(trimmed, types.get(lower));
        String id = UUID.randomUUID().toString();
        CarField field =
            new CarField.Builder()
                .withName(trimmed)
                .withType(type.getType())
                .withOptions(type.getOptions())
                .withPosition(++position)
                .withEntityId(id)
                .withId(id)
                .build();
        fieldRepository.insert(field);
        fields.put(lower, field);
        result.getCreatedFieldNames().add(trimmed);
      }
    }
    return fields;
  }

  /** Adds choice values the rows use that aren't options yet. */
  private void addMissingOptions(List<CarImportRow> rows, Map<String, CarField> fields) {
    for (Map.Entry<String, CarField> entry : new ArrayList<>(fields.entrySet())) {
      CarField field = entry.getValue();
      if (!CarField.TYPE_CHOICE.equals(field.getType())) continue;
      List<String> options = new ArrayList<>(field.getOptions());
      for (CarImportRow row : rows) {
        if (!willSave(row)) continue;
        for (Map.Entry<String, String> v : row.getCustomValues().entrySet()) {
          String value = v.getValue() == null ? "" : v.getValue().trim();
          if (v.getKey().trim().equalsIgnoreCase(field.getName())
              && !value.isEmpty()
              && !containsIgnoreCase(options, value)) {
            options.add(value);
          }
        }
      }
      if (options.size() > field.getOptions().size()) {
        CarField updated = CarField.Builder.from(field).withOptions(options).build();
        fieldRepository.replace(field.getEntityId(), updated);
        fields.put(entry.getKey(), updated);
      }
    }
  }

  private static boolean willSave(CarImportRow row) {
    if (CarImportRow.STATUS_ERROR.equals(row.getStatus())) return false;
    return !CarImportRow.STATUS_CONFLICT.equals(row.getStatus())
        || CarImportRow.RESOLUTION_OVERWRITE.equals(row.getSelectedResolution())
        || CarImportRow.RESOLUTION_AUTO_RENAME.equals(row.getSelectedResolution());
  }

  /** Sets what the row has on the builder; what it doesn't have stays as it was. */
  private static Car.Builder apply(
      Car.Builder b, Car existing, CarImportRow row, Map<String, CarField> fields) {
    Map<String, String> v = row.getValues();
    if (v.containsKey(CarImportParser.KEY_PICTURE))
      b.withAvatarUrl(v.get(CarImportParser.KEY_PICTURE));
    if (v.containsKey("brand")) b.withBrand(v.get("brand"));
    if (v.containsKey("carClass")) b.withCarClass(v.get("carClass"));
    if (v.containsKey("scale")) b.withScale(v.get("scale"));
    if (v.containsKey("motor")) b.withMotor(v.get("motor"));
    if (v.containsKey("magnet")) b.withMagnet(v.get("magnet"));
    if (v.containsKey("chassis")) b.withChassis(v.get("chassis"));
    if (v.containsKey("gears")) b.withGears(v.get("gears"));
    if (v.containsKey("tyres")) b.withTyres(v.get("tyres"));
    if (v.containsKey(CarImportParser.KEY_MODIFIED)) {
      b.withModified(isYes(v.get(CarImportParser.KEY_MODIFIED)));
    }
    if (v.containsKey("notes")) b.withNotes(v.get("notes"));

    Map<String, String> custom =
        new LinkedHashMap<>(existing != null ? existing.getCustomValues() : new LinkedHashMap<>());
    for (Map.Entry<String, String> e : row.getCustomValues().entrySet()) {
      CarField field = fields.get(e.getKey().trim().toLowerCase(Locale.ROOT));
      if (field == null) continue;
      String value = e.getValue() == null ? "" : e.getValue().trim();
      if (CarField.TYPE_BOOLEAN.equals(field.getType())) {
        value = isYes(value) ? "true" : "";
      } else if (CarField.TYPE_CHOICE.equals(field.getType())) {
        value = matchOption(field.getOptions(), value);
      }
      if (value.isEmpty()) {
        custom.remove(field.getEntityId());
      } else {
        custom.put(field.getEntityId(), value);
      }
    }
    return b.withCustomValues(custom);
  }

  static boolean isYes(String value) {
    return value != null && YES.contains(value.trim().toLowerCase(Locale.ROOT));
  }

  /** The option as the field spells it, so "soft" matches "Soft". */
  private static String matchOption(List<String> options, String value) {
    for (String option : options) {
      if (option.equalsIgnoreCase(value)) return option;
    }
    return value;
  }

  /** The name, or "name (2)", "name (3)"... when it's taken; marks the result as taken. */
  static String uniqueName(String name, Set<String> taken) {
    String candidate = name;
    int n = 2;
    while (taken.contains(candidate.toLowerCase(Locale.ROOT))) {
      candidate = name + " (" + n++ + ")";
    }
    taken.add(candidate.toLowerCase(Locale.ROOT));
    return candidate;
  }

  private static Map<String, CarField> fieldsByName(List<CarField> fields) {
    Map<String, CarField> byName = new LinkedHashMap<>();
    for (CarField f : fields) {
      if (f != null && f.getName() != null) {
        byName.put(f.getName().trim().toLowerCase(Locale.ROOT), f);
      }
    }
    return byName;
  }

  private static boolean containsIgnoreCase(List<String> list, String value) {
    for (String s : list) {
      if (s.equalsIgnoreCase(value)) return true;
    }
    return false;
  }
}

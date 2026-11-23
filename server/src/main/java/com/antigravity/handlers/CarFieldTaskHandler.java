package com.antigravity.handlers;

import com.antigravity.auth.Role;
import com.antigravity.context.DatabaseContext;
import com.antigravity.models.Car;
import com.antigravity.models.CarField;
import com.antigravity.repository.SqliteRepository;
import io.javalin.Javalin;
import io.javalin.http.Context;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * REST endpoints for the user's own slotcar fields (table "car_fields"). Each car keeps its values
 * for these fields in {@link Car#getCustomValues()}.
 */
public class CarFieldTaskHandler {
  private static final Logger logger = LoggerFactory.getLogger(CarFieldTaskHandler.class);

  static final String NAME_REQUIRED = "Field name cannot be empty";
  static final String NAME_EXISTS = "A field with this name already exists";
  static final String TYPE_INVALID = "Field type must be text, number, boolean or choice";
  static final String TYPE_FIXED = "The type of a field cannot be changed";
  static final String CHOICES_REQUIRED = "A choice field needs at least one choice";
  static final String NOT_FOUND = "Field not found";

  private final SqliteRepository<CarField> fieldRepository;
  private final SqliteRepository<Car> carRepository;

  public CarFieldTaskHandler(DatabaseContext databaseContext, Javalin app) {
    this.fieldRepository = new SqliteRepository<>(databaseContext, "car_fields", CarField.class);
    this.carRepository = new SqliteRepository<>(databaseContext, "cars", Car.class);

    app.get("/api/car-fields", this::getFields, Role.VIEWER);
    app.post("/api/car-fields", this::createField, Role.DIRECTOR);
    app.put("/api/car-fields/{id}", this::updateField, Role.DIRECTOR);
    app.delete("/api/car-fields/{id}", this::deleteField, Role.DIRECTOR);
  }

  /** The fields in editor order (position, then name). */
  public List<CarField> sortedFields() {
    return fieldRepository.findAll().stream()
        .sorted(
            Comparator.comparingInt(CarField::getPosition)
                .thenComparing(f -> f.getName() == null ? "" : f.getName()))
        .collect(Collectors.toList());
  }

  public void getFields(Context ctx) {
    ctx.json(sortedFields());
  }

  public void createField(Context ctx) {
    try {
      CarField field = DatabaseHandlerUtils.bodyAsClassWithId(ctx.body(), CarField.class);
      ctx.status(201).json(createField(field));
    } catch (IllegalStateException e) {
      ctx.status(400).result(e.getMessage());
    } catch (IllegalArgumentException e) {
      ctx.status(409).result(e.getMessage());
    } catch (Exception e) {
      logger.error("Error creating car field", e);
      ctx.status(500).result("Error creating car field: " + e.getMessage());
    }
  }

  /** Adds a field at the end, with a new id. */
  public CarField createField(CarField field) {
    String name = checkName(field, null);
    String type = field.getType() == null ? "" : field.getType().trim();
    if (!CarField.TYPES.contains(type)) {
      throw new IllegalStateException(TYPE_INVALID);
    }
    int position =
        fieldRepository.findAll().stream().mapToInt(CarField::getPosition).max().orElse(-1) + 1;
    String id = UUID.randomUUID().toString();
    CarField toSave =
        new CarField.Builder()
            .withName(name)
            .withType(type)
            .withOptions(checkOptions(type, field.getOptions()))
            .withPosition(position)
            .withEntityId(id)
            .withId(id)
            .build();
    fieldRepository.insert(toSave);
    return toSave;
  }

  public void updateField(Context ctx) {
    try {
      String id = ctx.pathParam("id");
      CarField field = DatabaseHandlerUtils.bodyAsClassWithId(ctx.body(), CarField.class);
      ctx.json(updateField(id, field));
    } catch (FieldNotFoundException e) {
      ctx.status(404).result(e.getMessage());
    } catch (IllegalStateException e) {
      ctx.status(400).result(e.getMessage());
    } catch (IllegalArgumentException e) {
      ctx.status(409).result(e.getMessage());
    } catch (Exception e) {
      logger.error("Error updating car field", e);
      ctx.status(500).result("Error updating car field: " + e.getMessage());
    }
  }

  /** Renames, changes the choices or moves a field. Its type stays the same. */
  public CarField updateField(String id, CarField field) {
    CarField existing = fieldRepository.findByEntityId(id);
    if (existing == null) {
      throw new FieldNotFoundException();
    }
    String name = checkName(field, id);
    if (field.getType() != null
        && !field.getType().trim().isEmpty()
        && !field.getType().trim().equals(existing.getType())) {
      throw new IllegalStateException(TYPE_FIXED);
    }
    CarField toSave =
        CarField.Builder.from(existing)
            .withName(name)
            .withOptions(checkOptions(existing.getType(), field.getOptions()))
            .withPosition(field.getPosition())
            .withEntityId(id)
            .withId(id)
            .build();
    fieldRepository.replace(id, toSave);
    return toSave;
  }

  public void deleteField(Context ctx) {
    try {
      deleteField(ctx.pathParam("id"));
      ctx.status(204);
    } catch (Exception e) {
      logger.error("Error deleting car field", e);
      ctx.status(500).result("Error deleting car field: " + e.getMessage());
    }
  }

  /** Deletes a field and removes its value from every car. */
  public void deleteField(String id) {
    fieldRepository.delete(id);
    for (Car car : carRepository.findAll()) {
      if (car.getCustomValues().containsKey(id)) {
        Map<String, String> values = new LinkedHashMap<>(car.getCustomValues());
        values.remove(id);
        carRepository.replace(
            car.getEntityId(), Car.Builder.from(car).withCustomValues(values).withId(null).build());
      }
    }
  }

  /**
   * The trimmed name; it must be set and unique (ignoring case), not counting the field with {@code
   * ownId}.
   */
  private String checkName(CarField field, String ownId) {
    String name = field.getName() == null ? "" : field.getName().trim();
    if (name.isEmpty()) {
      throw new IllegalStateException(NAME_REQUIRED);
    }
    boolean taken =
        fieldRepository.findAll().stream()
            .anyMatch(
                f ->
                    (ownId == null || !ownId.equals(f.getEntityId()))
                        && f.getName() != null
                        && f.getName().trim().equalsIgnoreCase(name));
    if (taken) {
      throw new IllegalArgumentException(NAME_EXISTS);
    }
    return name;
  }

  /**
   * Choices of a "choice" field: trimmed, without empty ones and duplicates, at least one. Other
   * types have no choices.
   */
  private static List<String> checkOptions(String type, List<String> options) {
    if (!CarField.TYPE_CHOICE.equals(type)) {
      return new ArrayList<>();
    }
    Set<String> seen = new LinkedHashSet<>();
    List<String> clean = new ArrayList<>();
    if (options != null) {
      for (String option : options) {
        String o = option == null ? "" : option.trim();
        if (!o.isEmpty() && seen.add(o.toLowerCase())) {
          clean.add(o);
        }
      }
    }
    if (clean.isEmpty()) {
      throw new IllegalStateException(CHOICES_REQUIRED);
    }
    return clean;
  }

  /** The field to update does not exist (404). */
  static class FieldNotFoundException extends IllegalStateException {
    private static final long serialVersionUID = 1L;

    FieldNotFoundException() {
      super(NOT_FOUND);
    }
  }
}

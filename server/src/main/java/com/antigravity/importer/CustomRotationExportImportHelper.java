package com.antigravity.importer;

import com.antigravity.models.CustomHeat;
import com.antigravity.models.CustomRotation;
import com.antigravity.models.Race;
import com.antigravity.proto.AssetMessage;
import com.antigravity.service.AssetService;
import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public final class CustomRotationExportImportHelper {

  private static final Logger logger =
      LoggerFactory.getLogger(CustomRotationExportImportHelper.class);

  private CustomRotationExportImportHelper() {}

  @JsonIgnoreProperties(ignoreUnknown = true)
  public static class CustomRotationPackage {
    @JsonProperty("name")
    private String name;

    @JsonProperty("num_lanes")
    private int numLanes;

    @JsonProperty("custom_rotations")
    private List<CustomRotation> customRotations = new ArrayList<>();

    public CustomRotationPackage() {}

    @JsonCreator
    public CustomRotationPackage(
        @JsonProperty("name") String name,
        @JsonProperty("num_lanes") int numLanes,
        @JsonProperty("custom_rotations") List<CustomRotation> customRotations) {
      this.name = name;
      this.numLanes = numLanes;
      this.customRotations = customRotations != null ? customRotations : new ArrayList<>();
    }

    public String getName() {
      return name;
    }

    public void setName(String name) {
      this.name = name;
    }

    public int getNumLanes() {
      return numLanes;
    }

    public void setNumLanes(int numLanes) {
      this.numLanes = numLanes;
    }

    public List<CustomRotation> getCustomRotations() {
      return customRotations;
    }

    public void setCustomRotations(List<CustomRotation> customRotations) {
      this.customRotations = customRotations != null ? customRotations : new ArrayList<>();
    }
  }

  public static CustomRotationPackage resolveCustomRotationPackage(
      Race race, AssetService assetService) {
    if (race == null) {
      return null;
    }

    String assetId = race.getCustomRotationAssetId();
    String assetName = race.getCustomRotationAssetName();

    AssetMessage asset = null;
    if (assetService != null) {
      if (assetId != null && !assetId.trim().isEmpty()) {
        asset = assetService.getAssetById(assetId);
        if (asset == null) {
          asset = assetService.getAssetByNameAndType(assetId, "custom_rotation");
        }
        if (asset == null) {
          asset = assetService.getAssetByName(assetId);
        }
      }
      if (asset == null && assetName != null && !assetName.trim().isEmpty()) {
        asset = assetService.getAssetByNameAndType(assetName, "custom_rotation");
        if (asset == null) {
          asset = assetService.getAssetByName(assetName);
        }
      }
    }

    if (asset != null && asset.getCustomRotationsCount() > 0) {
      List<CustomRotation> rotations = toModelRotations(asset.getCustomRotationsList());
      return new CustomRotationPackage(asset.getName(), asset.getNumLanes(), rotations);
    }

    if (race.getCustomRotations() != null && !race.getCustomRotations().isEmpty()) {
      String fallbackName =
          (assetName != null && !assetName.trim().isEmpty())
              ? assetName.trim()
              : (race.getName() != null ? race.getName() + " Rotation" : "Custom Rotation");
      return new CustomRotationPackage(fallbackName, 0, race.getCustomRotations());
    }

    return null;
  }

  public static Race reconcileCustomRotation(
      Race incomingRace, CustomRotationPackage incomingRotation, AssetService assetService) {
    if (incomingRace == null || incomingRotation == null || assetService == null) {
      return incomingRace;
    }

    List<CustomRotation> incomingRotations = incomingRotation.getCustomRotations();
    if (incomingRotations == null || incomingRotations.isEmpty()) {
      return incomingRace;
    }

    String candidateName =
        (incomingRotation.getName() != null && !incomingRotation.getName().trim().isEmpty())
            ? incomingRotation.getName().trim()
            : (incomingRace.getName() != null
                ? incomingRace.getName() + " Rotation"
                : "Custom Rotation");

    AssetMessage existing = assetService.getAssetByNameAndType(candidateName, "custom_rotation");
    if (existing == null) {
      existing = assetService.getAssetByName(candidateName);
      if (existing != null && !"custom_rotation".equalsIgnoreCase(existing.getType())) {
        existing = null;
      }
    }

    if (existing == null) {
      // No duplicate exists: save new custom rotation asset
      AssetMessage saved =
          assetService.saveCustomRotation(
              null,
              candidateName,
              incomingRotation.getNumLanes(),
              toProtoRotations(incomingRotations));
      return new Race.Builder()
          .from(incomingRace)
          .withCustomRotationAssetId(saved.getModel().getEntityId())
          .withCustomRotationAssetName(saved.getName())
          .build();
    }

    // Duplicate name detected: compare the two custom rotations
    List<CustomRotation> existingRotations = toModelRotations(existing.getCustomRotationsList());
    boolean identical = areRotationsIdentical(existingRotations, incomingRotations);

    if (identical) {
      // If identical, use existing asset's name and ID
      logger.info(
          "Custom rotation '{}' is identical to existing asset '{}'. Using existing.",
          candidateName,
          existing.getName());
      return new Race.Builder()
          .from(incomingRace)
          .withCustomRotationAssetId(existing.getModel().getEntityId())
          .withCustomRotationAssetName(existing.getName())
          .build();
    }

    // If different, generate unique name and import as new asset
    Set<String> existingNames = extractAllAssetNames(assetService);
    String uniqueName = DriverImporter.generateUniqueName(candidateName, existingNames);
    logger.info(
        "Custom rotation '{}' differs from existing. Importing with unique name '{}'.",
        candidateName,
        uniqueName);

    AssetMessage saved =
        assetService.saveCustomRotation(
            null, uniqueName, incomingRotation.getNumLanes(), toProtoRotations(incomingRotations));
    return new Race.Builder()
        .from(incomingRace)
        .withCustomRotationAssetId(saved.getModel().getEntityId())
        .withCustomRotationAssetName(saved.getName())
        .build();
  }

  public static boolean areRotationsIdentical(List<CustomRotation> a, List<CustomRotation> b) {
    if (a == b) {
      return true;
    }
    if (a == null || b == null) {
      return false;
    }
    if (a.size() != b.size()) {
      return false;
    }

    Map<Integer, CustomRotation> mapA = new HashMap<>();
    for (CustomRotation r : a) {
      if (r != null) {
        mapA.put(r.getNumDrivers(), r);
      }
    }

    for (CustomRotation rotB : b) {
      if (rotB == null) {
        return false;
      }
      CustomRotation rotA = mapA.get(rotB.getNumDrivers());
      if (rotA == null) {
        return false;
      }
      if (!areHeatsIdentical(rotA.getHeats(), rotB.getHeats())) {
        return false;
      }
    }
    return true;
  }

  private static boolean areHeatsIdentical(List<CustomHeat> heatsA, List<CustomHeat> heatsB) {
    if (heatsA == heatsB) {
      return true;
    }
    if (heatsA == null || heatsB == null) {
      return false;
    }
    if (heatsA.size() != heatsB.size()) {
      return false;
    }

    for (int i = 0; i < heatsA.size(); i++) {
      CustomHeat ha = heatsA.get(i);
      CustomHeat hb = heatsB.get(i);
      if (ha == null || hb == null) {
        return false;
      }
      if (ha.getGroup() != hb.getGroup()) {
        return false;
      }
      if (ha.getStep() != hb.getStep()) {
        return false;
      }
      if (ha.isStepUpBoundary() != hb.isStepUpBoundary()) {
        return false;
      }
      if (!Objects.equals(ha.getDriverIndices(), hb.getDriverIndices())) {
        return false;
      }
    }
    return true;
  }

  public static List<com.antigravity.proto.CustomRotation> toProtoRotations( // fqn-collision
      List<CustomRotation> modelRotations) {
    List<com.antigravity.proto.CustomRotation> list = new ArrayList<>(); // fqn-collision
    if (modelRotations == null) {
      return list;
    }

    for (CustomRotation mr : modelRotations) {
      com.antigravity.proto.CustomRotation.Builder b = // fqn-collision
          com.antigravity.proto.CustomRotation.newBuilder(); // fqn-collision
      b.setNumDrivers(mr.getNumDrivers());
      if (mr.getDescription() != null) {
        b.setDescription(mr.getDescription());
      }
      if (mr.getHeats() != null) {
        for (CustomHeat mh : mr.getHeats()) {
          com.antigravity.proto.CustomHeat.Builder hb = // fqn-collision
              com.antigravity.proto.CustomHeat.newBuilder(); // fqn-collision
          if (mh.getDriverIndices() != null) {
            hb.addAllDriverIndices(mh.getDriverIndices());
          }
          hb.setGroup(mh.getGroup());
          hb.setIsStepUpBoundary(mh.isStepUpBoundary());
          hb.setStep(mh.getStep());
          b.addHeats(hb.build());
        }
      }
      list.add(b.build());
    }
    return list;
  }

  public static List<CustomRotation> toModelRotations(
      List<com.antigravity.proto.CustomRotation> protoRotations) { // fqn-collision
    List<CustomRotation> list = new ArrayList<>();
    if (protoRotations == null) {
      return list;
    }

    for (com.antigravity.proto.CustomRotation pr : protoRotations) { // fqn-collision
      List<CustomHeat> heats = new ArrayList<>();
      for (com.antigravity.proto.CustomHeat ph : pr.getHeatsList()) { // fqn-collision
        heats.add(
            new CustomHeat(
                new ArrayList<>(ph.getDriverIndicesList()),
                ph.getGroup(),
                ph.getIsStepUpBoundary(),
                ph.getStep()));
      }
      list.add(new CustomRotation(pr.getNumDrivers(), heats, pr.getDescription()));
    }
    return list;
  }

  private static Set<String> extractAllAssetNames(AssetService assetService) {
    Set<String> names = new HashSet<>();
    try {
      List<AssetMessage> all = assetService.getAllAssets();
      if (all != null) {
        for (AssetMessage a : all) {
          if (a.getName() != null && !a.getName().trim().isEmpty()) {
            names.add(a.getName().trim());
          }
        }
      }
    } catch (Exception e) {
      logger.warn("Failed to retrieve asset names", e);
    }
    return names;
  }
}

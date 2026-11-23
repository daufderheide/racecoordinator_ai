package com.antigravity.importer;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertTrue;

import com.antigravity.context.DatabaseContext;
import com.antigravity.models.CustomHeat;
import com.antigravity.models.CustomRotation;
import com.antigravity.models.Race;
import com.antigravity.proto.AssetMessage;
import com.antigravity.service.AssetService;
import java.io.File;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import org.junit.After;
import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;
import org.junit.rules.TemporaryFolder;

public class CustomRotationExportImportHelperTest {

  @Rule public TemporaryFolder tempFolder = new TemporaryFolder();

  private DatabaseContext databaseContext;
  private AssetService assetService;

  @Before
  public void setUp() throws Exception {
    String rootDir = tempFolder.newFolder("db_root").getAbsolutePath() + File.separator;
    databaseContext = new DatabaseContext("test_db", null, rootDir);
    File assetsDir = new File(new File(databaseContext.getDataRoot(), "test_db"), "assets");
    assetService = new AssetService(databaseContext, assetsDir.getAbsolutePath());
  }

  @After
  public void tearDown() {
    if (databaseContext != null && databaseContext.getConnection() != null) {
      try {
        databaseContext.getConnection().close();
      } catch (Exception ignored) {
      }
    }
  }

  private List<CustomRotation> createSampleRotations() {
    List<CustomHeat> heats = new ArrayList<>();
    heats.add(new CustomHeat(Arrays.asList(0, 1, 2, 3), 0, false, 0));
    heats.add(new CustomHeat(Arrays.asList(3, 0, 1, 2), 0, false, 1));

    CustomRotation rotation = new CustomRotation(4, heats);
    return Collections.singletonList(rotation);
  }

  @Test
  public void testAreRotationsIdentical_SameStructure() {
    List<CustomRotation> a = createSampleRotations();
    List<CustomRotation> b = createSampleRotations();

    assertTrue(CustomRotationExportImportHelper.areRotationsIdentical(a, b));
    assertTrue(CustomRotationExportImportHelper.areRotationsIdentical(a, a));
  }

  @Test
  public void testAreRotationsIdentical_DifferingDriverCount() {
    List<CustomRotation> a = createSampleRotations();
    List<CustomHeat> heats = new ArrayList<>();
    heats.add(new CustomHeat(Arrays.asList(0, 1, 2), 0, false, 0));
    List<CustomRotation> b = Collections.singletonList(new CustomRotation(3, heats));

    assertFalse(CustomRotationExportImportHelper.areRotationsIdentical(a, b));
  }

  @Test
  public void testAreRotationsIdentical_DifferingLanes() {
    List<CustomRotation> a = createSampleRotations();
    List<CustomHeat> heats = new ArrayList<>();
    heats.add(new CustomHeat(Arrays.asList(0, 1, 2, 3), 0, false, 0));
    heats.add(new CustomHeat(Arrays.asList(2, 3, 0, 1), 0, false, 1)); // Differing order
    List<CustomRotation> b = Collections.singletonList(new CustomRotation(4, heats));

    assertFalse(CustomRotationExportImportHelper.areRotationsIdentical(a, b));
  }

  @Test
  public void testAreRotationsIdentical_DifferingStepOrGroup() {
    List<CustomRotation> a = createSampleRotations();
    List<CustomHeat> heats = new ArrayList<>();
    heats.add(new CustomHeat(Arrays.asList(0, 1, 2, 3), 1, false, 0)); // Group 1 instead of 0
    heats.add(new CustomHeat(Arrays.asList(3, 0, 1, 2), 1, false, 1));
    List<CustomRotation> b = Collections.singletonList(new CustomRotation(4, heats));

    assertFalse(CustomRotationExportImportHelper.areRotationsIdentical(a, b));
  }

  @Test
  public void testAreRotationsIdentical_NullsAndSizes() {
    assertFalse(
        CustomRotationExportImportHelper.areRotationsIdentical(null, createSampleRotations()));
    assertFalse(
        CustomRotationExportImportHelper.areRotationsIdentical(createSampleRotations(), null));
    assertFalse(
        CustomRotationExportImportHelper.areRotationsIdentical(
            createSampleRotations(), Collections.emptyList()));
  }

  @Test
  public void testResolveCustomRotationPackage_FromEmbeddedRotations() {
    List<CustomRotation> rotations = createSampleRotations();
    Race race = new Race.Builder().withName("Custom Race").withCustomRotations(rotations).build();

    CustomRotationExportImportHelper.CustomRotationPackage pkg =
        CustomRotationExportImportHelper.resolveCustomRotationPackage(race, assetService);

    assertNotNull(pkg);
    assertEquals("Custom Race Rotation", pkg.getName());
    assertEquals(1, pkg.getCustomRotations().size());
    assertEquals(4, pkg.getCustomRotations().get(0).getNumDrivers());
  }

  @Test
  public void testResolveCustomRotationPackage_FromAssetService() {
    List<CustomRotation> rotations = createSampleRotations();
    AssetMessage savedAsset =
        assetService.saveCustomRotation(
            null,
            "Pro 4-Lane Rotation",
            4,
            CustomRotationExportImportHelper.toProtoRotations(rotations));

    Race race =
        new Race.Builder()
            .withName("Custom Pro Race")
            .withCustomRotationAssetId(savedAsset.getModel().getEntityId())
            .withCustomRotationAssetName(savedAsset.getName())
            .build();

    CustomRotationExportImportHelper.CustomRotationPackage pkg =
        CustomRotationExportImportHelper.resolveCustomRotationPackage(race, assetService);

    assertNotNull(pkg);
    assertEquals("Pro 4-Lane Rotation", pkg.getName());
    assertEquals(4, pkg.getNumLanes());
    assertEquals(1, pkg.getCustomRotations().size());
  }

  @Test
  public void testResolveCustomRotationPackage_NullRace() {
    assertNull(CustomRotationExportImportHelper.resolveCustomRotationPackage(null, assetService));
  }

  @Test
  public void testReconcileCustomRotation_NoExistingAsset_CreatesNew() {
    List<CustomRotation> rotations = createSampleRotations();
    CustomRotationExportImportHelper.CustomRotationPackage pkg =
        new CustomRotationExportImportHelper.CustomRotationPackage(
            "Brand New Rotation", 4, rotations);
    Race race = new Race.Builder().withName("Grand Prix").build();

    Race reconciled =
        CustomRotationExportImportHelper.reconcileCustomRotation(race, pkg, assetService);

    assertNotNull(reconciled.getCustomRotationAssetId());
    assertEquals("Brand New Rotation", reconciled.getCustomRotationAssetName());

    AssetMessage found = assetService.getAssetByName("Brand New Rotation");
    assertNotNull(found);
  }

  @Test
  public void testReconcileCustomRotation_IdenticalAssetExists_ReusesExisting() {
    List<CustomRotation> rotations = createSampleRotations();
    AssetMessage initial =
        assetService.saveCustomRotation(
            null,
            "Existing Rotation",
            4,
            CustomRotationExportImportHelper.toProtoRotations(rotations));

    CustomRotationExportImportHelper.CustomRotationPackage incomingPkg =
        new CustomRotationExportImportHelper.CustomRotationPackage(
            "Existing Rotation", 4, rotations);
    Race race = new Race.Builder().withName("Grand Prix").build();

    Race reconciled =
        CustomRotationExportImportHelper.reconcileCustomRotation(race, incomingPkg, assetService);

    assertEquals(initial.getModel().getEntityId(), reconciled.getCustomRotationAssetId());
    assertEquals("Existing Rotation", reconciled.getCustomRotationAssetName());
  }

  @Test
  public void testReconcileCustomRotation_DifferingAssetExists_ImportsWithUniqueName() {
    List<CustomRotation> initialRotations = createSampleRotations();
    assetService.saveCustomRotation(
        null,
        "Existing Rotation",
        4,
        CustomRotationExportImportHelper.toProtoRotations(initialRotations));

    // Incoming rotation has different heats
    List<CustomHeat> diffHeats = new ArrayList<>();
    diffHeats.add(new CustomHeat(Arrays.asList(0, 2, 1, 3), 0, false, 0));
    List<CustomRotation> incomingRotations =
        Collections.singletonList(new CustomRotation(4, diffHeats));

    CustomRotationExportImportHelper.CustomRotationPackage incomingPkg =
        new CustomRotationExportImportHelper.CustomRotationPackage(
            "Existing Rotation", 4, incomingRotations);
    Race race = new Race.Builder().withName("Grand Prix").build();

    Race reconciled =
        CustomRotationExportImportHelper.reconcileCustomRotation(race, incomingPkg, assetService);

    assertNotNull(reconciled.getCustomRotationAssetId());
    // Should be given unique name e.g. "Existing Rotation (1)"
    assertEquals("Existing Rotation (1)", reconciled.getCustomRotationAssetName());

    AssetMessage uniqueAsset = assetService.getAssetByName("Existing Rotation (1)");
    assertNotNull(uniqueAsset);
  }
}

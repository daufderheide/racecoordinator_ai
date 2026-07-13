package com.antigravity;

import static org.junit.Assert.assertEquals;

import de.flapdoodle.embed.mongo.distribution.Version;
import org.junit.Test;

public class DatabaseMigrationTripwireTest {

  @Test
  public void testMongoDBVersionIsUnchanged() {
    // -------------------------------------------------------------------------------------
    // IMPORTANT: If this test is failing, it means the embedded MongoDB version was updated!
    // -------------------------------------------------------------------------------------
    // When the MongoDB major version changes (e.g. 6.0 to 7.0), the existing user database files
    // become incompatible. The application will detect this and execute an auto-migration script.
    //
    // YOU MUST DO THE FOLLOWING BEFORE UPDATING THIS TEST:
    // 1. Start the server with the old MongoDB version (e.g., 6.0).
    // 2. Create some databases and assets.
    // 3. Stop the server.
    // 4. Update the software to use the new MongoDB version (e.g., 7.0).
    // 5. Start the server and verify that the auto-migration logic successfully runs, backs up
    //    the old files, starts the new MongoDB version, and imports all data seamlessly.
    // 6. Verify that no data is lost and all secondary databases are present.
    //
    // Once manual verification is complete, update the expected version below to make this test
    // pass.
    // -------------------------------------------------------------------------------------

    de.flapdoodle.embed.mongo.distribution.IFeatureAwareVersion currentVersion =
        App.getMongoVersion();

    assertEquals(
        "MongoDB version updated! You MUST manually test the auto-migration logic with a database from the previous version. Once manual testing is complete, update this test's expected version to pass.",
        Version.Main.V6_0,
        currentVersion);
  }
}

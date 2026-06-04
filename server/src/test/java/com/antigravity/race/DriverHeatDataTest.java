package com.antigravity.race;

import static org.junit.Assert.assertEquals;

import com.antigravity.models.Driver;
import org.junit.Test;

public class DriverHeatDataTest {

  @Test
  public void testAdjustedLapCountWithFractions() {
    Driver driverModel = new Driver("Test", "Test");
    RaceParticipant driver = new RaceParticipant(driverModel);
    DriverHeatData dhd = new DriverHeatData(driver);

    // Mock 5 laps
    for (int i = 0; i < 5; i++) {
      dhd.addLap(10.0, false);
    }

    dhd.setPenaltyLaps(-1.0);
    dhd.setUserLaps(0.25);
    dhd.setAutoCalculatedLaps(0.5);

    // 5 - (-1.0) + 0.25 + 0.5 = 6.75
    assertEquals(6.75, dhd.getAdjustedLapCount(), 0.001);
  }

  @Test
  public void testAverageLapTimeCalculationWithAdjustments() {
    Driver driverModel = new Driver("Test", "Test");
    RaceParticipant driver = new RaceParticipant(driverModel);
    DriverHeatData dhd = new DriverHeatData(driver);

    // 5 laps of 10 seconds each
    for (int i = 0; i < 5; i++) {
      dhd.addLap(10.0, false);
    }

    // Add significant adjustments that would change the average if they were included
    dhd.setPenaltyLaps(5.0);
    dhd.setUserLaps(10.0);
    dhd.setAutoCalculatedLaps(15.0);

    // Adjusted lap count is now 5 - 5 + 10 + 15 = 25
    assertEquals(25.0, dhd.getAdjustedLapCount(), 0.001);

    // Average lap time should STILL be 10.0 (sum of 50.0 / 5 laps)
    // If it used adjusted count, it would be 50.0 / 35 = ~1.42
    assertEquals(10.0, dhd.getAverageLapTime(), 0.001);

    // Total time should also be based on actual laps: 50.0
    assertEquals(50.0, dhd.getTotalTime(), 0.001);
  }

  @Test
  public void testReactionTimeDefaultAndReset() {
    Driver driverModel = new Driver("Test", "Test");
    RaceParticipant driver = new RaceParticipant(driverModel);
    DriverHeatData dhd = new DriverHeatData(driver);

    // Default should be -1.0 (not set)
    assertEquals(-1.0, dhd.getReactionTime(), 0.001);

    // Set it to 0.0 (e.g. false start)
    dhd.setReactionTime(0.0);
    assertEquals(0.0, dhd.getReactionTime(), 0.001);

    // Reset should put it back to -1.0
    dhd.reset();
    assertEquals(-1.0, dhd.getReactionTime(), 0.001);
  }

  @Test
  public void testMongoSerializationDeserialization() {
    Driver driverModel = new Driver("Test Driver", "Nickname");
    RaceParticipant driver = new RaceParticipant(driverModel);
    DriverHeatData original = new DriverHeatData(driver);
    original.addSegment(1.5);
    original.addSegment(2.5);
    original.addLap(10.0, false);
    original.addSegment(3.0);
    original.addLap(12.0, true);

    org.bson.codecs.configuration.CodecRegistry pojoCodecRegistry =
        org.bson.codecs.configuration.CodecRegistries.fromRegistries(
            com.mongodb.MongoClientSettings.getDefaultCodecRegistry(),
            org.bson.codecs.configuration.CodecRegistries.fromProviders(
                org.bson.codecs.pojo.PojoCodecProvider.builder().automatic(true).build()));

    org.bson.codecs.Codec<DriverHeatData> codec = pojoCodecRegistry.get(DriverHeatData.class);
    org.bson.BsonDocument document = new org.bson.BsonDocument();
    org.bson.BsonWriter writer = new org.bson.BsonDocumentWriter(document);
    codec.encode(writer, original, org.bson.codecs.EncoderContext.builder().build());

    org.bson.BsonReader reader = new org.bson.BsonDocumentReader(document);
    DriverHeatData decoded = codec.decode(reader, org.bson.codecs.DecoderContext.builder().build());

    assertEquals(original.getLaps().size(), decoded.getLaps().size());
    assertEquals(original.getSegments().size(), decoded.getSegments().size());
  }
}

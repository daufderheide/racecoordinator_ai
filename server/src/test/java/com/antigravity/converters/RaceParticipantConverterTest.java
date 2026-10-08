package com.antigravity.converters;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;

import com.antigravity.models.Driver;
import com.antigravity.models.Team;
import com.antigravity.proto.RaceParticipant;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;
import org.junit.Test;

public class RaceParticipantConverterTest {

  @Test
  public void testToProto_Individual() {
    Driver driver = new Driver("Alice", "The Rocket", "d1", "1");
    com.antigravity.race.RaceParticipant participant =
        new com.antigravity.race.RaceParticipant(driver, "p1");
    Set<String> sentObjectIds = new HashSet<>();

    RaceParticipant proto = RaceParticipantConverter.toProto(participant, sentObjectIds);

    assertNotNull(proto);
    assertEquals(participant.getObjectId(), proto.getObjectId());
    assertNotNull(proto.getDriver());
    assertEquals("Alice", proto.getDriver().getName());
    assertNotNull(proto.getTeam()); // Team is always present but might be empty
    assertEquals("", proto.getTeam().getName());
  }

  @Test
  public void testToProto_Team() {
    Team team = new Team("Team Alpha", "avatar_url", Arrays.asList("d1", "d2"), "t1", "1");
    com.antigravity.race.RaceParticipant participant =
        new com.antigravity.race.RaceParticipant(team);
    Set<String> sentObjectIds = new HashSet<>();

    RaceParticipant proto = RaceParticipantConverter.toProto(participant, sentObjectIds);

    assertNotNull(proto);
    assertEquals(participant.getObjectId(), proto.getObjectId());
    assertNotNull(proto.getTeam());
    assertEquals("Team Alpha", proto.getTeam().getName());
    assertNotNull(proto.getDriver()); // Driver is always present but might be empty
    assertEquals("Team Alpha", proto.getDriver().getName());
  }

  @Test
  public void testToProto_OverallStats() {
    Driver driver = new Driver("Bob", "The Builder", "d2", "2");
    com.antigravity.race.RaceParticipant participant =
        new com.antigravity.race.RaceParticipant(driver, "p2");
    participant.setAllScoringLaps(Arrays.asList(10.0, 11.0, 12.0));
    participant.setAverageLapTime(11.0);
    participant.setLapsLed(5);
    participant.setTrackCalls(2);
    participant.setTotalPoints(45.5);
    participant.setAverageTop5(10.5);
    participant.setAverageTop10(11.2);
    participant.setAverageTop15(11.8);
    participant.setTop2Consecutive(21.0);
    participant.setTop3Consecutive(33.0);
    participant.setHasSegments(true);

    RaceParticipant proto = RaceParticipantConverter.toProto(participant, new HashSet<>());

    assertNotNull(proto);
    assertEquals(true, proto.getHasSegments());
    assertEquals(3, proto.getPhysicalLapCount());
    assertEquals(5, proto.getLapsLed());
    assertEquals(2, proto.getTrackCalls());
    assertEquals(45.5, proto.getTotalPoints(), 0.01);
    assertEquals(participant.getConsistencyScore(), proto.getConsistencyScore(), 0.01);
    assertEquals(participant.getStandardDeviation(), proto.getStandardDeviation(), 0.01);
    assertEquals(10.5, proto.getAverageTop5(), 0.01);
    assertEquals(11.2, proto.getAverageTop10(), 0.01);
    assertEquals(11.8, proto.getAverageTop15(), 0.01);
    assertEquals(21.0, proto.getTop2Consecutive(), 0.01);
    assertEquals(33.0, proto.getTop3Consecutive(), 0.01);
  }
}

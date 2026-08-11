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
}

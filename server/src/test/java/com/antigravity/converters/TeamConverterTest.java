package com.antigravity.converters;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertTrue;

import com.antigravity.models.Team;
import com.antigravity.proto.TeamModel;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;
import org.junit.Test;

public class TeamConverterTest {

  @Test
  public void testToProto_NullTeam() {
    assertNull(TeamConverter.toProto(null, new HashSet<>()));
  }

  @Test
  public void testToProto_FirstTime() {
    Team team = new Team("Team Alpha", "avatar_url", Arrays.asList("d1", "d2"), "t1", "1");
    Set<String> sentObjectIds = new HashSet<>();

    TeamModel proto = TeamConverter.toProto(team, sentObjectIds);

    assertNotNull(proto);
    assertEquals("Team Alpha", proto.getName());
    assertEquals("avatar_url", proto.getAvatarUrl());
    assertEquals("t1", proto.getModel().getEntityId());
    assertEquals(2, proto.getDriverIdsCount());
    assertTrue(proto.getDriverIdsList().contains("d1"));
    assertTrue(proto.getDriverIdsList().contains("d2"));

    assertTrue(sentObjectIds.contains("Team_" + team.getObjectId()));
  }

  @Test
  public void testToProto_SubsequentTime() {
    Team team = new Team("Team Alpha", "avatar_url", Arrays.asList("d1", "d2"), "t1", "1");
    Set<String> sentObjectIds = new HashSet<>();
    sentObjectIds.add("Team_" + team.getObjectId());

    TeamModel proto = TeamConverter.toProto(team, sentObjectIds);

    assertNotNull(proto);
    assertEquals("", proto.getName()); // Should be empty in subsequent sends
    assertEquals("t1", proto.getModel().getEntityId());
    assertEquals(0, proto.getDriverIdsCount());
  }
}

package com.antigravity.models;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;

import com.antigravity.proto.TeamModel;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.Arrays;
import org.junit.Test;

public class TeamTest {

  @Test
  public void testConstructorsAndGetters() {
    Team t1 =
        new Team(
            "Red Bull",
            "avatar.png",
            Arrays.asList("d1", "d2"),
            Arrays.asList("lbl1", "lbl2"),
            "team-1",
            "id-1");
    assertEquals("Red Bull", t1.getName());
    assertEquals("avatar.png", t1.getAvatarUrl());
    assertEquals(2, t1.getDriverIds().size());
    assertEquals(2, t1.getLabelIds().size());
    assertTrue(t1.getLabelIds().contains("lbl1"));
    assertEquals("team-1", t1.getEntityId());
    assertEquals("id-1", t1.getId());

    Team t2 = new Team("Ferrari", null, null);
    assertEquals("Ferrari", t2.getName());
    assertNotNull(t2.getDriverIds());
    assertNotNull(t2.getLabelIds());
    assertTrue(t2.getLabelIds().isEmpty());
  }

  @Test
  public void testBuilderAndProtoConstructor() {
    Team original =
        new Team.Builder()
            .withName("McLaren")
            .withAvatarUrl("mclaren.png")
            .withDriverIds(Arrays.asList("d1", "d2"))
            .withLabelIds(Arrays.asList("pro", "f1"))
            .withEntityId("t2")
            .withId("id-2")
            .build();

    assertEquals("McLaren", original.getName());
    assertEquals("mclaren.png", original.getAvatarUrl());
    assertEquals(2, original.getDriverIds().size());
    assertEquals(2, original.getLabelIds().size());
    assertEquals("t2", original.getEntityId());

    Team copy = Team.Builder.from(original).withName("McLaren Updated").build();
    assertEquals("McLaren Updated", copy.getName());
    assertEquals(2, copy.getLabelIds().size());
    assertEquals("t2", copy.getEntityId());

    TeamModel proto =
        TeamModel.newBuilder()
            .setName("Proto Team")
            .setAvatarUrl("proto.png")
            .addAllDriverIds(Arrays.asList("d3"))
            .addAllLabelIds(Arrays.asList("lbl-proto"))
            .setModel(com.antigravity.proto.Model.newBuilder().setEntityId("proto-1").build())
            .build();

    Team fromProto = new Team(proto);
    assertEquals("Proto Team", fromProto.getName());
    assertEquals(1, fromProto.getLabelIds().size());
    assertTrue(fromProto.getLabelIds().contains("lbl-proto"));
  }

  @Test
  public void testJsonSerialization() throws Exception {
    ObjectMapper mapper = new ObjectMapper();
    Team team =
        new Team(
            "Red Bull",
            "avatar.png",
            Arrays.asList("d1", "d2"),
            Arrays.asList("lbl1"),
            "team-1",
            "id-1");

    String json = mapper.writeValueAsString(team);
    Team deserialized = mapper.readValue(json, Team.class);

    assertNotNull(deserialized);
    assertEquals("Red Bull", deserialized.getName());
    assertEquals("avatar.png", deserialized.getAvatarUrl());
    assertEquals(2, deserialized.getDriverIds().size());
    assertEquals(1, deserialized.getLabelIds().size());
    assertEquals("lbl1", deserialized.getLabelIds().get(0));
  }
}

package com.antigravity.converters;

import com.antigravity.models.Team;
import com.antigravity.proto.TeamModel;
import com.antigravity.proto.Model;

public class TeamConverter {
  public static TeamModel toProto(Team team, java.util.Set<String> sentObjectIds) {
    if (team == null) {
      return null;
    }
    String key = "Team_" + team.getObjectId();
    if (sentObjectIds != null && sentObjectIds.contains(key)) {
      return TeamModel.newBuilder()
          .setModel(Model.newBuilder()
              .setEntityId(team.getEntityId() != null ? team.getEntityId() : "")
              .build())
          .build();
    } else {
      if (sentObjectIds != null) {
        sentObjectIds.add(key);
      }
      return TeamModel.newBuilder()
          .setName(team.getName())
          .setAvatarUrl(team.getAvatarUrl() != null ? team.getAvatarUrl() : "")
          .addAllDriverIds(team.getDriverIds())
          .setModel(Model.newBuilder()
              .setEntityId(team.getEntityId() != null ? team.getEntityId() : "")
              .build())
          .build();
    }
  }
}

package com.antigravity.converters;

import com.antigravity.models.Team;
import com.antigravity.proto.TeamModel;
import com.antigravity.service.AssetDefaultsInitializer;
import java.util.Set;

public class TeamConverter {

  public static TeamModel toProto(Team team, Set<String> sentObjectIds) {
    if (team == null) {
      return null;
    }
    String key = "Team_" + team.getObjectId();
    if (sentObjectIds != null && sentObjectIds.contains(key)) {
      return com.antigravity.proto.TeamModel.newBuilder() // fqn-collision
          .setModel(
              (com.antigravity.proto.Model) // fqn-collision
                  com.antigravity.proto.Model.newBuilder() // fqn-collision
                      .setEntityId(team.getEntityId() != null ? team.getEntityId() : "")
                      .build()) // fqn-collision
          .build();
    } else {
      if (sentObjectIds != null) {
        sentObjectIds.add(key);
      }
      String avatarUrl = team.getAvatarUrl();
      if (avatarUrl != null
          && !avatarUrl.isEmpty()
          && !avatarUrl.startsWith("/")
          && !avatarUrl.startsWith("http")) {
        String resolved = AssetDefaultsInitializer.resolveDefaultAssetUrl(avatarUrl);
        if (resolved != null) {
          avatarUrl = resolved;
        }
      }
      return com.antigravity.proto.TeamModel.newBuilder() // fqn-collision
          .setName(team.getName())
          .setAvatarUrl(avatarUrl != null ? avatarUrl : "")
          .addAllDriverIds(team.getDriverIds())
          .setModel(
              (com.antigravity.proto.Model) // fqn-collision
                  com.antigravity.proto.Model.newBuilder() // fqn-collision
                      .setEntityId(team.getEntityId() != null ? team.getEntityId() : "")
                      .build()) // fqn-collision
          .build();
    }
  }
}

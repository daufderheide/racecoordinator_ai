package com.antigravity.converters;

import com.antigravity.models.Track;
import com.antigravity.proto.Model;
import com.antigravity.proto.TrackModel;
import java.util.Set;
import java.util.stream.Collectors;

public class TrackConverter {

  public static TrackModel toProto(Track track, Set<String> sentObjectIds) {
    String key = "Track_" + track.getObjectId();
    if (sentObjectIds.contains(key)) {
      return TrackModel.newBuilder()
          .setModel(Model.newBuilder().setEntityId(track.getObjectId()).build())
          .build();
    } else {
      sentObjectIds.add(key);
      return TrackModel.newBuilder()
          .setModel(Model.newBuilder().setEntityId(track.getObjectId()).build())
          .setName(track.getName())
          .setNumTrackSections(track.getNumTrackSections())
          .setHasDigitalFuel(hasDigitalFuel(track))
          .addAllArduinoConfigs(
              track.getArduinoConfigs().stream()
                  .map(ArduinoConfigConverter::toProto)
                  .collect(Collectors.toList()))
          .addAllLanes(
              track.getLanes().stream()
                  .map(l -> LaneConverter.toProto(l, sentObjectIds))
                  .collect(Collectors.toList()))
          .addAllTrackmateConfigs(
              track.getTrackmateConfigs().stream()
                  .map(TrackmateConfigConverter::toProto)
                  .collect(Collectors.toList()))
          .build();
    }
  }

  private static boolean hasDigitalFuel(Track track) {
    return track.hasDigitalFuel();
  }
}

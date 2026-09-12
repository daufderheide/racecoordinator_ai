package com.antigravity.race;

import com.antigravity.models.Driver;
import com.antigravity.models.GroupOptions;
import com.antigravity.models.HeatScoring;
import com.antigravity.models.Lane;
import com.antigravity.models.OverallScoring;
import com.antigravity.models.Track;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

/**
 * Factory that creates a rich, self-contained sample Race with lanes, drivers, heats, and
 * lap/segment records. Used for template test exports and previewing.
 */
public final class SampleRaceFactory {

  private SampleRaceFactory() {}

  public static Race createSampleRace() {
    Driver d1 = new Driver("Austin", "Austin", "d_sample_1", "d_sample_1");
    Driver d2 = new Driver("Dave", "Dave", "d_sample_2", "d_sample_2");
    Driver d3 = new Driver("Abby", "Abby", "d_sample_3", "d_sample_3");
    Driver d4 = new Driver("Noah", "Noah", "d_sample_4", "d_sample_4");

    RaceParticipant p1 = new RaceParticipant(d1);
    RaceParticipant p2 = new RaceParticipant(d2);
    RaceParticipant p3 = new RaceParticipant(d3);
    RaceParticipant p4 = new RaceParticipant(d4);
    List<RaceParticipant> participants = Arrays.asList(p1, p2, p3, p4);

    Lane l1 = new Lane("#EF4444", "white", 100);
    Lane l2 = new Lane("#FFFFFF", "black", 100);
    Lane l3 = new Lane("#3B82F6", "white", 100);
    Lane l4 = new Lane("#FBBF24", "black", 100);
    Track track =
        new Track.Builder()
            .name("Grand Prix Raceway")
            .numTrackSections(2)
            .lanes(Arrays.asList(l1, l2, l3, l4))
            .build();

    com.antigravity.models.Race model = // fqn-collision
        new com.antigravity.models.Race.Builder() // fqn-collision
            .withName("Sample Race Demonstration")
            .withHeatScoring(new HeatScoring())
            .withOverallScoring(new OverallScoring())
            .withGroupOptions(new GroupOptions())
            .build();

    List<Heat> heats = new ArrayList<>();
    // Heat 1: 4 drivers on lanes 1-4
    DriverHeatData dhd1 = createSampleDriverHeatData(p1, d1, 1, 4.120, 4.250, 4.310, 4.090, 4.150);
    DriverHeatData dhd2 = createSampleDriverHeatData(p2, d2, 2, 4.210, 4.190, 4.350, 4.280, 4.220);
    DriverHeatData dhd3 = createSampleDriverHeatData(p3, d3, 3, 4.450, 4.380, 4.410, 4.520, 4.390);
    DriverHeatData dhd4 = createSampleDriverHeatData(p4, d4, 4, 4.320, 4.410, 4.290, 4.350, 4.400);
    Heat heat1 = new Heat(1, Arrays.asList(dhd1, dhd2, dhd3, dhd4), false);
    heat1.setStarted(true);
    heats.add(heat1);

    // Heat 2: rotated lane assignments
    DriverHeatData dhd21 = createSampleDriverHeatData(p4, d4, 1, 4.290, 4.310, 4.350, 4.280, 4.250);
    DriverHeatData dhd22 = createSampleDriverHeatData(p1, d1, 2, 4.080, 4.110, 4.150, 4.050, 4.120);
    DriverHeatData dhd23 = createSampleDriverHeatData(p2, d2, 3, 4.190, 4.220, 4.180, 4.250, 4.210);
    DriverHeatData dhd24 = createSampleDriverHeatData(p3, d3, 4, 4.380, 4.420, 4.350, 4.400, 4.390);
    Heat heat2 = new Heat(2, Arrays.asList(dhd21, dhd22, dhd23, dhd24), false);
    heat2.setStarted(true);
    heats.add(heat2);

    return new Race.Builder()
        .model(model)
        .track(track)
        .drivers(participants)
        .heats(heats)
        .skipHardwareInterface(true)
        .build();
  }

  private static DriverHeatData createSampleDriverHeatData(
      RaceParticipant rp, Driver d, int lane, double... lapTimes) {
    DriverHeatData dhd = new DriverHeatData(rp, d);
    dhd.setLane(lane);
    for (double lt : lapTimes) {
      List<Double> segs =
          Arrays.asList(
              RaceStatisticsUtils.roundToThreeDecimals(lt * 0.45),
              RaceStatisticsUtils.roundToThreeDecimals(lt * 0.55));
      dhd.getLaps().add(new DriverHeatData.LapData(lt, d.getEntityId(), segs, false, true));
    }
    dhd.setFinished(true);
    return dhd;
  }
}

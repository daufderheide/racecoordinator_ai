package com.antigravity.race;

import com.antigravity.models.Season;
import com.antigravity.models.SeasonRaceRecord;
import com.antigravity.models.SeasonStandingDetail;
import com.antigravity.models.SeasonStandingItem;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class SeasonStandingsCalculator {

  public static List<SeasonStandingItem> calculateStandings(Season season) {
    if (season == null || season.getRaces() == null || season.getRaces().isEmpty()) {
      return new ArrayList<>();
    }

    List<SeasonRaceRecord> races = new ArrayList<>(season.getRaces());
    // Sort races by date run (oldest to most recent)
    races.sort(Comparator.comparingLong(SeasonRaceRecord::getTimestamp));

    Map<String, DriverEntry> driverMap = new HashMap<>();

    for (SeasonRaceRecord race : races) {
      if (race.getDriverResults() == null) continue;
      for (SeasonRaceRecord.SeasonDriverResult res : race.getDriverResults()) {
        DriverEntry entry =
            driverMap.computeIfAbsent(res.getDriverId(), k -> new DriverEntry(res.getDriverName()));
        entry.scores.add(
            new SeasonStandingDetail(
                race.getRaceId(),
                race.getRaceName(),
                res.getOverallRank(),
                res.getOverallPoints(),
                res.getHeatPoints(),
                res.getTotalPoints()));
      }
    }

    List<SeasonStandingItem> result = new ArrayList<>();

    for (Map.Entry<String, DriverEntry> e : driverMap.entrySet()) {
      String driverId = e.getKey();
      DriverEntry entry = e.getValue();
      List<SeasonStandingDetail> scores = entry.scores;
      int drops = season.getDrops();
      int racesRun = scores.size();

      if (racesRun > drops && drops > 0) {
        // Find indices of lowest scores to drop
        List<Integer> sortedIndices = new ArrayList<>();
        for (int i = 0; i < scores.size(); i++) {
          sortedIndices.add(i);
        }
        sortedIndices.sort(Comparator.comparingInt(i -> scores.get(i).getTotalPoints()));

        for (int i = 0; i < drops; i++) {
          scores.get(sortedIndices.get(i)).setDropped(true);
        }
      }

      int net = 0;
      int gross = 0;
      for (SeasonStandingDetail s : scores) {
        gross += s.getTotalPoints();
        if (!s.isDropped()) {
          net += s.getTotalPoints();
        }
      }

      result.add(new SeasonStandingItem(driverId, entry.driverName, net, gross, racesRun, scores));
    }

    result.sort(
        (a, b) -> {
          if (b.getNetPoints() != a.getNetPoints())
            return Integer.compare(b.getNetPoints(), a.getNetPoints());
          if (b.getGrossPoints() != a.getGrossPoints())
            return Integer.compare(b.getGrossPoints(), a.getGrossPoints());
          return Integer.compare(b.getRacesRun(), a.getRacesRun());
        });

    // Set rank
    int currentRank = 1;
    for (SeasonStandingItem item : result) {
      item.setRank(currentRank++);
    }

    return result;
  }

  private static class DriverEntry {
    String driverName;
    List<SeasonStandingDetail> scores = new ArrayList<>();

    DriverEntry(String driverName) {
      this.driverName = driverName;
    }
  }
}

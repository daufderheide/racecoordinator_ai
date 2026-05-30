import { CommonModule, DecimalPipe } from "@angular/common";
import { ChangeDetectorRef, Component, OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Router } from "@angular/router";
import { DataService } from "@app/data.service";
import { RaceHistoryRecord } from "@app/models/race_history_record";

interface DriverTotal {
  driverId: string;
  name: string;
  nickname: string;
  avatarUrl: string;
  totalLaps: number;
  totalPoints: number;
  racesCount: number;
  bestLapTime: number;
  averageLapTime: number;
  totalTime: number;
}

export interface DriverDetailedStats {
  driverId: string;
  name: string;
  nickname: string;
  avatarUrl: string;
  totalWins: number;
  heatWins: number;
  fastestLapsCount: number;
  medianLap: number;
  totalRaces: number;
  heatsOnTrack: number;
  averageRacePlacing: number;
  averageHeatPlacing: number;
}

@Component({
  selector: "app-cumulative-results",
  templateUrl: "./cumulative-results.component.html",
  styleUrls: ["./cumulative-results.component.css"],
  standalone: true,
  imports: [CommonModule, DecimalPipe, FormsModule],
})
export class CumulativeResultsComponent implements OnInit {
  history: RaceHistoryRecord[] = [];
  selectedRaces: Set<string> = new Set();
  selectedTrackFilter: string = "";
  selectedCarClassFilter: string = "";
  selectedDatabaseFilter: string = "";
  availableTracks: string[] = [];
  availableCarClasses: string[] = [];
  availableDatabases: string[] = [];
  isCalculating = false;
  cumulativeStandings: DriverTotal[] = [];
  isLoading = true;
  Infinity = Infinity;
  // Sorting mode: 'points' (default) or 'laps'
  sortMode: "laps" | "points" = "laps";
  selectedDriverStats: DriverDetailedStats | null = null;
  showDemoData: boolean = false;
  sidebarWidth: number = 550;
  private isResizing = false;

  constructor(
    private dataService: DataService,
    private cdr: ChangeDetectorRef,
    private router: Router,
  ) {}

  ngOnInit() {
    this.loadHistory();
  }

  /** Load race history from backend and restore any persisted selection */
  loadHistory() {
    this.isLoading = true;
    this.dataService.getRaceHistory(this.showDemoData).subscribe({
      next: (data) => {
        console.log(
          "CumulativeResultsComponent: First race raw data sample:",
          data[0],
        );
        // 1. Sort the raw data first to ensure stable indices for fallback IDs
        const sortedData = data.sort((a, b) => {
          const timeA = a.statistics?.startMillis || 0;
          const timeB = b.statistics?.startMillis || 0;
          return timeB - timeA;
        });

        // 2. Map with index-based IDs for uniqueness
        this.history = sortedData.map((r, index) => {
          const id = this.getNormalizedId(r._id, r);
          return {
            ...r,
            _id: id || `fallback-${index}-${r.statistics?.startMillis || 0}`,
          };
        });
        this.updateFilterOptions();
        this.applyStoredSelection();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error("Error loading race history:", err);
        this.isLoading = false;
        this.cdr.detectChanges();
      },
    });
  }

  toggleDemoData() {
    this.showDemoData = !this.showDemoData;
    this.loadHistory();
  }

  toggleRaceSelection(raceId: any) {
    const id = this.getNormalizedId(raceId);
    console.log("CumulativeResultsComponent: Toggling selection for ID:", id);
    if (this.selectedRaces.has(id)) {
      this.selectedRaces.delete(id);
    } else {
      this.selectedRaces.add(id);
    }
    this.saveSelectedRaces();
    this.calculateCumulativeStandings();
  }

  onRaceDoubleClick(raceId: any) {
    const id = this.getNormalizedId(raceId);
    console.log("CumulativeResultsComponent: Double clicked race:", id);

    if (id) {
      this.router.navigate(["/history/race", id], {
        queryParams: { demo: this.showDemoData },
      });
    } else {
      console.error(
        "CumulativeResultsComponent: Could not determine race ID for navigation",
      );
    }
  }

  private getNormalizedId(id: any, fallback?: any): string {
    // 1. Try to find a known unique string ID first
    let bestId = "";

    if (typeof id === "string" && id.length > 5) {
      bestId = id;
    } else if (fallback?.entity_id) {
      bestId = fallback.entity_id;
    } else if (id?.$oid) {
      bestId = id.$oid;
    } else if (id?.id && typeof id.id === "string") {
      bestId = id.id;
    } else if (fallback?._id && typeof fallback._id === "string") {
      bestId = fallback._id;
    }

    if (bestId) return bestId;

    // 2. Fallback to object stringification if no string ID found
    if (id && typeof id === "object") {
      const str = JSON.stringify(id);
      // If it looks like a generic timestamp object, it's probably not unique enough
      if (str.includes("timestamp") && str.length < 50) {
        return ""; // Force fallback-index logic in loadHistory
      }
      return str;
    }

    return id ? String(id) : "";
  }

  selectAll() {
    this.filteredHistory.forEach((r) => this.selectedRaces.add(r._id));
    this.saveSelectedRaces();
    this.calculateCumulativeStandings();
  }

  selectNone() {
    this.selectedRaces.clear();
    this.saveSelectedRaces();
    this.calculateCumulativeStandings();
  }

  get filteredHistory(): RaceHistoryRecord[] {
    return this.history.filter((r) => {
      const matchTrack =
        !this.selectedTrackFilter || r.track?.name === this.selectedTrackFilter;
      const matchCarClass =
        !this.selectedCarClassFilter ||
        r.car_class === this.selectedCarClassFilter;
      const matchDatabase =
        !this.selectedDatabaseFilter ||
        r.database_name === this.selectedDatabaseFilter;
      return matchTrack && matchCarClass && matchDatabase;
    });
  }

  private updateFilterOptions() {
    const tracks = new Set<string>();
    const carClasses = new Set<string>();
    const databases = new Set<string>();

    this.history.forEach((r) => {
      if (r.track && r.track.name) tracks.add(r.track.name);
      if (r.car_class) carClasses.add(r.car_class);
      if (r.database_name) databases.add(r.database_name);
    });

    this.availableTracks = Array.from(tracks).sort();
    this.availableCarClasses = Array.from(carClasses).sort();
    this.availableDatabases = Array.from(databases).sort();
  }

  onFilterChange() {
    // When a filter changes, we might want to unselect races that are hidden, or keep them?
    // Let's just recalculate standings based on what is selected AND visible.
    this.calculateCumulativeStandings();
  }

  calculateCumulativeStandings() {
    this.isCalculating = true;
    const driverMap = new Map<string, DriverTotal>();
    this.filteredHistory
      .filter((r) => this.selectedRaces.has(r._id))
      .forEach((race) => {
        if (!race.drivers) return;
        race.drivers.forEach((p) => {
          const driverId = p.driver?.entity_id || p.objectId;
          if (!driverMap.has(driverId)) {
            driverMap.set(driverId, {
              driverId,
              name: p.driver?.name || "Unknown",
              nickname: p.driver?.nickname || "",
              avatarUrl: p.driver?.avatarUrl || "",
              totalLaps: 0,
              totalPoints: 0,
              racesCount: 0,
              bestLapTime: Infinity,
              averageLapTime: 0,
              totalTime: 0,
            });
          }
          const total = driverMap.get(driverId)!;
          total.totalLaps += p.totalLaps || 0;
          total.totalPoints += (p as any).rankValue || 0;
          total.racesCount++;
          total.totalTime += p.totalTime || 0;
          if (p.bestLapTime > 0 && p.bestLapTime < total.bestLapTime) {
            total.bestLapTime = p.bestLapTime;
          }
        });
      });

    this.cumulativeStandings = Array.from(driverMap.values())
      .map((total) => {
        if (total.totalLaps > 0) {
          total.averageLapTime = total.totalTime / total.totalLaps;
        }
        return total;
      })
      .sort((a, b) => {
        if (this.sortMode === "points") {
          if (b.totalPoints !== a.totalPoints) {
            return b.totalPoints - a.totalPoints;
          }
          if (b.totalLaps !== a.totalLaps) {
            return b.totalLaps - a.totalLaps;
          }
          return a.totalTime - b.totalTime;
        } else {
          if (b.totalLaps !== a.totalLaps) {
            return b.totalLaps - a.totalLaps;
          }
          if (b.totalPoints !== a.totalPoints) {
            return b.totalPoints - a.totalPoints;
          }
          return a.totalTime - b.totalTime;
        }
      });

    this.isCalculating = false;
    this.cdr.detectChanges();
  }

  /** Persist selected race IDs to localStorage */
  private saveSelectedRaces() {
    const ids = Array.from(this.selectedRaces);
    localStorage.setItem("cumulative_selected_races", JSON.stringify(ids));
  }

  /** Load persisted selection and recalculate */
  private applyStoredSelection() {
    const stored = localStorage.getItem("cumulative_selected_races");
    if (stored) {
      try {
        const ids: string[] = JSON.parse(stored);
        ids.forEach((id) => this.selectedRaces.add(id));
      } catch (e) {
        console.warn("Failed to parse stored race selection", e);
      }
    }
    this.calculateCumulativeStandings();
  }

  // eslint-disable-next-line max-lines-per-function
  exportDetailedReport() {
    const selectedRaces = this.filteredHistory.filter((r) =>
      this.selectedRaces.has(r._id),
    );
    if (selectedRaces.length === 0) return;

    let reportHtml = `
      <html>
      <head>
        <title>Detailed Race Report</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; line-height: 1.4; color: #333; }
          .race-header { border-bottom: 2px solid #333; margin-bottom: 20px; padding-bottom: 10px; }
          .header-row { display: flex; gap: 40px; margin-bottom: 5px; font-weight: 600; }
          .segment-section { margin-top: 30px; }
          .segment-title { font-size: 1.2rem; font-weight: bold; border-bottom: 1px solid #ccc; margin-bottom: 10px; padding-bottom: 5px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 0.9rem; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; font-weight: bold; }
          .num { text-align: center; }
          .time { text-align: right; font-family: monospace; }
        </style>
      </head>
      <body>
    `;

    // eslint-disable-next-line max-lines-per-function
    selectedRaces.forEach((race) => {
      const trackName = race.track?.name || "Unknown Track";
      const d = new Date(race.statistics?.startMillis || 0);
      const months = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      const dateStr = race.statistics?.startMillis
        ? `${months[d.getMonth()]}-${d.getDate().toString().padStart(2, "0")}-${d.getFullYear()} ${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`
        : "Unknown Date";
      const carClass = race.car_class || "N/A";
      const segLength = race.model?.heat_scoring?.finishValue || 0;
      const finishMethod = race.model?.heat_scoring?.finishMethod || "Lap";
      const descr = race.model?.name || "";

      const geolocation = race.geolocation || race.track?.geolocation || "N/A";

      reportHtml += `
        <div class="race-header">
          <div class="header-row">
            <span>Race: ${race.model?.name || "Unknown Race"}</span>
            <span>Track: ${trackName}</span>
          </div>
          <div class="header-row">
            <span>Date: ${dateStr}</span>
            <span>Class: ${carClass}</span>
          </div>
          <div class="header-row">
            <span>Geolocation: ${geolocation}</span>
          </div>
          <div class="header-row">
            <span>Segment Length (${finishMethod}s): ${segLength}</span>
            <span>Description: ${descr}</span>
          </div>
        </div>
      `;

      if (race.heats && race.heats.length > 0) {
        // Initialize cumulative stats for this race
        const cumulative = new Map<
          string,
          { laps: number; points: number; time: number; name: string }
        >();

        // 1. Pre-collect ALL unique drivers in this race
        const allDriverIds = new Set<string>();
        if (race.drivers) {
          race.drivers.forEach((d: any) => {
            const driverObj = d.driver || d;
            const id = driverObj?.entity_id || d.objectId || d._id;
            if (id) {
              allDriverIds.add(id);
              if (!cumulative.has(id)) {
                cumulative.set(id, {
                  laps: 0,
                  points: 0,
                  time: 0,
                  name: driverObj.name || "Unknown",
                });
              }
            }
          });
        }
        race.heats.forEach((h: any) => {
          h.drivers?.forEach((hd: any) => {
            const participant = hd.driver;
            const driverObj = participant?.driver || participant || hd;
            const id =
              driverObj?.entity_id || participant?.objectId || hd.objectId;
            if (id) {
              allDriverIds.add(id);
              if (!cumulative.has(id)) {
                cumulative.set(id, {
                  laps: 0,
                  points: 0,
                  time: 0,
                  name: driverObj.name || "Unknown",
                });
              }
            }
          });
        });

        race.heats.forEach((heat, heatIdx) => {
          reportHtml += `<div class="segment-section">`;
          const isFinal = heatIdx === race.heats.length - 1;
          reportHtml += `<div class="segment-title">Segment #${heatIdx + 1}${isFinal ? " / FINAL Standings" : ""}</div>`;
          reportHtml += `<table><thead><tr>
            <th>Name</th>
            <th>Lane</th>
            <th class="num">Avg Lap</th>
            <th class="num">Fastest Lap</th>
            <th class="num">Median Lap</th>
            <th class="num">Seg Laps</th>
            <th class="num">Seg Place</th>
            <th class="num">Total Laps</th>
            <th class="num">Seg Points</th>
            <th class="num">Race Place</th>
            <th class="num">Total Points</th>
            <th class="time">Total Run Time</th>
            <th class="time">Seg Run Time</th>
          </tr></thead><tbody>`;

          const currentHeatDrivers = heat.drivers || [];

          // Pre-update cumulative stats for this heat
          currentHeatDrivers.forEach((hd: any) => {
            const driverObj = hd.driver?.driver || hd.driver;
            const id =
              driverObj?.entity_id || hd.driver?.objectId || hd.objectId;
            if (id && cumulative.has(id)) {
              const c = cumulative.get(id)!;
              c.laps += hd.driver?.totalLaps || 0;
              c.time += hd.driver?.totalTime || 0;
              c.points += hd.driver?.rankValue || 0;
            }
          });

          // Sort ALL drivers by cumulative standings
          const sortedAllDrivers = Array.from(allDriverIds).sort((aId, bId) => {
            const ca = cumulative.get(aId)!;
            const cb = cumulative.get(bId)!;
            if (ca.laps !== cb.laps) return cb.laps - ca.laps;
            if (ca.points !== cb.points) return cb.points - ca.points;
            return ca.time - cb.time;
          });

          sortedAllDrivers.forEach((driverId, rowIndex) => {
            const c = cumulative.get(driverId)!;
            const hd = currentHeatDrivers.find((hDriver: any) => {
              const hDriverObj = hDriver.driver?.driver || hDriver.driver;
              const hId =
                hDriverObj?.entity_id ||
                hDriver.driver?.objectId ||
                hDriver.objectId;
              return hId === driverId;
            });

            const isSitout = !hd;
            const laneName = hd
              ? this.getLaneName(currentHeatDrivers.indexOf(hd), race.track)
              : "SITOUT";
            const avgLap = hd?.driver?.averageLapTime?.toFixed(3) || "-";
            const fastLap = hd?.driver?.bestLapTime?.toFixed(3) || "-";
            const medLap = hd?.driver?.medianLapTime?.toFixed(3) || "-";
            const segLaps = hd?.driver?.totalLaps ?? "SITOUT";
            const segPlace = hd
              ? [...currentHeatDrivers]
                  .sort(
                    (a: any, b: any) =>
                      (b.driver?.totalLaps || 0) - (a.driver?.totalLaps || 0),
                  )
                  .indexOf(hd) + 1
              : "-";
            const totalLaps = c.laps;
            const segPoints = hd?.driver?.rankValue || 0;
            const racePlace = rowIndex + 1;
            const totalPoints = c.points;
            const totalRunTime = this.formatTotalTime(c.time);
            const segRunTime = this.formatTotalTime(hd?.driver?.totalTime || 0);

            reportHtml += `<tr style="${isSitout ? "opacity: 0.6; background-color: #f9f9f9;" : ""}">
              <td>${c.name}</td>
              <td>${laneName}</td>
              <td class="num">${avgLap}</td>
              <td class="num">${fastLap}</td>
              <td class="num">${medLap}</td>
              <td class="num">${segLaps}</td>
              <td class="num">${segPlace}</td>
              <td class="num">${totalLaps}</td>
              <td class="num">${segPoints}</td>
              <td class="num">${racePlace}</td>
              <td class="num">${totalPoints}</td>
              <td class="time">${totalRunTime}</td>
              <td class="time">${segRunTime}</td>
            </tr>`;
          });

          reportHtml += `</tbody></table></div>`;
        });
      } else if (race.drivers && race.drivers.length > 0) {
        // Fallback to final results if no heats available
        reportHtml += `<div class="segment-section">`;
        reportHtml += `<div class="segment-title">Final Results (Segment data unavailable)</div>`;
        reportHtml += `<table><thead><tr>
          <th>Name</th>
          <th>Rank</th>
          <th class="num">Avg Lap</th>
          <th class="num">Fastest Lap</th>
          <th class="num">Median Lap</th>
          <th class="num">Total Laps</th>
          <th class="num">Points</th>
          <th class="time">Total Run Time</th>
        </tr></thead><tbody>`;

        const sortedDrivers = [...race.drivers].sort((a, b) => a.rank - b.rank);
        sortedDrivers.forEach((p) => {
          const name = p.driver?.name || "Unknown";
          const avgLap = p.averageLapTime?.toFixed(3) || "0.000";
          const fastLap = p.bestLapTime?.toFixed(3) || "0.000";
          const medLap = p.medianLapTime?.toFixed(3) || "0.000";
          const totalLaps = p.totalLaps || 0;
          const rank = p.rank || 0;
          const points = (p as any).rankValue || 0;
          const totalTime = this.formatTotalTime(p.totalTime || 0);

          reportHtml += `<tr>
            <td>${name}</td>
            <td class="num">${rank}</td>
            <td class="num">${avgLap}</td>
            <td class="num">${fastLap}</td>
            <td class="num">${medLap}</td>
            <td class="num">${totalLaps}</td>
            <td class="num">${points}</td>
            <td class="time">${totalTime}</td>
          </tr>`;
        });
        reportHtml += `</tbody></table></div>`;
      } else {
        reportHtml += `<p>No race data available for this record.</p>`;
      }
      reportHtml += `<hr style="margin: 40px 0; border: 0; border-top: 2px dashed #ccc;">`;
    });

    reportHtml += `</body></html>`;
    this.downloadFile(reportHtml, "detailed_race_report.html", "text/html");
  }

  private getLaneName(index: number, track: any): string {
    if (track && track.lanes && track.lanes[index]) {
      const lane = track.lanes[index];
      const color = lane.background_color?.toLowerCase() || "";
      if (color === "#00ff00" || color === "green") return "Green";
      if (color === "#ff0000" || color === "red") return "Red";
      if (color === "#0000ff" || color === "blue") return "Blue";
      if (color === "#ffff00" || color === "yellow") return "Yellow";
      if (color === "#ffffff" || color === "white") return "White";
      if (color === "#000000" || color === "black") return "Black";
      if (color === "#ffa500" || color === "orange") return "Orange";
      if (color === "#800080" || color === "purple") return "Purple";
      return lane.background_color || `Lane ${index + 1}`;
    }
    return `Lane ${index + 1}`;
  }

  exportCsv() {
    const selectedRaces = this.filteredHistory.filter((r) =>
      this.selectedRaces.has(r._id),
    );
    const raceNames = selectedRaces
      .map((r) => r.model?.name || "Unknown")
      .join("; ");
    const tracks = Array.from(
      new Set(selectedRaces.map((r) => r.track?.name || "Unknown")),
    ).join("; ");
    const carClasses = Array.from(
      new Set(selectedRaces.map((r) => r.car_class || "N/A")),
    ).join("; ");
    const geolocations = Array.from(
      new Set(
        selectedRaces.map(
          (r) => r.geolocation || r.track?.geolocation || "N/A",
        ),
      ),
    ).join("; ");

    let dateRange = "N/A";
    if (selectedRaces.length > 0) {
      const startMillis = Math.min(
        ...selectedRaces.map((r) => r.statistics?.startMillis || Infinity),
      );
      const endMillis = Math.max(
        ...selectedRaces.map((r) => r.statistics?.startMillis || -Infinity),
      );
      if (startMillis !== Infinity) {
        dateRange = this.formatDateOnly(startMillis);
        if (endMillis !== -Infinity && endMillis !== startMillis) {
          dateRange += " to " + this.formatDateOnly(endMillis);
        }
      }
    }

    const metadata = [
      ["Date Range", `"${dateRange}"`],
      ["Races", `"${raceNames}"`],
      ["Tracks", `"${tracks}"`],
      ["Car Classes", `"${carClasses}"`],
      ["Geolocations", `"${geolocations}"`],
      [],
    ]
      .map((r) => r.join(","))
      .join("\n");

    const header = [
      "Rank",
      "Driver",
      "Races",
      "Total Laps",
      "Points",
      "Total Time",
      "Best Lap",
      "Avg Lap",
    ].join(",");
    const rows = this.cumulativeStandings.map((entry, index) => {
      const bestLap =
        entry.bestLapTime === this.Infinity
          ? "-"
          : entry.bestLapTime.toFixed(3);
      const avgLap = entry.averageLapTime.toFixed(3);
      return [
        index + 1,
        `"${entry.name}"`,
        entry.racesCount,
        entry.totalLaps,
        entry.totalPoints,
        `"${this.formatTotalTime(entry.totalTime)}"`,
        bestLap,
        avgLap,
      ].join(",");
    });
    const csvContent = metadata + [header, ...rows].join("\n");
    this.downloadFile(csvContent, "analytics.csv", "text/csv");
  }

  exportHtml() {
    const selectedRaces = this.filteredHistory.filter((r) =>
      this.selectedRaces.has(r._id),
    );
    const raceNames = selectedRaces
      .map((r) => r.model?.name || "Unknown")
      .join(", ");
    const tracks = Array.from(
      new Set(selectedRaces.map((r) => r.track?.name || "Unknown")),
    ).join(", ");
    const carClasses = Array.from(
      new Set(selectedRaces.map((r) => r.car_class || "N/A")),
    ).join(", ");
    const geolocations = Array.from(
      new Set(
        selectedRaces.map(
          (r) => r.geolocation || r.track?.geolocation || "N/A",
        ),
      ),
    ).join(", ");

    let dateRange = "N/A";
    if (selectedRaces.length > 0) {
      const startMillis = Math.min(
        ...selectedRaces.map((r) => r.statistics?.startMillis || Infinity),
      );
      const endMillis = Math.max(
        ...selectedRaces.map((r) => r.statistics?.startMillis || -Infinity),
      );
      if (startMillis !== Infinity) {
        dateRange = this.formatDateOnly(startMillis);
        if (endMillis !== -Infinity && endMillis !== startMillis) {
          dateRange += " to " + this.formatDateOnly(endMillis);
        }
      }
    }

    const tableHtml =
      document.querySelector(".standings-table")?.outerHTML || "";
    const htmlContent = `
      <html>
      <head>
        <title>Analytics Report</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #fff; color: #333; padding: 20px; }
          h1 { color: #1e1e2f; text-align: center; margin-bottom: 20px; }
          .metadata-box { max-width: 1000px; margin: 0 auto 30px; padding: 15px; background: #f8f9fa; border-radius: 8px; border: 1px solid #eee; }
          .metadata-row { display: flex; gap: 30px; margin-bottom: 8px; font-size: 0.9rem; }
          .metadata-label { font-weight: 700; min-width: 100px; color: #666; }
          table { border-collapse: collapse; width: 100%; max-width: 1000px; margin: 0 auto; box-shadow: 0 0 20px rgba(0,0,0,0.05); }
          th, td { border: 1px solid #eee; padding: 12px; text-align: left; }
          th { background-color: #f8f9fa; font-weight: 700; text-transform: uppercase; font-size: 0.75rem; color: #666; letter-spacing: 0.05em; }
          .driver-info { display: flex; align-items: center; gap: 10px; }
          .driver-avatar { width: 24px; height: 24px; border-radius: 50%; object-fit: cover; border: 1px solid #eee; background: #f9f9f9; }
          .driver-name { font-weight: 600; font-size: 0.95rem; }
          .driver-nickname { font-size: 0.85rem; color: #888; font-weight: normal; margin-left: 4px; }
          .rank-badge { font-weight: 800; display: inline-block; width: 24px; text-align: center; }
          
          /* Centering appropriate columns */
          th:first-child, td:first-child, 
          th:nth-child(3), td:nth-child(3),
          th:nth-child(4), td:nth-child(4),
          th:nth-child(5), td:nth-child(5),
          th:nth-child(6), td:nth-child(6) { 
            text-align: center; 
          }
          
          .points-col { font-weight: 700; color: #000; }
          .laps-col { color: #3b82f6; }
          tr:nth-child(even) { background-color: #fafafa; }
        </style>
      </head>
      <body>
        <h1>Cumulative Analytics Report</h1>
        <div class="metadata-box">
          <div class="metadata-row"><span class="metadata-label">Date Range:</span> <span>${dateRange}</span></div>
          <div class="metadata-row"><span class="metadata-label">Races:</span> <span>${raceNames}</span></div>
          <div class="metadata-row"><span class="metadata-label">Tracks:</span> <span>${tracks}</span></div>
          <div class="metadata-row"><span class="metadata-label">Car Classes:</span> <span>${carClasses}</span></div>
          <div class="metadata-row"><span class="metadata-label">Geolocations:</span> <span>${geolocations}</span></div>
        </div>
        ${tableHtml}
      </body>
      </html>
    `;
    this.downloadFile(htmlContent, "analytics.html", "text/html");
  }

  private downloadFile(content: string, filename: string, mimeType: string) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  formatDate(millis: number | undefined): string {
    if (!millis) return "Unknown Date";
    return new Date(millis).toLocaleString([], {
      year: "2-digit",
      month: "numeric",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  formatDateOnly(millis: number | undefined): string {
    if (!millis) return "Unknown Date";
    return new Date(millis).toLocaleDateString([], {
      month: "short",
      day: "numeric",
      year: "2-digit",
    });
  }

  formatTime(millis: number | undefined): string {
    if (!millis) return "";
    return new Date(millis).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  formatTotalTime(totalTimeSeconds: number): string {
    if (!totalTimeSeconds || totalTimeSeconds === 0) return "0.000";
    const hours = Math.floor(totalTimeSeconds / 3600);
    const minutes = Math.floor((totalTimeSeconds % 3600) / 60);
    const seconds = Math.floor(totalTimeSeconds % 60);
    const ms = Math.round((totalTimeSeconds % 1) * 1000);

    let timeStr = "";
    if (hours > 0) {
      timeStr =
        hours +
        ":" +
        minutes.toString().padStart(2, "0") +
        ":" +
        seconds.toString().padStart(2, "0");
    } else if (minutes > 0) {
      timeStr = minutes + ":" + seconds.toString().padStart(2, "0");
    } else {
      timeStr = seconds.toString();
    }

    return timeStr + "." + ms.toString().padStart(3, "0");
  }

  goBack() {
    this.router.navigate(["/raceday-setup"]);
  }

  goToMaintenance() {
    this.router.navigate(["/history/maintenance"]);
  }

  onResizeStart(event: MouseEvent) {
    this.isResizing = true;
    event.preventDefault();
  }

  onMouseMove(event: MouseEvent) {
    if (!this.isResizing) return;
    const newWidth = event.clientX - 24; // 24px padding/offset compensation
    if (newWidth > 300 && newWidth < 1000) {
      this.sidebarWidth = newWidth;
    }
  }

  onMouseUp() {
    this.isResizing = false;
  }

  getAvatarUrl(url: string | undefined): string {
    if (!url) return "assets/default-avatar.png";
    if (url.startsWith("/")) {
      return `${this.dataService.serverUrl}${url}`;
    }
    return url;
  }

  // eslint-disable-next-line max-lines-per-function
  openDriverCard(driverTotal: DriverTotal) {
    const driverId = driverTotal.driverId;
    const stats: DriverDetailedStats = {
      driverId: driverId,
      name: driverTotal.name,
      nickname: driverTotal.nickname,
      avatarUrl: driverTotal.avatarUrl,
      totalWins: 0,
      heatWins: 0,
      fastestLapsCount: 0,
      medianLap: 0,
      totalRaces: 0,
      heatsOnTrack: 0,
      averageRacePlacing: 0,
      averageHeatPlacing: 0,
    };

    const selectedRaceRecords = this.filteredHistory.filter((r) =>
      this.selectedRaces.has(r._id),
    );

    let raceRanks: number[] = [];
    let heatRanks: number[] = [];
    let medianLaps: number[] = [];

    selectedRaceRecords.forEach((race) => {
      // Find driver in this race
      const driverPart = race.drivers?.find(
        (d) => (d.driver?.entity_id || d.objectId) === driverId,
      );
      if (!driverPart) return;

      stats.totalRaces++;
      raceRanks.push(driverPart.rank);
      if (driverPart.rank === 1) {
        stats.totalWins++;
      }

      if (driverPart.medianLapTime && driverPart.medianLapTime > 0) {
        medianLaps.push(driverPart.medianLapTime);
      } else if (driverPart.averageLapTime && driverPart.averageLapTime > 0) {
        medianLaps.push(driverPart.averageLapTime);
      }

      // Credit the fastest lap to exactly one driver per race. On a tie for
      // the minimum best lap, award it to the first such driver in race order.
      const myBest = driverPart.bestLapTime;
      if (myBest > 0 && myBest !== this.Infinity) {
        const validDrivers = (race.drivers || []).filter(
          (d) => d.bestLapTime > 0 && d.bestLapTime !== this.Infinity,
        );
        const minBest = Math.min(...validDrivers.map((d) => d.bestLapTime));
        const winner = validDrivers.find((d) => d.bestLapTime === minBest);
        const winnerId = winner
          ? winner.driver?.entity_id || winner.objectId
          : null;
        if (myBest === minBest && winnerId === driverId) {
          stats.fastestLapsCount++;
        }
      }

      // Process Heats (if available, otherwise fallback to race stats)
      if (race.heats && race.heats.length > 0) {
        race.heats.forEach((heat) => {
          const heatDrivers = heat.drivers || [];
          const heatDriver = heatDrivers.find(
            (hd: any) =>
              hd.driver?.driver?.entity_id === driverId ||
              hd.driver?.objectId === driverId,
          );
          if (heatDriver) {
            stats.heatsOnTrack++;
            // Compute heat rank by sorting heat drivers by laps desc, time asc
            const sortedHeatDrivers = [...heatDrivers].sort(
              (a: any, b: any) => {
                const lapsA = a.driver?.totalLaps || 0;
                const lapsB = b.driver?.totalLaps || 0;
                if (lapsA !== lapsB) return lapsB - lapsA;
                const timeA = a.driver?.totalTime || 0;
                const timeB = b.driver?.totalTime || 0;
                return timeA - timeB;
              },
            );

            const rank =
              sortedHeatDrivers.findIndex(
                (hd: any) =>
                  hd.driver?.driver?.entity_id === driverId ||
                  hd.driver?.objectId === driverId,
              ) + 1;

            if (rank > 0) {
              heatRanks.push(rank);
              if (rank === 1) {
                stats.heatWins++;
              }
            }
          }
        });
      } else {
        // If no heats array, assume the race was 1 heat that they participated in
        stats.heatsOnTrack++;
        heatRanks.push(driverPart.rank);
        if (driverPart.rank === 1) stats.heatWins++;
      }
    });

    if (raceRanks.length > 0) {
      stats.averageRacePlacing =
        raceRanks.reduce((a, b) => a + b, 0) / raceRanks.length;
    }
    if (heatRanks.length > 0) {
      stats.averageHeatPlacing =
        heatRanks.reduce((a, b) => a + b, 0) / heatRanks.length;
    }
    if (medianLaps.length > 0) {
      medianLaps.sort((a, b) => a - b);
      const mid = Math.floor(medianLaps.length / 2);
      if (medianLaps.length % 2 === 0) {
        stats.medianLap = (medianLaps[mid - 1] + medianLaps[mid]) / 2;
      } else {
        stats.medianLap = medianLaps[mid];
      }
    }

    this.selectedDriverStats = stats;
  }

  exportDriverCsv() {
    if (!this.selectedDriverStats) return;
    const s = this.selectedDriverStats;
    const header = "Stat,Value";
    const rows = [
      ["Driver", s.name],
      ["Nickname", s.nickname || "-"],
      ["Total Wins", s.totalWins],
      ["Heat Wins", s.heatWins],
      ["Fastest Laps", s.fastestLapsCount],
      ["Median Lap", s.medianLap > 0 ? s.medianLap.toFixed(3) : "-"],
      ["Total Races", s.totalRaces],
      ["Heats on Track", s.heatsOnTrack],
      [
        "Avg Race Rank",
        s.averageRacePlacing > 0 ? s.averageRacePlacing.toFixed(1) : "-",
      ],
      [
        "Avg Heat Rank",
        s.averageHeatPlacing > 0 ? s.averageHeatPlacing.toFixed(1) : "-",
      ],
    ].map((r) => r.join(","));

    const csvContent = [header, ...rows].join("\n");
    const filename = `stats_${s.name.replace(/\s+/g, "_").toLowerCase()}.csv`;
    this.downloadFile(csvContent, filename, "text/csv");
  }

  exportDriverHtml() {
    if (!this.selectedDriverStats) return;
    const s = this.selectedDriverStats;
    const htmlContent = `
      <html>
      <head>
        <title>Stats: ${s.name}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #fff; color: #333; padding: 40px; }
          .card { max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 30px; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
          .header { display: flex; align-items: center; gap: 20px; margin-bottom: 30px; border-bottom: 2px solid #f0f0f0; padding-bottom: 20px; }
          .avatar { width: 80px; height: 80px; border-radius: 50%; object-fit: cover; }
          h1 { margin: 0; color: #1e1e2f; }
          .nickname { color: #888; font-style: italic; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
          .stat-box { background: #f8f9fa; padding: 15px; border-radius: 8px; }
          .label { font-size: 0.8rem; color: #666; text-transform: uppercase; display: block; margin-bottom: 5px; }
          .value { font-size: 1.5rem; font-weight: 700; color: #1e1e2f; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="header">
            <img src="${this.getAvatarUrl(s.avatarUrl)}" class="avatar">
            <div>
              <h1>${s.name}</h1>
              ${s.nickname ? `<span class="nickname">"${s.nickname}"</span>` : ""}
            </div>
          </div>
          <div class="grid">
            <div class="stat-box"><span class="label">Total Wins</span><span class="value">${s.totalWins}</span></div>
            <div class="stat-box"><span class="label">Heat Wins</span><span class="value">${s.heatWins}</span></div>
            <div class="stat-box"><span class="label">Fastest Laps</span><span class="value">${s.fastestLapsCount}</span></div>
            <div class="stat-box"><span class="label">Median Lap</span><span class="value">${s.medianLap > 0 ? s.medianLap.toFixed(3) : "-"}</span></div>
            <div class="stat-box"><span class="label">Total Races</span><span class="value">${s.totalRaces}</span></div>
            <div class="stat-box"><span class="label">Heats on Track</span><span class="value">${s.heatsOnTrack}</span></div>
            <div class="stat-box"><span class="label">Avg Race Rank</span><span class="value">${s.averageRacePlacing > 0 ? s.averageRacePlacing.toFixed(1) : "-"}</span></div>
            <div class="stat-box"><span class="label">Avg Heat Rank</span><span class="value">${s.averageHeatPlacing > 0 ? s.averageHeatPlacing.toFixed(1) : "-"}</span></div>
          </div>
        </div>
      </body>
      </html>
    `;
    const filename = `stats_${s.name.replace(/\s+/g, "_").toLowerCase()}.html`;
    this.downloadFile(htmlContent, filename, "text/html");
  }

  exportDriverPng() {
    if (!this.selectedDriverStats) return;
    const cardEl = document.querySelector(".driver-card") as HTMLElement;
    if (cardEl) {
      import("html2canvas").then((m) => {
        const h2c = m.default || m;
        // Temporarily hide close button for cleaner capture
        const closeBtn = cardEl.querySelector(".close-btn") as HTMLElement;
        if (closeBtn) closeBtn.style.display = "none";

        (h2c as any)(cardEl, {
          backgroundColor: "#1e1e2f",
          scale: 2, // Higher quality
        }).then((canvas: HTMLCanvasElement) => {
          if (closeBtn) closeBtn.style.display = "flex";
          const imgData = canvas.toDataURL("image/png");
          const link = document.createElement("a");
          link.href = imgData;
          link.download = `stats_${this.selectedDriverStats!.name.replace(/\s+/g, "_").toLowerCase()}.png`;
          link.click();
        });
      });
    }
  }

  closeDriverCard() {
    this.selectedDriverStats = null;
  }
}

import { ChangeDetectorRef, Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { DataService } from "src/app/data.service";
import { RaceHistoryRecord } from "src/app/models/race_history_record";
import { SettingsService } from "src/app/services/settings.service";
import { ThemeService } from "src/app/services/theme.service";

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

@Component({
  selector: "app-cumulative-results",
  templateUrl: "./cumulative-results.component.html",
  styleUrls: ["./cumulative-results.component.css"],
  standalone: false
})
export class CumulativeResultsComponent implements OnInit {
  history: RaceHistoryRecord[] = [];
  selectedRaces: Set<string> = new Set();
  isCalculating = false;
  cumulativeStandings: DriverTotal[] = [];
  isLoading = true;
  Infinity = Infinity;
  // Sorting mode: 'points' (default) or 'laps'
  sortMode: 'points' | 'laps' = 'points';

  constructor(
    private dataService: DataService,
    private settingsService: SettingsService,
    private themeService: ThemeService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadHistory();
  }

  /** Load race history from backend and restore any persisted selection */
  private loadHistory() {
    this.isLoading = true;
    const isDemo = false;
    this.dataService.getRaceHistory(isDemo).subscribe({
      next: (data) => {
        this.history = data.sort((a, b) => {
          const timeA = a.statistics?.startMillis || 0;
          const timeB = b.statistics?.startMillis || 0;
          return timeB - timeA;
        });
        this.applyStoredSelection();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error("Error loading race history:", err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  toggleRaceSelection(raceId: string) {
    if (this.selectedRaces.has(raceId)) {
      this.selectedRaces.delete(raceId);
    } else {
      this.selectedRaces.add(raceId);
    }
    this.saveSelectedRaces();
    this.calculateCumulativeStandings();
  }

  selectAll() {
    this.history.forEach(r => this.selectedRaces.add(r._id));
    this.saveSelectedRaces();
    this.calculateCumulativeStandings();
  }

  selectNone() {
    this.selectedRaces.clear();
    this.saveSelectedRaces();
    this.calculateCumulativeStandings();
  }

  calculateCumulativeStandings() {
    this.isCalculating = true;
    const driverMap = new Map<string, DriverTotal>();
    this.history
      .filter(r => this.selectedRaces.has(r._id))
      .forEach(race => {
        if (!race.drivers) return;
        race.drivers.forEach(p => {
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
              totalTime: 0
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
      .map(total => {
        if (total.totalLaps > 0) {
          total.averageLapTime = total.totalTime / total.totalLaps;
        }
        return total;
      })
      .sort((a, b) => {
        if (this.sortMode === 'points') {
          if (b.totalPoints !== a.totalPoints) {
            return b.totalPoints - a.totalPoints;
          }
          return b.totalLaps - a.totalLaps;
        } else {
          if (b.totalLaps !== a.totalLaps) {
            return b.totalLaps - a.totalLaps;
          }
          return b.totalPoints - a.totalPoints;
        }
      });

    this.isCalculating = false;
    this.cdr.detectChanges();
  }

  /** Persist selected race IDs to localStorage */
  private saveSelectedRaces() {
    const ids = Array.from(this.selectedRaces);
    localStorage.setItem('cumulative_selected_races', JSON.stringify(ids));
  }

  /** Load persisted selection and recalculate */
  private applyStoredSelection() {
    const stored = localStorage.getItem('cumulative_selected_races');
    if (stored) {
      try {
        const ids: string[] = JSON.parse(stored);
        ids.forEach(id => this.selectedRaces.add(id));
      } catch (e) {
        console.warn('Failed to parse stored race selection', e);
      }
    }
    this.calculateCumulativeStandings();
  }

  exportCsv() {
    const header = ['Rank', 'Driver', 'Races', 'Total Laps', 'Points', 'Best Lap', 'Avg Lap'].join(',');
    const rows = this.cumulativeStandings.map((entry, index) => {
      const bestLap = entry.bestLapTime === this.Infinity ? '-' : entry.bestLapTime.toFixed(3);
      const avgLap = entry.averageLapTime.toFixed(3);
      return [
        index + 1,
        `"${entry.name}"`,
        entry.racesCount,
        entry.totalLaps,
        entry.totalPoints,
        bestLap,
        avgLap
      ].join(',');
    });
    const csvContent = [header, ...rows].join('\n');
    this.downloadFile(csvContent, 'cumulative_standings.csv', 'text/csv');
  }

  exportHtml() {
    const tableHtml = document.querySelector('.standings-table')?.outerHTML || '';
    const htmlContent = `
      <html>
      <head>
        <title>Cumulative Standings</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #fff; color: #333; padding: 20px; }
          h1 { color: #1e1e2f; text-align: center; margin-bottom: 30px; }
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
          th:nth-child(5), td:nth-child(5) { 
            text-align: center; 
          }
          
          .points-col { font-weight: 700; color: #000; }
          .laps-col { color: #3b82f6; }
          tr:nth-child(even) { background-color: #fafafa; }
        </style>
      </head>
      <body>
        <h1>Cumulative Standings</h1>
        ${tableHtml}
      </body>
      </html>
    `;
    this.downloadFile(htmlContent, 'cumulative_standings.html', 'text/html');
  }

  exportPng() {
    const tableEl = document.querySelector('.standings-panel') as HTMLElement;
    if (tableEl) {
      import('html2canvas').then(m => {
        const h2c = m.default || m;
        (h2c as any)(tableEl).then((canvas: HTMLCanvasElement) => {
          const imgData = canvas.toDataURL('image/png');
          const link = document.createElement('a');
          link.href = imgData;
          link.download = 'cumulative_standings.png';
          link.click();
        });
      });
    }
  }

  private downloadFile(content: string, filename: string, mimeType: string) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  formatDate(millis: number | undefined): string {
    if (!millis) return "Unknown Date";
    return new Date(millis).toLocaleString();
  }

  goBack() {
    this.router.navigate(["/raceday-setup"]);
  }

  getAvatarUrl(url: string | undefined): string {
    if (!url) return "assets/default-avatar.png";
    if (url.startsWith("/")) {
      return `${this.dataService.serverUrl}${url}`;
    }
    return url;
  }
}

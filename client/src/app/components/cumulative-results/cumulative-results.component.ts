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
  standalone: false
})
export class CumulativeResultsComponent implements OnInit {
  history: RaceHistoryRecord[] = [];
  selectedRaces: Set<string> = new Set();
  selectedTrackFilter: string = '';
  selectedCarClassFilter: string = '';
  selectedDatabaseFilter: string = '';
  availableTracks: string[] = [];
  availableCarClasses: string[] = [];
  availableDatabases: string[] = [];
  isCalculating = false;
  cumulativeStandings: DriverTotal[] = [];
  isLoading = true;
  Infinity = Infinity;
  // Sorting mode: 'points' (default) or 'laps'
  sortMode: 'points' | 'laps' = 'points';
  selectedDriverStats: DriverDetailedStats | null = null;

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
        this.updateFilterOptions();
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
    this.filteredHistory.forEach(r => this.selectedRaces.add(r._id));
    this.saveSelectedRaces();
    this.calculateCumulativeStandings();
  }

  selectNone() {
    this.selectedRaces.clear();
    this.saveSelectedRaces();
    this.calculateCumulativeStandings();
  }

  get filteredHistory(): RaceHistoryRecord[] {
    return this.history.filter(r => {
      const matchTrack = !this.selectedTrackFilter || r.track?.name === this.selectedTrackFilter;
      const matchCarClass = !this.selectedCarClassFilter || r.car_class === this.selectedCarClassFilter;
      const matchDatabase = !this.selectedDatabaseFilter || r.database_name === this.selectedDatabaseFilter;
      return matchTrack && matchCarClass && matchDatabase;
    });
  }

  private updateFilterOptions() {
    const tracks = new Set<string>();
    const carClasses = new Set<string>();
    const databases = new Set<string>();

    this.history.forEach(r => {
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
    const header = ['Rank', 'Driver', 'Races', 'Total Laps', 'Points', 'Total Time', 'Best Lap', 'Avg Lap'].join(',');
    const rows = this.cumulativeStandings.map((entry, index) => {
      const bestLap = entry.bestLapTime === this.Infinity ? '-' : entry.bestLapTime.toFixed(3);
      const avgLap = entry.averageLapTime.toFixed(3);
      return [
        index + 1,
        `"${entry.name}"`,
        entry.racesCount,
        entry.totalLaps,
        entry.totalPoints,
        `"${this.formatTotalTime(entry.totalTime)}"`,
        bestLap,
        avgLap
      ].join(',');
    });
    const csvContent = [header, ...rows].join('\n');
    this.downloadFile(csvContent, 'analytics.csv', 'text/csv');
  }

  exportHtml() {
    const tableHtml = document.querySelector('.standings-table')?.outerHTML || '';
    const htmlContent = `
      <html>
      <head>
        <title>Analytics</title>
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
        <h1>Analytics</h1>
        ${tableHtml}
      </body>
      </html>
    `;
    this.downloadFile(htmlContent, 'analytics.html', 'text/html');
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
          link.download = 'analytics.png';
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
    if (!millis) return 'Unknown Date';
    return new Date(millis).toLocaleString([], { 
      year: '2-digit', 
      month: 'numeric', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }

  formatTotalTime(totalTimeSeconds: number): string {
    if (!totalTimeSeconds || totalTimeSeconds === 0) return "0.000";
    const hours = Math.floor(totalTimeSeconds / 3600);
    const minutes = Math.floor((totalTimeSeconds % 3600) / 60);
    const seconds = Math.floor(totalTimeSeconds % 60);
    const ms = Math.floor((totalTimeSeconds % 1) * 1000);

    let timeStr = "";
    if (hours > 0) {
      timeStr = hours + ":" + 
                minutes.toString().padStart(2, '0') + ":" + 
                seconds.toString().padStart(2, '0');
    } else if (minutes > 0) {
      timeStr = minutes + ":" + 
                seconds.toString().padStart(2, '0');
    } else {
      timeStr = seconds.toString();
    }

    return timeStr + "." + ms.toString().padStart(3, '0');
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
      averageHeatPlacing: 0
    };

    const selectedRaceRecords = this.filteredHistory.filter(r => this.selectedRaces.has(r._id));
    
    let raceRanks: number[] = [];
    let heatRanks: number[] = [];
    let medianLaps: number[] = [];
    
    selectedRaceRecords.forEach(race => {
      // Find driver in this race
      const driverPart = race.drivers?.find(d => (d.driver?.entity_id || d.objectId) === driverId);
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

      // Check if driver had the absolute fastest lap in this race
      let isFastest = true;
      let myBest = driverPart.bestLapTime;
      if (myBest > 0 && myBest !== this.Infinity) {
        race.drivers?.forEach(other => {
          if (other.bestLapTime > 0 && other.bestLapTime < myBest) {
            isFastest = false;
          }
        });
        if (isFastest) {
          stats.fastestLapsCount++;
        }
      }

      // Process Heats (if available, otherwise fallback to race stats)
      if (race.heats && race.heats.length > 0) {
        race.heats.forEach(heat => {
          const heatDrivers = heat.drivers || [];
          const heatDriver = heatDrivers.find((hd: any) => 
            hd.driver?.driver?.entity_id === driverId || hd.driver?.objectId === driverId
          );
          if (heatDriver) {
             stats.heatsOnTrack++;
             // Compute heat rank by sorting heat drivers by laps desc, time asc
             const sortedHeatDrivers = [...heatDrivers].sort((a: any, b: any) => {
               const lapsA = a.driver?.totalLaps || 0;
               const lapsB = b.driver?.totalLaps || 0;
               if (lapsA !== lapsB) return lapsB - lapsA;
               const timeA = a.driver?.totalTime || 0;
               const timeB = b.driver?.totalTime || 0;
               return timeA - timeB;
             });
             
             const rank = sortedHeatDrivers.findIndex((hd: any) => 
               hd.driver?.driver?.entity_id === driverId || hd.driver?.objectId === driverId
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
      stats.averageRacePlacing = raceRanks.reduce((a, b) => a + b, 0) / raceRanks.length;
    }
    if (heatRanks.length > 0) {
      stats.averageHeatPlacing = heatRanks.reduce((a, b) => a + b, 0) / heatRanks.length;
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
    const header = 'Stat,Value';
    const rows = [
      ['Driver', s.name],
      ['Nickname', s.nickname || '-'],
      ['Total Wins', s.totalWins],
      ['Heat Wins', s.heatWins],
      ['Fastest Laps', s.fastestLapsCount],
      ['Median Lap', s.medianLap > 0 ? s.medianLap.toFixed(3) : '-'],
      ['Total Races', s.totalRaces],
      ['Heats on Track', s.heatsOnTrack],
      ['Avg Race Rank', s.averageRacePlacing > 0 ? s.averageRacePlacing.toFixed(1) : '-'],
      ['Avg Heat Rank', s.averageHeatPlacing > 0 ? s.averageHeatPlacing.toFixed(1) : '-']
    ].map(r => r.join(','));
    
    const csvContent = [header, ...rows].join('\n');
    const filename = `stats_${s.name.replace(/\s+/g, '_').toLowerCase()}.csv`;
    this.downloadFile(csvContent, filename, 'text/csv');
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
              ${s.nickname ? `<span class="nickname">"${s.nickname}"</span>` : ''}
            </div>
          </div>
          <div class="grid">
            <div class="stat-box"><span class="label">Total Wins</span><span class="value">${s.totalWins}</span></div>
            <div class="stat-box"><span class="label">Heat Wins</span><span class="value">${s.heatWins}</span></div>
            <div class="stat-box"><span class="label">Fastest Laps</span><span class="value">${s.fastestLapsCount}</span></div>
            <div class="stat-box"><span class="label">Median Lap</span><span class="value">${s.medianLap > 0 ? s.medianLap.toFixed(3) : '-'}</span></div>
            <div class="stat-box"><span class="label">Total Races</span><span class="value">${s.totalRaces}</span></div>
            <div class="stat-box"><span class="label">Heats on Track</span><span class="value">${s.heatsOnTrack}</span></div>
            <div class="stat-box"><span class="label">Avg Race Rank</span><span class="value">${s.averageRacePlacing > 0 ? s.averageRacePlacing.toFixed(1) : '-'}</span></div>
            <div class="stat-box"><span class="label">Avg Heat Rank</span><span class="value">${s.averageHeatPlacing > 0 ? s.averageHeatPlacing.toFixed(1) : '-'}</span></div>
          </div>
        </div>
      </body>
      </html>
    `;
    const filename = `stats_${s.name.replace(/\s+/g, '_').toLowerCase()}.html`;
    this.downloadFile(htmlContent, filename, 'text/html');
  }

  exportDriverPng() {
    if (!this.selectedDriverStats) return;
    const cardEl = document.querySelector('.driver-card') as HTMLElement;
    if (cardEl) {
      import('html2canvas').then(m => {
        const h2c = m.default || m;
        // Temporarily hide close button for cleaner capture
        const closeBtn = cardEl.querySelector('.close-btn') as HTMLElement;
        if (closeBtn) closeBtn.style.display = 'none';
        
        (h2c as any)(cardEl, {
          backgroundColor: '#1e1e2f',
          scale: 2 // Higher quality
        }).then((canvas: HTMLCanvasElement) => {
          if (closeBtn) closeBtn.style.display = 'flex';
          const imgData = canvas.toDataURL('image/png');
          const link = document.createElement('a');
          link.href = imgData;
          link.download = `stats_${this.selectedDriverStats!.name.replace(/\s+/g, '_').toLowerCase()}.png`;
          link.click();
        });
      });
    }
  }

  closeDriverCard() {
    this.selectedDriverStats = null;
  }
}

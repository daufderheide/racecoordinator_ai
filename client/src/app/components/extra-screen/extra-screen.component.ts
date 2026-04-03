import { Component, OnInit, OnDestroy, ChangeDetectorRef, HostListener } from '@angular/core';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';
import { Heat } from '../../race/heat';
import { DriverHeatData } from '../../race/driver_heat_data';
import { Track } from 'src/app/models/track';
import { Race } from 'src/app/models/race';
import { TranslationService } from 'src/app/services/translation.service';
import { RaceService } from 'src/app/services/race.service';
import { SettingsService } from 'src/app/services/settings.service';
import { AnchorPoint } from '../raceday/column_definition';
import { Settings, ColumnVisibility } from 'src/app/models/settings';
import { ColumnDefinition } from '../raceday/column_definition';
import { RaceConnectionService } from 'src/app/services/race-connection.service';
import { com } from 'src/app/proto/message';

@Component({
  selector: 'app-extra-screen',
  templateUrl: './extra-screen.component.html',
  styleUrls: ['./extra-screen.component.css'],
  standalone: false
})
export class ExtraScreenComponent implements OnInit, OnDestroy {
  private isDestroyed = false;
  private subscriptions: Subscription[] = [];
  
  heat?: Heat;
  track!: Track;
  race!: Race | undefined;
  columns: ColumnDefinition[] = [];
  errorMessage?: string;
  protected time: number = 0;
  protected timeFormat: string = '1.0-0';
  private previousTime: number = 0;
  scale: number = 1;
  raceState: com.antigravity.RaceState = com.antigravity.RaceState.UNKNOWN_STATE;
  sortedHeatDrivers: DriverHeatData[] = [];
  totalHeats: number = 0;
  highlightedDrivers: Set<string> = new Set();
  private driverRankings = new Map<string, number>();

  constructor(
    private raceService: RaceService,
    private settingsService: SettingsService,
    private raceConnection: RaceConnectionService,
    private translationService: TranslationService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}

  ngOnInit() {
    this.updateScale();
    this.loadRaceData();
    
    this.raceConnection.connect();
    
    this.subscriptions.push(
      this.raceConnection.raceTime$.subscribe(raceTime => {
        if (!this.isDestroyed) {
          const time = raceTime.time || 0;
          
          // Dynamic time format matching Race screen
          if (time > this.previousTime) {
            this.timeFormat = '1.0-0';
          } else if (time < this.previousTime) {
            if (time < 10) {
              this.timeFormat = '1.2-2';
            } else {
              this.timeFormat = '1.0-0';
            }
          } else {
            if (time === 0) this.timeFormat = '1.0-0';
          }
          
          this.previousTime = time;
          this.time = time;
          this.cdr.detectChanges();
        }
      })
    );
    
    this.subscriptions.push(
      this.raceConnection.raceState$.subscribe(state => {
        if (!this.isDestroyed) {
          this.raceState = state;
          this.cdr.detectChanges();
        }
      })
    );
    
    this.subscriptions.push(
      this.raceConnection.standingsUpdate$.subscribe(update => {
        if (update && update.updates) {
          update.updates.forEach(u => {
            if (u.objectId && u.rank != null && u.rank !== undefined) {
              this.driverRankings.set(u.objectId, u.rank);
            }
          });
          this.sortHeatDrivers();
        }
      })
    );
    
    this.subscriptions.push(
      this.raceConnection.laps$.subscribe(lap => {
        if (this.heat?.heatDrivers && lap?.objectId) {
          const settings = this.settingsService.getSettings();
          if (settings.extraScreenHighlightRowOnLap) {
            this.highlightedDrivers.add(lap.objectId);
            this.cdr.detectChanges();
            setTimeout(() => {
              if (lap.objectId) {
                this.highlightedDrivers.delete(lap.objectId);
              }
              if (!this.isDestroyed) {
                this.cdr.detectChanges();
              }
            }, 400);
          }
        }
      })
    );
    
    this.subscriptions.push(
      this.raceConnection.laps$.subscribe(() => {
        if (!this.isDestroyed) {
          this.loadRaceData();
          this.cdr.detectChanges();
        }
      })
    );
    
    this.subscriptions.push(
      this.raceService.currentHeat$.subscribe(() => {
        if (!this.isDestroyed) {
          this.loadRaceData();
          this.cdr.detectChanges();
        }
      })
    );
  }

  ngOnDestroy() {
    this.isDestroyed = true;
    this.raceConnection.disconnect();
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  @HostListener('window:resize')
  onResize() {
    this.updateScale();
  }

  private updateScale() {
    const targetWidth = 1600;
    const targetHeight = 900;
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    this.scale = Math.min(windowWidth / targetWidth, windowHeight / targetHeight);
  }

  private loadRaceData() {
    this.race = this.raceService.getRace();
    if (this.race) {
      this.track = this.race.track;
      this.heat = this.raceService.getCurrentHeat();
      this.totalHeats = this.raceService.getHeats()?.length || 0;
      this.loadColumns();
      this.sortHeatDrivers();
    }
  }

  private loadColumns() {
    const settings = this.settingsService.getSettings();
    let selectedColumns = settings.extraScreenColumns;
    if (!selectedColumns || selectedColumns.length === 0) {
      selectedColumns = Settings.DEFAULT_EXTRA_SCREEN_COLUMNS;
    }

    const isFuelRace = (this.race?.fuel_options?.enabled || this.race?.digital_fuel_options?.enabled) ?? false;
    const visibilityMap = settings.extraScreenColumnVisibility || {};

    selectedColumns = selectedColumns.filter(key => {
      const visibility = visibilityMap[key] || ColumnVisibility.Always;
      if (visibility === ColumnVisibility.Always) return true;
      if (visibility === ColumnVisibility.FuelRaceOnly) return isFuelRace;
      if (visibility === ColumnVisibility.NonFuelRaceOnly) return !isFuelRace;
      return true;
    });

    const layouts = settings.extraScreenColumnLayouts || {};
    
    // Match Race screen logic: find a resizing column and fill remaining space
    const nameKeys = ['driver.name', 'driver.nickname'];
    const fixedWidths: { [key: string]: number } = {
      'driver.name': 400, 'driver.nickname': 400, 'driver.avatarUrl': 100,
      'lapCount': 180, 'reactionTime': 275, 'lastLapTime': 275,
      'medianLapTime': 275, 'averageLapTime': 275, 'bestLapTime': 275,
      'gapLeader': 275, 'gapPosition': 275, 'seed': 180,
      'rankHeat': 180, 'rankOverall': 180, 'participant.team.name': 275,
      'participant.fuelLevel': 180, 'fuelCapacity': 180, 'fuelPercentage': 180,
      'mph': 275, 'kph': 275, 'fph': 275, 'segmentTime': 275,
      'imageset': 180
    };

    let totalFixedWithoutResizingColumn = 0;
    let resizingColumnKey: string | null = null;

    // Find the first column containing name/nickname in its layout to use as resizing column
    for (const key of selectedColumns) {
      const layout = layouts[key] || { [AnchorPoint.CenterCenter]: key };
      const containsName = Object.values(layout).some(v => nameKeys.includes((v as string).split('_')[0]));

      if (containsName) {
        resizingColumnKey = key;
        break;
      }
    }

    // Fallback: if no column contains name, resize the first column
    if (!resizingColumnKey && selectedColumns.length > 0) {
      resizingColumnKey = selectedColumns[0];
    }

    // Sum up widths of all OTHER columns
    selectedColumns.forEach(key => {
      if (key === resizingColumnKey) return;
      const layout = layouts[key] || { [AnchorPoint.CenterCenter]: key };
      const primaryProp = layout[AnchorPoint.CenterCenter] || Object.values(layout)[0] || key;
      const baseKey = primaryProp.split('_')[0];
      totalFixedWithoutResizingColumn += fixedWidths[baseKey] || 275;
    });

    const remainingWidth = Math.max(300, 1600 - totalFixedWithoutResizingColumn);

    this.columns = selectedColumns.map(key => {
      const layout = layouts[key] || { [AnchorPoint.CenterCenter]: key };
      const isResizing = (key === resizingColumnKey);
      const width = isResizing ? remainingWidth : this.getColumnWidth(key);

      return new ColumnDefinition(
        key,
        key,
        width,
        key === 'driver.name' || key === 'driver.nickname',
        isResizing ? 'start' : 'middle',
        isResizing ? 30 : 0,
        AnchorPoint.CenterCenter,
        (v) => v?.toString() ?? '',
        layout
      );
    });
  }

  private getColumnWidth(key: string): number {
    const widths: { [key: string]: number } = {
      'driver.name': 400, 'driver.nickname': 400, 'driver.avatarUrl': 100,
      'lapCount': 180, 'reactionTime': 275, 'lastLapTime': 275,
      'medianLapTime': 275, 'averageLapTime': 275, 'bestLapTime': 275,
      'gapLeader': 275, 'gapPosition': 275, 'seed': 180,
      'rankHeat': 180, 'rankOverall': 180, 'participant.team.name': 275,
      'participant.fuelLevel': 180, 'fuelCapacity': 180, 'fuelPercentage': 180,
      'mph': 275, 'kph': 275, 'fph': 275, 'segmentTime': 275
    };
    return widths[key] || 275;
  }

  getColumnLabel(key: string): string {
    const labels: { [key: string]: string } = {
      'driver.name': 'Name', 'driver.nickname': 'Nickname',
      'lapCount': 'Lap', 'reactionTime': 'Reaction',
      'lastLapTime': 'Lap Time', 'medianLapTime': 'Median',
      'averageLapTime': 'Avg', 'bestLapTime': 'Best',
      'gapLeader': 'Gap Leader', 'gapPosition': 'Gap Pos',
      'seed': 'Seed', 'rankHeat': 'Rank Heat', 'rankOverall': 'Rank Overall',
      'participant.team.name': 'Team', 'participant.fuelLevel': 'Fuel',
      'fuelCapacity': 'Capacity', 'fuelPercentage': 'Fuel %',
      'mph': 'MPH', 'kph': 'KPH', 'fph': 'FPH', 'segmentTime': 'Segment'
    };
    return this.translationService.translate(labels[key] || key);
  }

  // Helper method to get column X position
  getColumnX(columnIndex: number): number {
    if (!this.columns || this.columns.length === 0) return 0;
    let x = 0; // Start position
    const limit = Math.min(columnIndex, this.columns.length);
    for (let i = 0; i < limit; i++) {
      x += this.columns[i].width;
    }
    return x;
  }

  // Helper method to get column center X position
  getColumnCenterX(columnIndex: number): number {
    if (!this.columns || !this.columns[columnIndex]) return 0;
    return this.getColumnX(columnIndex) + (this.columns[columnIndex].width / 2);
  }

  // Helper method to get column text X position
  getColumnTextX(columnIndex: number, anchor?: any): number {
    const column = this.columns ? this.columns[columnIndex] : undefined;
    if (!column) return 0;

    const xBase = this.getColumnX(columnIndex);
    const width = column.width;
    const padding = column.padding || 10;
    const targetAnchor = anchor || column.anchor;

    switch (targetAnchor) {
      case AnchorPoint.TopLeft:
      case AnchorPoint.CenterLeft:
      case AnchorPoint.BottomLeft:
        return xBase + padding;
      case AnchorPoint.TopRight:
      case AnchorPoint.CenterRight:
      case AnchorPoint.BottomRight:
        return xBase + width - padding;
      case AnchorPoint.TopCenter:
      case AnchorPoint.CenterCenter:
      case AnchorPoint.BottomCenter:
      default:
        return xBase + (width / 2);
    }
  }

  getRowHeight(): number {
    return 560 / (this.track?.lanes?.length || 1);
  }

  getLaneColor(laneIndex: number): string {
    return this.track?.lanes?.[laneIndex]?.background_color || '#1a2a3a';
  }

  getLaneTextColor(laneIndex: number): string {
    return this.track?.lanes?.[laneIndex]?.foreground_color || '#ffffff';
  }

  // Helper method to get column text Y position
  getColumnTextY(columnIndex: number, hasTeam: boolean = false, anchor?: any): number {
    const rowHeight = this.getRowHeight();
    const targetAnchor = anchor || AnchorPoint.CenterCenter;

    switch (targetAnchor) {
      case AnchorPoint.TopLeft:
      case AnchorPoint.TopCenter:
      case AnchorPoint.TopRight:
        return rowHeight * 0.22;
      case AnchorPoint.BottomLeft:
      case AnchorPoint.BottomCenter:
      case AnchorPoint.BottomRight:
        return rowHeight * 0.78;
      default:
        return rowHeight * 0.52;
    }
  }

  // Helper method to get SVG text-anchor
  getColumnTextAnchor(columnIndex: number, anchor?: any): string {
    const column = this.columns ? this.columns[columnIndex] : undefined;
    if (!column) return 'middle';

    const targetAnchor = anchor || column.anchor;
    switch (targetAnchor) {
      case AnchorPoint.TopLeft:
      case AnchorPoint.CenterLeft:
      case AnchorPoint.BottomLeft:
        return 'start';
      case AnchorPoint.TopRight:
      case AnchorPoint.CenterRight:
      case AnchorPoint.BottomRight:
        return 'end';
      default:
        return 'middle';
    }
  }

  getAnchorFontSize(anchor: string): number {
    switch (anchor) {
      case AnchorPoint.CenterCenter:
        return 45;
      default:
        return 20;
    }
  }

  getFlagColor(): string {
    const RS = com.antigravity.RaceState;
    switch (this.raceState) {
      case RS.RACING: return '#22c55e';
      case RS.PAUSED: return '#eab308';
      case RS.RACE_OVER:
      case RS.HEAT_OVER: return '#ffffff';
      default: return '#ef4444';
    }
  }

  formatTime(time: number | undefined): string {
    if (time === undefined || time === null || time === 0) return '0.00';
    return time.toFixed(2);
  }

  formatColumnValue(hd: DriverHeatData, column: ColumnDefinition, propertyName?: string): string {
    if (!hd || !column) return '--';
    const valueKey = propertyName || Object.values(column.layout)[0];
    if (!valueKey) return '--';
    
    // Driver info
    if (valueKey === 'driver.name') return hd.driver?.name || '--';
    if (valueKey === 'driver.nickname') return hd.driver?.nickname || hd.driver?.name || '--';
    if (valueKey === 'driver.avatarUrl') return hd.driver?.avatarUrl || '';
    
    // Lap data
    if (valueKey === 'lapCount') return hd.lapCount?.toString() || '0';
    if (valueKey === 'lastLapTime') return this.formatTime(hd.lastLapTime);
    if (valueKey === 'bestLapTime') return this.formatTime(hd.bestLapTime);
    if (valueKey === 'averageLapTime') return this.formatTime(hd.averageLapTime);
    if (valueKey === 'medianLapTime') return this.formatTime(hd.medianLapTime);
    if (valueKey === 'reactionTime') return this.formatTime(hd.reactionTime);
    
    // Gaps
    if (valueKey === 'gapLeader') return hd.gapLeader?.toFixed(3) || '--';
    if (valueKey === 'gapPosition') return hd.gapPosition?.toFixed(3) || '--';
    
    // Rankings (from participant)
    if (valueKey === 'rankHeat') {
      const rank = this.driverRankings.get(hd.objectId);
      return rank ? rank.toString() : '--';
    }
    if (valueKey === 'rankOverall') {
      const rank = hd.participant?.rank;
      return rank ? rank.toString() : '--';
    }
    if (valueKey === 'seed') {
      const seed = hd.participant?.seed;
      return seed ? `(${seed})` : '--';
    }
    
    // Segment time
    if (valueKey === 'segmentTime') return this.formatTime(hd.lastSegmentTime);
    
    // Team
    if (valueKey === 'participant.team.name') return hd.participant?.team?.name || '--';
    
    // Fuel
    if (valueKey === 'participant.fuelLevel') return hd.participant?.fuelLevel?.toFixed(1) || '--';
    if (valueKey === 'fuelCapacity') return hd.participant?.fuelLevel ? '100.0' : '--';
    if (valueKey === 'fuelPercentage') {
      const level = hd.participant?.fuelLevel;
      if (level === undefined || level === null) return '--';
      return level.toFixed(1) + '%';
    }
    
    // Speed (calculated from lane length and lap time)
    if (valueKey === 'mph' || valueKey === 'kph' || valueKey === 'fph') {
      const lastLapTime = hd.lastLapTime;
      const lane = this.track?.lanes?.[hd.laneIndex];
      const length = lane?.length;
      
      if (lastLapTime > 0 && length !== undefined && length > 0) {
        const fph = (length / lastLapTime) * 3600;
        if (valueKey === 'fph') return fph.toFixed(0);
        
        const mph = fph / 5280;
        if (valueKey === 'mph') return mph.toFixed(2);
        
        const kph = mph * 1.609344;
        if (valueKey === 'kph') return kph.toFixed(2);
      }
      return '--.--';
    }
    
    return '--';
  }

  private sortHeatDrivers() {
    if (!this.heat?.heatDrivers) {
      this.sortedHeatDrivers = [];
      return;
    }
    
    const settings = this.settingsService.getSettings();
    if (settings.extraScreenSortByStandings) {
      // Sort by race standings (rankings)
      this.sortedHeatDrivers = [...this.heat.heatDrivers].sort((a: any, b: any) => {
        const rankA = this.driverRankings.get(a.objectId) ?? 999;
        const rankB = this.driverRankings.get(b.objectId) ?? 999;
        return rankA - rankB;
      });
    } else {
      // Sort by lane index (static order)
      this.sortedHeatDrivers = [...this.heat.heatDrivers].sort((a: any, b: any) => (a.laneIndex || 0) - (b.laneIndex || 0));
    }
    this.cdr.detectChanges();
  }
}

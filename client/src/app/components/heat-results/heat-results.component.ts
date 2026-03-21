import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Subscription } from 'rxjs';
import { RaceConnectionService } from 'src/app/services/race-connection.service';
import { RaceService } from 'src/app/services/race.service';
import { DriverHeatData } from 'src/app/race/driver_heat_data';
import { Heat } from 'src/app/race/heat';
import { Race } from 'src/app/models/race';

interface GraphPoint {
  x: number;
  y: number;
}

interface DriverLine {
  objectId: string;
  driverName: string;
  color: string;
  backgroundColor: string;
  points: GraphPoint[];
  pathData: string;
  rankPoints: GraphPoint[];
  rankPathData: string;
}

@Component({
  selector: 'app-heat-results',
  templateUrl: './heat-results.component.html',
  styleUrls: ['./heat-results.component.css'],
  standalone: false
})
export class HeatResultsComponent implements OnInit, OnDestroy {
  private subscriptions: Subscription[] = [];
  protected heat?: Heat;
  protected race?: Race;
  protected driverLines: DriverLine[] = [];

  // SVG Dimensions
  protected width = 1600;
  protected height = 900;

  // Padding for graph area
  protected padding = { top: 80, right: 100, bottom: 80, left: 100 };

  protected maxX = 10; // Min scale
  protected maxY = 5;  // Min scale

  constructor(
    private raceConnectionService: RaceConnectionService,
    private raceService: RaceService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.raceConnectionService.connect();

    this.subscriptions.push(this.raceService.currentHeat$.subscribe(() => {
      this.loadRaceData();
      this.updateGraph();
    }));

    this.subscriptions.push(this.raceConnectionService.laps$.subscribe(() => {
      this.updateGraph();
    }));

    this.loadRaceData();
    this.updateGraph();
  }

  ngOnDestroy() {
    this.raceConnectionService.disconnect();
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private loadRaceData() {
    this.race = this.raceService.getRace();
    this.heat = this.raceService.getCurrentHeat();

    // TODO(aufderheide):  Remove this garbage.  The mock data needs to be setup in the
    // test helpers and has no business in production code.
    if (!this.heat || !this.heat.heatDrivers || this.heat.heatDrivers.length === 0) {
      this.createMockData();
    }
  }

  protected updateGraph() {
    if (!this.heat || !this.heat.heatDrivers) return;

    this.driverLines = this.heat.heatDrivers
      .filter(hd => hd.driver && hd.driver.name !== 'Empty')
      .map(hd => {
        const driverName = hd.driver.nickname || hd.driver.name;
        const lane = this.race?.track?.lanes[hd.laneIndex];
        const color = lane?.foreground_color || '#ffffff';
        const backgroundColor = lane?.background_color || '#333333';

        const laps = hd.lapTimes; // Uses our new getter
        let currentAbsoluteTime = 0;
        const points: GraphPoint[] = [];

        laps.forEach(lapTime => {
          currentAbsoluteTime += lapTime;
          points.push({ x: currentAbsoluteTime, y: lapTime });
        });

        return {
          objectId: hd.objectId,
          driverName,
          color,
          backgroundColor,
          points,
          pathData: '',
          rankPoints: [],
          rankPathData: ''
        };
      });

    // --- Compute Ranking Timeline ---
    interface ChronoEvent {
      absoluteTime: number;
      objectId: string;
    }

    const events: ChronoEvent[] = [];
    this.driverLines.forEach(line => {
      let accum = 0;
      // Get the corresponding DriverHeatData to fetch lapTimes
      const hd = this.heat?.heatDrivers.find(d => d.objectId === line.objectId);
      const laps = hd?.lapTimes || [];
      laps.forEach(lap => {
        accum += lap;
        events.push({ absoluteTime: accum, objectId: line.objectId });
      });
    });

    events.sort((a, b) => a.absoluteTime - b.absoluteTime);

    // Track active laps completed counts
    const lapsCount: { [id: string]: number } = {};
    const lastLapTime: { [id: string]: number } = {};
    const rankingHistory: { [id: string]: GraphPoint[] } = {};

    this.driverLines.forEach(line => {
      lapsCount[line.objectId] = 0;
      lastLapTime[line.objectId] = 0;
      rankingHistory[line.objectId] = [{ x: 0, y: 0 }]; // Initial setup loaded from timeline loops
    });

    events.forEach(event => {
      lapsCount[event.objectId]++;
      lastLapTime[event.objectId] = event.absoluteTime;

      // Score drivers: descending laps first, tiebreak with ascending total time spent completing that lap length
      const scores = this.driverLines.map(line => ({
        objectId: line.objectId,
        laps: lapsCount[line.objectId],
        time: lastLapTime[line.objectId],
      }));

      scores.sort((a, b) => {
        if (a.laps !== b.laps) return b.laps - a.laps;
        return a.time - b.time;
      });

      scores.forEach((score, index) => {
        rankingHistory[score.objectId].push({ x: event.absoluteTime, y: index + 1 });
      });
    });

    // Assign ranking points to driver lines
    this.driverLines.forEach(line => {
      const history = rankingHistory[line.objectId];
      if (history.length > 1 && history[0].x === 0 && history[0].y === 0) {
        history[0].y = history[1].y; // align start point for cleaner curve
      }
      line.rankPoints = history;
    });

    // Calculate Max X & Max Y for scaling
    let allX = this.driverLines.flatMap(line => line.points.map(p => p.x));
    let allY = this.driverLines.flatMap(line => line.points.map(p => p.y));

    if (allX.length > 0) {
      this.maxX = Math.max(...allX) * 1.05; // 5% padding
    } else {
      this.maxX = 10;
    }

    if (allY.length > 0) {
      this.maxY = Math.max(...allY) * 1.1; // 10% padding
    } else {
      this.maxY = 5;
    }

    // Generate SVG path strings
    this.driverLines.forEach(line => {
      if (line.points.length > 0) {
        line.pathData = this.generatePath(line.points, false);
      }
      if (line.rankPoints.length > 0) {
        line.rankPathData = this.generatePath(line.rankPoints, true);
      }
    });

    this.cdr.detectChanges();
  }

  private generatePath(points: GraphPoint[], isRank: boolean): string {
    if (points.length === 0) return '';

    return points.map((point, index) => {
      const x = isRank ? this.scaleXLeft(point.x) : this.scaleXRight(point.x);
      const y = isRank ? this.scaleYLeft(point.y) : this.scaleY(point.y);
      return (index === 0 ? 'M' : 'L') + ` ${x} ${y}`;
    }).join(' ');
  }

  protected scaleXLeft(x: number): number {
    const graphWidth = (this.width - this.padding.left - this.padding.right - 80) / 2;
    return this.padding.left + (x / this.maxX) * graphWidth;
  }

  protected scaleXRight(x: number): number {
    const graphWidth = (this.width - this.padding.left - this.padding.right - 80) / 2;
    const offset = this.padding.left + graphWidth + 80;
    return offset + (x / this.maxX) * graphWidth;
  }

  protected scaleYLeft(rank: number): number {
    const graphHeight = this.height - this.padding.top - this.padding.bottom;
    const N = this.driverLines.length || 4;
    if (N <= 1) return this.padding.top + graphHeight / 2;
    return this.padding.top + ((rank - 1) / (N - 1)) * graphHeight;
  }

  protected scaleX(x: number): number {
    const graphWidth = this.width - this.padding.left - this.padding.right;
    return this.padding.left + (x / this.maxX) * graphWidth;
  }

  protected scaleY(y: number): number {
    const graphHeight = this.height - this.padding.top - this.padding.bottom;
    // Invert Y for SVG coord system (0,0 is top-left)
    return this.height - this.padding.bottom - (y / this.maxY) * graphHeight;
  }

  // Grid helpers
  get xTicks(): number[] {
    const ticks = [];
    const step = Math.ceil(this.maxX / 10) || 1;
    for (let i = 0; i <= this.maxX; i += step) {
      ticks.push(i);
    }
    return ticks;
  }

  get yTicks(): number[] {
    const ticks = [];
    const step = Math.ceil(this.maxY / 5) || 1;
    for (let i = 0; i <= this.maxY; i += step) {
      ticks.push(i);
    }
    return ticks;
  }

  get yTicksLeft(): number[] {
    const N = this.driverLines.length || 4;
    const ticks = [];
    for (let i = 1; i <= N; i++) {
      ticks.push(i);
    }
    return ticks;
  }

  private createMockData() {
    const fakeDriver1 = { name: 'Alice', nickname: 'Ally' };
    const fakeDriver2 = { name: 'Bob', nickname: 'Bobby' };
    const fakeDriver3 = { name: 'Charlie', nickname: 'Chuck' };

    const hd1 = new DriverHeatData('m1', { driver: fakeDriver1 } as any, 0, fakeDriver1 as any);
    const hd2 = new DriverHeatData('m2', { driver: fakeDriver2 } as any, 1, fakeDriver2 as any);
    const hd3 = new DriverHeatData('m3', { driver: fakeDriver3 } as any, 2, fakeDriver3 as any);

    hd1.addLapTime(1, 10.5, 10.5, 10.5, 10.5);
    hd1.addLapTime(2, 10.2, 10.35, 10.35, 10.2);
    hd1.addLapTime(3, 10.4, 10.37, 10.37, 10.2);

    hd2.addLapTime(1, 11.1, 11.1, 11.1, 11.1);
    hd2.addLapTime(2, 10.8, 10.95, 10.95, 10.8);
    hd2.addLapTime(3, 10.7, 10.87, 10.87, 10.7);

    hd3.addLapTime(1, 12.0, 12.0, 12.0, 12.0);
    hd3.addLapTime(2, 11.2, 11.6, 11.6, 11.2);
    hd3.addLapTime(3, 11.5, 11.57, 11.57, 11.2);

    this.heat = new Heat('mHeat', 1, [hd1, hd2, hd3]);

    this.race = {
      name: 'Mock Race',
      track: {
        lanes: [
          { background_color: '#ef4444', foreground_color: '#ffffff' },
          { background_color: '#3b82f6', foreground_color: '#ffffff' },
          { background_color: '#10b981', foreground_color: '#ffffff' }
        ]
      }
    } as any;
  }
}

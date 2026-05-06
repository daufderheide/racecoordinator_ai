import { ChangeDetectorRef, Component, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { DataService } from "src/app/data.service";
import { RaceHistoryRecord } from "src/app/models/race_history_record";

@Component({
  selector: "app-race-detail",
  templateUrl: "./race-detail.component.html",
  styleUrls: ["./race-detail.component.css"],
  standalone: false,
})
export class RaceDetailComponent implements OnInit {
  raceId: string | null = null;
  race: RaceHistoryRecord | null = null;
  isLoading = true;
  selectedHeatIndex: number = 0;
  cumulativeLapsMap: Map<string, number> = new Map();
  cumulativePointsMap: Map<string, number> = new Map();
  cumulativeTimeMap: Map<string, number> = new Map();
  segmentDrivers: any[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private dataService: DataService,
    private cdr: ChangeDetectorRef,
  ) {
    console.log("RaceDetailComponent: Constructor called");
  }

  ngOnInit() {
    console.log("RaceDetailComponent: ngOnInit called");
    this.route.params.subscribe(params => {
      this.raceId = params['id'];
      const isDemo = this.route.snapshot.queryParamMap.get('demo') === 'true';
      
      console.log("RaceDetailComponent: Captured raceId:", this.raceId, "isDemo:", isDemo);
      
      if (this.raceId) {
        this.loadRaceDetails(this.raceId, isDemo);
      } else {
        this.router.navigate(["/analytics"]);
      }
    });
  }

  loadRaceDetails(id: string, isDemo: boolean) {
    this.isLoading = true;
    
    // If ID looks like a client-side fallback or a serialized object, go straight to Load All
    if (id.startsWith("fallback-") || id.includes("{") || id.includes(":")) {
      console.log("RaceDetailComponent: ID looks complex or fallback, using Load All strategy directly.");
      this.loadAllFallback(id);
      return;
    }

    console.log("RaceDetailComponent: Fast load attempt (Direct Lookup). ID:", id, "Demo:", isDemo);
    this.dataService.getRaceHistoryById(id, isDemo).subscribe({
      next: (race) => {
        if (race && race._id) {
          this.race = race;
          this.calculateCumulativeLaps();
          this.prepareSegmentDrivers();
          this.isLoading = false;
          this.cdr.detectChanges();
          console.log("RaceDetailComponent: Direct lookup success");
        } else {
          console.warn("RaceDetailComponent: Not found via direct lookup, trying secondary mode...");
          this.tryAlternateMode(id, isDemo);
        }
      },
      error: (err) => {
        console.warn("RaceDetailComponent: Direct lookup error, trying secondary mode...", err);
        this.tryAlternateMode(id, isDemo);
      }
    });
  }

  private tryAlternateMode(id: string, wasDemo: boolean) {
    // Try the other database before falling back to full list load
    this.dataService.getRaceHistoryById(id, !wasDemo).subscribe({
      next: (race) => {
        if (race && race._id) {
          this.race = race;
          this.calculateCumulativeLaps();
          this.prepareSegmentDrivers();
          this.isLoading = false;
          this.cdr.detectChanges();
          console.log("RaceDetailComponent: Alternate mode lookup success");
        } else {
          this.loadAllFallback(id);
        }
      },
      error: () => this.loadAllFallback(id)
    });
  }

  private loadAllFallback(id: string) {
    console.log("RaceDetailComponent: Ultimate fallback (Load All)");
    this.dataService.getRaceHistory(false).subscribe({
      next: (history) => {
        this.race = this.findInHistory(history, id);
        if (this.race) {
          this.calculateCumulativeLaps();
          this.prepareSegmentDrivers();
          this.isLoading = false;
          this.cdr.detectChanges();
        } else {
          this.dataService.getRaceHistory(true).subscribe({
            next: (demoHistory) => {
              this.race = this.findInHistory(demoHistory, id);
              if (this.race) {
                this.calculateCumulativeLaps();
                this.prepareSegmentDrivers();
              }
              this.isLoading = false;
              this.cdr.detectChanges();
            },
            error: () => {
              this.isLoading = false;
              this.cdr.detectChanges();
            }
          });
        }
      },
      error: () => {
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  private findInHistory(history: any[], id: string): any {
    // 1. Sort the history the same way CumulativeResultsComponent does
    const sorted = history.sort((a, b) => {
      const timeA = a.statistics?.startMillis || 0;
      const timeB = b.statistics?.startMillis || 0;
      return timeB - timeA;
    });

    // 2. Find by normalized ID, using the same fallback logic
    return sorted.find((r, index) => {
      const normalizedId = this.getNormalizedId(r._id, r, index);
      return normalizedId === id;
    });
  }

  private getNormalizedId(id: any, fallback?: any, index?: number): string {
    // Priority 1: Real unique string IDs
    let bestId = "";
    if (typeof id === 'string' && id.length > 5) {
      bestId = id;
    } else if (fallback?.entity_id) {
      bestId = fallback.entity_id;
    } else if (id?.$oid) {
      bestId = id.$oid;
    } else if (id?.id && typeof id.id === 'string') {
      bestId = id.id;
    } else if (fallback?._id && typeof fallback._id === 'string') {
      bestId = fallback._id;
    }
    
    if (bestId) return bestId;

    // Priority 2: Serialized object if not a generic timestamp
    if (id && typeof id === 'object') {
      const str = JSON.stringify(id);
      if (!(str.includes("timestamp") && str.length < 50)) {
        return str;
      }
    }
    
    // Priority 3: Fallback ID matching the list logic (index-based)
    const timestamp = fallback?.statistics?.startMillis || 0;
    return `fallback-${index !== undefined ? index : 'unknown'}-${timestamp}`;
  }

  get currentHeat() {
    return this.race?.heats?.[this.selectedHeatIndex];
  }

  onHeatChange(index: number) {
    this.selectedHeatIndex = index;
    this.calculateCumulativeLaps();
    this.prepareSegmentDrivers();
  }

  prepareSegmentDrivers() {
    if (!this.race) {
      console.warn("RaceDetailComponent: No race data available for prepareSegmentDrivers");
      return;
    }
    
    if (!this.race.heats || this.race.heats.length === 0) {
      console.warn("RaceDetailComponent: Race has no heats/segments!");
      return;
    }

    const currentHeat = this.race.heats[this.selectedHeatIndex];
    if (!currentHeat) {
      console.warn("RaceDetailComponent: No heat data for index:", this.selectedHeatIndex, "Heats length:", this.race.heats.length);
      return;
    }

    console.log("RaceDetailComponent: Preparing drivers for Segment #", this.selectedHeatIndex + 1);
    console.log("RaceDetailComponent: Raw Heat Drivers:", currentHeat.drivers);

    // 1. Get all unique drivers in the entire race
    const allDrivers = new Map<string, any>();
    
    // Check main drivers list first (RaceParticipant array)
    if (this.race.drivers && this.race.drivers.length > 0) {
      console.log("RaceDetailComponent: Found race.drivers list. Count:", this.race.drivers.length);
      this.race.drivers.forEach((d: any) => {
        const driverObj = d.driver || d;
        const id = driverObj?.entity_id || d.objectId || d._id;
        if (id) allDrivers.set(id, driverObj);
      });
    }
    
    // Supplement from ALL heats
    this.race.heats.forEach((h, idx) => {
      if (h.drivers) {
        h.drivers.forEach((hd: any) => {
          const participant = hd.driver;
          const driverObj = participant?.driver || participant || hd;
          const id = driverObj?.entity_id || participant?.objectId || hd.objectId;
          if (id && !allDrivers.has(id)) {
            allDrivers.set(id, driverObj);
          }
        });
      }
    });

    console.log("RaceDetailComponent: Total unique drivers discovered:", allDrivers.size);

    // 2. Map current heat drivers for easy lookup
    const participatingDrivers = new Map<string, any>();
    currentHeat.drivers?.forEach((hd: any) => {
      const participant = hd.driver;
      const driverObj = participant?.driver || participant;
      const id = driverObj?.entity_id || participant?.objectId || hd.objectId;
      if (id) participatingDrivers.set(id, participant);
    });

    // 3. Build the final list
    this.segmentDrivers = Array.from(allDrivers.values()).map(d => {
      const id = d.entity_id || d.objectId || d._id;
      const heatData = participatingDrivers.get(id);
      return {
        driver: d,
        heatData: heatData, // RaceParticipant
        isSitout: !heatData
      };
    });

    console.log("RaceDetailComponent: Final segment drivers list size:", this.segmentDrivers.length);

    // 4. Sort: By Cumulative Laps, then Cumulative Points, then Cumulative Time
    this.segmentDrivers.sort((a, b) => {
      const idA = a.driver?.entity_id || a.driver?.objectId || a.driver?._id;
      const idB = b.driver?.entity_id || b.driver?.objectId || b.driver?._id;
      
      const lapsA = this.cumulativeLapsMap.get(idA) || 0;
      const lapsB = this.cumulativeLapsMap.get(idB) || 0;
      if (lapsA !== lapsB) return lapsB - lapsA;
      
      const pointsA = this.cumulativePointsMap.get(idA) || 0;
      const pointsB = this.cumulativePointsMap.get(idB) || 0;
      if (pointsA !== pointsB) return pointsB - pointsA;
      
      const timeA = this.cumulativeTimeMap.get(idA) || Infinity;
      const timeB = this.cumulativeTimeMap.get(idB) || Infinity;
      return timeA - timeB;
    });
  }

  calculateCumulativeLaps() {
    this.cumulativeLapsMap.clear();
    this.cumulativePointsMap.clear();
    this.cumulativeTimeMap.clear();
    
    if (!this.race || !this.race.heats) return;

    // We need to calculate for ALL drivers in the race, not just the ones in currentHeat
    const allDriverIds = new Set<string>();
    this.race.heats.forEach(h => h.drivers?.forEach((hd: any) => {
      const id = hd.driver?.driver?.entity_id || hd.driver?.objectId;
      if (id) allDriverIds.add(id);
    }));

    allDriverIds.forEach(driverId => {
      let totalLaps = 0;
      let totalPoints = 0;
      let totalTime = 0;
      
      for (let i = 0; i <= this.selectedHeatIndex; i++) {
        const heat = this.race?.heats[i];
        const driverInHeat = heat?.drivers?.find((d: any) => 
          (d.driver?.driver?.entity_id === driverId) || (d.driver?.objectId === driverId)
        );
        if (driverInHeat && driverInHeat.driver) {
          totalLaps += driverInHeat.driver.totalLaps || 0;
          totalPoints += driverInHeat.driver.rankValue || 0;
          totalTime += driverInHeat.driver.totalTime || 0;
        }
      }
      
      this.cumulativeLapsMap.set(driverId, totalLaps);
      this.cumulativePointsMap.set(driverId, totalPoints);
      this.cumulativeTimeMap.set(driverId, totalTime);
    });
  }

  getCumulativeLaps(driverId: string | undefined): number {
    return driverId ? (this.cumulativeLapsMap.get(driverId) || 0) : 0;
  }

  goBack() {
    this.router.navigate(["/analytics"]);
  }

  formatDate(millis: number | undefined): string {
    if (!millis) return "Unknown Date";
    return new Date(millis).toLocaleString();
  }

  formatTotalTime(totalTimeSeconds: number): string {
    if (!totalTimeSeconds || totalTimeSeconds === 0) return "0.000";
    const minutes = Math.floor(totalTimeSeconds / 60);
    const seconds = Math.floor(totalTimeSeconds % 60);
    const ms = Math.floor((totalTimeSeconds % 1) * 1000);
    return `${minutes}:${seconds.toString().padStart(2, "0")}.${ms.toString().padStart(3, "0")}`;
  }

  getAvatarUrl(url: string | undefined): string {
    if (!url) return "assets/default-avatar.png";
    if (url.startsWith("/")) {
      return `${this.dataService.serverUrl}${url}`;
    }
    return url;
  }
}

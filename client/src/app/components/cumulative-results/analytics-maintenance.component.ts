import { CommonModule } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Router } from "@angular/router";
import { DataService } from "@app/data.service";

@Component({
  selector: "app-analytics-maintenance",
  templateUrl: "./analytics-maintenance.component.html",
  styleUrls: ["./analytics-maintenance.component.css"],
  standalone: true,
  imports: [CommonModule, FormsModule],
})
export class AnalyticsMaintenanceComponent implements OnInit {
  history: any[] = [];
  selectedRaces: Set<string> = new Set();
  isDemoMode: boolean = false;
  loading: boolean = false;

  constructor(
    private dataService: DataService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.loadHistory();
  }

  loadHistory() {
    this.loading = true;
    console.log("Maintenance: Loading history, demo mode:", this.isDemoMode);
    this.dataService.getRaceHistory(this.isDemoMode).subscribe({
      next: (data: any[]) => {
        console.log("Maintenance: Received data:", data);
        if (!data || data.length === 0) {
          console.warn("Maintenance: No data returned from server");
        }
        // Sort by date descending
        this.history = data.sort(
          (a: any, b: any) =>
            (b.statistics?.startMillis || 0) - (a.statistics?.startMillis || 0),
        );
        this.loading = false;
      },
      error: (err: any) => {
        console.error("Maintenance: Error loading history:", err);
        alert(
          "Failed to load race history: " + (err.message || "Unknown error"),
        );
        this.loading = false;
      },
    });
  }

  toggleDemoMode() {
    this.isDemoMode = !this.isDemoMode;
    this.selectedRaces.clear();
    this.loadHistory();
  }

  toggleSelection(raceId: string) {
    if (this.selectedRaces.has(raceId)) {
      this.selectedRaces.delete(raceId);
    } else {
      this.selectedRaces.add(raceId);
    }
  }

  toggleAll() {
    if (this.selectedRaces.size === this.history.length) {
      this.selectedRaces.clear();
    } else {
      this.history.forEach((r) => this.selectedRaces.add(r._id));
    }
  }

  deleteSelected() {
    if (this.selectedRaces.size === 0) return;

    if (
      confirm(
        `Are you sure you want to delete ${this.selectedRaces.size} selected race(s)? This action cannot be undone.`,
      )
    ) {
      const deletions = Array.from(this.selectedRaces).map((id) => {
        const race = this.history.find((r) => r._id === id);
        return this.dataService.deleteRaceHistory(
          id,
          this.isDemoMode,
          race?.databaseName,
        );
      });

      this.loading = true;
      // In a real app we'd use forkJoin, but let's keep it simple
      let completed = 0;
      deletions.forEach((obs) => {
        obs.subscribe({
          next: () => {
            completed++;
            if (completed === deletions.length) {
              this.selectedRaces.clear();
              this.loadHistory();
            }
          },
          error: (err: any) => {
            console.error("Delete error:", err);
            completed++;
            if (completed === deletions.length) {
              this.loadHistory();
            }
          },
        });
      });
    }
  }

  goBack() {
    this.router.navigate(["/history"]);
  }

  formatDate(millis: number | undefined): string {
    if (!millis) return "N/A";
    return new Date(millis).toLocaleString();
  }
}

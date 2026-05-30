import { Routes } from "@angular/router";
import { AssetManagerComponent } from "@app/components/asset-manager/asset-manager.component";
import { CustomRotationEditorComponent } from "@app/components/asset-manager/custom-rotation-editor/custom-rotation-editor.component";
import { AnalyticsMaintenanceComponent } from "@app/components/cumulative-results/analytics-maintenance.component";
import { CumulativeResultsComponent } from "@app/components/cumulative-results/cumulative-results.component";
import { RaceDetailComponent } from "@app/components/cumulative-results/race-detail.component";
import { DatabaseManagerComponent } from "@app/components/database-manager/database-manager.component";
import { DriverEditorComponent } from "@app/components/driver-editor/driver-editor.component";
import { DriverManagerComponent } from "@app/components/driver-manager/driver-manager.component";
import { DriverResultsComponent } from "@app/components/driver-results/driver-results.component";
import { DriverStationComponent } from "@app/components/driver-station/driver-station.component";
import { HeatResultsComponent } from "@app/components/heat-results/heat-results.component";
import { RaceEditorComponent } from "@app/components/race-editor/race-editor.component";
import { RaceManagerComponent } from "@app/components/race-manager/race-manager.component";
import { RaceResultsComponent } from "@app/components/race-results/race-results.component";
import { DefaultRacedayComponent } from "@app/components/raceday/default-raceday.component";
import { ModifyHeatsModalComponent } from "@app/components/raceday/modify-heats-modal/modify-heats-modal.component";
import { RacedayComponent } from "@app/components/raceday/raceday.component";
import { RacedaySetupComponent } from "@app/components/raceday-setup/raceday-setup.component";
import { TeamEditorComponent } from "@app/components/team-editor/team-editor.component";
import { TeamManagerComponent } from "@app/components/team-manager/team-manager.component";
import { TrackEditorComponent } from "@app/components/track-editor/track-editor.component";
import { TrackManagerComponent } from "@app/components/track-manager/track-manager.component";
import { UIEditorComponent } from "@app/components/ui-editor/ui-editor.component";
import { AuthGuard } from "@app/guards/auth.guard";
import { DirtyCheckGuard } from "@app/guards/dirty-check.guard";
import { RacedayGuard } from "@app/guards/raceday.guard";

export const routes: Routes = [
  { path: "", redirectTo: "raceday-setup", pathMatch: "full" },
  {
    path: "raceday",
    component: RacedayComponent,
    canDeactivate: [RacedayGuard],
    data: { animation: "RacedayPage" },
  },
  {
    path: "default-raceday",
    component: DefaultRacedayComponent,
    canDeactivate: [RacedayGuard],
    data: { animation: "RacedayPage" },
  },
  {
    path: "raceday-setup",
    component: RacedaySetupComponent,
    data: { animation: "RacedaySetupPage" },
  },
  {
    path: "asset-manager",
    component: AssetManagerComponent,
    canActivate: [AuthGuard],
    data: { animation: "AssetManagerPage" },
  },
  {
    path: "custom-rotation-editor",
    component: CustomRotationEditorComponent,
    canActivate: [AuthGuard],
    data: { animation: "CustomRotationEditorPage" },
  },
  {
    path: "driver-editor",
    component: DriverEditorComponent,
    canActivate: [AuthGuard],
    data: { animation: "DriverEditorPage" },
  },
  {
    path: "driver-manager",
    component: DriverManagerComponent,
    canActivate: [AuthGuard],
    data: { animation: "DriverManagerPage" },
  },
  {
    path: "team-manager",
    component: TeamManagerComponent,
    canActivate: [AuthGuard],
    data: { animation: "TeamManagerPage" },
  },
  {
    path: "team-editor",
    component: TeamEditorComponent,
    canActivate: [AuthGuard],
    data: { animation: "TeamEditorPage" },
  },
  {
    path: "track-manager",
    component: TrackManagerComponent,
    canActivate: [AuthGuard],
    data: { animation: "TrackManagerPage" },
  },
  {
    path: "track-editor",
    component: TrackEditorComponent,
    canActivate: [AuthGuard],
    data: { animation: "TrackEditorPage" },
  },
  {
    path: "database-manager",
    component: DatabaseManagerComponent,
    canActivate: [AuthGuard],
    data: { animation: "DatabaseManagerPage" },
  },
  {
    path: "race-manager",
    component: RaceManagerComponent,
    canActivate: [AuthGuard],
    data: { animation: "RaceManagerPage" },
  },
  {
    path: "race-editor",
    component: RaceEditorComponent,
    canActivate: [AuthGuard],
    data: { animation: "RaceEditorPage" },
  },
  {
    path: "ui-editor",
    component: UIEditorComponent,
    canActivate: [AuthGuard],
    canDeactivate: [DirtyCheckGuard],
    data: { animation: "UIEditorPage" },
  },
  {
    path: "driver-station/:lane",
    component: DriverStationComponent,
    data: { animation: "DriverStationPage" },
  },
  {
    path: "heat-results",
    component: HeatResultsComponent,
    data: { animation: "HeatResultsPage" },
  },
  {
    path: "modify-heats",
    component: ModifyHeatsModalComponent,
    canActivate: [AuthGuard],
    data: { animation: "ModifyHeatsPage" },
  },
  {
    path: "race-results",
    component: RaceResultsComponent,
    data: { animation: "RaceResultsPage" },
  },
  {
    path: "driver-results/:driverId",
    component: DriverResultsComponent,
    data: { animation: "DriverResultsPage" },
  },
  {
    path: "history",
    component: CumulativeResultsComponent,
    data: { animation: "AnalyticsPage" },
  },
  {
    path: "history/race/:id",
    component: RaceDetailComponent,
    data: { animation: "RaceDetailPage" },
  },
  {
    path: "history/maintenance",
    component: AnalyticsMaintenanceComponent,
    canActivate: [AuthGuard],
    data: { animation: "AnalyticsMaintenancePage" },
  },
  { path: "analytics", redirectTo: "history" },
  { path: "analytics/race/:id", redirectTo: "history/race/:id" },
  { path: "analytics/maintenance", redirectTo: "history/maintenance" },
  { path: "**", redirectTo: "" },
];

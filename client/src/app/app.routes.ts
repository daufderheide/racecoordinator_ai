import { Routes } from "@angular/router";
import { AssetManagerComponent } from "src/app/components/asset-manager/asset-manager.component";
import { DatabaseManagerComponent } from "src/app/components/database-manager/database-manager.component";
import { DriverEditorComponent } from "src/app/components/driver-editor/driver-editor.component";
import { DriverManagerComponent } from "src/app/components/driver-manager/driver-manager.component";
import { DriverStationComponent } from "src/app/components/driver-station/driver-station.component";
import { HeatResultsComponent } from "src/app/components/heat-results/heat-results.component";
import { RaceEditorComponent } from "src/app/components/race-editor/race-editor.component";
import { RaceManagerComponent } from "src/app/components/race-manager/race-manager.component";
import { DefaultRacedayComponent } from "src/app/components/raceday/default-raceday.component";
import { RacedayComponent } from "src/app/components/raceday/raceday.component";
import { RacedaySetupComponent } from "src/app/components/raceday-setup/raceday-setup.component";
import { TeamEditorComponent } from "src/app/components/team-editor/team-editor.component";
import { TeamManagerComponent } from "src/app/components/team-manager/team-manager.component";
import { TrackEditorComponent } from "src/app/components/track-editor/track-editor.component";
import { TrackManagerComponent } from "src/app/components/track-manager/track-manager.component";
import { UIEditorComponent } from "src/app/components/ui-editor/ui-editor.component";
import { DirtyCheckGuard } from "src/app/guards/dirty-check.guard";
import { RacedayGuard } from "src/app/guards/raceday.guard";

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
    data: { animation: "AssetManagerPage" },
  },
  {
    path: "driver-editor",
    component: DriverEditorComponent,
    data: { animation: "DriverEditorPage" },
  },
  {
    path: "driver-manager",
    component: DriverManagerComponent,
    data: { animation: "DriverManagerPage" },
  },
  {
    path: "team-manager",
    component: TeamManagerComponent,
    data: { animation: "TeamManagerPage" },
  },
  {
    path: "team-editor",
    component: TeamEditorComponent,
    data: { animation: "TeamEditorPage" },
  },
  {
    path: "track-manager",
    component: TrackManagerComponent,
    data: { animation: "TrackManagerPage" },
  },
  {
    path: "track-editor",
    component: TrackEditorComponent,
    data: { animation: "TrackEditorPage" },
  },
  {
    path: "database-manager",
    component: DatabaseManagerComponent,
    data: { animation: "DatabaseManagerPage" },
  },
  {
    path: "race-manager",
    component: RaceManagerComponent,
    data: { animation: "RaceManagerPage" },
  },
  {
    path: "race-editor",
    component: RaceEditorComponent,
    data: { animation: "RaceEditorPage" },
  },
  {
    path: "ui-editor",
    component: UIEditorComponent,
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
  { path: "**", redirectTo: "" },
];

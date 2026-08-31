import { Routes } from "@angular/router";
import { AssetManagerComponent } from "@app/components/asset-manager/asset-manager.component";
import { CustomRotationEditorComponent } from "@app/components/asset-manager/custom-rotation-editor/custom-rotation-editor.component";
import { DatabaseManagerComponent } from "@app/components/database-manager/database-manager.component";
import { DisplayClient } from "@app/components/display-client/display-client";
import { DriverEditorComponent } from "@app/components/driver-editor/driver-editor.component";
import { DriverManagerComponent } from "@app/components/driver-manager/driver-manager.component";
import { DriverResultsComponent } from "@app/components/driver-results/driver-results.component";
import { DriverStationComponent } from "@app/components/driver-station/driver-station.component";
import { EventEditorComponent } from "@app/components/event-editor/event-editor.component";
import { EventManagerComponent } from "@app/components/event-manager/event-manager.component";
import { HeatResultsComponent } from "@app/components/heat-results/heat-results.component";
import { PredictionResultsComponent } from "@app/components/prediction-results/prediction-results.component";
import { RaceEditorComponent } from "@app/components/race-editor/race-editor.component";
import { RaceManagerComponent } from "@app/components/race-manager/race-manager.component";
import { RaceResultsComponent } from "@app/components/race-results/race-results.component";
import { DefaultRacedayComponent } from "@app/components/raceday/default-raceday.component";
import { ModifyHeatsModalComponent } from "@app/components/raceday/modify-heats-modal/modify-heats-modal.component";
import { RacedayComponent } from "@app/components/raceday/raceday.component";
import { RacedaySetupComponent } from "@app/components/raceday-setup/raceday-setup.component";
import { SeasonEditorComponent } from "@app/components/season-editor/season-editor.component";
import { SeasonManagerComponent } from "@app/components/season-manager/season-manager.component";
import { SeasonResultsComponent } from "@app/components/season-results/season-results.component";
import { TeamEditorComponent } from "@app/components/team-editor/team-editor.component";
import { TeamManagerComponent } from "@app/components/team-manager/team-manager.component";
import { TrackEditorComponent } from "@app/components/track-editor/track-editor.component";
import { TrackManagerComponent } from "@app/components/track-manager/track-manager.component";
import { UIEditorComponent } from "@app/components/ui-editor/ui-editor.component";
import { AuthGuard } from "@app/guards/auth.guard";
import { DirtyCheckGuard } from "@app/guards/dirty-check.guard";
import { RacedayGuard } from "@app/guards/raceday.guard";
import { Role } from "@app/models/role";

export const routes: Routes = [
  { path: "", redirectTo: "raceday-setup", pathMatch: "full" },
  {
    path: "raceday",
    component: RacedayComponent,
    canDeactivate: [RacedayGuard],
    title: "Raceday",
    data: { animation: "RacedayPage" },
  },
  {
    path: "default-raceday",
    component: DefaultRacedayComponent,
    canDeactivate: [RacedayGuard],
    title: "Raceday",
    data: { animation: "RacedayPage" },
  },
  {
    path: "raceday-setup",
    component: RacedaySetupComponent,
    title: "Raceday Setup",
    data: { animation: "RacedaySetupPage" },
  },
  {
    path: "display-client",
    component: DisplayClient,
    title: "Display Client",
    data: { animation: "DisplayClientPage" },
  },
  {
    path: "asset-manager",
    component: AssetManagerComponent,
    canActivate: [AuthGuard],
    title: "Asset Manager",
    data: { animation: "AssetManagerPage" },
  },
  {
    path: "custom-rotation-editor",
    component: CustomRotationEditorComponent,
    canActivate: [AuthGuard],
    canDeactivate: [DirtyCheckGuard],
    runGuardsAndResolvers: "always",
    title: "Custom Rotation Editor",
    data: { animation: "CustomRotationEditorPage" },
  },
  {
    path: "driver-editor",
    component: DriverEditorComponent,
    canActivate: [AuthGuard],
    canDeactivate: [DirtyCheckGuard],
    runGuardsAndResolvers: "always",
    title: "Driver Editor",
    data: { animation: "DriverEditorPage" },
  },
  {
    path: "driver-manager",
    component: DriverManagerComponent,
    canActivate: [AuthGuard],
    title: "Driver Manager",
    data: { animation: "DriverManagerPage" },
  },
  {
    path: "team-manager",
    component: TeamManagerComponent,
    canActivate: [AuthGuard],
    title: "Team Manager",
    data: { animation: "TeamManagerPage" },
  },
  {
    path: "team-editor",
    component: TeamEditorComponent,
    canActivate: [AuthGuard],
    canDeactivate: [DirtyCheckGuard],
    runGuardsAndResolvers: "always",
    title: "Team Editor",
    data: { animation: "TeamEditorPage" },
  },
  {
    path: "track-manager",
    component: TrackManagerComponent,
    canActivate: [AuthGuard],
    title: "Track Manager",
    data: { animation: "TrackManagerPage" },
  },
  {
    path: "track-editor",
    component: TrackEditorComponent,
    canActivate: [AuthGuard],
    canDeactivate: [DirtyCheckGuard],
    runGuardsAndResolvers: "always",
    title: "Track Editor",
    data: { animation: "TrackEditorPage" },
  },
  {
    path: "database-manager",
    component: DatabaseManagerComponent,
    canActivate: [AuthGuard],
    title: "Database Manager",
    data: { animation: "DatabaseManagerPage" },
  },
  {
    path: "event-manager",
    component: EventManagerComponent,
    canActivate: [AuthGuard],
    title: "Event Manager",
    data: { animation: "EventManagerPage" },
  },
  {
    path: "event-editor",
    component: EventEditorComponent,
    canActivate: [AuthGuard],
    canDeactivate: [DirtyCheckGuard],
    runGuardsAndResolvers: "always",
    title: "Event Editor",
    data: { animation: "EventEditorPage" },
  },
  {
    path: "season-manager",
    component: SeasonManagerComponent,
    canActivate: [AuthGuard],
    title: "Season Manager",
    data: { animation: "SeasonManagerPage" },
  },
  {
    path: "season-editor",
    component: SeasonEditorComponent,
    canActivate: [AuthGuard],
    canDeactivate: [DirtyCheckGuard],
    runGuardsAndResolvers: "always",
    title: "Season Editor",
    data: { animation: "SeasonEditorPage" },
  },
  {
    path: "race-manager",
    component: RaceManagerComponent,
    canActivate: [AuthGuard],
    title: "Race Manager",
    data: { animation: "RaceManagerPage" },
  },
  {
    path: "race-editor",
    component: RaceEditorComponent,
    canActivate: [AuthGuard],
    canDeactivate: [DirtyCheckGuard],
    runGuardsAndResolvers: "always",
    title: "Race Editor",
    data: { animation: "RaceEditorPage" },
  },
  {
    path: "ui-editor",
    component: UIEditorComponent,
    canActivate: [AuthGuard],
    canDeactivate: [DirtyCheckGuard],
    runGuardsAndResolvers: "always",
    title: "UI Editor",
    data: { animation: "UIEditorPage", requiredRole: Role.VIEWER },
  },
  {
    path: "driver-station/:lane",
    component: DriverStationComponent,
    title: "Driver Station",
    data: { animation: "DriverStationPage" },
  },
  {
    path: "driver-view/:driverId",
    loadComponent: () =>
      import("@app/components/driver-view/driver-view.component").then(
        (c) => c.DriverViewComponent,
      ),
    title: "Driver View",
    data: { animation: "DriverViewPage" },
  },
  {
    path: "heat-results",
    component: HeatResultsComponent,
    title: "Heat Results",
    data: { animation: "HeatResultsPage" },
  },
  {
    path: "modify-heats",
    component: ModifyHeatsModalComponent,
    canActivate: [AuthGuard],
    title: "Modify Heats",
    data: { animation: "ModifyHeatsPage" },
  },
  {
    path: "race-results",
    component: RaceResultsComponent,
    title: "Race Results",
    data: { animation: "RaceResultsPage" },
  },
  {
    path: "season-results",
    component: SeasonResultsComponent,
    title: "Season Results",
    data: { animation: "SeasonResultsPage" },
  },
  {
    path: "prediction-results",
    component: PredictionResultsComponent,
    title: "Prediction Results",
    data: { animation: "PredictionResultsPage" },
  },
  {
    path: "driver-results/:driverId",
    component: DriverResultsComponent,
    title: "Driver Results",
    data: { animation: "DriverResultsPage" },
  },
  { path: "**", redirectTo: "" },
];

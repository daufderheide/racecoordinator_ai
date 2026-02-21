import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { RacedayComponent } from './components/raceday/raceday.component';
import { RacedaySetupComponent } from './components/raceday-setup/raceday-setup.component';
import { LeaderBoardComponent } from './components/leader_board/leader_board.component';
import { AssetManagerComponent } from './components/asset-manager/asset-manager.component';
import { DriverEditorComponent } from './components/driver-editor/driver-editor.component';
import { DriverManagerComponent } from './components/driver-manager/driver-manager.component';
import { TrackManagerComponent } from './components/track-manager/track-manager.component';
import { TrackEditorComponent } from './components/track-editor/track-editor.component';
import { DatabaseManagerComponent } from './components/database-manager/database-manager.component';
import { RaceManagerComponent } from './components/race-manager/race-manager.component';
import { RaceEditorComponent } from './components/race-editor/race-editor.component';
import { TeamManagerComponent } from './components/team-manager/team-manager.component';
import { TeamEditorComponent } from './components/team-editor/team-editor.component';
import { UIEditorComponent } from './components/ui-editor/ui-editor.component';
import { DirtyCheckGuard } from './guards/dirty-check.guard';

const routes: Routes = [
    { path: '', redirectTo: 'raceday-setup', pathMatch: 'full' },
    { path: 'raceday', component: RacedayComponent, data: { animation: 'RacedayPage' } },
    { path: 'leaderboard', component: LeaderBoardComponent, data: { animation: 'LeaderBoardPage' } },
    { path: 'raceday-setup', component: RacedaySetupComponent, data: { animation: 'RacedaySetupPage' } },
    { path: 'asset-manager', component: AssetManagerComponent, data: { animation: 'AssetManagerPage' } },
    { path: 'driver-editor', component: DriverEditorComponent, data: { animation: 'DriverEditorPage' } },
    { path: 'driver-manager', component: DriverManagerComponent, data: { animation: 'DriverManagerPage' } },
    { path: 'team-manager', component: TeamManagerComponent, data: { animation: 'TeamManagerPage' } },
    { path: 'team-editor', component: TeamEditorComponent, data: { animation: 'TeamEditorPage' } },
    { path: 'track-manager', component: TrackManagerComponent, data: { animation: 'TrackManagerPage' } },
    { path: 'track-editor', component: TrackEditorComponent, data: { animation: 'TrackEditorPage' } },
    { path: 'database-manager', component: DatabaseManagerComponent, data: { animation: 'DatabaseManagerPage' } },
    { path: 'race-manager', component: RaceManagerComponent, data: { animation: 'RaceManagerPage' } },
    { path: 'race-editor', component: RaceEditorComponent, data: { animation: 'RaceEditorPage' } },
    { path: 'ui-editor', component: UIEditorComponent, canDeactivate: [DirtyCheckGuard], data: { animation: 'UIEditorPage' } },
    { path: '**', redirectTo: '' }
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule]
})
export class AppRoutingModule { }

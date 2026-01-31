import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { RacedayComponent } from './components/raceday/raceday.component';
import { RacedaySetupComponent } from './components/raceday-setup/raceday-setup.component';
import { LeaderBoardComponent } from './components/leader_board/leader_board.component';
import { AssetManagerComponent } from './components/asset-manager/asset-manager.component';
import { DriverEditorComponent } from './components/driver-editor/driver-editor.component';
import { DriverManagerComponent } from './components/driver-manager/driver-manager.component';

const routes: Routes = [
    { path: '', redirectTo: 'raceday-setup', pathMatch: 'full' },
    { path: 'raceday', component: RacedayComponent, data: { animation: 'RacedayPage' } },
    { path: 'leaderboard', component: LeaderBoardComponent, data: { animation: 'LeaderBoardPage' } },
    { path: 'raceday-setup', component: RacedaySetupComponent, data: { animation: 'RacedaySetupPage' } },
    { path: 'asset-manager', component: AssetManagerComponent, data: { animation: 'AssetManagerPage' } },
    { path: 'driver-editor', component: DriverEditorComponent, data: { animation: 'DriverEditorPage' } },
    { path: 'driver-manager', component: DriverManagerComponent, data: { animation: 'DriverManagerPage' } },
    { path: '**', redirectTo: '' }
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule]
})
export class AppRoutingModule { }

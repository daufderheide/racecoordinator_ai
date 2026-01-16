import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './home.component';
import { RacedayComponent } from './components/raceday/raceday.component';
import { RacedaySetupComponent } from './components/raceday-setup/raceday-setup.component';

const routes: Routes = [
    { path: '', component: HomeComponent },
    { path: 'raceday', component: RacedayComponent },
    { path: 'raceday-setup', component: RacedaySetupComponent },
    { path: '**', redirectTo: '' }
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule]
})
export class AppRoutingModule { }

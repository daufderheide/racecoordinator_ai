import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './home.component';
import { RacedayComponent } from './components/raceday/raceday.component';

const routes: Routes = [
    { path: '', component: HomeComponent },
    { path: 'raceday', component: RacedayComponent },
    { path: '**', redirectTo: '' }
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule]
})
export class AppRoutingModule { }

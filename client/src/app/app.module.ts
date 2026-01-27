import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { provideHttpClient } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import { RacedayComponent } from './components/raceday/raceday.component';
import { RacedaySetupComponent } from './components/raceday-setup/raceday-setup.component';
import { DefaultRacedaySetupComponent } from './components/raceday-setup/default-raceday-setup.component';
import { RaceService } from './services/race.service';
import { ConfirmationModalComponent } from './components/confirmation-modal/confirmation-modal.component';
import { LeaderBoardComponent } from './components/leader_board/leader_board.component';
import { SharedModule } from './shared/shared.module';

@NgModule({
  declarations: [
    AppComponent,

    RacedayComponent,
    RacedaySetupComponent,
    DefaultRacedaySetupComponent,
    ConfirmationModalComponent,
    LeaderBoardComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    SharedModule
  ],
  providers: [
    provideHttpClient(),
    RaceService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }

import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { provideHttpClient } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import { RacedayComponent } from './components/raceday/raceday.component';
import { DefaultRacedayComponent } from './components/raceday/default-raceday.component';
import { RacedaySetupComponent } from './components/raceday-setup/raceday-setup.component';
import { DefaultRacedaySetupComponent } from './components/raceday-setup/default-raceday-setup.component';
import { RaceService } from './services/race.service';

import { LeaderBoardComponent } from './components/leader_board/leader_board.component';
import { AssetManagerComponent } from './components/asset-manager/asset-manager.component';
import { DriverEditorComponent } from './components/driver-editor/driver-editor.component';
import { DriverManagerComponent } from './components/driver-manager/driver-manager.component';
import { TrackManagerComponent } from './components/track-manager/track-manager.component';
import { TrackEditorComponent } from './components/track-editor/track-editor.component';
import { ArduinoEditorComponent } from './components/track-editor/arduino-editor/arduino-editor.component';
import { ArduinoSummaryComponent } from './components/track-manager/arduino-summary/arduino-summary.component';
import { SharedModule } from './components/shared/shared.module';
import { DatabaseManagerComponent } from './components/database-manager/database-manager.component';
import { RaceManagerComponent } from './components/race-manager/race-manager.component';
import { RaceEditorComponent } from './components/race-editor/race-editor.component';
import { TeamManagerComponent } from './components/team-manager/team-manager.component';
import { TeamEditorComponent } from './components/team-editor/team-editor.component';

@NgModule({
  declarations: [
    AppComponent,

    RacedayComponent,
    DefaultRacedayComponent,
    RacedaySetupComponent,
    DefaultRacedaySetupComponent,
    LeaderBoardComponent,
    AssetManagerComponent,
    DriverEditorComponent,
    DriverManagerComponent,
    TeamManagerComponent,
    TeamEditorComponent,
    TrackManagerComponent,
    TrackEditorComponent,
    ArduinoEditorComponent,
    ArduinoSummaryComponent,
    DatabaseManagerComponent,
    RaceManagerComponent,
    RaceEditorComponent
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

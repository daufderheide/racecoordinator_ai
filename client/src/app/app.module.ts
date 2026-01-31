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
import { ItemSelectorComponent } from './components/shared/item-selector/item-selector.component';
import { SharedModule } from './shared/shared.module';
import { AvatarUrlPipe } from './pipes/avatar-url.pipe';

@NgModule({
  declarations: [
    AppComponent,

    RacedayComponent,
    DefaultRacedayComponent,
    RacedaySetupComponent,
    DefaultRacedaySetupComponent,
    DefaultRacedaySetupComponent,
    DefaultRacedaySetupComponent,
    LeaderBoardComponent,
    AssetManagerComponent,
    DriverEditorComponent,
    DriverManagerComponent,
    ItemSelectorComponent,
    AvatarUrlPipe
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

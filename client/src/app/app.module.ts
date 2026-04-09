import { provideHttpClient } from "@angular/common/http";
import { NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { AssetManagerComponent } from "src/app/components/asset-manager/asset-manager.component";
import { ImageSetEditorComponent } from "src/app/components/asset-manager/image-set-editor/image-set-editor.component";
import { DatabaseManagerComponent } from "src/app/components/database-manager/database-manager.component";
import { DriverEditorComponent } from "src/app/components/driver-editor/driver-editor.component";
import { DriverManagerComponent } from "src/app/components/driver-manager/driver-manager.component";
import { DriverStationComponent } from "src/app/components/driver-station/driver-station.component";
import { HeatResultsComponent } from "src/app/components/heat-results/heat-results.component";
import { RaceEditorComponent } from "src/app/components/race-editor/race-editor.component";
import { RaceManagerComponent } from "src/app/components/race-manager/race-manager.component";
import { DefaultRacedayComponent } from "src/app/components/raceday/default-raceday.component";
import { RacedayComponent } from "src/app/components/raceday/raceday.component";
import { DefaultRacedaySetupComponent } from "src/app/components/raceday-setup/default-raceday-setup.component";
import { RacedaySetupComponent } from "src/app/components/raceday-setup/raceday-setup.component";
import { SharedModule } from "src/app/components/shared/shared.module";
import { TeamEditorComponent } from "src/app/components/team-editor/team-editor.component";
import { TeamManagerComponent } from "src/app/components/team-manager/team-manager.component";
import { ArduinoEditorComponent } from "src/app/components/track-editor/arduino-editor/arduino-editor.component";
import { TrackEditorComponent } from "src/app/components/track-editor/track-editor.component";
import { ArduinoSummaryComponent } from "src/app/components/track-manager/arduino-summary/arduino-summary.component";
import { TrackManagerComponent } from "src/app/components/track-manager/track-manager.component";
import { UIEditorComponent } from "src/app/components/ui-editor/ui-editor.component";
import { RaceService } from "src/app/services/race.service";

import { AppComponent } from "./app.component";
import { AppRoutingModule } from "./app-routing.module";

@NgModule({
  declarations: [
    AppComponent,

    RacedayComponent,
    DefaultRacedayComponent,
    RacedaySetupComponent,
    DefaultRacedaySetupComponent,
    AssetManagerComponent,
    ImageSetEditorComponent,
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
    RaceEditorComponent,
    UIEditorComponent,
    DriverStationComponent,
    HeatResultsComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    SharedModule,
  ],
  providers: [provideHttpClient(), RaceService],
  bootstrap: [AppComponent],
})
export class AppModule {}

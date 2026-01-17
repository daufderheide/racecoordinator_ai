import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { provideHttpClient } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HomeComponent } from './home.component';
import { RacedayComponent } from './components/raceday/raceday.component';
import { RacedaySetupComponent } from './components/raceday-setup/raceday-setup.component';
import { FormsModule } from '@angular/forms';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { RaceService } from './services/race.service';
import { TranslatePipe } from './pipes/translate.pipe';
import { SvgTextScalerDirective } from './directives/svg-text-scaler.directive';

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    RacedayComponent,
    RacedaySetupComponent,
    TranslatePipe,
    SvgTextScalerDirective
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    DragDropModule,
    BrowserAnimationsModule
  ],
  providers: [
    provideHttpClient(),
    RaceService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }

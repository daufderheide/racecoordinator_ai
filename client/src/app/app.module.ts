import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { provideHttpClient } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import { RacedayComponent } from './components/raceday/raceday.component';
import { RacedaySetupComponent } from './components/raceday-setup/raceday-setup.component';
import { FormsModule } from '@angular/forms';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { RaceService } from './services/race.service';
import { TranslatePipe } from './pipes/translate.pipe';
import { SvgTextScalerDirective } from './directives/svg-text-scaler.directive';
import { ConfirmationModalComponent } from './components/confirmation-modal/confirmation-modal.component';
import { LeaderBoardComponent } from './components/leader_board/leader_board.component';

@NgModule({
  declarations: [
    AppComponent,

    RacedayComponent,
    RacedaySetupComponent,
    TranslatePipe,
    SvgTextScalerDirective,
    SvgTextScalerDirective,
    ConfirmationModalComponent,
    LeaderBoardComponent
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

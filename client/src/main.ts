import "@angular/compiler";
import { provideHttpClient } from "@angular/common/http";
import { bootstrapApplication } from "@angular/platform-browser";
import { provideAnimations } from "@angular/platform-browser/animations";
import { provideRouter } from "@angular/router";
import { LoggerService } from "@app/services/logger.service";
import { RaceService } from "@app/services/race.service";

import { AppComponent } from "./app/app.component";
import { routes } from "./app/app.routes";

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes),
    provideAnimations(),
    provideHttpClient(),
    RaceService,
    LoggerService,
  ],
}).catch((err) => console.error(err));

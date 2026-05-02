import "@angular/compiler";

import { provideHttpClient } from "@angular/common/http";
import { RaceService } from "src/app/services/race.service";
import { bootstrapApplication } from "@angular/platform-browser";
import { provideAnimations } from "@angular/platform-browser/animations";
import { AppComponent } from "./app/app.component";
import { provideRouter } from "@angular/router";
import { routes } from "./app/app.routes";

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes),
    provideAnimations(),
    provideHttpClient(),
    RaceService,
  ],
}).catch((err) => console.error(err));

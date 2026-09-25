import "@angular/compiler";
import { provideHttpClient, withInterceptors } from "@angular/common/http";
import { bootstrapApplication } from "@angular/platform-browser";
import { provideAnimations } from "@angular/platform-browser/animations";
import { provideRouter, withRouterConfig } from "@angular/router";
import { authInterceptor } from "@app/services/auth.interceptor";
import { LoggerService } from "@app/services/logger.service";
import { RaceService } from "@app/services/race.service";
import {
  isBrowserSupported,
  renderUnsupportedBrowserBanner,
} from "@app/utils/browser-compatibility";
import { initGlobalFormSecurity } from "@app/utils/form-security";

initGlobalFormSecurity();

import { AppComponent } from "./app/app.component";
import { routes } from "./app/app.routes";

if (!isBrowserSupported()) {
  renderUnsupportedBrowserBanner();
} else {
  bootstrapApplication(AppComponent, {
    providers: [
      provideRouter(
        routes,
        withRouterConfig({
          canceledNavigationResolution: "computed",
        }),
      ),
      provideAnimations(),
      provideHttpClient(withInterceptors([authInterceptor])),
      RaceService,
      LoggerService,
    ],
  }).catch((err) => {
    console.error(err);
    renderUnsupportedBrowserBanner();
  });
}

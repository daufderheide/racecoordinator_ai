import { ChangeDetectorRef, Inject } from "@angular/core";
import { Router } from "@angular/router";
import { DataService } from "@app/data.service";
import { FileSystemService } from "@app/services/file-system.service";
import { HelpService } from "@app/services/help.service";
import { LoggerService } from "@app/services/logger.service";
import { ParticipantValidationService } from "@app/services/participant-validation.service";
import { RaceService } from "@app/services/race.service";
import { SettingsService } from "@app/services/settings.service";
import { ThemeService } from "@app/services/theme.service";
import { TranslationService } from "@app/services/translation.service";

import { DefaultRacedaySetupComponent } from "./default-raceday-setup.component";

export class CustomUiBaseComponent extends DefaultRacedaySetupComponent {
  constructor(
    @Inject(DataService) dataService: DataService,
    @Inject(ChangeDetectorRef) cdr: ChangeDetectorRef,
    @Inject(RaceService) raceService: RaceService,
    @Inject(Router) router: Router,
    @Inject(TranslationService) translationService: TranslationService,
    @Inject(SettingsService) settingsService: SettingsService,
    @Inject(FileSystemService) fileSystem: FileSystemService,
    @Inject(HelpService) helpService: HelpService,
    @Inject(LoggerService) logger: LoggerService,
    @Inject(ParticipantValidationService)
    validationService: ParticipantValidationService,
    @Inject(ThemeService) themeService: ThemeService,
  ) {
    super(
      dataService,
      cdr,
      raceService,
      router,
      translationService,
      settingsService,
      fileSystem,
      helpService,
      logger,
      validationService,
      themeService,
    );
  }
}

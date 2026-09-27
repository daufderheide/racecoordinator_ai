import { ChangeDetectorRef, Component, inject, OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Router } from "@angular/router";
import { firstValueFrom } from "rxjs";
import {
  CustomOptionComponent,
  CustomSelectComponent,
} from "@app/components/shared/custom-select/custom-select.component";
import { DataService } from "@app/data.service";
import { Theme } from "@app/models/theme";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { ThemeService } from "@app/services/theme.service";

@Component({
  selector: "app-display-client",
  standalone: true,
  imports: [
    FormsModule,
    TranslatePipe,
    CustomSelectComponent,
    CustomOptionComponent,
  ],
  template: `
    <div class="display-client-container">
      <div class="display-card">
        <div class="card-header">
          <h2>{{ "DC_TITLE" | translate }}</h2>
        </div>
        <div class="card-content">
          <p>{{ "DC_DESCRIPTION" | translate }}</p>
          <div class="form-group">
            <label for="themeSelect">{{ "DC_THEME_LABEL" | translate }}</label>
            <app-custom-select
              id="themeSelect"
              [(ngModel)]="selectedThemeId"
              class="rc-select"
            >
              <app-custom-option value="" [disabled]="true">
                {{ "DC_SELECT_THEME" | translate }}
              </app-custom-option>
              @for (theme of themes; track theme.entity_id) {
                <app-custom-option [value]="theme.entity_id">{{
                  theme.name
                }}</app-custom-option>
              }
            </app-custom-select>
          </div>
        </div>
        <div class="card-actions">
          <button
            id="launch-display-btn"
            class="rc-button primary"
            [disabled]="!selectedThemeId"
            (click)="launchDisplay()"
          >
            {{ "DC_LAUNCH_BUTTON" | translate }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .display-client-container {
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100vh;
        background-color: var(--background-color, #1e1e1e);
        color: var(--text-color, #ffffff);
        font-family: var(--font-family, sans-serif);
      }
      .display-card {
        width: 400px;
        padding: 2rem;
        background-color: var(--card-bg-color, #2a2a2a);
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
      }
      .card-header h2 {
        margin-top: 0;
        margin-bottom: 1rem;
        font-size: 1.5rem;
      }
      .card-content p {
        margin-bottom: 1.5rem;
        color: var(--text-muted, #b0b0b0);
      }
      .form-group {
        display: flex;
        flex-direction: column;
        margin-bottom: 2rem;
      }
      .form-group label {
        margin-bottom: 0.5rem;
        font-weight: 500;
      }
      .rc-select {
        padding: 0.75rem;
        border-radius: 4px;
        border: 1px solid var(--border-color, #444);
        background-color: var(--input-bg-color, #333);
        color: var(--text-color, #ffffff);
        font-size: 1rem;
      }
      .card-actions {
        display: flex;
        justify-content: flex-end;
      }
      .rc-button {
        padding: 0.75rem 1.5rem;
        border: none;
        border-radius: 4px;
        font-size: 1rem;
        cursor: pointer;
        transition: background-color 0.2s;
      }
      .rc-button.primary {
        background-color: var(--primary-color, #007bff);
        color: white;
      }
      .rc-button.primary:hover:not(:disabled) {
        background-color: var(--primary-color-hover, #0056b3);
      }
      .rc-button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    `,
  ],
})
export class DisplayClient implements OnInit {
  themes: Theme[] = [];
  selectedThemeId: string = "";

  constructor(
    private themeService: ThemeService,
    private router: Router,
    private dataService?: DataService,
    private cdr?: ChangeDetectorRef,
  ) {
    if (!this.dataService) {
      this.dataService = inject(DataService, { optional: true }) ?? undefined;
    }
    if (!this.cdr) {
      this.cdr = inject(ChangeDetectorRef, { optional: true }) ?? undefined;
    }
  }

  async ngOnInit(): Promise<void> {
    await this.loadThemes();
  }

  async loadThemes(): Promise<void> {
    this.themes = this.themeService?.getThemes() || [];
    if (this.themes.length === 0 && this.themeService?.initialize) {
      try {
        await this.themeService.initialize();
        this.themes = this.themeService.getThemes() || [];
      } catch {
        // ignore error and try fallback
      }
    }

    if (this.themes.length === 0 && this.dataService) {
      try {
        const fetched = await firstValueFrom(this.dataService.getThemes());
        if (fetched && fetched.length > 0) {
          this.themes = fetched;
        }
      } catch {
        // ignore error
      }
    }

    const currentValid = this.themes.some(
      (t) => t.entity_id === this.selectedThemeId,
    );
    if (!currentValid && this.themes.length > 0) {
      const active = this.themeService?.getActiveTheme?.();
      this.selectedThemeId =
        active?.entity_id ||
        this.themes.find((t) => t.is_default)?.entity_id ||
        this.themes[0]?.entity_id ||
        "";
    }

    this.cdr?.markForCheck();
  }

  launchDisplay(): void {
    if (this.selectedThemeId) {
      this.router.navigate(["/default-raceday"], {
        queryParams: { themeId: this.selectedThemeId },
      });
    }
  }
}

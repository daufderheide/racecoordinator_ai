import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  OnInit,
  signal,
} from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { FormsModule } from "@angular/forms";
import type { DriverResultsSections } from "@app/components/driver-results/driver-results-layout.model";
import type { HeatResultsWidgetContext } from "@app/components/heat-results/heat-results-widget.component";
import type { RaceStandingsWidgetContext } from "@app/components/race-results/race-standings-widget.component";
import { RacedayAbsoluteWidgetComponent } from "@app/components/raceday/components/raceday-absolute-widget/raceday-absolute-widget.component";
import {
  CustomOptionComponent,
  CustomSelectComponent,
} from "@app/components/shared/custom-select/custom-select.component";
import { ResultsLayoutPurpose } from "@app/models/settings";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { CustomUiService } from "@app/services/custom-ui.service";
import { SettingsService } from "@app/services/settings.service";

import { readResultsLayout, RESULTS_LAYOUTS } from "./results-layout.model";

export type ResultsWidgetContext =
  | { heatResultsWidgetContext: HeatResultsWidgetContext }
  | { raceStandingsWidgetContext: RaceStandingsWidgetContext }
  | { driverResultsSections: DriverResultsSections };

@Component({
  selector: "app-results-layout",
  imports: [
    FormsModule,
    RacedayAbsoluteWidgetComponent,
    CustomSelectComponent,
    CustomOptionComponent,
    TranslatePipe,
  ],
  templateUrl: "./results-layout.component.html",
  styleUrl: "./results-layout.component.css",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResultsLayoutComponent implements OnInit {
  readonly purpose = input.required<ResultsLayoutPurpose>();
  readonly context = input.required<ResultsWidgetContext>();

  private readonly customUis = inject(CustomUiService);
  private readonly settings = inject(SettingsService);
  private readonly savedLayouts = toSignal(this.customUis.customUIs$, {
    initialValue: [],
  });
  private readonly savedSettings = this.settings.getSettings();
  private readonly selection = signal({
    heatResultsLayoutId: this.savedSettings?.heatResultsLayoutId || "",
    raceResultsLayoutId: this.savedSettings?.raceResultsLayoutId || "",
    driverResultsLayoutId: this.savedSettings?.driverResultsLayoutId || "",
  });
  private readonly definition = computed(() => RESULTS_LAYOUTS[this.purpose()]);
  private readonly layoutId = computed(
    () => this.selection()[this.definition().preference],
  );

  protected readonly layouts = computed(() =>
    this.savedLayouts().flatMap((ui) => {
      const layout = readResultsLayout(ui);
      return layout?.purpose === this.purpose()
        ? [{ id: ui.entity_id, name: ui.name, layout }]
        : [];
    }),
  );
  readonly activeLayout = computed(
    () => this.layouts().find(({ id }) => id === this.layoutId())?.layout,
  );
  protected readonly selectedLayoutId = computed(() =>
    this.activeLayout() ? this.layoutId() : "",
  );
  protected readonly visibleWidgets = computed(
    () =>
      this.activeLayout()?.widgets.filter((widget) =>
        this.definition().widgets.some(
          ({ type }) => type === widget?.widgetType,
        ),
      ) ?? [],
  );
  protected readonly widgetHost = computed(() => ({
    layout: this.activeLayout(),
    ...this.context(),
  }));

  ngOnInit(): void {
    if (!this.customUis.isInitialized()) void this.customUis.initialize();
  }

  protected selectLayout(id: string): void {
    if (id && !this.layouts().some((layout) => layout.id === id)) return;
    const key = this.definition().preference;
    this.selection.update((selection) => ({ ...selection, [key]: id }));
    const settings = this.settings.getSettings();
    settings[key] = id || undefined;
    this.settings.saveSettings(settings);
  }
}

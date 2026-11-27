import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  OnInit,
  output,
  signal,
} from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { FormsModule } from "@angular/forms";
import { RacedayAbsoluteWidgetComponent } from "@app/components/raceday/components/raceday-absolute-widget/raceday-absolute-widget.component";
import {
  CustomOptionComponent,
  CustomSelectComponent,
} from "@app/components/shared/custom-select/custom-select.component";
import type { HeatExpanderData } from "@app/components/shared/heat-driver-expander/heat-driver-expander.component";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { Heat } from "@app/race/heat";
import { CustomUiService } from "@app/services/custom-ui.service";
import { SettingsService } from "@app/services/settings.service";

import {
  readHeatResultsLayout,
  supportsHeatResultsWidget,
} from "./heat-results-layout.model";
import {
  HeatResultsWidgetContext,
  toHeatResultsRows,
} from "./heat-results-widget.component";

@Component({
  selector: "app-heat-results-layout",
  imports: [
    FormsModule,
    RacedayAbsoluteWidgetComponent,
    CustomSelectComponent,
    CustomOptionComponent,
    TranslatePipe,
  ],
  templateUrl: "./heat-results-layout.component.html",
  styleUrl: "./heat-results-layout.component.css",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeatResultsLayoutComponent implements OnInit {
  readonly heats = input.required<readonly Heat[]>();
  readonly selectableHeats = input.required<readonly Heat[]>();
  readonly currentHeat = input<Heat>();
  readonly selectedHeatIndex = input.required<number>();
  readonly data = input.required<readonly HeatExpanderData[]>();
  readonly heatSelected = output<number>();

  private readonly customUis = inject(CustomUiService);
  private readonly settings = inject(SettingsService);
  private readonly savedLayouts = toSignal(this.customUis.customUIs$, {
    initialValue: [],
  });
  private readonly layoutId = signal(
    this.settings.getSettings()?.heatResultsLayoutId || "",
  );

  protected readonly layouts = computed(() =>
    this.savedLayouts().flatMap((ui) => {
      const layout = readHeatResultsLayout(ui);
      return layout ? [{ id: ui.entity_id, name: ui.name, layout }] : [];
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
        supportsHeatResultsWidget(widget?.widgetType),
      ) ?? [],
  );
  protected readonly widgetHost = computed(() => {
    const layout = this.activeLayout();
    const data: HeatResultsWidgetContext = {
      choices: this.selectableHeats().map((heat) => ({
        index: this.heats().indexOf(heat),
        number: heat.heatNumber,
        isCurrent: heat === this.currentHeat(),
      })),
      selectedIndex: this.selectedHeatIndex(),
      rows: toHeatResultsRows(this.data()),
      selectHeat: (index) => this.heatSelected.emit(index),
    };
    return { layout, heatResultsWidgetContext: data };
  });

  ngOnInit(): void {
    if (!this.customUis.isInitialized()) void this.customUis.initialize();
  }

  protected selectLayout(id: string): void {
    if (id && !this.layouts().some((layout) => layout.id === id)) return;
    this.layoutId.set(id);
    const settings = this.settings.getSettings();
    settings.heatResultsLayoutId = id || undefined;
    this.settings.saveSettings(settings);
  }
}

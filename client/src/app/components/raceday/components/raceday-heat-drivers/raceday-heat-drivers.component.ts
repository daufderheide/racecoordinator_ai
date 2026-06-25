import { CommonModule } from "@angular/common";
import {
  AfterViewInit,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  input,
  OnDestroy,
  viewChild,
  ViewEncapsulation,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Track } from "@app/models/track";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { DriverHeatData } from "@app/race/driver_heat_data";
import { Heat } from "@app/race/heat";
import { TranslationService } from "@app/services/translation.service";

@Component({
  standalone: true,
  selector: "app-raceday-heat-drivers",
  templateUrl: "./raceday-heat-drivers.component.html",
  styleUrls: ["./raceday-heat-drivers.component.css"],
  encapsulation: ViewEncapsulation.None,
  imports: [CommonModule, TranslatePipe, FormsModule],
})
export class RacedayHeatDriversComponent implements AfterViewInit, OnDestroy {
  type = input<"next-heat" | "on-deck">("next-heat");
  track = input<Track | undefined>(undefined);
  currentHeat = input<Heat | undefined>(undefined);
  heats = input<Heat[]>([]);
  parent = input<any>(undefined);
  widget = input<any>(undefined);

  private driversPanel = viewChild<ElementRef<HTMLElement>>("driversPanel");
  private resizeObserver?: ResizeObserver;
  private translationService = inject(TranslationService);

  constructor() {
    effect(() => {
      // Trigger whenever inputs change
      this.drivers();
      this.type();
      this.widget();

      // Schedule fit on next microtask
      setTimeout(() => this.fitText(), 0);
    });
  }

  ngAfterViewInit() {
    const panelEl = this.driversPanel()?.nativeElement;
    if (panelEl && typeof ResizeObserver !== "undefined") {
      this.resizeObserver = new ResizeObserver(() => {
        this.fitText();
      });
      this.resizeObserver.observe(panelEl);
    }
  }

  ngOnDestroy() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
  }

  private fitText() {
    const panelEl = this.driversPanel()?.nativeElement;
    const widgetData = this.widget();

    if (!panelEl) return;

    const isAuto = widgetData?.scaleMode === "auto";
    if (!isAuto) {
      this.resetCSSProperties(panelEl);
      return;
    }

    const titleText = this.translationService.translate(
      this.type() === "on-deck" ? "RD_WIN_ON_DECK" : "RD_WIN_NEXT_HEAT",
    );

    // Font families and weights
    const titleFontFamily =
      widgetData?.customSettings?.titleFontFamily || "sans-serif";
    const laneFontFamily =
      widgetData?.customSettings?.laneFontFamily || "sans-serif";

    // Use canvas to measure text
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    let titleWidthAt100 = 100;
    let maxRowWidthAt100 = 0;

    if (context) {
      context.font = `bold 100px ${titleFontFamily}`;
      titleWidthAt100 = context.measureText(titleText).width || 1;

      const driversList = this.drivers();
      maxRowWidthAt100 = this.measureMaxRowWidthAt100(
        context,
        driversList,
        laneFontFamily,
      );
    }

    const containerWidth = panelEl.clientWidth;
    const containerHeight = panelEl.clientHeight;

    // We pad container bounds
    const availableWidth = containerWidth * 0.92;
    const availableHeight = containerHeight * 0.9;

    // Calculate limit width based on title (title S = 1.125 * lane S)
    const limitWidthTitle = (availableWidth * 100) / (1.125 * titleWidthAt100);

    // Calculate limit width based on driver row (lane S = S)
    const limitWidthRow = availableWidth / (maxRowWidthAt100 / 100 + 0.24);

    // Calculate height limit
    const trackLaneCount = this.track()?.lanes?.length || 0;
    const N = Math.max(trackLaneCount, this.drivers().length, 1);

    let heightFactor = 0;
    const hasTeams = this.drivers().some((hd) => this.isTeam(hd));
    // normal item = 1.0 + 1.0 padding = 2.0
    // stacked item = 1.0 + 0.7 + 1.0 padding = 2.7
    const itemHeightMultiplier = hasTeams ? 2.7 : 2.0;
    // padding-y * 2 = 1.5, title margin = 0.75, title size = 1.125
    // 1.5 + 0.75 + 1.125 = 3.375. minus 0.5 for gap adjustment: 2.875
    heightFactor = 2.875 + itemHeightMultiplier * N;

    const limitHeight = availableHeight / heightFactor;

    const baseScaleFactor = widgetData?.textScaleFactor ?? 1;
    const targetLaneFontSize = Math.max(
      Math.floor(
        Math.min(limitHeight, limitWidthTitle, limitWidthRow) * baseScaleFactor,
      ),
      8,
    );

    const targetTitleFontSize = Math.floor(targetLaneFontSize * 1.125);

    // Apply via CSS custom properties
    this.applyCSSProperties(panelEl, targetLaneFontSize, targetTitleFontSize);
  }

  private resetCSSProperties(panelEl: HTMLElement) {
    panelEl.style.removeProperty("--heat-drivers-font-size");
    panelEl.style.removeProperty("--heat-drivers-title-size");
    panelEl.style.removeProperty("--heat-drivers-padding-x");
    panelEl.style.removeProperty("--heat-drivers-padding-y");
    panelEl.style.removeProperty("--heat-drivers-gap");
    panelEl.style.removeProperty("--heat-drivers-item-padding-x");
    panelEl.style.removeProperty("--heat-drivers-item-padding-y");
    panelEl.style.removeProperty("--heat-drivers-title-margin");
  }

  private measureMaxRowWidthAt100(
    context: CanvasRenderingContext2D,
    driversList: DriverHeatData[],
    laneFontFamily: string,
  ): number {
    if (driversList.length === 0) {
      // Empty state text: "N/A"
      const naText = this.translationService.translate("GEN_NA");
      context.font = `italic 93.75px ${laneFontFamily}`; // 15px/16px = 93.75%
      return context.measureText(naText).width || 1;
    }

    let maxWidth = 0;
    for (const hd of driversList) {
      let driverText = hd.driver?.nickname || hd.driver?.name || "";
      let teamName = "";
      if (this.isTeam(hd)) {
        teamName =
          hd.participant?.team?.name || (hd.driver as any)?.team?.name || "";
      }

      let textPadding = 0;
      if (
        this.parent() &&
        this.isTeam(hd) &&
        this.parent().authService.currentRole !== this.parent().Role.VIEWER
      ) {
        textPadding = 44; // 44px at S=100px
      }

      context.font = `600 100px ${laneFontFamily}`;
      let driverWidth = context.measureText(driverText).width || 1;

      if (teamName) {
        context.font = `600 70px ${laneFontFamily}`;
        const teamWidth = context.measureText(teamName).width || 1;
        driverWidth = Math.max(driverWidth, teamWidth);
      }

      // Lane badge text
      const badgeText = `L${hd.laneIndex + 1}`;
      context.font = `bold 87.5px ${laneFontFamily}`;
      const badgeTextWidth = context.measureText(badgeText).width || 1;
      const badgeWidth = badgeTextWidth + 105; // text width + padding

      const rowWidth = driverWidth + textPadding + badgeWidth + 8; // 8px margin-left at 100px
      if (rowWidth > maxWidth) {
        maxWidth = rowWidth;
      }
    }
    return maxWidth;
  }

  private applyCSSProperties(
    panelEl: HTMLElement,
    targetLaneFontSize: number,
    targetTitleFontSize: number,
  ) {
    panelEl.style.setProperty(
      "--heat-drivers-font-size",
      `${targetLaneFontSize}px`,
    );
    panelEl.style.setProperty(
      "--heat-drivers-title-size",
      `${targetTitleFontSize}px`,
    );
    panelEl.style.setProperty(
      "--heat-drivers-padding-x",
      `${targetLaneFontSize * 0.75}px`,
    );
    panelEl.style.setProperty(
      "--heat-drivers-padding-y",
      `${targetLaneFontSize * 0.75}px`,
    );
    panelEl.style.setProperty(
      "--heat-drivers-gap",
      `${targetLaneFontSize * 0.5}px`,
    );
    panelEl.style.setProperty(
      "--heat-drivers-item-padding-x",
      `${targetLaneFontSize * 0.75}px`,
    );
    panelEl.style.setProperty(
      "--heat-drivers-item-padding-y",
      `${targetLaneFontSize * 0.5}px`,
    );
    panelEl.style.setProperty(
      "--heat-drivers-title-margin",
      `${targetLaneFontSize * 0.75}px`,
    );
  }

  nextHeatNumber = computed<number>(() => {
    const cur = this.currentHeat();
    return cur ? cur.heatNumber + 1 : 0;
  });

  drivers = computed<DriverHeatData[]>(() => {
    const cur = this.currentHeat();
    const hts = this.heats();
    if (!cur || !hts || hts.length === 0) {
      return [];
    }
    const nextHeat = hts.find((h) => h.heatNumber === cur.heatNumber + 1);
    if (!nextHeat || !nextHeat.heatDrivers) {
      return [];
    }

    if (this.type() === "next-heat") {
      return nextHeat.heatDrivers;
    }

    const activeDrivers = nextHeat.heatDrivers.filter((hd) => {
      return hd.driver && !this.parent()?.isEmptyDriver(hd);
    });

    if (this.type() === "on-deck") {
      const currentDriverIds = new Set(
        cur.heatDrivers
          ?.map((d) => d.driver?.objectId || d.driver?.entity_id)
          .filter(Boolean) || [],
      );
      return activeDrivers.filter((hd) => {
        const id = hd.driver?.objectId || hd.driver?.entity_id;
        return id && !currentDriverIds.has(id);
      });
    }

    return activeDrivers;
  });

  isTeam(hd: DriverHeatData): boolean {
    return this.parent()?.isTeam(hd) ?? false;
  }

  isEditMode(): boolean {
    const parent = this.parent();
    if (!parent) return false;
    const isCustomizing = parent.isLayoutCustomizing;
    const isUIEditor =
      typeof parent.isUIEditorMode === "function"
        ? parent.isUIEditorMode()
        : parent.isUIEditorMode;
    return !!(isCustomizing || isUIEditor);
  }

  getTeammates(hd: DriverHeatData): any[] {
    return this.parent()?.getTeammates(hd) ?? [];
  }

  getDropdownArrowBg(_hd: DriverHeatData): string {
    if (!this.parent()) return "";
    const color = this.widget()?.customSettings?.["laneTextColor"] || "#f8fafc";
    return this.parent().getDropdownIcon(color);
  }

  getDriverStats(hd: DriverHeatData, driverId: string): string {
    return this.parent()?.getDriverStats(hd, driverId) ?? "";
  }

  onTeammateChange(hd: DriverHeatData, event: any) {
    const nextHeatNum = this.nextHeatNumber();
    if (this.parent() && nextHeatNum > 0) {
      this.parent().onNextHeatTeammateChange(hd, event, nextHeatNum);
    }
  }

  getLaneBackgroundColor(laneIndex: number): string {
    return this.track()?.lanes?.[laneIndex]?.background_color || "#333333";
  }

  getLaneForegroundColor(laneIndex: number): string {
    return this.track()?.lanes?.[laneIndex]?.foreground_color || "#ffffff";
  }

  trackByDriver(index: number, hd: DriverHeatData): string {
    return hd.driver?.objectId || hd.driver?.entity_id || String(index);
  }
}

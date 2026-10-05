import { CdkDrag, CdkDragHandle, CdkDropList } from "@angular/cdk/drag-drop";
import { CommonModule } from "@angular/common";
import {
  AfterViewInit,
  Component,
  ElementRef,
  inject,
  input,
  NgZone,
  OnDestroy,
  viewChild,
  viewChildren,
  ViewEncapsulation,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { RacedayGhostPacingComponent } from "@app/components/raceday/components/raceday-ghost-pacing/raceday-ghost-pacing.component";
import { RacedayLayoutUtils } from "@app/components/raceday/utils/raceday-layout.utils";
import {
  CustomOptionComponent,
  CustomSelectComponent,
} from "@app/components/shared/custom-select/custom-select.component";
import { AbsoluteWidgetNode } from "@app/models/settings";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { GhostBenchmarkType } from "@app/services/ghost-pacing.service";

@Component({
  standalone: true,
  selector: "app-raceday-lane-view",
  templateUrl: "./raceday-lane-view.component.html",
  styleUrls: ["./raceday-lane-view.component.css"],
  encapsulation: ViewEncapsulation.None,
  imports: [
    CommonModule,
    CdkDropList,
    CdkDrag,
    CdkDragHandle,
    TranslatePipe,
    FormsModule,
    RacedayGhostPacingComponent,
    CustomSelectComponent,
    CustomOptionComponent,
  ],
})
export class RacedayLaneViewComponent implements AfterViewInit, OnDestroy {
  parent = input<any>(undefined);
  widget = input<AbsoluteWidgetNode | null>(null);

  private laneViewContainer =
    viewChild<ElementRef<HTMLElement>>("laneViewContainer");
  private fitTextTargets =
    viewChildren<ElementRef<HTMLElement>>("fitTextTarget");

  private resizeObserver?: ResizeObserver;
  private mutationObserver?: MutationObserver;
  private lastWidth = 0;
  private lastHeight = 0;
  private resizeTimeout?: any;
  private mutationTimeout?: any;
  private zone = inject(NgZone);

  constructor() {}

  ngAfterViewInit() {
    if (typeof ResizeObserver !== "undefined") {
      this.resizeObserver = new ResizeObserver((entries) => {
        const entry = entries[0];
        if (entry) {
          const width = entry.contentRect.width;
          const height = entry.contentRect.height;
          if (
            Math.abs(this.lastWidth - width) < 1 &&
            Math.abs(this.lastHeight - height) < 1
          ) {
            return;
          }

          this.lastWidth = width;
          this.lastHeight = height;
        }

        if (this.resizeTimeout) {
          clearTimeout(this.resizeTimeout);
        }
        this.zone.runOutsideAngular(() => {
          this.resizeTimeout = setTimeout(() => this.fitTexts(), 10);
        });
      });
      const container = this.laneViewContainer()?.nativeElement;
      if (container) {
        this.resizeObserver.observe(container);
      }
    }

    if (typeof MutationObserver !== "undefined") {
      this.mutationObserver = new MutationObserver(() => {
        if (this.mutationTimeout) {
          clearTimeout(this.mutationTimeout);
        }
        this.zone.runOutsideAngular(() => {
          this.mutationTimeout = setTimeout(() => this.fitTexts(), 50);
        });
      });
      const container = this.laneViewContainer()?.nativeElement;
      if (container) {
        this.mutationObserver.observe(container, {
          childList: true,
          characterData: true,
          subtree: true,
        });
      }
    }
  }

  ngOnDestroy() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
    }
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
    }
    if (this.mutationTimeout) {
      clearTimeout(this.mutationTimeout);
    }
  }

  private fitTexts() {
    const targets = this.fitTextTargets()
      .map((t) => t.nativeElement)
      .filter((el) => el.clientHeight > 0 && el.clientWidth > 0);
    if (!targets.length) return;

    // Reset all to natural size
    targets.forEach((el) => {
      el.style.removeProperty("--text-fit-scale");
    });

    // We only scale text containers (they don't contain images usually, but we check for text nodes or span children)
    // Actually, just check if it overflows.
    for (const el of targets) {
      // If it contains an image, scaling font-size won't fix overflow, skip it to avoid thrashing.
      if (el.querySelector("img")) continue;

      const textEl =
        (el.querySelector(".teammate-display-name") as HTMLElement) || el;

      const checkOverflow = (element: HTMLElement) => {
        return (
          element.scrollHeight > element.clientHeight + 1 ||
          element.scrollWidth > element.clientWidth + 1 ||
          (element.firstElementChild &&
            element.firstElementChild.scrollHeight >
              element.clientHeight + 1) ||
          (element.firstElementChild &&
            element.firstElementChild.scrollWidth > element.clientWidth + 1)
        );
      };

      if (checkOverflow(textEl)) {
        let minScale = 0.1;
        let maxScale = 1.0;
        let bestScale = 1.0;

        // Binary search for the best scale factor
        for (let i = 0; i < 6; i++) {
          const scale = (minScale + maxScale) / 2;
          el.style.setProperty("--text-fit-scale", scale.toString());

          if (checkOverflow(textEl)) {
            maxScale = scale; // still too big
          } else {
            bestScale = scale; // fits, try bigger
            minScale = scale;
          }
        }
        el.style.setProperty("--text-fit-scale", bestScale.toString());
      }
    }
  }

  getColumnLabel(col: any): string {
    const customLabels = this.widget()?.customSettings?.["columnLabels"];
    if (customLabels && customLabels[col.propertyName] !== undefined) {
      return customLabels[col.propertyName];
    }
    return this.parent().getColumnLabel(col);
  }

  getPacingBenchmarkType(property?: string): GhostBenchmarkType {
    switch (property) {
      case "ghostPacingPB":
        return "PERSONAL_BEST";
      case "ghostPacingPersonalAvg":
        return "PERSONAL_AVG";
      case "ghostPacingPersonalMedian":
        return "PERSONAL_MEDIAN";
      case "ghostPacingLeaderAvg":
        return "HEAT_LEADER_AVG";
      case "ghostPacingLeaderMedian":
        return "HEAT_LEADER_MEDIAN";
      case "ghostPacingLeaderBest":
        return "HEAT_LEADER";
      case "ghostPacing":
      default:
        return "LANE_RECORD";
    }
  }

  isPacingProperty(property?: string): boolean {
    return RacedayLayoutUtils.isPacingProperty(property || "");
  }

  getPacingDecimalPlaces(col?: any, entry?: any): number {
    const s =
      this.widget()?.customSettings ||
      (this.parent() as any)?.laneViewWidgetSettings ||
      (this.parent() as any)?.currentRacedayLayout?.widgets?.find?.(
        (w: any) => w.widgetType === "lane-view",
      )?.customSettings;
    const customColDecimals =
      s?.["columnDecimals"] || s?.["columnDecimalPlaces"];
    const colKey = typeof col === "string" ? col : col?.propertyName;
    const propKey = typeof entry === "string" ? entry : entry?.property;
    const isPacing =
      this.isPacingProperty(propKey) ||
      this.isPacingProperty(colKey) ||
      Boolean(colKey && colKey.startsWith("ghostPacing")) ||
      Boolean(propKey && propKey.startsWith("ghostPacing"));

    if (customColDecimals) {
      if (
        colKey &&
        customColDecimals[colKey] !== undefined &&
        customColDecimals[colKey] !== null &&
        customColDecimals[colKey] !== ""
      ) {
        return Math.min(3, Math.max(0, Number(customColDecimals[colKey])));
      }
      if (
        propKey &&
        customColDecimals[propKey] !== undefined &&
        customColDecimals[propKey] !== null &&
        customColDecimals[propKey] !== ""
      ) {
        return Math.min(3, Math.max(0, Number(customColDecimals[propKey])));
      }
      if (colKey && colKey.includes("_")) {
        for (const subKey of colKey.split("_")) {
          if (
            customColDecimals[subKey] !== undefined &&
            customColDecimals[subKey] !== null &&
            customColDecimals[subKey] !== ""
          ) {
            return Math.min(3, Math.max(0, Number(customColDecimals[subKey])));
          }
        }
      }
      if (isPacing) {
        for (const k of Object.keys(customColDecimals)) {
          if (
            k.startsWith("ghostPacing") &&
            customColDecimals[k] !== undefined &&
            customColDecimals[k] !== null &&
            customColDecimals[k] !== ""
          ) {
            return Math.min(3, Math.max(0, Number(customColDecimals[k])));
          }
        }
      }
    }

    const isInset = entry?.anchor && !entry.anchor.startsWith("center-");
    if (isInset && s?.["insetTimeDecimalPlaces"] !== undefined) {
      return Math.min(3, Math.max(0, Number(s["insetTimeDecimalPlaces"])));
    }
    if (s?.["timeDecimalPlaces"] !== undefined) {
      return Math.min(3, Math.max(0, Number(s["timeDecimalPlaces"])));
    }
    return 3;
  }

  isLaneEmpty(hd: any): boolean {
    if (this.parent()?.isEmptyDriver) {
      return this.parent().isEmptyDriver(hd);
    }
    if (this.parent()?.isLaneOccupied) {
      return !this.parent().isLaneOccupied(hd);
    }
    return false;
  }

  isPacingActive(entry: any, hd: any): boolean {
    return this.isPacingProperty(entry?.property) && !this.isLaneEmpty(hd);
  }

  isSoloCenterPacing(col: any, entry: any, hd?: any): boolean {
    if (hd && this.isLaneEmpty(hd)) return false;
    if (!entry || entry.anchor !== "center-center") return false;
    if (!this.isPacingProperty(entry.property)) return false;
    const entries = this.parent()?.getLayoutEntries?.(col);
    return Boolean(entries && entries.length === 1);
  }

  isNameProperty(property?: string): boolean {
    if (!property) return false;
    const baseKey = property.split("_")[0];
    if (this.parent()?.isNameProperty) {
      return this.parent().isNameProperty(property);
    }
    return baseKey === "driver.name" || baseKey === "driver.nickname";
  }

  isTeamProperty(property?: string): boolean {
    if (!property) return false;
    const baseKey = property.split("_")[0];
    return baseKey === "participant.team.name";
  }

  isTeamOrNameProperty(property?: string): boolean {
    return this.isNameProperty(property) || this.isTeamProperty(property);
  }

  hasNameProperty(col: any): boolean {
    if (!col) return false;
    if (this.isNameProperty(col.propertyName)) return true;
    if (col.layout) {
      return Object.values(col.layout).some((p: any) => this.isNameProperty(p));
    }
    const entries = this.parent()?.getLayoutEntries?.(col);
    if (entries && Array.isArray(entries)) {
      return entries.some((e: any) => this.isNameProperty(e?.property));
    }
    return false;
  }

  shouldShowTeammateSelect(col: any, entry: any, hd: any): boolean {
    if (!hd || !entry?.property) return false;
    const p = this.parent();
    if (!p) return false;
    if (!p.isTeam?.(hd)) return false;

    // Driver name or nickname always provides the team selector
    if (this.isNameProperty(entry.property)) {
      return true;
    }

    // Team name only provides the selector if the column does not have a name/nickname
    // and this entry is not an inset (i.e. it is center-center)
    if (this.isTeamProperty(entry.property)) {
      if (this.hasNameProperty(col)) {
        return false;
      }
      if (entry.anchor && entry.anchor !== "center-center") {
        return false;
      }
      return true;
    }

    return false;
  }

  getTeammateDisplayName(hd: any, property?: string): string {
    if (!hd || !property) return "";
    const baseKey = property.split("_")[0];
    if (baseKey === "driver.nickname") {
      return (
        hd.actualDriver?.nickname ||
        hd.actualDriver?.name ||
        hd.driver?.nickname ||
        hd.driver?.name ||
        ""
      );
    }
    if (baseKey === "participant.team.name") {
      return (
        hd.participant?.team?.name ||
        hd.driver?.team?.name ||
        hd.actualDriver?.name ||
        hd.driver?.name ||
        ""
      );
    }
    return hd.actualDriver?.name || hd.driver?.name || "";
  }
}

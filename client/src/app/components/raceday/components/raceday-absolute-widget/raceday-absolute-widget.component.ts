import { DragDropModule } from "@angular/cdk/drag-drop";
import { CommonModule, NgComponentOutlet } from "@angular/common";
import {
  AfterViewChecked,
  ChangeDetectorRef,
  Component,
  ElementRef,
  inject,
  input,
  OnDestroy,
  OnInit,
  Type,
  viewChild,
  ViewEncapsulation,
} from "@angular/core";
import { Subscription } from "rxjs";
import { RacedayActionButtonComponent } from "@app/components/raceday/components/raceday-action-button/raceday-action-button.component";
import { RacedayBrandingComponent } from "@app/components/raceday/components/raceday-branding/raceday-branding.component";
import { RacedayCountdownComponent } from "@app/components/raceday/components/raceday-countdown/raceday-countdown.component";
import { RacedayEventNameComponent } from "@app/components/raceday/components/raceday-event-name/raceday-event-name.component";
import { RacedayFlagComponent } from "@app/components/raceday/components/raceday-flag/raceday-flag.component";
import { RacedayGroupLeaderboardComponent } from "@app/components/raceday/components/raceday-group-leaderboard/raceday-group-leaderboard.component";
import { RacedayHeatInfoComponent } from "@app/components/raceday/components/raceday-heat-info/raceday-heat-info.component";
import { RacedayHeatListComponent } from "@app/components/raceday/components/raceday-heat-list/raceday-heat-list.component";
import { RacedayImageComponent } from "@app/components/raceday/components/raceday-image/raceday-image.component";
import { RacedayLabelComponent } from "@app/components/raceday/components/raceday-label/raceday-label.component";
import { RacedayLaneColumnComponent } from "@app/components/raceday/components/raceday-lane-column/raceday-lane-column.component";
import { RacedayLaneViewComponent } from "@app/components/raceday/components/raceday-lane-view/raceday-lane-view.component";
import { RacedayLeaderboardComponent } from "@app/components/raceday/components/raceday-leaderboard/raceday-leaderboard.component";
import { RacedayMenuBarComponent } from "@app/components/raceday/components/raceday-menu-bar/raceday-menu-bar.component";
import { RacedayNextHeatComponent } from "@app/components/raceday/components/raceday-next-heat/raceday-next-heat.component";
import { RacedayOnDeckComponent } from "@app/components/raceday/components/raceday-on-deck/raceday-on-deck.component";
import { RacedayQrComponent } from "@app/components/raceday/components/raceday-qr/raceday-qr.component";
import { RacedayRaceNameComponent } from "@app/components/raceday/components/raceday-race-name/raceday-race-name.component";
import { RacedayRecordsComponent } from "@app/components/raceday/components/raceday-records/raceday-records.component";
import { RacedaySeasonLeaderboardComponent } from "@app/components/raceday/components/raceday-season-leaderboard/raceday-season-leaderboard.component";
import { RacedaySeasonNameComponent } from "@app/components/raceday/components/raceday-season-name/raceday-season-name.component";
import { RacedaySeasonRaceLeaderboardComponent } from "@app/components/raceday/components/raceday-season-race-leaderboard/raceday-season-race-leaderboard.component";
import { RacedayTimerComponent } from "@app/components/raceday/components/raceday-timer/raceday-timer.component";
import { RacedayTrackNameComponent } from "@app/components/raceday/components/raceday-track-name/raceday-track-name.component";
import { LaneGridAnimationHelper } from "@app/components/raceday/utils/lane-grid-animation.helper";
import { AbsoluteWidgetNode } from "@app/models/settings";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { CustomWidgetService } from "@app/services/custom-widget.service";
import { LoggerService } from "@app/services/logger.service";

@Component({
  standalone: true,
  selector: "app-raceday-absolute-widget",
  templateUrl: "./raceday-absolute-widget.component.html",
  styleUrls: ["./raceday-absolute-widget.component.css"],
  encapsulation: ViewEncapsulation.None,
  imports: [
    CommonModule,
    NgComponentOutlet,
    DragDropModule,
    TranslatePipe,
    RacedayMenuBarComponent,
    RacedayRaceNameComponent,
    RacedayEventNameComponent,
    RacedaySeasonNameComponent,
    RacedayHeatInfoComponent,
    RacedayTrackNameComponent,
    RacedayBrandingComponent,
    RacedayQrComponent,
    RacedayFlagComponent,
    RacedayTimerComponent,
    RacedayRecordsComponent,
    RacedayLeaderboardComponent,
    RacedayGroupLeaderboardComponent,
    RacedaySeasonLeaderboardComponent,
    RacedaySeasonRaceLeaderboardComponent,
    RacedayLaneViewComponent,
    RacedayLaneColumnComponent,
    RacedayOnDeckComponent,
    RacedayNextHeatComponent,
    RacedayHeatListComponent,
    RacedayImageComponent,
    RacedayLabelComponent,
    RacedayActionButtonComponent,
    RacedayCountdownComponent,
  ],
})
export class RacedayAbsoluteWidgetComponent
  implements OnInit, OnDestroy, AfterViewChecked
{
  widget = input.required<AbsoluteWidgetNode>();
  parentComponent = input<any>(undefined);
  isCustomizing = input<boolean>(false);
  selectedWidgetId = input<string | null>(null);
  isCountdownPreviewActive = input<boolean>(false);
  gridContentOffset = input<{ x: number; y: number } | null>(null);

  wrapperRef = viewChild<ElementRef<HTMLElement>>("widgetWrapper");
  isGridAnimating = false;
  private lastAnimatedEntityId: string | null = null;
  private gridAnimTimer?: any;

  private customWidgetService = inject(CustomWidgetService, { optional: true });
  private logger = inject(LoggerService, { optional: true });
  private widgetSub?: Subscription;

  get isSelected(): boolean {
    return this.selectedWidgetId() === this.widget().id;
  }

  get isCountdownWidget(): boolean {
    return this.widget().widgetType === "countdown";
  }

  get isCountdownActive(): boolean {
    if (!this.isCountdownWidget) {
      return true;
    }
    if (this.isCustomizing()) {
      return true;
    }
    return !!this.parentComponent()?.showCountdownOverlay;
  }

  get isCountdownGhost(): boolean {
    if (!this.isCustomizing() || !this.isCountdownWidget) {
      return false;
    }
    return !this.isSelected && !this.isCountdownPreviewActive();
  }

  get isGridMirrored(): boolean {
    const s = this.widget().customSettings;
    if (s?.["mirrorRows"] === false) return false;
    const session = this.parentComponent()?.gridSession?.();
    if (!session || session.mirrorRows === false) return false;
    if (s?.["gridId"] !== session.gridId) return false;

    const masterId = s?.["gridMasterId"];
    if (masterId) {
      const allWidgets = this.parentComponent()?.layout?.widgets || [];
      const masterExists = allWidgets.some((w: any) => w.id === masterId);
      if (!masterExists) {
        return false;
      }
    }

    return (
      Number(s?.["gridLane"] ?? s?.["targetIndex"]) !== session.sourceLaneIndex
    );
  }

  get isWidgetInGrid(): boolean {
    return Boolean(this.widget().customSettings?.["gridId"]);
  }

  get gridDirection(): "vertical" | "horizontal" {
    const s = this.widget().customSettings;
    const session = this.parentComponent()?.gridSession?.();
    if (session && session.gridId === s?.["gridId"]) {
      return session.direction || "vertical";
    }
    return s?.["gridDirection"] || "vertical";
  }

  get isHeightAutoCalculated(): boolean {
    return this.isWidgetInGrid && this.gridDirection === "vertical";
  }

  get isWidthAutoCalculated(): boolean {
    return this.isWidgetInGrid && this.gridDirection === "horizontal";
  }

  get computedZIndex(): number {
    const w = this.widget();
    if (w.widgetType === "countdown") {
      return Math.max(100000, (w.zIndex || 2000) + 100000);
    }
    if (!this.isCustomizing() && w.widgetType === "menu-bar") {
      return 99999;
    }
    return w.zIndex || 100;
  }

  get widgetLabel(): string {
    const w = this.widget();
    if (w.widgetType === "lane-column") {
      const s = w.customSettings || {};
      const col = ((s["customLabel"] || s["columnKey"] || "") as string)
        .replace(/^driver\./, "")
        .replace(/([A-Z])/g, " $1")
        .trim()
        .toUpperCase();
      if (s["isHeaderWidget"]) {
        return col ? `HEADER · ${col}` : "HEADER";
      }
      const idx =
        (s["gridLane"] != null
          ? s["gridLane"]
          : s["targetIndex"] != null
            ? s["targetIndex"]
            : 0) + 1;
      const mode = s["bindingMode"] || "lane";
      const prefix = mode === "position" ? `P${idx}` : `L${idx}`;
      return col ? `${prefix} · ${col}` : prefix;
    }
    return w.widgetType;
  }

  get isSameGridColumn(): boolean {
    if (this.isSelected) return false;
    const parent = this.parentComponent();
    if (!parent?.isLayoutCustomizing) return false;
    const sel = parent.selectedWidget;
    if (!sel || !sel.customSettings?.["gridId"]) return false;
    const myS = this.widget().customSettings;
    if (myS?.["gridId"] !== sel.customSettings["gridId"]) return false;
    return (
      (myS?.["columnKey"] || "") === (sel.customSettings["columnKey"] || "")
    );
  }

  get isSameGridRow(): boolean {
    if (this.isSelected) return false;
    const parent = this.parentComponent();
    if (!parent?.isLayoutCustomizing) return false;
    const sel = parent.selectedWidget;
    if (!sel || !sel.customSettings?.["gridId"]) return false;
    const myS = this.widget().customSettings;
    if (myS?.["gridId"] !== sel.customSettings["gridId"]) return false;
    if (sel.customSettings["isHeaderWidget"]) {
      return !!myS?.["isHeaderWidget"];
    }
    if (myS?.["isHeaderWidget"]) return false;
    const myRow = myS?.["gridLane"] ?? myS?.["targetIndex"];
    const selRow =
      sel.customSettings["gridLane"] ?? sel.customSettings["targetIndex"];
    return myRow != null && selRow != null && myRow === selRow;
  }

  private isResizing = false;
  private resizeStartWidth = 0;
  private resizeStartHeight = 0;
  private resizeStartX = 0;
  private resizeStartY = 0;
  private startPointerX = 0;
  private startPointerY = 0;

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    if (this.customWidgetService?.customWidgets$) {
      this.widgetSub = this.customWidgetService.customWidgets$.subscribe(() => {
        this.cdr.markForCheck();
      });
    }
    const type = this.widget()?.widgetType;
    if (
      this.isCustomWidget(type) &&
      this.customWidgetService &&
      this.customWidgetService.getCustomWidgets().length === 0
    ) {
      this.logger?.info(
        `RacedayAbsoluteWidget: Custom widget '${type}' requested but 0 widgets currently loaded in CustomWidgetService. Triggering reload...`,
      );
      this.customWidgetService.reloadCustomWidgets().catch((err) => {
        this.logger?.warn(
          "RacedayAbsoluteWidget: Error reloading custom widgets",
          err,
        );
      });
    }
  }

  ngAfterViewChecked(): void {
    this.checkGridAnimation();
  }

  ngOnDestroy() {
    this.widgetSub?.unsubscribe();
    if (this.gridAnimTimer) {
      clearTimeout(this.gridAnimTimer);
      this.gridAnimTimer = undefined;
    }
    const el = this.wrapperRef()?.nativeElement;
    el?.classList.remove("grid-animating");
  }

  private calculateResizedBounds(
    handle: string,
    deltaX: number,
    deltaY: number,
    baseWidth: number,
    baseHeight: number,
  ): { x: number; y: number; width: number; height: number } {
    let newW = this.resizeStartWidth;
    let newH = this.resizeStartHeight;
    let newX = this.resizeStartX;
    let newY = this.resizeStartY;

    if (handle.includes("e")) newW += deltaX;
    if (handle.includes("w")) {
      newW -= deltaX;
      newX += deltaX;
    }
    if (handle.includes("s")) newH += deltaY;
    if (handle.includes("n")) {
      newH -= deltaY;
      newY += deltaY;
    }

    if (newW < 50) {
      if (handle.includes("w")) newX -= 50 - newW;
      newW = 50;
    }
    if (newH < 50) {
      if (handle.includes("n")) newY -= 50 - newH;
      newH = 50;
    }

    if (newX < 0) {
      if (handle.includes("w")) newW += newX;
      newX = 0;
    }
    if (newY < 0) {
      if (handle.includes("n")) newH += newY;
      newY = 0;
    }
    if (newX + newW > baseWidth) {
      newW = baseWidth - newX;
    }
    if (newY + newH > baseHeight) {
      newH = baseHeight - newY;
    }

    if (newW < 50) {
      if (handle.includes("w")) newX -= 50 - newW;
      newW = 50;
    }
    if (newH < 50) {
      if (handle.includes("n")) newY -= 50 - newH;
      newH = 50;
    }

    if (this.isHeightAutoCalculated) {
      newH = this.resizeStartHeight;
      newY = this.resizeStartY;
    }
    if (this.isWidthAutoCalculated) {
      newW = this.resizeStartWidth;
      newX = this.resizeStartX;
    }

    let snapped = { x: newX, y: newY, w: newW, h: newH };
    if (this.parentComponent().snapToEdges) {
      snapped = this.parentComponent().snapToEdges(
        newX,
        newY,
        newW,
        newH,
        this.widget().id,
        handle,
        baseWidth,
        baseHeight,
      );
    }

    const clampedX = this.isWidthAutoCalculated
      ? this.resizeStartX
      : Math.max(0, Math.min(baseWidth - 50, snapped.x));
    const clampedY = this.isHeightAutoCalculated
      ? this.resizeStartY
      : Math.max(0, Math.min(baseHeight - 50, snapped.y));
    const clampedW = this.isWidthAutoCalculated
      ? this.resizeStartWidth
      : Math.max(50, Math.min(baseWidth - clampedX, snapped.w));
    const clampedH = this.isHeightAutoCalculated
      ? this.resizeStartHeight
      : Math.max(50, Math.min(baseHeight - clampedY, snapped.h));

    return {
      x: clampedX,
      y: clampedY,
      width: clampedW,
      height: clampedH,
    };
  }

  onResizeStart(event: PointerEvent, handle: string) {
    if (!this.isCustomizing() || this.isGridMirrored) return;
    event.preventDefault();
    event.stopPropagation();

    this.isResizing = true;
    this.resizeStartWidth = this.widget().width;
    this.resizeStartHeight = this.widget().height;
    this.resizeStartX = this.widget().x;
    this.resizeStartY = this.widget().y;
    this.startPointerX = event.clientX;
    this.startPointerY = event.clientY;

    const onPointerMove = (moveEvent: PointerEvent) => {
      if (!this.isResizing) return;

      const scale = this.parentComponent().visualScale || 1;
      const deltaX = (moveEvent.clientX - this.startPointerX) / scale;
      const deltaY = (moveEvent.clientY - this.startPointerY) / scale;
      const baseWidth = this.parentComponent().layout?.baseWidth || 1920;
      const baseHeight = this.parentComponent().layout?.baseHeight || 1080;

      const bounds = this.calculateResizedBounds(
        handle,
        deltaX,
        deltaY,
        baseWidth,
        baseHeight,
      );

      this.widget().x = bounds.x;
      this.widget().y = bounds.y;
      this.widget().width = bounds.width;
      this.widget().height = bounds.height;

      this.cdr.detectChanges();
    };

    const onPointerUp = () => {
      this.isResizing = false;
      document.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("pointerup", onPointerUp);
      if (this.parentComponent().gridSession?.()) {
        const session = this.parentComponent().gridSession();
        if (
          this.widget().customSettings?.["gridId"] === session.gridId &&
          Number(this.widget().customSettings?.["gridLane"]) ===
            session.sourceLaneIndex
        ) {
          this.parentComponent().onMasterWidgetModified?.(this.widget());
        }
      }
      if (this.parentComponent().layoutChanged) {
        this.parentComponent().layoutChanged.emit(
          this.parentComponent().layout,
        );
      }
    };

    document.addEventListener("pointermove", onPointerMove);
    document.addEventListener("pointerup", onPointerUp);
  }

  // Handle dragging manually to support snapping better than cdkDrag might out of the box
  onDragStart(event: PointerEvent) {
    if (!this.isCustomizing() || this.isGridMirrored) return;
    // Don't drag if clicking a resize handle
    if ((event.target as HTMLElement).classList.contains("resize-handle"))
      return;
    if ((event.target as HTMLElement).tagName === "BUTTON") return;

    event.preventDefault();
    event.stopPropagation();

    this.bringToFront();

    const scale = this.parentComponent().visualScale || 1;
    const startX = event.clientX;
    const startY = event.clientY;
    const initialWidgetX = this.widget().x;
    const initialWidgetY = this.widget().y;

    const onPointerMove = (moveEvent: PointerEvent) => {
      const deltaX = (moveEvent.clientX - startX) / scale;
      const deltaY = (moveEvent.clientY - startY) / scale;

      let newX = initialWidgetX + deltaX;
      let newY = initialWidgetY + deltaY;

      const baseWidth = this.parentComponent().layout?.baseWidth || 1920;
      const baseHeight = this.parentComponent().layout?.baseHeight || 1080;
      const w = this.widget().width;
      const h = this.widget().height;

      if (this.isHeightAutoCalculated) {
        newY = initialWidgetY;
      }
      if (this.isWidthAutoCalculated) {
        newX = initialWidgetX;
      }

      let snapped = {
        x: newX,
        y: newY,
        w: w,
        h: h,
      };
      if (this.parentComponent().snapToEdges) {
        snapped = this.parentComponent().snapToEdges(
          newX,
          newY,
          w,
          h,
          this.widget().id,
          "all",
          baseWidth,
          baseHeight,
        );
      }

      this.widget().x = this.isWidthAutoCalculated
        ? initialWidgetX
        : Math.max(0, Math.min(baseWidth - w, snapped.x));
      this.widget().y = this.isHeightAutoCalculated
        ? initialWidgetY
        : Math.max(0, Math.min(baseHeight - h, snapped.y));
      this.cdr.detectChanges();
    };

    const onPointerUp = () => {
      document.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("pointerup", onPointerUp);
      if (this.parentComponent().gridSession?.()) {
        const session = this.parentComponent().gridSession();
        if (
          this.widget().customSettings?.["gridId"] === session.gridId &&
          Number(this.widget().customSettings?.["gridLane"]) ===
            session.sourceLaneIndex
        ) {
          this.parentComponent().onMasterWidgetModified?.(this.widget());
        }
      }
      if (this.parentComponent().layoutChanged) {
        this.parentComponent().layoutChanged.emit(
          this.parentComponent().layout,
        );
      }
    };

    document.addEventListener("pointermove", onPointerMove);
    document.addEventListener("pointerup", onPointerUp);
  }

  removeWidget(event: Event) {
    event.stopPropagation();
    if (this.parentComponent().removeWidget) {
      this.parentComponent().removeWidget(this.widget().id);
    }
  }

  bringToFront() {
    if (this.parentComponent() && this.parentComponent().bringToFront) {
      const masterId = this.widget().customSettings?.["gridMasterId"];
      const allWidgets = this.parentComponent()?.layout?.widgets || [];
      const masterExists = masterId
        ? allWidgets.some((w: any) => w.id === masterId)
        : false;
      if (this.isGridMirrored && masterId && masterExists) {
        this.parentComponent().bringToFront(masterId);
      } else {
        this.parentComponent().bringToFront(this.widget().id);
      }
    }
  }

  isCustomWidget(type: string | undefined): boolean {
    if (!type) return false;
    if (
      this.customWidgetService &&
      typeof this.customWidgetService.isCustomWidget === "function"
    ) {
      return this.customWidgetService.isCustomWidget(type);
    }
    return type.startsWith("custom:");
  }

  shouldRenderAsLaneColumn(widget: AbsoluteWidgetNode): boolean {
    if (widget.widgetType === "lane-column") return true;
    if (this.isCustomWidget(widget.widgetType)) {
      const s = widget.customSettings;
      return Boolean(
        s?.["gridId"] ||
        s?.["bindingMode"] !== undefined ||
        s?.["gridLane"] !== undefined ||
        s?.["targetIndex"] !== undefined ||
        (s?.["insets"] && Object.values(s["insets"]).some((v) => Boolean(v))),
      );
    }
    return false;
  }

  getCustomWidgetComponent(type: string | undefined): Type<any> | null {
    if (
      this.customWidgetService &&
      typeof this.customWidgetService.getWidgetComponent === "function"
    ) {
      return this.customWidgetService.getWidgetComponent(type) ?? null;
    }
    return null;
  }

  getCustomWidgetName(type: string | undefined): string {
    if (
      this.customWidgetService &&
      typeof this.customWidgetService.getWidgetDefinition === "function"
    ) {
      const def = this.customWidgetService.getWidgetDefinition(type);
      if (def?.manifest?.name) {
        return def.manifest.name;
      }
    }
    if (type?.startsWith("custom:")) {
      return type.substring("custom:".length);
    }
    return type || "";
  }

  getCustomWidgetError(type: string | undefined): string | undefined {
    if (
      this.customWidgetService &&
      typeof this.customWidgetService.getWidgetDefinition === "function"
    ) {
      const def = this.customWidgetService.getWidgetDefinition(type);
      return def?.error;
    }
    return undefined;
  }

  private cachedCustomInputs?: {
    widget: any;
    parent: any;
    isCustomizing: boolean;
  };
  private lastCustomWidgetRef?: any;
  private lastCustomParentRef?: any;
  private lastCustomizingFlag?: boolean;

  getCustomWidgetInputs() {
    const w = this.widget();
    const p = this.parentComponent();
    const c = this.isCustomizing();
    if (
      !this.cachedCustomInputs ||
      this.lastCustomWidgetRef !== w ||
      this.lastCustomParentRef !== p ||
      this.lastCustomizingFlag !== c
    ) {
      this.lastCustomWidgetRef = w;
      this.lastCustomParentRef = p;
      this.lastCustomizingFlag = c;
      this.cachedCustomInputs = {
        widget: w,
        parent: p,
        isCustomizing: c,
      };
    }
    return this.cachedCustomInputs;
  }

  private checkGridAnimation(): void {
    if (this.isCustomizing()) {
      this.lastAnimatedEntityId = null;
      return;
    }
    const w = this.widget();
    if (!w || w.widgetType !== "lane-column") return;
    const s = w.customSettings;
    if (!s || !s["gridId"] || s["isHeaderWidget"]) return;
    if (s["sortByBindingMode"] === false) return;
    const mode = s["bindingMode"];
    if (mode !== "position" && mode !== "overallPosition") return;

    const entityId = LaneGridAnimationHelper.resolveEntityId(
      w,
      this.parentComponent(),
    );
    if (!entityId) return;

    if (this.lastAnimatedEntityId === entityId) {
      return;
    }

    const prevEntity = this.lastAnimatedEntityId;
    this.lastAnimatedEntityId = entityId;

    if (prevEntity !== null) {
      const delta = LaneGridAnimationHelper.getShiftDelta(
        w,
        this.parentComponent(),
        this.isCustomizing(),
      );
      if (delta) {
        this.applyShiftAnimation(delta.deltaX, delta.deltaY);
      }
    } else {
      LaneGridAnimationHelper.recordPosition(
        w,
        entityId,
        this.parentComponent()?.heat?.objectId || null,
      );
    }
  }

  private applyShiftAnimation(deltaX: number, deltaY: number): void {
    const el = this.wrapperRef()?.nativeElement;
    if (!el) return;

    if (this.gridAnimTimer) {
      clearTimeout(this.gridAnimTimer);
      this.gridAnimTimer = undefined;
    }

    this.isGridAnimating = true;
    el.classList.add("grid-animating");
    el.style.transition = "none";
    el.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
    void el.offsetHeight;
    el.style.transition = "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)";
    el.style.transform = "translate(0px, 0px)";

    this.gridAnimTimer = setTimeout(() => {
      if (el) {
        el.classList.remove("grid-animating");
        el.style.transition = "";
        el.style.transform = "";
      }
      this.isGridAnimating = false;
      this.gridAnimTimer = undefined;
    }, 300);
  }
}

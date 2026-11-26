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
import { isOverallOrSeedDataSource } from "@app/components/raceday/components/raceday-lane-column/raceday-lane-column-driver.helper";
import { RacedayLaneViewComponent } from "@app/components/raceday/components/raceday-lane-view/raceday-lane-view.component";
import { RacedayLeaderboardComponent } from "@app/components/raceday/components/raceday-leaderboard/raceday-leaderboard.component";
import { RacedayMenuBarComponent } from "@app/components/raceday/components/raceday-menu-bar/raceday-menu-bar.component";
import { RacedayNextHeatComponent } from "@app/components/raceday/components/raceday-next-heat/raceday-next-heat.component";
import { RacedayOnDeckComponent } from "@app/components/raceday/components/raceday-on-deck/raceday-on-deck.component";
import { RacedayProgressGaugeComponent } from "@app/components/raceday/components/raceday-progress-gauge/raceday-progress-gauge.component";
import { RacedayQrComponent } from "@app/components/raceday/components/raceday-qr/raceday-qr.component";
import { RacedayRaceNameComponent } from "@app/components/raceday/components/raceday-race-name/raceday-race-name.component";
import { RacedayRecordsComponent } from "@app/components/raceday/components/raceday-records/raceday-records.component";
import { RacedaySeasonLeaderboardComponent } from "@app/components/raceday/components/raceday-season-leaderboard/raceday-season-leaderboard.component";
import { RacedaySeasonNameComponent } from "@app/components/raceday/components/raceday-season-name/raceday-season-name.component";
import { RacedaySeasonRaceLeaderboardComponent } from "@app/components/raceday/components/raceday-season-race-leaderboard/raceday-season-race-leaderboard.component";
import { RacedayTimerComponent } from "@app/components/raceday/components/raceday-timer/raceday-timer.component";
import { RacedayTrackNameComponent } from "@app/components/raceday/components/raceday-track-name/raceday-track-name.component";
import { LaneGridAnimationHelper } from "@app/components/raceday/utils/lane-grid-animation.helper";
import { LaneGridReplicationHelper } from "@app/components/raceday/utils/lane-grid-replication.helper";
import { LIFTED_Z } from "@app/components/raceday/utils/layer-order.utils";
import {
  GroupStart,
  movableIds,
  moveGroup,
} from "@app/components/ui-editor/multi-select.utils";
import { getRecordLabelField } from "@app/models/record-label-field";
import { AbsoluteWidgetNode } from "@app/models/settings";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { CustomWidgetService } from "@app/services/custom-widget.service";
import { LoggerService } from "@app/services/logger.service";
import { TranslationService } from "@app/services/translation.service";
import { resolveCustomWidgetName } from "@app/utils/custom-widget-name.utils";
import { resolveWidgetBorderStyles } from "@app/utils/widget-border.utils";
import { shadowFor, withOpacity } from "@app/utils/widget-style.utils";

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
    RacedayProgressGaugeComponent,
  ],
})
export class RacedayAbsoluteWidgetComponent
  implements OnInit, OnDestroy, AfterViewChecked
{
  widget = input.required<AbsoluteWidgetNode>();
  parentComponent = input<any>(undefined);
  isCustomizing = input<boolean>(false);
  selectedWidgetId = input<string | null>(null);
  /** Layout Editor multi-select (phase 4c-1): every selected id, main first. */
  selectedWidgetIds = input<string[]>([]);
  isCountdownPreviewActive = input<boolean>(false);
  gridContentOffset = input<{ x: number; y: number } | null>(null);
  showCountdownOverlay = input<boolean>(false);
  countdownLamps = input<any[]>([]);

  wrapperRef = viewChild<ElementRef<HTMLElement>>("widgetWrapper");
  isGridAnimating = false;
  private lastAnimatedEntityId: string | null = null;
  private gridAnimTimer?: any;

  private customWidgetService = inject(CustomWidgetService, { optional: true });
  private logger = inject(LoggerService, { optional: true });
  private translationService = inject(TranslationService, { optional: true });
  private widgetSub?: Subscription;

  get isSelected(): boolean {
    return this.selectedWidgetId() === this.widget().id;
  }

  get labelRecordValue(): string | number | undefined {
    const field = getRecordLabelField(
      this.widget().customSettings?.["recordField"],
    );
    return field ? this.parentComponent()?.[field.key] : undefined;
  }

  /** Selected along with others, but not the main widget (phase 4c-1). */
  get isAlsoSelected(): boolean {
    return (
      !this.isSelected &&
      (this.selectedWidgetIds() || []).includes(this.widget().id)
    );
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
    return (
      this.showCountdownOverlay() ||
      !!this.parentComponent()?.showCountdownOverlay
    );
  }

  get isCountdownGhost(): boolean {
    if (!this.isCustomizing() || !this.isCountdownWidget) {
      return false;
    }
    return !this.isSelected && !this.isCountdownPreviewActive();
  }

  get effectiveBackgroundColor(): string | null {
    const color =
      this.widget()?.customSettings?.["backgroundColor"] ||
      this.widget()?.backgroundColor ||
      null;
    return withOpacity(
      color,
      this.widget()?.customSettings?.["backgroundOpacity"],
    );
  }

  /** The widget's shadow setting as CSS (none for the Countdown, which is see-through). */
  get effectiveShadow(): string | null {
    if (this.isCountdownWidget) return null;
    return shadowFor(this.widget()?.customSettings?.["shadow"]);
  }

  get borderStyles() {
    return resolveWidgetBorderStyles(
      this.widget()?.widgetType,
      this.widget()?.customSettings,
    );
  }

  get hasWidgetBorder(): boolean {
    return this.borderStyles.hasBorder;
  }
  get isEditorMode(): boolean {
    if (this.isCustomizing()) return true;
    const parent = this.parentComponent();
    return Boolean(
      (typeof parent?.isUIEditorMode === "function"
        ? parent.isUIEditorMode()
        : parent?.isUIEditorMode) || parent?.isLayoutCustomizing,
    );
  }

  get isFuelWidgetHidden(): boolean {
    if (this.isEditorMode) return false;

    const parent = this.parentComponent();
    const w = this.widget();
    if (
      w?.widgetType === "progress-gauge" &&
      w?.customSettings?.["gaugeType"] === "fuel"
    ) {
      if (typeof parent?.isFuelRace === "function") {
        return !parent.isFuelRace();
      }
      if (typeof parent?.isFuelRace === "boolean") {
        return !parent.isFuelRace;
      }
      const race = parent?.race || parent?.raceService?.getRace?.();
      const track = parent?.track || race?.track;
      if (race) {
        const isDigital =
          typeof track?.hasDigitalFuel === "function"
            ? track.hasDigitalFuel()
            : !!(track?.has_digital_fuel || track?.hasDigitalFuel);
        const fuelOptions = isDigital
          ? race.digital_fuel_options || race.digitalFuelOptions
          : race.fuel_options || race.fuelOptions;
        return !(
          fuelOptions?.enabled ||
          race.fuel_options?.enabled ||
          race.fuelOptions?.enabled ||
          race.digital_fuel_options?.enabled ||
          race.digitalFuelOptions?.enabled
        );
      }
      return false;
    }
    return false;
  }

  get isOverallNoDataRow(): boolean {
    if (this.isEditorMode) return false;

    const parent = this.parentComponent();
    const s = this.widget()?.customSettings;
    if (s?.["isHeaderWidget"]) return false;

    const bindingMode = s?.["bindingMode"] || "lane";
    const isOverallOrSeed = isOverallOrSeedDataSource(
      s as any,
      parent,
      bindingMode,
    );
    const defaultMode = isOverallOrSeed ? "remove" : "empty";
    const emptyRowsMode = (s?.["emptyRowsMode"] || defaultMode) as string;
    if (emptyRowsMode !== "remove") {
      return false;
    }

    const gridId = s?.["gridId"];
    const lane = Number(s?.["gridLane"] ?? s?.["targetIndex"] ?? 0);
    const dataCount = gridId
      ? LaneGridReplicationHelper.getGridDataCount(
          parent?.layout?.widgets || [this.widget()],
          gridId,
          parent,
        )
      : parent?.race?.standings?.length ||
        parent?.raceStandings?.length ||
        parent?.participants?.length ||
        parent?.race?.participants?.length ||
        parent?.raceParticipants?.length ||
        0;

    const startRowOffset = Math.max(1, Number(s?.["startRowOffset"]) || 1);
    const effectiveIndex = lane + (startRowOffset - 1);
    return effectiveIndex >= dataCount;
  }

  get isGridMirrored(): boolean {
    const session = this.parentComponent()?.gridSession?.();
    if (!session) return false;
    const s = this.widget().customSettings;
    if (s?.["isHeaderWidget"]) return false;
    if (s?.["gridId"] !== session.gridId) return false;

    const isHoriz =
      session.direction === "horizontal" ||
      session.layoutOrientation === "horizontal" ||
      s?.["gridDirection"] === "horizontal" ||
      s?.["layoutOrientation"] === "horizontal";
    const isLanesMirrored = isHoriz
      ? s?.["linkColumns"] !== false && session.linkColumns !== false
      : s?.["mirrorRows"] !== false && session.mirrorRows !== false;
    if (!isLanesMirrored) return false;

    const masterId = s?.["gridMasterId"];
    if (masterId) {
      const parent = this.parentComponent();
      const masterExists = parent?.hasWidgetId
        ? parent.hasWidgetId(masterId)
        : (parent?.layout?.widgets || []).some((w: any) => w.id === masterId);
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

  get isGridSelected(): boolean {
    const gridId = this.widget().customSettings?.["gridId"];
    if (!gridId) return false;
    const session = this.parentComponent()?.gridSession?.();
    return Boolean(session && session.gridId === gridId);
  }

  /** Locked in the Layout Editor: can be selected, not moved or resized. */
  get isLocked(): boolean {
    return this.widget()?.customSettings?.["locked"] === true;
  }

  get canModifyWidget(): boolean {
    if (!this.isCustomizing() || this.isCountdownGhost) return false;
    if (this.isWidgetInGrid && !this.isGridSelected) return false;
    return !this.isGridMirrored;
  }

  get gridDirection(): "vertical" | "horizontal" {
    const s = this.widget().customSettings;
    const session = this.parentComponent()?.gridSession?.();
    if (session && session.gridId === s?.["gridId"]) {
      return session.direction || s?.["gridDirection"] || "vertical";
    }
    return s?.["gridDirection"] || "vertical";
  }

  get isHeightAutoCalculated(): boolean {
    if (this.widget().customSettings?.["mirrorRows"] === false) return false;
    const session = this.parentComponent()?.gridSession?.();
    if (session && session.mirrorRows === false) return false;
    return this.isWidgetInGrid && this.gridDirection === "vertical";
  }

  get isWidthAutoCalculated(): boolean {
    if (this.widget().customSettings?.["mirrorRows"] === false) return false;
    const session = this.parentComponent()?.gridSession?.();
    if (session && session.mirrorRows === false) return false;
    return this.isWidgetInGrid && this.gridDirection === "horizontal";
  }

  get computedZIndex(): number {
    const w = this.widget();
    if (w.widgetType === "countdown") {
      return Math.max(100000, (w.zIndex || 2000) + 100000);
    }
    if (w.widgetType === "menu-bar") {
      return 99999;
    }
    // on top while dragged (phase 4b), below the menu bar and countdown
    if (this.parentComponent()?.liftedIds?.()?.has(w.id)) {
      return LIFTED_Z + (w.zIndex || 100);
    }
    return w.zIndex || 100;
  }

  get widgetLabel(): string {
    const w = this.widget();
    if (w.widgetType === "lane-column") {
      const s = w.customSettings || {};
      const rawText = (s["customLabel"] || s["columnKey"] || "") as string;
      const col = rawText
        .replace(/^driver\./, "")
        .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
        .replace(/\s+/g, " ")
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
      const laneTag =
        this.translationService?.translate("HL_LANE_TAG", { lane: idx }) ||
        `L${idx}`;
      const prefix =
        mode === "position"
          ? `P${idx}`
          : mode === "overallPosition"
            ? `OP${idx}`
            : mode === "seed"
              ? `S${idx}`
              : laneTag;
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
    if (el) {
      el.style.zIndex = "";
    }
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

    const snapped = this.snap(
      { x: newX, y: newY, w: newW, h: newH },
      handle,
      baseWidth,
      baseHeight,
    );

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

  /** Alt held while dragging / resizing: no snapping (phase 4a). */
  private snapOff = false;

  /**
   * Snap a moved / resized rect: edges and centres with guide lines when the
   * host has snapWithGuides (Layout Editor), else the older edge snapping.
   */
  private snap(
    rect: { x: number; y: number; w: number; h: number },
    handle: string,
    baseWidth: number,
    baseHeight: number,
  ): { x: number; y: number; w: number; h: number } {
    const host = this.parentComponent();
    if (this.snapOff) {
      host.snapGuides?.set(null);
      return rect;
    }
    if (host.snapWithGuides) {
      const r = host.snapWithGuides(
        rect,
        this.widget().id,
        handle,
        baseWidth,
        baseHeight,
        this.snapIgnore,
      );
      host.snapGuides?.set(
        r.guidesX.length || r.guidesY.length
          ? { x: r.guidesX, y: r.guidesY }
          : null,
      );
      return r;
    }
    if (host.snapToEdges) {
      return host.snapToEdges(
        rect.x,
        rect.y,
        rect.w,
        rect.h,
        this.widget().id,
        handle,
        baseWidth,
        baseHeight,
      );
    }
    return rect;
  }

  /** Position and size next to the widget while it is dragged / resized. */
  private showReadout(): void {
    const w = this.widget();
    this.parentComponent().dragReadout?.set({
      x: Math.round(w.x),
      y: Math.round(w.y),
      w: Math.round(w.width),
      h: Math.round(w.height),
    });
  }

  private clearSnapOverlay(): void {
    this.snapOff = false;
    this.parentComponent().snapGuides?.set(null);
    this.parentComponent().dragReadout?.set(null);
  }

  onResizeStart(event: PointerEvent, handle: string) {
    if (!this.canModifyWidget || this.isLocked) return;
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

      this.snapOff = moveEvent.altKey;
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
      this.showReadout();

      this.cdr.detectChanges();
    };

    const onPointerUp = () => {
      this.isResizing = false;
      document.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("pointerup", onPointerUp);
      this.clearSnapOverlay();
      this.afterMoveOrResize();
    };

    document.addEventListener("pointermove", onPointerMove);
    document.addEventListener("pointerup", onPointerUp);
  }

  // Handle dragging manually to support snapping better than cdkDrag might out of the box
  onDragStart(event: PointerEvent) {
    if (!this.canModifyWidget) return;
    if (this.isLocked) {
      // a locked widget is only selected, never dragged
      this.selectWidget();
      return;
    }
    const target = event.target as HTMLElement | null;
    // Don't drag if clicking a resize handle, button, or input
    if (target?.closest(".resize-handle")) return;
    if (target?.closest("button")) return;
    if (target?.closest("app-custom-select, select, input, textarea")) return;

    event.preventDefault();
    event.stopPropagation();

    // Several selected (phase 4c-2): pressing one of them moves them all and
    // keeps the selection; a click without moving selects only this one.
    const group = this.groupDragStarts();
    this.snapIgnore = group.map((g) => g.id);

    // select, and lift on top only while dragging: the saved layer order
    // changes only through the panel's layer buttons (phase 4b)
    if (!group.length) this.selectWidget();
    this.setLifted(true, this.snapIgnore);

    const scale = this.parentComponent().visualScale || 1;
    const startX = event.clientX;
    const startY = event.clientY;
    const initialWidgetX = this.widget().x;
    const initialWidgetY = this.widget().y;
    let moved = false;

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

      this.snapOff = moveEvent.altKey;
      const snapped = this.snap(
        { x: newX, y: newY, w, h },
        "all",
        baseWidth,
        baseHeight,
      );

      this.widget().x = this.isWidthAutoCalculated
        ? initialWidgetX
        : Math.max(0, Math.min(baseWidth - w, snapped.x));
      this.widget().y = this.isHeightAutoCalculated
        ? initialWidgetY
        : Math.max(0, Math.min(baseHeight - h, snapped.y));
      if (
        Math.abs(moveEvent.clientX - startX) > 2 ||
        Math.abs(moveEvent.clientY - startY) > 2
      ) {
        moved = true;
      }
      if (group.length) {
        // the others follow by the same amount; nobody leaves the canvas
        const lead = {
          id: this.widget().id,
          x: initialWidgetX,
          y: initialWidgetY,
          width: w,
          height: h,
        };
        moveGroup(
          lead,
          this.widget(),
          group,
          (id) => this.findLayoutWidget(id),
          baseWidth,
          baseHeight,
        );
      }
      this.showReadout();
      this.cdr.detectChanges();
    };

    const onPointerUp = () => {
      document.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("pointerup", onPointerUp);
      this.clearSnapOverlay();
      this.setLifted(false);
      this.snapIgnore = [];
      if (group.length && !moved) {
        // a click on one of several selected: select only that one
        this.parentComponent().soleSelected?.emit(this.widget().id);
        return;
      }
      this.afterMoveOrResize();
    };

    document.addEventListener("pointermove", onPointerMove);
    document.addEventListener("pointerup", onPointerUp);
  }

  removeWidget(event: Event) {
    event.stopPropagation();
    if (!this.canModifyWidget) return;
    if (this.parentComponent().removeWidget) {
      this.parentComponent().removeWidget(this.widget().id);
    }
  }

  onWidgetPointerDown(event: PointerEvent): void {
    if (!this.isCustomizing() || this.isCountdownGhost) return;
    const target = event.target as HTMLElement | null;
    // Layout Editor: Shift / Ctrl-click adds or removes the widget (phase 4c-1)
    const parent = this.parentComponent();
    if (
      (event.shiftKey || event.ctrlKey || event.metaKey) &&
      parent?.isUIEditorMode?.() &&
      parent?.selectionToggled &&
      !target?.closest(".resize-handle, button, .widget-remove-btn")
    ) {
      event.preventDefault();
      event.stopPropagation();
      parent.selectionToggled.emit(this.widget().id);
      return;
    }
    if (
      target?.closest(
        ".resize-handle, button, .widget-remove-btn, app-custom-select, select, input, textarea",
      )
    ) {
      return;
    }
    if (
      target?.closest(
        ".anchor-zone, .anchor-delete-btn, .delete-anchor-btn, .lane-column-anchor, .drop-zone, .inset-cell",
      )
    ) {
      return;
    }
    if (!this.canModifyWidget) {
      this.selectWidget();
      return;
    }
    this.onDragStart(event);
  }

  /**
   * Select this widget (or its grid master) without changing the layer order.
   * Hosts without selectWidget keep the old bring-to-front behaviour.
   */
  selectWidget(): void {
    const parent = this.parentComponent();
    if (parent?.selectWidget) {
      parent.selectWidget(this.widget().id);
    } else {
      this.bringToFront();
    }
  }

  /** Draw this widget (or its whole grid, or the group) on top while it's dragged. */
  private setLifted(on: boolean, alsoIds: string[] = []): void {
    const lifted = this.parentComponent()?.liftedIds;
    if (!lifted?.set) return;
    if (!on) {
      lifted.set(new Set());
      return;
    }
    const gridId = this.widget().customSettings?.["gridId"];
    const ids = gridId
      ? (this.parentComponent().layout?.widgets || [])
          .filter((w: any) => w.customSettings?.["gridId"] === gridId)
          .map((w: any) => w.id)
      : [this.widget().id, ...alsoIds];
    lifted.set(new Set(ids));
  }

  /** Other selected widgets that move along while this one is dragged. */
  private snapIgnore: string[] = [];

  /** After a move or resize: update the grid's other lanes, then save. */
  private afterMoveOrResize(): void {
    if (this.parentComponent().gridSession?.()) {
      const session = this.parentComponent().gridSession();
      if (
        this.widget().customSettings?.["gridId"] === session.gridId &&
        (Number(this.widget().customSettings?.["gridLane"]) ===
          session.sourceLaneIndex ||
          LaneGridReplicationHelper.isHeaderWidget(this.widget()))
      ) {
        this.parentComponent().onMasterWidgetModified?.(this.widget());
      }
    }
    if (this.parentComponent().layoutChanged) {
      this.parentComponent().layoutChanged.emit(this.parentComponent().layout);
    }
  }

  private findLayoutWidget(id: string): any {
    return (this.parentComponent()?.layout?.widgets || []).find(
      (w: any) => w.id === id,
    );
  }

  /**
   * Start positions of the other selected widgets that move with this one
   * (phase 4c-2): only in the Layout Editor, only when this widget is one of
   * several selected. Locked widgets and grid columns stay put.
   */
  private groupDragStarts(): GroupStart[] {
    const ids = this.selectedWidgetIds() || [];
    const me = this.widget().id;
    if (ids.length < 2 || !ids.includes(me)) return [];
    if (!this.parentComponent()?.isUIEditorMode?.()) return [];
    const widgets = this.parentComponent()?.layout?.widgets || [];
    return movableIds(
      widgets,
      ids.filter((id) => id !== me),
    ).map((id) => {
      const w = this.findLayoutWidget(id);
      return { id, x: w.x, y: w.y, width: w.width, height: w.height };
    });
  }

  bringToFront() {
    if (this.parentComponent() && this.parentComponent().bringToFront) {
      const masterId = this.widget().customSettings?.["gridMasterId"];
      const parent = this.parentComponent();
      const masterExists = masterId
        ? parent?.hasWidgetId
          ? parent.hasWidgetId(masterId)
          : (parent?.layout?.widgets || []).some((w: any) => w.id === masterId)
        : false;
      const shouldTargetMaster = Boolean(
        masterId &&
        masterExists &&
        (this.isGridMirrored ||
          this.widget().customSettings?.["mirrorRows"] !== false),
      );
      if (shouldTargetMaster) {
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
    if (
      widget.widgetType === "lane-column" ||
      widget.widgetType === "average-score" ||
      widget.widgetType === "drift-indicator"
    )
      return true;
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
    return resolveCustomWidgetName(
      type,
      this.customWidgetService?.getWidgetDefinition?.(type)?.manifest,
      this.translationService,
    );
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
    if (!w || !this.shouldRenderAsLaneColumn(w)) return;
    const s = w.customSettings;
    if (!s || !s["gridId"] || s["isHeaderWidget"]) return;
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
    el.style.zIndex = String(this.computedZIndex + 1000);
    el.style.transition = "none";
    el.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
    void el.offsetHeight;
    el.style.transition = "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)";
    el.style.transform = "translate(0px, 0px)";

    this.gridAnimTimer = setTimeout(() => {
      if (el) {
        el.classList.remove("grid-animating");
        el.style.zIndex = "";
        el.style.transition = "";
        el.style.transform = "";
      }
      this.isGridAnimating = false;
      this.gridAnimTimer = undefined;
    }, 300);
  }
}

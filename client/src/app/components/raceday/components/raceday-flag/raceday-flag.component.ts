import { CommonModule } from "@angular/common";
import {
  Component,
  computed,
  inject,
  input,
  ViewEncapsulation,
} from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { of } from "rxjs";
import { AbsoluteWidgetNode, HighlightLapStyle } from "@app/models/settings";
import { RaceFlag } from "@app/proto/antigravity";
import { DriverHeatData } from "@app/race/driver_heat_data";
import { RaceFlagService } from "@app/services/race-flag.service";
import { isColorLight } from "@app/utils/color.utils";

@Component({
  standalone: true,
  selector: "app-raceday-flag",
  templateUrl: "./raceday-flag.component.html",
  styleUrls: ["./raceday-flag.component.css"],
  encapsulation: ViewEncapsulation.None,
  imports: [CommonModule],
})
export class RacedayFlagComponent {
  private raceFlagService = inject(RaceFlagService, { optional: true });
  private serviceFlagUrl = toSignal(
    this.raceFlagService?.currentFlagUrl$ ?? of(""),
    {
      initialValue:
        typeof this.raceFlagService?.getCurrentFlagUrl === "function"
          ? this.raceFlagService.getCurrentFlagUrl()
          : typeof this.raceFlagService?.getFlagUrl === "function"
            ? this.raceFlagService.getFlagUrl()
            : "",
    },
  );

  parent = input<any>(undefined);
  widget = input<AbsoluteWidgetNode | null>(null);
  currentFlagUrl = input<string>("");
  displayMode = input<"image" | "color-bar" | "both" | undefined>(undefined);
  raceStateColor = input<string | undefined>(undefined);
  raceFlag = input<any>(undefined);

  protected displayFlagUrl = computed(() => {
    return this.currentFlagUrl() || this.serviceFlagUrl() || "";
  });

  get effectiveSettings(): Record<string, any> {
    return this.widget()?.customSettings || {};
  }

  get effectiveDisplayMode(): "image" | "color-bar" | "both" {
    return (
      this.displayMode() || this.effectiveSettings["displayMode"] || "image"
    );
  }

  get isImageMode(): boolean {
    const mode = this.effectiveDisplayMode;
    return mode === "image" || mode === "both";
  }

  get isColorBarMode(): boolean {
    const mode = this.effectiveDisplayMode;
    return mode === "color-bar" || mode === "both";
  }

  get effectiveRaceStateColor(): string {
    if (this.raceStateColor()) {
      return this.raceStateColor()!;
    }
    const parentComp = this.parent();
    if (parentComp && typeof parentComp.raceStateColor === "string") {
      return parentComp.raceStateColor;
    }
    const flag =
      this.raceFlag() ?? parentComp?.driverData?.flag ?? RaceFlag.UNKNOWN_FLAG;

    if (this.raceFlagService) {
      if (flag === RaceFlag.UNKNOWN_FLAG || flag === 0) {
        return typeof this.raceFlagService.getFlagColor === "function"
          ? this.raceFlagService.getFlagColor()
          : "red";
      }
      if (typeof this.raceFlagService.getFlagTypeForFlag === "function") {
        return this.raceFlagService.getFlagTypeForFlag(flag);
      }
    }
    return "red";
  }

  get targetDriver(): DriverHeatData | undefined {
    const parent = this.parent();
    const bindingMode =
      this.effectiveSettings["bindingMode"] ||
      (parent?.isDriverStation ? "hostLane" : "lane");
    const targetIdx = this.effectiveSettings["targetIndex"] ?? 0;
    const drivers: DriverHeatData[] =
      parent?.sortedHeatDrivers ||
      parent?.heatDrivers ||
      parent?.heat?.heatDrivers ||
      (parent?.driverData ? [parent.driverData] : []);

    if (bindingMode === "hostLane" || parent?.isDriverStation) {
      const effLane = parent?.activeLaneIndex ?? parent?.laneIndex ?? targetIdx;
      if (
        parent?.driverData &&
        (parent?.laneIndex === effLane || parent?.activeLaneIndex === effLane)
      ) {
        return parent.driverData;
      }
      return drivers.find((d) => d.laneIndex === effLane) || drivers[effLane];
    }

    if (bindingMode === "hostDriver") {
      const targetId = parent?.activeDriverId ?? parent?.driverId;
      if (targetId) {
        return drivers.find(
          (d) =>
            d.objectId === targetId ||
            d.participant?.objectId === targetId ||
            d.driver?.entity_id === targetId,
        );
      }
      return drivers[0];
    }

    if (this.effectiveSettings["targetIndex"] !== undefined) {
      return (
        drivers.find((d) => d.laneIndex === targetIdx) || drivers[targetIdx]
      );
    }
    return undefined;
  }

  get isHighlighted(): boolean {
    if (
      this.highlightLapStyle === "none" ||
      this.effectiveSettings["highlightRowOnLap"] === false
    ) {
      return false;
    }
    const driverId = this.targetDriver?.objectId;
    const participantId = this.targetDriver?.participant?.objectId;
    const entityDriverId =
      this.targetDriver?.actualDriver?.entity_id ||
      this.targetDriver?.driver?.entity_id;
    const hd = this.parent()?.highlightedDrivers;
    if (hd) {
      if (driverId && hd.has(driverId)) return true;
      if (participantId && hd.has(participantId)) return true;
      if (entityDriverId && hd.has(entityDriverId)) return true;
    }
    if (
      this.parent()?.isDriverStation &&
      this.parent()?.activeLaneIndex !== undefined
    ) {
      const drivers: DriverHeatData[] =
        this.parent()?.sortedHeatDrivers ||
        this.parent()?.heatDrivers ||
        this.parent()?.heat?.heatDrivers ||
        [];
      const hostDriver = drivers.find(
        (d) => d.laneIndex === this.parent()?.activeLaneIndex,
      );
      if (hostDriver) {
        if (hostDriver.objectId && hd?.has(hostDriver.objectId)) return true;
        if (
          hostDriver.participant?.objectId &&
          hd?.has(hostDriver.participant.objectId)
        ) {
          return true;
        }
        const hostEntityDriverId =
          hostDriver.actualDriver?.entity_id || hostDriver.driver?.entity_id;
        if (hostEntityDriverId && hd?.has(hostEntityDriverId)) {
          return true;
        }
      }
    }
    return false;
  }

  get highlightLapStyle(): HighlightLapStyle {
    if (this.effectiveSettings["highlightLapStyle"]) {
      return this.effectiveSettings["highlightLapStyle"];
    }
    if (this.effectiveSettings["highlightRowOnLap"] === false) {
      return "none";
    }
    if (this.parent()?.isDriverStation) {
      return this.parent()?.highlightLapStyle || "full-glow";
    }
    return this.parent()?.highlightLapStyle || "classic";
  }

  get isLightBackground(): boolean {
    return isColorLight(this.effectiveRaceStateColor);
  }
}

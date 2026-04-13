import { Injectable, OnDestroy } from "@angular/core";
import { Subscription } from "rxjs";
import { com } from "src/app/proto/message";

import { RaceConnectionService } from "./race-connection.service";

export type FlagType =
  | "red"
  | "green"
  | "yellow"
  | "white"
  | "checkered"
  | "green_yellow";

@Injectable({
  providedIn: "root",
})
export class RaceFlagService implements OnDestroy {
  private currentFlag: com.antigravity.RaceFlag =
    com.antigravity.RaceFlag.UNKNOWN_FLAG;
  private subscription: Subscription;

  constructor(private raceConnectionService: RaceConnectionService) {
    this.subscription = this.raceConnectionService.raceFlag$.subscribe(
      (flag) => {
        this.currentFlag = flag;
      },
    );
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  /**
   * Get the current flag type based on the server-provided flag.
   */
  getFlagType(): FlagType {
    const RF = com.antigravity.RaceFlag;
    switch (this.currentFlag) {
      case RF.GREEN:
        return "green";
      case RF.YELLOW:
        return "yellow";
      case RF.RED:
        return "red";
      case RF.WHITE:
        return "white";
      case RF.CHECKERED:
        return "checkered";
      case RF.GREEN_YELLOW:
        return "green_yellow";
      default:
        return "red";
    }
  }

  /**
   * Get the flag color for driver station indicator (simplified version)
   */
  getFlagColor(): "red" | "green" | "yellow" | "white" | "checkered" {
    const flagType = this.getFlagType();

    // Map to simplified color set
    if (flagType === "green_yellow") return "green";
    return flagType as "red" | "green" | "yellow" | "white" | "checkered";
  }

  /**
   * Get the translation key for the current flag name.
   */
  getFlagNameKey(): string {
    const flagType = this.getFlagType();
    return `RACE_FLAG_${flagType.toUpperCase()}`;
  }
}

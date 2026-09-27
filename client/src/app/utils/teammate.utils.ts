import { Driver } from "@app/models/driver";
import { RaceParticipant } from "@app/models/race_participant";
import { DriverHeatData } from "@app/race/driver_heat_data";
import { Heat } from "@app/race/heat";

export interface DriverStatsLabels {
  heatAbbr: string;
  lapAbbr: string;
  totalAbbr: string;
}

export class TeammateUtils {
  /**
   * Determines if a heat driver represents a team entry or is in practice mode.
   */
  public static isTeam(
    hd: DriverHeatData | any,
    isPractice?: boolean,
  ): boolean {
    return (
      !!(hd?.participant?.team || hd?.driver?.team || (hd as any)?.team) ||
      !!isPractice
    );
  }

  /**
   * Retrieves all available teammates for a heat driver entry.
   * In practice mode, returns an empty lane entry followed by all participants' drivers.
   * In team mode, returns the drivers associated with the team.
   */
  public static getTeammates(
    hd: DriverHeatData | any,
    allDrivers: Driver[] | any[],
    options?: {
      isPractice?: boolean;
      participants?: RaceParticipant[] | any[];
      emptyLaneLabel?: string;
    },
  ): any[] {
    if (options?.isPractice) {
      const emptyDriver = {
        name: options.emptyLaneLabel || "Empty Lane",
        nickname: "",
        entity_id: "EMPTY_LANE",
        id: "EMPTY_LANE",
      };

      const raceDrivers: any[] = [];
      const participants = options.participants || [];
      participants.forEach((p) => {
        if (p.driver && p.driver.entity_id !== "EMPTY_LANE") {
          const d = allDrivers.find(
            (d) =>
              (d.entity_id || d.id) ===
              (p.driver?.entity_id || (p as any).driverId),
          );
          if (
            d &&
            !raceDrivers.find(
              (rd) => (rd.entity_id || rd.id) === (d.entity_id || d.id),
            )
          ) {
            raceDrivers.push(d);
          }
        }
        const tDriverIds = p.team?.driverIds || (p.team as any)?.driver_ids;
        if (p.team && tDriverIds && Array.isArray(tDriverIds)) {
          tDriverIds.forEach((id: string) => {
            const d = allDrivers.find((d) => (d.entity_id || d.id) === id);
            if (
              d &&
              !raceDrivers.find(
                (rd) => (rd.entity_id || rd.id) === (d.entity_id || d.id),
              )
            ) {
              raceDrivers.push(d);
            }
          });
        }
      });

      return [emptyDriver, ...raceDrivers];
    }

    const team = hd?.participant?.team || hd?.driver?.team || (hd as any)?.team;
    const driverIds = team?.driverIds || (team as any)?.driver_ids;
    if (team && driverIds && Array.isArray(driverIds)) {
      return driverIds
        .map((id: string) =>
          allDrivers.find((d) => (d.entity_id || d.id) === id),
        )
        .filter((d: any) => !!d);
    }
    return [];
  }

  /**
   * Computes formatted driver statistics string: (H: X L / Ys, T: X L / Ys).
   */
  public static getDriverStats(
    hd: DriverHeatData | any,
    driverId: string,
    heats: Heat[] | any[] | null | undefined,
    labels: DriverStatsLabels,
  ): string {
    if (!hd || !driverId) return "";
    let heatLaps = 0;
    let heatTime = 0;
    let overallLaps = 0;
    let overallTime = 0;

    const hLabel = labels.heatAbbr;
    const lLabel = labels.lapAbbr;
    const tLabel = labels.totalAbbr;

    const lapsWithDetails = hd.lapsWithDetails;
    if (lapsWithDetails && Array.isArray(lapsWithDetails)) {
      lapsWithDetails.forEach((l: any) => {
        if (l.driverId === driverId) {
          heatLaps++;
          heatTime += l.time;
        }
      });
    }

    if (heats && Array.isArray(heats)) {
      heats.forEach((h: any) => {
        if (h.heatDrivers && Array.isArray(h.heatDrivers)) {
          h.heatDrivers.forEach((d_hd: any) => {
            const dLaps = d_hd.lapsWithDetails;
            if (dLaps && Array.isArray(dLaps)) {
              dLaps.forEach((l: any) => {
                if (l.driverId === driverId) {
                  overallLaps++;
                  overallTime += l.time;
                }
              });
            }
          });
        }
      });
    }

    const formatTime = (t: number) => {
      if (t >= 60) {
        const m = Math.floor(t / 60);
        const s = (t % 60).toFixed(1).padStart(4, "0");
        return `${m}:${s}`;
      }
      return `${t.toFixed(1)}s`;
    };

    return `(${hLabel}: ${heatLaps} ${lLabel} / ${formatTime(heatTime)}, ${tLabel}: ${overallLaps} ${lLabel} / ${formatTime(overallTime)})`;
  }
}

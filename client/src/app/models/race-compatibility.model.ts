export interface RaceCompatibility {
  status: "COMPATIBLE" | "DEGRADED" | "INCOMPATIBLE";
  can_run: boolean;
  is_read_only: boolean;
  ignored_features?: string[];
  blocking_features?: string[];
}

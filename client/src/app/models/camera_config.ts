export interface LaneDetectionGate {
  laneIndex: number;
  xPct: number;
  yPct: number;
  widthPct: number;
  heightPct: number;
  gateType: number; // 0 = LAP/FINISH, 1 = SECTOR, 2 = PIT_IN, 3 = PIT_OUT
  sensitivity: number;
}

export interface CameraConfig {
  name: string;
  interfaceIndex: number;
  targetFps: number;
  autoDetectLanes: boolean;
  gates: LaneDetectionGate[];
  connectionType?: "local" | "remote";
}

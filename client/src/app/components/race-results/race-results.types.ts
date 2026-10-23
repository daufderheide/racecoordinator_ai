import { Driver } from "@app/models/driver";

export interface StandingsRow {
  rank: number;
  visualIndex: number;
  driver: Driver;
  score: number;
  laps: number;
  averageLapTime: number;
  medianLapTime: number;
  bestLapTime: number;
  totalTime: number;
  gap1st: number | null;
  gapAhead: number | null;
  avatarUrl: string;
  laneScores: (number | null)[];
}

export interface GraphPoint {
  x: number;
  y: number;
  isOwnLap?: boolean;
  causesStandingsChange?: boolean;
}

export interface DriverLine {
  objectId: string;
  driverName: string;
  color: string;
  backgroundColor: string;
  points: GraphPoint[];
  pathData: string;
  rankPoints: GraphPoint[];
  rankPathData: string;
  legendX: number;
  legendY: number;
}

export const NEON_COLORS = [
  { color: "#00ffff", bg: "#0b2e30" }, // Neon Cyan
  { color: "#ff00ff", bg: "#300030" }, // Neon Pink
  { color: "#ffff00", bg: "#303000" }, // Neon Yellow
  { color: "#00ff00", bg: "#003000" }, // Neon Green
  { color: "#ff3d00", bg: "#300b00" }, // Neon Orange/Red
  { color: "#3d5afe", bg: "#000b30" }, // Neon Blue
  { color: "#d500f9", bg: "#230030" }, // Dark Magenta
  { color: "#1de9b6", bg: "#003020" }, // Mint Teal
  { color: "#ff9100", bg: "#301c00" }, // Amber Orange
  { color: "#c6ff00", bg: "#233000" }, // Lime Green
];

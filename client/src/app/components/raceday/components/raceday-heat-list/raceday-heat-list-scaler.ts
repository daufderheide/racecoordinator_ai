export interface HeatSummaryColumnSettings {
  pos: boolean;
  driver: boolean;
  laps: boolean;
  bestLap: boolean;
  gap: boolean;
  avgLap: boolean;
  medianLap: boolean;
}

export interface ScalerCardDimensions {
  cardWidth: number;
  cardHeight: number;
  contentWidth: number;
  contentHeight: number;
}

export function calculateCardDimensions(
  containerWidth: number,
  containerHeight: number,
  cols: number,
  rows: number,
  scale: number,
): ScalerCardDimensions {
  const gridGap = 8;
  const safeCols = Math.max(1, cols);
  const safeRows = Math.max(1, rows);

  const cardWidth = Math.max(
    20,
    (containerWidth - (safeCols - 1) * gridGap) / safeCols,
  );
  const cardHeight = Math.max(
    20,
    (containerHeight - (safeRows - 1) * gridGap) / safeRows,
  );

  const padX = Math.round(12 * scale);
  const padY = Math.round(8 * scale);
  const cardGap = Math.round(3 * scale);
  const headerFont = Math.max(11, Math.min(20, Math.round(13 * scale)));
  const headerHeight = Math.round(headerFont * 1.2 + 4);

  const contentWidth = Math.max(20, cardWidth - padX);
  const contentHeight = Math.max(
    20,
    cardHeight - padY - cardGap - headerHeight,
  );

  return { cardWidth, cardHeight, contentWidth, contentHeight };
}

export function calculateOptimalSummaryHeaderFontSize(params: {
  contentWidth: number;
  contentHeight: number;
  scale: number;
  maxLanes: number;
  columns: HeatSummaryColumnSettings;
}): number {
  const { contentWidth, contentHeight, scale, maxLanes, columns } = params;
  if (contentWidth <= 0 || contentHeight <= 0) return 12;

  const totalRows = Math.max(1, maxLanes) + 1;
  const tableHeight = Math.max(20, contentHeight - 2);
  const rowHeight = tableHeight / totalRows;

  const vertPad = Math.max(2, Math.round(2 * scale));
  const maxFontH = Math.max(8, (rowHeight - vertPad) / 1.15);

  let explicitPct = 0;
  if (columns.pos) explicitPct += 0.12;
  if (columns.laps) explicitPct += 0.16;
  if (columns.bestLap) explicitPct += 0.28;
  if (columns.gap) explicitPct += 0.18;
  if (columns.avgLap) explicitPct += 0.24;
  if (columns.medianLap) explicitPct += 0.24;

  const driverPct = columns.driver ? Math.max(0.15, 1.0 - explicitPct) : 0;
  const totalPct = explicitPct + driverPct;
  const normFactor = totalPct > 1.0 ? 1.0 / totalPct : 1.0;

  const colPad = Math.max(4, Math.round(8 * scale));
  const limits: number[] = [maxFontH];

  const checkCol = (active: boolean, pct: number, headerChars: number) => {
    if (!active) return;
    const effectiveWidth = Math.max(
      10,
      contentWidth * pct * normFactor - colPad,
    );
    const maxFont = effectiveWidth / (headerChars * 0.68);
    limits.push(maxFont);
  };

  checkCol(columns.pos, 0.12, 3.2); // "POS"
  checkCol(columns.driver, driverPct, 6.0); // "DRIVER"
  checkCol(columns.laps, 0.16, 4.2); // "LAPS"
  checkCol(columns.bestLap, 0.28, 8.2); // "BEST LAP"
  checkCol(columns.gap, 0.18, 3.2); // "GAP"
  checkCol(columns.avgLap, 0.24, 7.2); // "AVG LAP"
  checkCol(columns.medianLap, 0.24, 10.2); // "MEDIAN LAP"

  const optimalFont = Math.min(...limits);
  return Math.max(8, Math.min(32, Math.floor(optimalFont)));
}

export function calculateOptimalSummaryRowFontSize(params: {
  contentWidth: number;
  contentHeight: number;
  scale: number;
  maxLanes: number;
  columns: HeatSummaryColumnSettings;
}): number {
  const { contentWidth, contentHeight, scale, maxLanes, columns } = params;
  if (contentWidth <= 0 || contentHeight <= 0) return 12;

  const totalRows = Math.max(1, maxLanes) + 1;
  const tableHeight = Math.max(20, contentHeight - 2);
  const rowHeight = tableHeight / totalRows;

  const vertPad = Math.max(2, Math.round(2 * scale));
  const maxFontH = Math.max(8, (rowHeight - vertPad) / 1.15);

  let totalChars = 0;
  let colCount = 0;
  if (columns.pos) {
    totalChars += 2.0; // rank is 1-2 digits
    colCount++;
  }
  if (columns.driver) {
    totalChars += 8.5;
    colCount++;
  }
  if (columns.laps) {
    totalChars += 4.0;
    colCount++;
  }
  if (columns.bestLap) {
    totalChars += 6.0;
    colCount++;
  }
  if (columns.gap) {
    totalChars += 6.0;
    colCount++;
  }
  if (columns.avgLap) {
    totalChars += 6.0;
    colCount++;
  }
  if (columns.medianLap) {
    totalChars += 6.0;
    colCount++;
  }
  if (colCount === 0) {
    totalChars = 10;
    colCount = 1;
  }

  const horizPadPerCol = Math.max(4, Math.round(8 * scale));
  const totalColPad = colCount * horizPadPerCol;
  const netWidthForText = Math.max(20, contentWidth - totalColPad);
  const maxFontW = netWidthForText / (totalChars * 0.56);

  const optimalFont = Math.min(maxFontH, maxFontW);
  return Math.max(8, Math.min(48, Math.floor(optimalFont)));
}

export function calculateOptimalSummaryFontSize(params: {
  contentWidth: number;
  contentHeight: number;
  scale: number;
  maxLanes: number;
  columns: HeatSummaryColumnSettings;
}): number {
  return calculateOptimalSummaryRowFontSize(params);
}

export function calculateOptimalNonSummaryFontSize(params: {
  contentWidth: number;
  contentHeight: number;
  scale: number;
  maxLanes: number;
  laneColumns: number;
  hasTeam: boolean;
  longestDriverNameLength: number;
}): number {
  const {
    contentWidth,
    contentHeight,
    scale,
    maxLanes,
    laneColumns,
    hasTeam,
    longestDriverNameLength,
  } = params;
  if (contentWidth <= 0 || contentHeight <= 0) return 12;

  const laneCols = Math.max(1, laneColumns);
  const laneRows = Math.max(1, Math.ceil(Math.max(1, maxLanes) / laneCols));

  const laneGridGap = Math.max(2, Math.round(2 * scale));
  const badgeWidth = Math.max(
    20,
    (contentWidth - (laneCols - 1) * laneGridGap) / laneCols,
  );
  const badgeHeight = Math.max(
    20,
    (contentHeight - (laneRows - 1) * laneGridGap) / laneRows,
  );

  // Vertical constraint: nickname (1 line) + optional team name (0.78em line) + padding
  const badgePadY = Math.max(2, Math.round(4 * scale));
  const heightMultiplier = hasTeam ? 2.05 : 1.15;
  const maxFontH = Math.max(8, (badgeHeight - badgePadY) / heightMultiplier);

  // Horizontal constraint: "L1" tag (~2.2 chars) + gap (~0.5 chars) + nickname
  const effectiveChars = Math.min(
    12,
    Math.max(7, longestDriverNameLength || 8),
  );
  const totalBadgeChars = 2.2 + effectiveChars;

  const badgePadX = Math.max(4, Math.round(10 * scale));
  const badgeGap = Math.max(2, Math.round(4 * scale));
  const netBadgeWidth = Math.max(10, badgeWidth - badgePadX - badgeGap);
  const maxFontW = netBadgeWidth / (totalBadgeChars * 0.58);

  const optimalFont = Math.min(maxFontH, maxFontW);
  return Math.max(8, Math.min(48, Math.floor(optimalFont)));
}

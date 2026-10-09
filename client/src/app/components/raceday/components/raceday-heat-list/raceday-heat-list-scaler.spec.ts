import {
  calculateCardDimensions,
  calculateOptimalNonSummaryFontSize,
  calculateOptimalSummaryFontSize,
  calculateOptimalSummaryHeaderFontSize,
  calculateOptimalSummaryRowFontSize,
} from "./raceday-heat-list-scaler";

describe("raceday-heat-list-scaler", () => {
  describe("calculateCardDimensions", () => {
    it("should compute card and content dimensions for standard 2x2 grid", () => {
      const dims = calculateCardDimensions(960, 540, 2, 2, 1.5);
      expect(dims.cardWidth).toBe((960 - 8) / 2); // 476
      expect(dims.cardHeight).toBe((540 - 8) / 2); // 266
      expect(dims.contentWidth).toBeLessThan(dims.cardWidth);
      expect(dims.contentHeight).toBeLessThan(dims.cardHeight);
      expect(dims.contentWidth).toBeGreaterThan(20);
      expect(dims.contentHeight).toBeGreaterThan(20);
    });

    it("should handle edge cases with 0 or negative columns and rows", () => {
      const dims = calculateCardDimensions(500, 300, 0, 0, 1.0);
      expect(dims.cardWidth).toBe(500);
      expect(dims.cardHeight).toBe(300);
    });
  });

  describe("calculateOptimalSummaryHeaderFontSize", () => {
    const defaultCols = {
      pos: true,
      driver: true,
      laps: true,
      bestLap: true,
      gap: false,
      avgLap: false,
      medianLap: false,
    };

    it("should size column header font so that POS fits without being truncated", () => {
      const headerFont = calculateOptimalSummaryHeaderFontSize({
        contentWidth: 450,
        contentHeight: 220,
        scale: 1.5,
        maxLanes: 4,
        columns: defaultCols,
      });

      // Header font should be comfortably sized (e.g. 15-22px) so POS (3 chars) fits in 12% width
      expect(headerFont).toBeGreaterThanOrEqual(14);
      expect(headerFont).toBeLessThanOrEqual(25);
    });

    it("should reduce header font size when columns with long titles like MEDIAN LAP are enabled", () => {
      const allCols = {
        pos: true,
        driver: true,
        laps: true,
        bestLap: true,
        gap: true,
        avgLap: true,
        medianLap: true,
      };
      const headerFewCols = calculateOptimalSummaryHeaderFontSize({
        contentWidth: 350,
        contentHeight: 200,
        scale: 1.0,
        maxLanes: 4,
        columns: defaultCols,
      });
      const headerAllCols = calculateOptimalSummaryHeaderFontSize({
        contentWidth: 350,
        contentHeight: 200,
        scale: 1.0,
        maxLanes: 4,
        columns: allCols,
      });

      expect(headerAllCols).toBeLessThanOrEqual(headerFewCols);
    });

    it("should handle 0 or negative dimensions gracefully", () => {
      expect(
        calculateOptimalSummaryHeaderFontSize({
          contentWidth: 0,
          contentHeight: 0,
          scale: 1.0,
          maxLanes: 4,
          columns: defaultCols,
        }),
      ).toBe(12);
    });
  });

  describe("calculateOptimalSummaryRowFontSize", () => {
    const defaultCols = {
      pos: true,
      driver: true,
      laps: true,
      bestLap: true,
      gap: false,
      avgLap: false,
      medianLap: false,
    };

    it("should calculate a large font size when spacious rows and columns are available", () => {
      const rowFont = calculateOptimalSummaryRowFontSize({
        contentWidth: 450,
        contentHeight: 220,
        scale: 1.5,
        maxLanes: 4,
        columns: defaultCols,
      });
      // 5 rows in 220px -> ~44px row height -> font should easily be >= 20px
      expect(rowFont).toBeGreaterThanOrEqual(20);
      expect(rowFont).toBeLessThanOrEqual(48);
    });

    it("should allow data row font size to be larger than header font size", () => {
      const headerFont = calculateOptimalSummaryHeaderFontSize({
        contentWidth: 450,
        contentHeight: 220,
        scale: 1.5,
        maxLanes: 4,
        columns: defaultCols,
      });
      const rowFont = calculateOptimalSummaryRowFontSize({
        contentWidth: 450,
        contentHeight: 220,
        scale: 1.5,
        maxLanes: 4,
        columns: defaultCols,
      });

      expect(rowFont).toBeGreaterThanOrEqual(headerFont);
    });

    it("should reduce font size when many lanes are present to fit all rows vertically", () => {
      const font4Lanes = calculateOptimalSummaryRowFontSize({
        contentWidth: 400,
        contentHeight: 180,
        scale: 1.0,
        maxLanes: 4,
        columns: defaultCols,
      });
      const font8Lanes = calculateOptimalSummaryRowFontSize({
        contentWidth: 400,
        contentHeight: 180,
        scale: 1.0,
        maxLanes: 8,
        columns: defaultCols,
      });

      expect(font8Lanes).toBeLessThan(font4Lanes);
    });

    it("should clamp to minimum 8px on tiny containers and handle 0 or negative dimensions", () => {
      expect(
        calculateOptimalSummaryRowFontSize({
          contentWidth: 0,
          contentHeight: 0,
          scale: 1.0,
          maxLanes: 4,
          columns: defaultCols,
        }),
      ).toBe(12);

      const tinyFont = calculateOptimalSummaryRowFontSize({
        contentWidth: 50,
        contentHeight: 30,
        scale: 1.0,
        maxLanes: 8,
        columns: defaultCols,
      });
      expect(tinyFont).toBe(8);
    });
  });

  describe("calculateOptimalSummaryFontSize (alias)", () => {
    it("should match calculateOptimalSummaryRowFontSize", () => {
      const params = {
        contentWidth: 400,
        contentHeight: 200,
        scale: 1.0,
        maxLanes: 4,
        columns: {
          pos: true,
          driver: true,
          laps: true,
          bestLap: true,
          gap: false,
          avgLap: false,
          medianLap: false,
        },
      };
      expect(calculateOptimalSummaryFontSize(params)).toBe(
        calculateOptimalSummaryRowFontSize(params),
      );
    });
  });

  describe("calculateOptimalNonSummaryFontSize", () => {
    it("should calculate a large font size for spacious non-summary lane badges", () => {
      const font = calculateOptimalNonSummaryFontSize({
        contentWidth: 450,
        contentHeight: 220,
        scale: 1.5,
        maxLanes: 4,
        laneColumns: 2, // 2 columns -> ~220px width per badge
        hasTeam: false,
        longestDriverNameLength: 8,
      });
      expect(font).toBeGreaterThanOrEqual(18);
      expect(font).toBeLessThanOrEqual(48);
    });

    it("should adjust font size based on laneColumns width", () => {
      const font1Col = calculateOptimalNonSummaryFontSize({
        contentWidth: 400,
        contentHeight: 200,
        scale: 1.0,
        maxLanes: 4,
        laneColumns: 1, // wide badges
        hasTeam: false,
        longestDriverNameLength: 10,
      });
      const font4Cols = calculateOptimalNonSummaryFontSize({
        contentWidth: 400,
        contentHeight: 200,
        scale: 1.0,
        maxLanes: 4,
        laneColumns: 4, // narrow badges (~95px)
        hasTeam: false,
        longestDriverNameLength: 10,
      });

      expect(font4Cols).toBeLessThan(font1Col);
    });

    it("should account for team names occupying vertical height", () => {
      const fontWithoutTeam = calculateOptimalNonSummaryFontSize({
        contentWidth: 300,
        contentHeight: 60, // constrained vertical height
        scale: 1.0,
        maxLanes: 2,
        laneColumns: 1,
        hasTeam: false,
        longestDriverNameLength: 8,
      });
      const fontWithTeam = calculateOptimalNonSummaryFontSize({
        contentWidth: 300,
        contentHeight: 60,
        scale: 1.0,
        maxLanes: 2,
        laneColumns: 1,
        hasTeam: true,
        longestDriverNameLength: 8,
      });

      expect(fontWithTeam).toBeLessThan(fontWithoutTeam);
    });

    it("should clamp to minimum 8px on tiny containers and handle 0 or negative dimensions", () => {
      expect(
        calculateOptimalNonSummaryFontSize({
          contentWidth: 0,
          contentHeight: 0,
          scale: 1.0,
          maxLanes: 4,
          laneColumns: 4,
          hasTeam: false,
          longestDriverNameLength: 8,
        }),
      ).toBe(12);

      const tinyFont = calculateOptimalNonSummaryFontSize({
        contentWidth: 40,
        contentHeight: 30,
        scale: 1.0,
        maxLanes: 4,
        laneColumns: 4,
        hasTeam: false,
        longestDriverNameLength: 10,
      });
      expect(tinyFont).toBe(8);
    });
  });
});

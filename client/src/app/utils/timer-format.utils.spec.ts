import {
  formatTimerDisplay,
  isSubsecondActive,
  TimerFormatOptions,
} from "./timer-format.utils";

describe("TimerFormatUtils", () => {
  describe("isSubsecondActive", () => {
    it("should return false when decimals is 0", () => {
      expect(
        isSubsecondActive(5, { subsecondDecimals: 0, subsecondMode: "always" }),
      ).toBeFalse();
    });

    it("should return false when mode is never", () => {
      expect(
        isSubsecondActive(5, {
          subsecondDecimals: 2,
          subsecondMode: "never",
          subsecondThreshold: 10,
        }),
      ).toBeFalse();
    });

    it("should return true when mode is always and time > 0", () => {
      expect(
        isSubsecondActive(75, {
          subsecondDecimals: 2,
          subsecondMode: "always",
        }),
      ).toBeTrue();
    });

    it("should return true when mode is threshold and time <= threshold", () => {
      expect(
        isSubsecondActive(9.5, {
          subsecondDecimals: 2,
          subsecondMode: "threshold",
          subsecondThreshold: 10,
        }),
      ).toBeTrue();
      expect(
        isSubsecondActive(10, {
          subsecondDecimals: 2,
          subsecondMode: "threshold",
          subsecondThreshold: 10,
        }),
      ).toBeTrue();
    });

    it("should return false when mode is threshold and time > threshold", () => {
      expect(
        isSubsecondActive(10.1, {
          subsecondDecimals: 2,
          subsecondMode: "threshold",
          subsecondThreshold: 10,
        }),
      ).toBeFalse();
      expect(
        isSubsecondActive(65, {
          subsecondDecimals: 2,
          subsecondMode: "threshold",
          subsecondThreshold: 10,
        }),
      ).toBeFalse();
    });

    it("should return false when time <= 0 in threshold mode", () => {
      expect(
        isSubsecondActive(0, {
          subsecondDecimals: 2,
          subsecondMode: "threshold",
          subsecondThreshold: 10,
        }),
      ).toBeFalse();
    });
  });

  describe("formatTimerDisplay - dynamic format (default)", () => {
    const defaultOpts: TimerFormatOptions = {
      format: "dynamic",
      subsecondMode: "threshold",
      subsecondThreshold: 10,
      subsecondDecimals: 2,
    };

    it("should format hours (> 1 hr) as H:MM:SS", () => {
      expect(formatTimerDisplay(3665, defaultOpts)).toBe("1:01:05");
      expect(formatTimerDisplay(7200, defaultOpts)).toBe("2:00:00");
    });

    it("should format minutes (> 1 min) as M:SS without leading zero on minutes", () => {
      expect(formatTimerDisplay(361, defaultOpts)).toBe("6:01");
      expect(formatTimerDisplay(65, defaultOpts)).toBe("1:05");
      expect(formatTimerDisplay(83, defaultOpts)).toBe("1:23");
    });

    it("should format seconds (< 1 min, > threshold) as S", () => {
      expect(formatTimerDisplay(45, defaultOpts)).toBe("45");
      expect(
        formatTimerDisplay(59.9, { ...defaultOpts, subsecondThreshold: 10 }),
      ).toBe("59");
      expect(formatTimerDisplay(15, defaultOpts)).toBe("15");
    });

    it("should format subseconds when time <= threshold", () => {
      expect(formatTimerDisplay(9.5, defaultOpts)).toBe("9.50");
      expect(formatTimerDisplay(0.25, defaultOpts)).toBe("0.25");
    });

    it("should format zero as '0'", () => {
      expect(formatTimerDisplay(0, defaultOpts)).toBe("0");
      expect(formatTimerDisplay(-1, defaultOpts)).toBe("0");
    });
  });

  describe("formatTimerDisplay - mm_ss format", () => {
    const mmSsOpts: TimerFormatOptions = {
      format: "mm_ss",
      subsecondMode: "threshold",
      subsecondThreshold: 10,
      subsecondDecimals: 2,
    };

    it("should always pad minutes to 2 digits", () => {
      expect(formatTimerDisplay(83, mmSsOpts)).toBe("01:23");
      expect(formatTimerDisplay(45, mmSsOpts)).toBe("00:45");
      expect(
        formatTimerDisplay(9, { ...mmSsOpts, subsecondMode: "never" }),
      ).toBe("00:09");
    });

    it("should show subseconds when under threshold with padded minutes", () => {
      expect(formatTimerDisplay(9.5, mmSsOpts)).toBe("00:09.50");
      expect(formatTimerDisplay(0.5, mmSsOpts)).toBe("00:00.50");
    });

    it("should format zero as '00:00'", () => {
      expect(formatTimerDisplay(0, mmSsOpts)).toBe("00:00");
    });

    it("should format hours when > 1 hr", () => {
      expect(formatTimerDisplay(3665, mmSsOpts)).toBe("1:01:05");
    });
  });

  describe("formatTimerDisplay - m_ss format", () => {
    const mSsOpts: TimerFormatOptions = {
      format: "m_ss",
      subsecondMode: "threshold",
      subsecondThreshold: 10,
      subsecondDecimals: 2,
    };

    it("should keep single digit minutes when >= 1 min and show 0:SS under 1 min", () => {
      expect(formatTimerDisplay(83, mSsOpts)).toBe("1:23");
      expect(formatTimerDisplay(45, mSsOpts)).toBe("0:45");
      expect(
        formatTimerDisplay(9, { ...mSsOpts, subsecondMode: "never" }),
      ).toBe("0:09");
    });

    it("should show subseconds with minutes retained", () => {
      expect(formatTimerDisplay(9.5, mSsOpts)).toBe("0:09.50");
    });

    it("should format zero as '0:00'", () => {
      expect(formatTimerDisplay(0, mSsOpts)).toBe("0:00");
    });
  });

  describe("formatTimerDisplay - hh_mm_ss format", () => {
    const hhMmSsOpts: TimerFormatOptions = {
      format: "hh_mm_ss",
      subsecondMode: "threshold",
      subsecondThreshold: 10,
      subsecondDecimals: 2,
    };

    it("should format with fixed HH:MM:SS", () => {
      expect(formatTimerDisplay(3665, hhMmSsOpts)).toBe("01:01:05");
      expect(formatTimerDisplay(83, hhMmSsOpts)).toBe("00:01:23");
      expect(formatTimerDisplay(45, hhMmSsOpts)).toBe("00:00:45");
    });

    it("should format zero as '00:00:00'", () => {
      expect(formatTimerDisplay(0, hhMmSsOpts)).toBe("00:00:00");
    });

    it("should format subseconds with full clock", () => {
      expect(formatTimerDisplay(9.5, hhMmSsOpts)).toBe("00:00:09.50");
    });
  });

  describe("formatTimerDisplay - seconds format", () => {
    const secOpts: TimerFormatOptions = {
      format: "seconds",
      subsecondMode: "threshold",
      subsecondThreshold: 10,
      subsecondDecimals: 2,
    };

    it("should format total elapsed or remaining seconds", () => {
      expect(formatTimerDisplay(3665, secOpts)).toBe("3665");
      expect(formatTimerDisplay(83, secOpts)).toBe("83");
      expect(formatTimerDisplay(45, secOpts)).toBe("45");
    });

    it("should format subseconds on total seconds", () => {
      expect(formatTimerDisplay(9.5, secOpts)).toBe("9.50");
      expect(
        formatTimerDisplay(83.42, { ...secOpts, subsecondMode: "always" }),
      ).toBe("83.42");
    });

    it("should format zero as '0'", () => {
      expect(formatTimerDisplay(0, secOpts)).toBe("0");
    });
  });

  describe("formatTimerDisplay - subsecond modes (always, never, threshold)", () => {
    it("should show subseconds throughout entire race when mode is always", () => {
      const alwaysOpts: TimerFormatOptions = {
        format: "mm_ss",
        subsecondMode: "always",
        subsecondDecimals: 2,
      };
      expect(formatTimerDisplay(75.45, alwaysOpts)).toBe("01:15.45");
      expect(formatTimerDisplay(45.2, alwaysOpts)).toBe("00:45.20");
      expect(formatTimerDisplay(0, alwaysOpts)).toBe("00:00.00");
    });

    it("should never show subseconds when mode is never", () => {
      const neverOpts: TimerFormatOptions = {
        format: "dynamic",
        subsecondMode: "never",
        subsecondThreshold: 10,
        subsecondDecimals: 2,
      };
      expect(formatTimerDisplay(9.5, neverOpts)).toBe("9");
      expect(formatTimerDisplay(0.5, neverOpts)).toBe("0");
    });

    it("should respect decimal places (1, 2, 3)", () => {
      expect(
        formatTimerDisplay(9.5, {
          format: "dynamic",
          subsecondMode: "always",
          subsecondDecimals: 1,
        }),
      ).toBe("9.5");

      expect(
        formatTimerDisplay(9.5, {
          format: "dynamic",
          subsecondMode: "always",
          subsecondDecimals: 3,
        }),
      ).toBe("9.500");
    });

    it("should properly handle rounding rollover (e.g. 59.999 with 2 decimals rolls over to 01:00.00)", () => {
      const alwaysMmSs: TimerFormatOptions = {
        format: "mm_ss",
        subsecondMode: "always",
        subsecondDecimals: 2,
      };
      expect(formatTimerDisplay(59.999, alwaysMmSs)).toBe("01:00.00");
    });
  });
});

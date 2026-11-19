import { ChangeDetectorRef } from "@angular/core";
import { ICustomHeat } from "@app/proto/antigravity";

import {
  allocateRotationHighlightColor,
  getContrastTextColor,
  ROTATION_DRIVER_HIGHLIGHT_PALETTE,
  RotationHighlightManager,
} from "./rotation-highlight.helper";

describe("RotationHighlightManager and helpers", () => {
  describe("allocateRotationHighlightColor", () => {
    it("should allocate the first color in palette when no colors are used", () => {
      const color = allocateRotationHighlightColor(new Set());
      expect(color).toBe(ROTATION_DRIVER_HIGHLIGHT_PALETTE[0]);
    });

    it("should allocate the next unused color", () => {
      const used = new Set([
        ROTATION_DRIVER_HIGHLIGHT_PALETTE[0].toLowerCase(),
      ]);
      const color = allocateRotationHighlightColor(used);
      expect(color).toBe(ROTATION_DRIVER_HIGHLIGHT_PALETTE[1]);
    });

    it("should generate HSL color when palette is exhausted", () => {
      const used = new Set(
        ROTATION_DRIVER_HIGHLIGHT_PALETTE.map((c) => c.toLowerCase()),
      );
      const color = allocateRotationHighlightColor(used);
      expect(color).toMatch(/^hsl\(\d+,\s*90%,\s*55%\)$/);
    });
  });

  describe("getContrastTextColor", () => {
    it("should return dark text for bright colors", () => {
      expect(getContrastTextColor("#ffffff")).toBe("#0f172a");
      expect(getContrastTextColor("#f59e0b")).toBe("#0f172a");
    });

    it("should return white text for dark colors", () => {
      expect(getContrastTextColor("#0f172a")).toBe("#ffffff");
      expect(getContrastTextColor("#000000")).toBe("#ffffff");
      expect(getContrastTextColor("#1e293b")).toBe("#ffffff");
    });

    it("should support 3-digit hex colors", () => {
      expect(getContrastTextColor("#fff")).toBe("#0f172a");
      expect(getContrastTextColor("#000")).toBe("#ffffff");
    });

    it("should support HSL colors", () => {
      expect(getContrastTextColor("hsl(120, 90%, 80%)")).toBe("#0f172a");
      expect(getContrastTextColor("hsl(120, 90%, 30%)")).toBe("#ffffff");
    });

    it("should fallback to dark text for empty color", () => {
      expect(getContrastTextColor("")).toBe("#0f172a");
    });
  });

  describe("RotationHighlightManager", () => {
    let mockCdr: jasmine.SpyObj<ChangeDetectorRef>;
    let manager: RotationHighlightManager;

    beforeEach(() => {
      mockCdr = jasmine.createSpyObj("ChangeDetectorRef", ["markForCheck"]);
      manager = new RotationHighlightManager(mockCdr);
    });

    it("should start with no highlighted drivers", () => {
      expect(manager.hasHighlightedDrivers()).toBeFalse();
      expect(manager.isDriverHighlighted(1)).toBeFalse();
      expect(manager.getDriverHighlightColor(1)).toBeNull();
    });

    it("should ignore invalid driverIds (null, undefined, 0)", () => {
      manager.toggleDriverHighlight(null);
      manager.toggleDriverHighlight(undefined);
      manager.toggleDriverHighlight(0);

      expect(manager.hasHighlightedDrivers()).toBeFalse();
      expect(mockCdr.markForCheck).not.toHaveBeenCalled();
    });

    it("should toggle driver highlight on and off", () => {
      manager.toggleDriverHighlight(1);
      expect(manager.isDriverHighlighted(1)).toBeTrue();
      expect(manager.getDriverHighlightColor(1)).toBe(
        ROTATION_DRIVER_HIGHLIGHT_PALETTE[0],
      );
      expect(mockCdr.markForCheck).toHaveBeenCalledTimes(1);

      manager.toggleDriverHighlight(1);
      expect(manager.isDriverHighlighted(1)).toBeFalse();
      expect(manager.getDriverHighlightColor(1)).toBeNull();
      expect(mockCdr.markForCheck).toHaveBeenCalledTimes(2);
    });

    it("should highlight step-up drivers (negative IDs)", () => {
      manager.toggleDriverHighlight(-1);
      expect(manager.isDriverHighlighted(-1)).toBeTrue();
      expect(manager.getDriverHighlightColor(-1)).toBe(
        ROTATION_DRIVER_HIGHLIGHT_PALETTE[0],
      );
    });

    it("should ignore non-primary mouse clicks (right click)", () => {
      const rightClick = new MouseEvent("click", { button: 2 });
      spyOn(rightClick, "stopPropagation");

      manager.toggleDriverHighlight(1, rightClick);
      expect(rightClick.stopPropagation).toHaveBeenCalled();
      expect(manager.isDriverHighlighted(1)).toBeFalse();
    });

    it("should stop propagation on valid left click", () => {
      const leftClick = new MouseEvent("click", { button: 0 });
      spyOn(leftClick, "stopPropagation");

      manager.toggleDriverHighlight(1, leftClick);
      expect(leftClick.stopPropagation).toHaveBeenCalled();
      expect(manager.isDriverHighlighted(1)).toBeTrue();
    });

    it("should allocate distinct colors for multiple drivers", () => {
      manager.toggleDriverHighlight(1);
      manager.toggleDriverHighlight(2);
      manager.toggleDriverHighlight(-1);

      const color1 = manager.getDriverHighlightColor(1);
      const color2 = manager.getDriverHighlightColor(2);
      const color3 = manager.getDriverHighlightColor(-1);

      expect(color1).not.toBe(color2);
      expect(color1).not.toBe(color3);
      expect(color2).not.toBe(color3);
    });

    it("should clear all highlights", () => {
      manager.toggleDriverHighlight(1);
      manager.toggleDriverHighlight(2);
      expect(manager.hasHighlightedDrivers()).toBeTrue();

      manager.clearDriverHighlights();
      expect(manager.hasHighlightedDrivers()).toBeFalse();
      expect(manager.isDriverHighlighted(1)).toBeFalse();
      expect(manager.isDriverHighlighted(2)).toBeFalse();
    });

    it("should check if a heat is highlighted", () => {
      const heat1: ICustomHeat = { driverIndices: [1, 2, 0, 0] };
      const heat2: ICustomHeat = { driverIndices: [3, 4, 0, 0] };

      expect(manager.isHeatHighlighted(heat1)).toBeFalse();
      expect(manager.isHeatHighlighted(heat2)).toBeFalse();

      manager.toggleDriverHighlight(1);
      expect(manager.isHeatHighlighted(heat1)).toBeTrue();
      expect(manager.isHeatHighlighted(heat2)).toBeFalse();
      expect(manager.isHeatHighlighted(null)).toBeFalse();
    });

    it("should extract heat highlight colors for highlighted drivers in heat", () => {
      const heat: ICustomHeat = { driverIndices: [1, 2, 3, 0] };

      expect(manager.getHeatHighlightColors(heat)).toEqual([]);

      manager.toggleDriverHighlight(1);
      manager.toggleDriverHighlight(3);

      const colors = manager.getHeatHighlightColors(heat);
      expect(colors.length).toBe(2);
      expect(colors[0]).toBe(manager.getDriverHighlightColor(1)!);
      expect(colors[1]).toBe(manager.getDriverHighlightColor(3)!);
      expect(manager.getHeatHighlightColors(null)).toEqual([]);
    });
  });
});

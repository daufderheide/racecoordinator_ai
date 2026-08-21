import { fakeAsync, TestBed, tick } from "@angular/core/testing";

import { PrintService } from "./print.service";

describe("PrintService", () => {
  let service: PrintService;
  let printSpy: jasmine.Spy;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PrintService],
    });
    service = TestBed.inject(PrintService);
    printSpy = spyOn(window, "print").and.stub();
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should call window.print after timeout", fakeAsync(() => {
    service.print();
    expect(printSpy).not.toHaveBeenCalled();
    tick(100);
    expect(printSpy).toHaveBeenCalled();
  }));

  it("should add and remove print-full-scroll class if fullScroll is true", fakeAsync(() => {
    const bodyClassList = document.body.classList;
    const htmlClassList = document.documentElement.classList;
    expect(bodyClassList.contains("print-full-scroll")).toBeFalse();
    expect(htmlClassList.contains("print-full-scroll")).toBeFalse();

    service.print(undefined, true);
    // At this point (before tick), it should have added the class
    expect(bodyClassList.contains("print-full-scroll")).toBeTrue();
    expect(htmlClassList.contains("print-full-scroll")).toBeTrue();

    tick(100);
    // After print finishes, the class should be removed
    expect(bodyClassList.contains("print-full-scroll")).toBeFalse();
    expect(htmlClassList.contains("print-full-scroll")).toBeFalse();
  }));

  it("should add and remove print-no-background class if includeBackground is false", fakeAsync(() => {
    const bodyClassList = document.body.classList;
    const htmlClassList = document.documentElement.classList;
    expect(bodyClassList.contains("print-no-background")).toBeFalse();
    expect(htmlClassList.contains("print-no-background")).toBeFalse();

    service.print(undefined, false, undefined, false);
    expect(bodyClassList.contains("print-no-background")).toBeTrue();
    expect(htmlClassList.contains("print-no-background")).toBeTrue();

    tick(100);
    expect(bodyClassList.contains("print-no-background")).toBeFalse();
    expect(htmlClassList.contains("print-no-background")).toBeFalse();
  }));

  it("should change and restore document.title when pageName is provided", fakeAsync(() => {
    const originalTitle = document.title;
    const testPageName = "TestPage";

    service.print(testPageName);

    // In the microtask before print, the title should be updated
    // Format: `${pageName}--${yyyy}-${mm}-${dd}--${hh}-${min}-${ss}_${ampm}`
    const updatedTitle = document.title;
    expect(updatedTitle).toContain(testPageName);
    expect(updatedTitle).toMatch(
      /TestPage--\d{4}-\d{2}-\d{2}--\d{2}-\d{2}-\d{2}_(AM|PM)/,
    );

    tick(100);

    // After print finishes, it should restore the original title
    expect(document.title).toBe(originalTitle);
  }));

  it("should use the provided timestamp for the filename instead of current time", fakeAsync(() => {
    const fixedDate = new Date(2024, 5, 15, 14, 30, 45); // June 15, 2024 2:30:45 PM

    service.print("Race Results", false, fixedDate);

    const updatedTitle = document.title;
    expect(updatedTitle).toBe("Race Results--2024-06-15--02-30-45_PM");

    tick(100);
  }));

  describe("formatExportTimestamp", () => {
    it("should format a fixed date correctly", () => {
      const fixedDate = new Date(2024, 5, 15, 14, 30, 45); // June 15, 2024 2:30:45 PM
      const result = service.formatExportTimestamp(fixedDate);
      expect(result).toBe("--2024-06-15--02-30-45_PM");
    });

    it("should handle midnight (12 AM)", () => {
      const midnight = new Date(2024, 0, 1, 0, 5, 10);
      const result = service.formatExportTimestamp(midnight);
      expect(result).toBe("--2024-01-01--12-05-10_AM");
    });

    it("should handle noon (12 PM)", () => {
      const noon = new Date(2024, 0, 1, 12, 0, 0);
      const result = service.formatExportTimestamp(noon);
      expect(result).toBe("--2024-01-01--12-00-00_PM");
    });

    it("should default to current time when no timestamp is provided", () => {
      const result = service.formatExportTimestamp();
      expect(result).toMatch(/--\d{4}-\d{2}-\d{2}--\d{2}-\d{2}-\d{2}_(AM|PM)/);
    });
  });
});

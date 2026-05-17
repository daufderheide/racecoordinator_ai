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
    const classList = document.body.classList;
    expect(classList.contains("print-full-scroll")).toBeFalse();

    service.print(undefined, true);
    // At this point (before tick), it should have added the class
    expect(classList.contains("print-full-scroll")).toBeTrue();

    tick(100);
    // After print finishes, the class should be removed
    expect(classList.contains("print-full-scroll")).toBeFalse();
  }));

  it("should change and restore document.title when pageName is provided", fakeAsync(() => {
    const originalTitle = document.title;
    const testPageName = "TestPage";

    service.print(testPageName);

    // In the microtask before print, the title should be updated
    // Format: `${pageName} -- ${yyyy}-${mm}-${dd} -- ${hh}-${min}-${ss}_${ampm}`
    const updatedTitle = document.title;
    expect(updatedTitle).toContain(testPageName);
    expect(updatedTitle).toMatch(
      /TestPage -- \d{4}-\d{2}-\d{2} -- \d{2}-\d{2}-\d{2}_(AM|PM)/,
    );

    tick(100);

    // After print finishes, it should restore the original title
    expect(document.title).toBe(originalTitle);
  }));
});

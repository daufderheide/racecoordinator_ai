import { TestbedHarnessEnvironment } from "@angular/cdk/testing/testbed";
import { Component, input, output } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ActivatedRoute, Router } from "@angular/router";
import { of } from "rxjs";
import { TranslationService } from "@app/services/translation.service";

import { EditorTitleComponent } from "./editor-title.component";
import { EditorTitleHarness } from "./testing/editor-title.harness";

@Component({
  selector: "app-toolbar",
  standalone: true,
  template: '<button id="help-track-btn" (click)="help.emit()">Help</button>',
})
class MockToolbarComponent {
  showUndo = input<boolean>(true);
  showRedo = input<boolean>(true);
  showHelp = input<boolean>(true);
  showAdd = input<boolean>(false);
  showDelete = input<boolean>(false);
  showCopy = input<boolean>(false);
  isSaving = input<boolean>(false);
  undoManager = input<any>();
  helpSteps = input<any[]>([]);
  helpTitle = input<string>("");
  helpRecordName = input<string | undefined>();
  isHeatsEqual = input<boolean | undefined>(undefined);
  showExpandCollapse = input<boolean>(false);
  allExpanded = input<boolean>(false);
  help = output<void>();
  add = output<void>();
  delete = output<void>();
  copy = output<void>();
  expandCollapse = output<void>();
}

import { Pipe, PipeTransform } from "@angular/core";
@Pipe({ name: "translate" })
class MockTranslatePipe implements PipeTransform {
  transform(value: string): string {
    return value;
  }
}

describe("EditorTitleComponent", () => {
  let component: EditorTitleComponent;
  let fixture: ComponentFixture<EditorTitleComponent>;
  let harness: EditorTitleHarness;
  let mockRouter: any;
  let mockTranslationService: any;

  beforeEach(async () => {
    mockRouter = jasmine.createSpyObj("Router", ["navigate"]);
    mockTranslationService = jasmine.createSpyObj("TranslationService", [
      "translate",
    ]);
    mockTranslationService.translate.and.callFake((key: string) => key);

    await TestBed.configureTestingModule({
      imports: [EditorTitleComponent, MockToolbarComponent, MockTranslatePipe],
      providers: [
        { provide: Router, useValue: mockRouter },
        { provide: TranslationService, useValue: mockTranslationService },
        {
          provide: ActivatedRoute,
          useValue: {
            queryParams: of({}),
            snapshot: {
              queryParamMap: {
                get: jasmine.createSpy("get").and.returnValue(null),
              },
            },
          },
        },
      ],
    }).compileComponents();
  });

  beforeEach(async () => {
    fixture = TestBed.createComponent(EditorTitleComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput("titleKey", "TEST_TITLE");
    harness = await TestbedHarnessEnvironment.harnessForFixture(
      fixture,
      EditorTitleHarness,
    );
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should display title", async () => {
    fixture.detectChanges();
    expect(await harness.getTitle()).toBe("TEST_TITLE");
    expect(await harness.getItemName()).toBeNull();
  });

  it("should not display item name if itemName is whitespace only", async () => {
    fixture.componentRef.setInput("itemName", "   ");
    fixture.detectChanges();
    expect(await harness.getTitle()).toBe("TEST_TITLE");
    expect(await harness.getItemName()).toBeNull();
  });

  it("should display item name when provided and update reactively", async () => {
    fixture.componentRef.setInput("itemName", "Grand Prix 2026");
    fixture.detectChanges();
    expect(await harness.getItemName()).toBe("Grand Prix 2026");
    expect(await harness.getTitle()).toContain("TEST_TITLE");
    expect(await harness.getTitle()).toContain("Grand Prix 2026");

    // Dynamic update
    fixture.componentRef.setInput("itemName", "Championship Finals");
    fixture.detectChanges();
    expect(await harness.getItemName()).toBe("Championship Finals");
  });

  it("should emit help event on click", async () => {
    spyOn(component.help, "emit");
    await harness.clickHelp();
    expect(component.help.emit).toHaveBeenCalled();
  });

  it("should forward isHeatsEqual input", () => {
    fixture.componentRef.setInput("isHeatsEqual", true);
    fixture.detectChanges();
    expect(component.isHeatsEqual()).toBeTrue();
  });

  it("should contain app-browser-navigation element", () => {
    const navEl = fixture.nativeElement.querySelector("app-browser-navigation");
    expect(navEl).toBeTruthy();
  });

  it("should apply has-zoom class to header when showZoom is true", () => {
    const headerEl = fixture.nativeElement.querySelector(".header");
    expect(headerEl.classList.contains("has-zoom")).toBeFalse();

    fixture.componentRef.setInput("showZoom", true);
    fixture.detectChanges();
    expect(headerEl.classList.contains("has-zoom")).toBeTrue();
  });

  it("should set title attribute on item-name element to trimmedItemName", () => {
    fixture.componentRef.setInput("itemName", "  Custom Rotation  ");
    fixture.detectChanges();

    const itemNameEl = fixture.nativeElement.querySelector(".item-name");
    expect(itemNameEl).toBeTruthy();
    expect(itemNameEl.getAttribute("title")).toBe("Custom Rotation");
  });

  describe("Object Review Navigation & Expand/Collapse", () => {
    const testItems = [
      { id: "item-1", name: "Item 1" },
      { id: "item-2", name: "Item 2" },
      { id: "item-3", name: "Item 3" },
    ];

    beforeEach(() => {
      fixture.componentRef.setInput("items", testItems);
      fixture.componentRef.setInput("selectedId", "item-1");
      fixture.detectChanges();
    });

    it("should display prev/next buttons and item counter", async () => {
      expect(await harness.getItemCounter()).toContain("1 / 3");
      expect(await harness.isPreviousDisabled()).toBeTrue();
      expect(await harness.isNextDisabled()).toBeFalse();
    });

    it("should enable both buttons for middle item", async () => {
      fixture.componentRef.setInput("selectedId", "item-2");
      fixture.detectChanges();

      expect(await harness.getItemCounter()).toContain("2 / 3");
      expect(await harness.isPreviousDisabled()).toBeFalse();
      expect(await harness.isNextDisabled()).toBeFalse();
    });

    it("should disable next button on last item", async () => {
      fixture.componentRef.setInput("selectedId", "item-3");
      fixture.detectChanges();

      expect(await harness.getItemCounter()).toContain("3 / 3");
      expect(await harness.isPreviousDisabled()).toBeFalse();
      expect(await harness.isNextDisabled()).toBeTrue();
    });

    it("should disable both navigation buttons in edit mode", async () => {
      fixture.componentRef.setInput("selectedId", "item-2");
      fixture.componentRef.setInput("isEditMode", true);
      fixture.detectChanges();

      expect(await harness.isPreviousDisabled()).toBeTrue();
      expect(await harness.isNextDisabled()).toBeTrue();
    });

    it("should emit selectedIdChange when clicking next and previous", async () => {
      spyOn(component.selectedIdChange, "emit");

      await harness.clickNext();
      expect(component.selectedIdChange.emit).toHaveBeenCalledWith("item-2");

      fixture.componentRef.setInput("selectedId", "item-2");
      fixture.detectChanges();

      await harness.clickPrevious();
      expect(component.selectedIdChange.emit).toHaveBeenCalledWith("item-1");
    });

    it("should advance on ArrowRight, ], and E keys in read-only mode", () => {
      spyOn(component.selectedIdChange, "emit");

      // ArrowRight
      window.dispatchEvent(
        new KeyboardEvent("keydown", { key: "ArrowRight", cancelable: true }),
      );
      expect(component.selectedIdChange.emit).toHaveBeenCalledWith("item-2");

      // ]
      (component.selectedIdChange.emit as jasmine.Spy).calls.reset();
      window.dispatchEvent(
        new KeyboardEvent("keydown", { key: "]", cancelable: true }),
      );
      expect(component.selectedIdChange.emit).toHaveBeenCalledWith("item-2");

      // E
      (component.selectedIdChange.emit as jasmine.Spy).calls.reset();
      window.dispatchEvent(
        new KeyboardEvent("keydown", { key: "e", cancelable: true }),
      );
      expect(component.selectedIdChange.emit).toHaveBeenCalledWith("item-2");
    });

    it("should go to previous on ArrowLeft, [, and Q keys in read-only mode", () => {
      fixture.componentRef.setInput("selectedId", "item-3");
      fixture.detectChanges();

      spyOn(component.selectedIdChange, "emit");

      // ArrowLeft
      window.dispatchEvent(
        new KeyboardEvent("keydown", { key: "ArrowLeft", cancelable: true }),
      );
      expect(component.selectedIdChange.emit).toHaveBeenCalledWith("item-2");

      // [
      (component.selectedIdChange.emit as jasmine.Spy).calls.reset();
      window.dispatchEvent(
        new KeyboardEvent("keydown", { key: "[", cancelable: true }),
      );
      expect(component.selectedIdChange.emit).toHaveBeenCalledWith("item-2");

      // Q
      (component.selectedIdChange.emit as jasmine.Spy).calls.reset();
      window.dispatchEvent(
        new KeyboardEvent("keydown", { key: "q", cancelable: true }),
      );
      expect(component.selectedIdChange.emit).toHaveBeenCalledWith("item-2");
    });

    it("should ignore keyboard navigation when isEditMode is true", () => {
      fixture.componentRef.setInput("isEditMode", true);
      fixture.detectChanges();

      spyOn(component.selectedIdChange, "emit");
      window.dispatchEvent(
        new KeyboardEvent("keydown", { key: "ArrowRight", cancelable: true }),
      );
      window.dispatchEvent(
        new KeyboardEvent("keydown", { key: "e", cancelable: true }),
      );
      expect(component.selectedIdChange.emit).not.toHaveBeenCalled();
    });

    it("should ignore keyboard navigation when an input is focused", () => {
      const inputEl = document.createElement("input");
      document.body.appendChild(inputEl);
      inputEl.focus();

      spyOn(component.selectedIdChange, "emit");
      window.dispatchEvent(
        new KeyboardEvent("keydown", { key: "ArrowRight", cancelable: true }),
      );
      expect(component.selectedIdChange.emit).not.toHaveBeenCalled();

      document.body.removeChild(inputEl);
    });

    it("should ignore keyboard navigation when metaKey or ctrlKey is held", () => {
      spyOn(component.selectedIdChange, "emit");
      window.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "e",
          ctrlKey: true,
          cancelable: true,
        }),
      );
      window.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "ArrowRight",
          metaKey: true,
          cancelable: true,
        }),
      );
      expect(component.selectedIdChange.emit).not.toHaveBeenCalled();
    });

    it("should emit expandCollapse on X key press when showExpandCollapse is true", () => {
      fixture.componentRef.setInput("showExpandCollapse", true);
      fixture.detectChanges();

      spyOn(component.expandCollapse, "emit");
      window.dispatchEvent(
        new KeyboardEvent("keydown", { key: "x", cancelable: true }),
      );
      expect(component.expandCollapse.emit).toHaveBeenCalled();
    });

    it("should not emit expandCollapse on X key when showExpandCollapse is false", () => {
      fixture.componentRef.setInput("showExpandCollapse", false);
      fixture.detectChanges();

      spyOn(component.expandCollapse, "emit");
      window.dispatchEvent(
        new KeyboardEvent("keydown", { key: "x", cancelable: true }),
      );
      expect(component.expandCollapse.emit).not.toHaveBeenCalled();
    });

    it("should not scroll containers back to top when advancing or going to previous", async () => {
      const mockContainer = document.createElement("div");
      mockContainer.className = "sections-wrapper";
      mockContainer.scrollTo = jasmine.createSpy("scrollTo");
      document.body.appendChild(mockContainer);

      try {
        await harness.clickNext();
        expect(mockContainer.scrollTo).not.toHaveBeenCalled();

        component.selectPrevious();
        expect(mockContainer.scrollTo).not.toHaveBeenCalled();
      } finally {
        document.body.removeChild(mockContainer);
      }
    });
  });
});

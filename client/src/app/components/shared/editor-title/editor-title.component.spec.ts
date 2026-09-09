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
  help = output<void>();
  add = output<void>();
  delete = output<void>();
  copy = output<void>();
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
});

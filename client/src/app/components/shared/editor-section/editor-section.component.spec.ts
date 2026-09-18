import { Component } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { TranslationService } from "@app/services/translation.service";

import { EditorSectionComponent } from "./editor-section.component";

@Component({
  standalone: true,
  imports: [EditorSectionComponent],
  template: `
    <app-editor-section
      [titleKey]="titleKey"
      [titleText]="titleText"
      [(expanded)]="expanded"
      [sectionId]="sectionId"
      [headerId]="headerId"
      [headingLevel]="headingLevel"
      [collapsible]="collapsible"
      [customClass]="customClass"
      (toggle)="onToggle($event)"
    >
      <span header-badge class="test-badge">ALPHA</span>
      <button header-actions class="test-action-btn">Action</button>
      <div class="projected-body">Section Body Content</div>
    </app-editor-section>
  `,
})
class TestHostComponent {
  titleKey?: string = "TEST_TITLE_KEY";
  titleText?: string;
  expanded: boolean = true;
  sectionId?: string = "test-section-id";
  headerId?: string = "test-header-id";
  headingLevel: "h1" | "h2" | "h3" | "h4" = "h1";
  collapsible: boolean = true;
  customClass?: string = "custom-test-class";
  lastToggledValue?: boolean;

  onToggle(val: boolean) {
    this.lastToggledValue = val;
  }
}

describe("EditorSectionComponent", () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let host: TestHostComponent;
  let mockTranslationService: any;

  beforeEach(async () => {
    mockTranslationService = jasmine.createSpyObj("TranslationService", [
      "translate",
    ]);
    mockTranslationService.translate.and.callFake(
      (key: string) => `Translated_${key}`,
    );

    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
      providers: [
        { provide: TranslationService, useValue: mockTranslationService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should render the section with sectionId, headerId, and customClass", () => {
    const sectionEl = fixture.debugElement.query(By.css(".config-section"));
    expect(sectionEl.nativeElement.id).toBe("test-section-id");
    expect(
      sectionEl.nativeElement.classList.contains("custom-test-class"),
    ).toBeTrue();

    const headerEl = fixture.debugElement.query(By.css(".section-header"));
    expect(headerEl.nativeElement.id).toBe("test-header-id");
  });

  it("should translate titleKey using TranslationService", () => {
    const h1El = fixture.debugElement.query(By.css(".section-header h1"));
    expect(h1El.nativeElement.textContent.trim()).toBe(
      "Translated_TEST_TITLE_KEY",
    );
  });

  it("should render titleText when titleKey is undefined", () => {
    host.titleKey = undefined;
    host.titleText = "Direct Title Text";
    fixture.detectChanges();

    const h1El = fixture.debugElement.query(By.css(".section-header h1"));
    expect(h1El.nativeElement.textContent.trim()).toBe("Direct Title Text");
  });

  it("should render correct heading tags based on headingLevel input", () => {
    host.headingLevel = "h4";
    fixture.detectChanges();
    expect(
      fixture.debugElement.query(By.css(".section-header h4")),
    ).toBeTruthy();
    expect(
      fixture.debugElement.query(By.css(".section-header h1")),
    ).toBeFalsy();

    host.headingLevel = "h3";
    fixture.detectChanges();
    expect(
      fixture.debugElement.query(By.css(".section-header h3")),
    ).toBeTruthy();

    host.headingLevel = "h2";
    fixture.detectChanges();
    expect(
      fixture.debugElement.query(By.css(".section-header h2")),
    ).toBeTruthy();
  });

  it("should project content, header badge, and header actions", () => {
    const badge = fixture.debugElement.query(By.css(".test-badge"));
    expect(badge).toBeTruthy();
    expect(badge.nativeElement.textContent).toBe("ALPHA");

    const actionBtn = fixture.debugElement.query(By.css(".test-action-btn"));
    expect(actionBtn).toBeTruthy();

    const body = fixture.debugElement.query(By.css(".projected-body"));
    expect(body).toBeTruthy();
    expect(body.nativeElement.textContent).toBe("Section Body Content");
  });

  it("should toggle expanded state on header click and emit events", () => {
    const headerEl = fixture.debugElement.query(By.css(".section-header"));
    headerEl.nativeElement.click();
    fixture.detectChanges();

    expect(host.expanded).toBeFalse();
    expect(host.lastToggledValue).toBeFalse();
    expect(fixture.debugElement.query(By.css(".section-content"))).toBeFalsy();

    headerEl.nativeElement.click();
    fixture.detectChanges();

    expect(host.expanded).toBeTrue();
    expect(host.lastToggledValue).toBeTrue();
    expect(fixture.debugElement.query(By.css(".section-content"))).toBeTruthy();
  });

  it("should toggle on Enter and Space keydown events", () => {
    const headerEl = fixture.debugElement.query(By.css(".section-header"));
    const enterEvent = new KeyboardEvent("keydown", { key: "Enter" });
    headerEl.nativeElement.dispatchEvent(enterEvent);
    fixture.detectChanges();

    expect(host.expanded).toBeFalse();

    const spaceEvent = new KeyboardEvent("keydown", { key: " " });
    headerEl.nativeElement.dispatchEvent(spaceEvent);
    fixture.detectChanges();

    expect(host.expanded).toBeTrue();
  });

  it("should not toggle when collapsible is false", () => {
    host.collapsible = false;
    fixture.detectChanges();

    const expanderIcon = fixture.debugElement.query(By.css(".expander-icon"));
    expect(expanderIcon).toBeFalsy();

    const headerEl = fixture.debugElement.query(By.css(".section-header"));
    expect(headerEl.nativeElement.getAttribute("role")).toBeNull();
    expect(headerEl.nativeElement.getAttribute("tabindex")).toBeNull();

    headerEl.nativeElement.click();
    fixture.detectChanges();

    expect(host.expanded).toBeTrue();
  });
});

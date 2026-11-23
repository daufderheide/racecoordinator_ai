import { ComponentFixture, TestBed } from "@angular/core/testing";
import { TranslationService } from "@app/services/translation.service";
import {
  mockTranslationService,
  resetMocks,
} from "@app/testing/unit-test-mocks";

import { PreviewBadgeComponent } from "./preview-badge.component";

describe("PreviewBadgeComponent", () => {
  let fixture: ComponentFixture<PreviewBadgeComponent>;

  beforeEach(async () => {
    mockTranslationService.translate.and.callFake((key: string) => key);
    await TestBed.configureTestingModule({
      imports: [PreviewBadgeComponent],
      providers: [
        { provide: TranslationService, useValue: mockTranslationService },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(PreviewBadgeComponent);
    fixture.detectChanges();
  });

  afterEach(() => resetMocks());

  const badge = (): HTMLElement =>
    fixture.nativeElement.querySelector(".preview-badge");

  it("shows the label and explains it in the tooltip", () => {
    expect(badge().textContent).toContain("PREVIEW_BADGE");
    expect(badge().getAttribute("title")).toBe("PREVIEW_BADGE_TOOLTIP");
    expect(badge().getAttribute("aria-label")).toBe("PREVIEW_BADGE_TOOLTIP");
  });

  it("is small by default", () => {
    expect(badge().classList).not.toContain("large");
  });

  it("can be large", () => {
    fixture.componentRef.setInput("size", "large");
    fixture.detectChanges();
    expect(badge().classList).toContain("large");
  });
});

import { Component } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { GuideStep } from "@app/services/help.service";

import { GuideStepTestHelper } from "./guide-step-test.helper";

@Component({
  standalone: true,
  template: `
    <div id="section-one" class="box-one">Section 1</div>
    <div id="section-two" class="box-two">Section 2</div>
  `,
})
class TestHostComponent {}

describe("GuideStepTestHelper", () => {
  let fixture: ComponentFixture<TestHostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
  });

  it("should successfully validate steps whose targetId and selector exist in the DOM", () => {
    const onEnterSpy = jasmine.createSpy("onEnter");
    const onLeaveSpy = jasmine.createSpy("onLeave");

    const steps: GuideStep[] = [
      {
        title: "Welcome Modal",
        content: "Intro text with no selector",
      },
      {
        targetId: "section-one",
        title: "Step 1",
        content:
          'Explaining section 1 with <a href="#" class="help-link help-article-test-guide help-section-one">Link</a>',
        onEnter: onEnterSpy,
        onLeave: onLeaveSpy,
      },
      {
        selector: ".box-two",
        title: "Step 2",
        content:
          'Explaining section 2 with <a href="#" class="help-link help-article-test-guide">Link</a>',
      },
    ];

    expect(() => {
      GuideStepTestHelper.verifyGuideStepsExistInDom(fixture, steps);
    }).not.toThrow();

    expect(onEnterSpy).toHaveBeenCalled();
    expect(onLeaveSpy).toHaveBeenCalled();
  });

  it("should validate well-formed help links with valid kebab-case article and section names", () => {
    const validContent =
      'Check <a class="help-link help-article-raceday-setup help-section-available-drivers">Drivers</a> for details.';
    expect(() => {
      GuideStepTestHelper.verifyHelpLinksInContent(validContent);
    }).not.toThrow();
  });
});

import { Component } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";

import { PartTextStyleDirective } from "./part-text-style.directive";

@Component({
  standalone: true,
  imports: [PartTextStyleDirective],
  template: `<span [appPartTextStyle]="settings" partPrefix="header"
    >Text</span
  >`,
})
class HostComponent {
  settings: Record<string, any> | null = {};
}

describe("PartTextStyleDirective", () => {
  let fixture: ComponentFixture<HostComponent>;
  const span = () =>
    fixture.nativeElement.querySelector("span") as HTMLSpanElement;

  beforeEach(() => {
    fixture = TestBed.createComponent(HostComponent);
  });

  it("adds nothing when the part has no style settings (its own CSS look stays)", () => {
    fixture.detectChanges();
    expect(span().style.fontWeight).toBe("");
    expect(span().style.letterSpacing).toBe("");
    expect(span().style.textTransform).toBe("");
  });

  it("applies weight, letter spacing and case from <prefix> keys", () => {
    fixture.componentInstance.settings = {
      headerFontWeight: "bold",
      headerLetterSpacing: 3,
      headerTextTransform: "uppercase",
    };
    fixture.detectChanges();
    expect(span().style.fontWeight).toBe("bold");
    expect(span().style.letterSpacing).toBe("3px");
    expect(span().style.textTransform).toBe("uppercase");
  });

  it("ignores other parts' keys and unknown values", () => {
    fixture.componentInstance.settings = {
      valueFontWeight: "bold",
      headerFontWeight: "heavy",
      headerTextTransform: "capitalize",
      headerLetterSpacing: "wide",
    };
    fixture.detectChanges();
    expect(span().style.fontWeight).toBe("");
    expect(span().style.textTransform).toBe("");
    expect(span().style.letterSpacing).toBe("");
  });

  it("lets 0 spacing and 'as typed' override a part that has them in CSS", () => {
    fixture.componentInstance.settings = {
      headerLetterSpacing: 0,
      headerTextTransform: "none",
      headerFontWeight: "normal",
    };
    fixture.detectChanges();
    expect(span().style.letterSpacing).toBe("0px");
    expect(span().style.textTransform).toBe("none");
    expect(span().style.fontWeight).toBe("normal");
  });
});

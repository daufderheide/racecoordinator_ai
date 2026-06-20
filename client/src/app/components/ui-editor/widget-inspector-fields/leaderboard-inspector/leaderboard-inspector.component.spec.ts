import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FormsModule } from "@angular/forms";
import { TranslatePipe } from "@app/pipes/translate.pipe";

import { LeaderboardInspectorComponent } from "./leaderboard-inspector.component";

describe("LeaderboardInspectorComponent", () => {
  let component: LeaderboardInspectorComponent;
  let fixture: ComponentFixture<LeaderboardInspectorComponent>;
  let changeSpy: jasmine.Spy;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormsModule, LeaderboardInspectorComponent, TranslatePipe],
    }).compileComponents();

    fixture = TestBed.createComponent(LeaderboardInspectorComponent);
    component = fixture.componentInstance;

    // Set required input
    fixture.componentRef.setInput("settings", {
      titleFontFamily: "",
      titleFontSize: 18,
      titleTextColor: "",
      overallLeaderFontFamily: "",
      overallLeaderFontSize: 16,
      overallLeaderTextColor: "",
      restFontFamily: "",
      restFontSize: 16,
      restTextColor: "",
    });

    changeSpy = spyOn(component.change, "emit");
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should emit change when general settings change", () => {
    component.onSettingsChange();
    expect(changeSpy).toHaveBeenCalled();
  });

  it("should update color and emit change on onColorChange", () => {
    const event = {
      target: {
        value: "#ff0000",
      },
    } as any;

    component.onColorChange("titleTextColor", event);
    expect(component.settings().titleTextColor).toBe("#ff0000");
    expect(changeSpy).toHaveBeenCalled();
  });

  it("should reset color to empty string and emit change on resetColor", () => {
    component.settings().titleTextColor = "#ffffff";
    component.resetColor("titleTextColor");
    expect(component.settings().titleTextColor).toBe("");
    expect(changeSpy).toHaveBeenCalled();
  });
});

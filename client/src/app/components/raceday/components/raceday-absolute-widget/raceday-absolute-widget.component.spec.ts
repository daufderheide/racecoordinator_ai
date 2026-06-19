import { TestbedHarnessEnvironment } from "@angular/cdk/testing/testbed";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { AbsoluteWidgetNode } from "@app/models/settings";
import { TranslationService } from "@app/services/translation.service";
import { mockTranslationService } from "@app/testing/unit-test-mocks";

import { RacedayAbsoluteWidgetComponent } from "./raceday-absolute-widget.component";
import { RacedayAbsoluteWidgetHarness } from "./testing/raceday-absolute-widget.harness";

describe("RacedayAbsoluteWidgetComponent", () => {
  let component: RacedayAbsoluteWidgetComponent;
  let fixture: ComponentFixture<RacedayAbsoluteWidgetComponent>;
  let harness: RacedayAbsoluteWidgetHarness;
  let mockParent: any;
  let mockWidget: AbsoluteWidgetNode;

  beforeEach(async () => {
    mockTranslationService.translate.and.callFake((key: string) => key);

    mockWidget = {
      id: "test-widget",
      widgetType: "timer",
      x: 10,
      y: 20,
      width: 150,
      height: 80,
      zIndex: 100,
    };

    mockParent = {
      visualScale: 1,
      track: undefined,
      heat: undefined,
      heats: [],
      isTeam: () => false,
      getTeammates: () => [],
      getDropdownIcon: () => "",
      getDriverStats: () => "",
      snapToEdges: jasmine
        .createSpy("snapToEdges")
        .and.callFake((x, y, w, h) => ({ x, y, w, h })),
      moveWidgetForward: jasmine.createSpy("moveWidgetForward"),
      moveWidgetBackward: jasmine.createSpy("moveWidgetBackward"),
      removeWidget: jasmine.createSpy("removeWidget"),
      bringToFront: jasmine.createSpy("bringToFront"),
      layoutChanged: {
        emit: jasmine.createSpy("emit"),
      },
      layout: {
        widgets: [],
      },
    };

    await TestBed.configureTestingModule({
      imports: [RacedayAbsoluteWidgetComponent],
      providers: [
        { provide: TranslationService, useValue: mockTranslationService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RacedayAbsoluteWidgetComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput("widget", mockWidget);
    fixture.componentRef.setInput("parentComponent", mockParent);
    fixture.componentRef.setInput("isCustomizing", true);
    harness = await TestbedHarnessEnvironment.harnessForFixture(
      fixture,
      RacedayAbsoluteWidgetHarness,
    );
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should use harness to check customization state and labels", async () => {
    expect(await harness.isCustomizing()).toBeTrue();
    expect(await harness.getWidgetTypeLabel()).toBe("timer");
  });

  it("should delegate moveForward to parent moveWidgetForward via harness", async () => {
    await harness.clickMoveForward();
    expect(mockParent.moveWidgetForward).toHaveBeenCalledWith("test-widget");
  });

  it("should delegate moveBackward to parent moveWidgetBackward via harness", async () => {
    await harness.clickMoveBackward();
    expect(mockParent.moveWidgetBackward).toHaveBeenCalledWith("test-widget");
  });

  it("should delegate removeWidget to parent removeWidget via harness", async () => {
    await harness.clickRemove();
    expect(mockParent.removeWidget).toHaveBeenCalledWith("test-widget");
  });

  it("should delegate bringToFront to parent bringToFront", () => {
    component.bringToFront();
    expect(mockParent.bringToFront).toHaveBeenCalledWith("test-widget");
  });

  it("should apply scale-auto class when scaleMode is 'auto'", () => {
    mockWidget.scaleMode = "auto";
    mockWidget.textScaleFactor = 1.2;
    fixture.componentRef.setInput("widget", { ...mockWidget });
    fixture.detectChanges();
    const wrapper = fixture.nativeElement.querySelector(".widget-wrapper");
    expect(wrapper.classList.contains("scale-auto")).toBeTrue();
    expect(wrapper.classList.contains("scale-fixed")).toBeFalse();
  });

  it("should apply scale-fixed class and fontSize styles when scaleMode is 'fixed'", () => {
    mockWidget.scaleMode = "fixed";
    mockWidget.fontSize = 32;
    fixture.componentRef.setInput("widget", { ...mockWidget });
    fixture.detectChanges();
    const wrapper = fixture.nativeElement.querySelector(".widget-wrapper");
    expect(wrapper.classList.contains("scale-fixed")).toBeTrue();
    expect(wrapper.classList.contains("scale-auto")).toBeFalse();
  });

  it("should apply custom color and background classes when set", () => {
    mockWidget.textColor = "#ff0000";
    mockWidget.backgroundColor = "#00ff00";
    fixture.componentRef.setInput("widget", { ...mockWidget });
    fixture.detectChanges();
    const wrapper = fixture.nativeElement.querySelector(".widget-wrapper");
    expect(wrapper.classList.contains("has-custom-color")).toBeTrue();
    expect(wrapper.classList.contains("has-custom-bg")).toBeTrue();
  });

  it("should render on-deck widget", () => {
    mockWidget.widgetType = "on-deck";
    fixture.componentRef.setInput("widget", { ...mockWidget });
    fixture.detectChanges();
    const onDeck = fixture.nativeElement.querySelector("app-raceday-on-deck");
    expect(onDeck).toBeTruthy();
  });

  it("should render next-heat widget", () => {
    mockWidget.widgetType = "next-heat";
    fixture.componentRef.setInput("widget", { ...mockWidget });
    fixture.detectChanges();
    const nextHeat = fixture.nativeElement.querySelector(
      "app-raceday-next-heat",
    );
    expect(nextHeat).toBeTruthy();
  });

  it("should apply pointer-events: none to interactive elements inside widgets when in edit mode", () => {
    mockWidget.widgetType = "on-deck";
    fixture.componentRef.setInput("widget", { ...mockWidget });
    fixture.componentRef.setInput("isCustomizing", true);
    fixture.detectChanges();

    const wrapper = fixture.nativeElement.querySelector(".widget-wrapper");
    expect(wrapper.classList.contains("edit-mode")).toBeTrue();

    // Create a mock select/button/a element inside the widget content to verify CSS rules
    const select = document.createElement("select");
    const button = document.createElement("button");
    const anchor = document.createElement("a");
    const content = fixture.nativeElement.querySelector(".widget-content");
    content.appendChild(select);
    content.appendChild(button);
    content.appendChild(anchor);

    const selectStyle = window.getComputedStyle(select);
    const buttonStyle = window.getComputedStyle(button);
    const anchorStyle = window.getComputedStyle(anchor);

    expect(selectStyle.pointerEvents).toBe("none");
    expect(buttonStyle.pointerEvents).toBe("none");
    expect(anchorStyle.pointerEvents).toBe("none");

    // Elements with specific column editing classes should have pointer-events: auto
    const deleteColBtn = document.createElement("button");
    deleteColBtn.className = "delete-col-btn";
    const colVisibilitySelect = document.createElement("select");
    colVisibilitySelect.className = "col-visibility-select";
    const deleteAnchorBtn = document.createElement("button");
    deleteAnchorBtn.className = "delete-anchor-btn";

    content.appendChild(deleteColBtn);
    content.appendChild(colVisibilitySelect);
    content.appendChild(deleteAnchorBtn);

    const deleteColStyle = window.getComputedStyle(deleteColBtn);
    const colVisStyle = window.getComputedStyle(colVisibilitySelect);
    const deleteAnchorStyle = window.getComputedStyle(deleteAnchorBtn);

    expect(deleteColStyle.pointerEvents).toBe("auto");
    expect(colVisStyle.pointerEvents).toBe("auto");
    expect(deleteAnchorStyle.pointerEvents).toBe("auto");
  });
});

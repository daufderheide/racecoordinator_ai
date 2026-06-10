import { TestbedHarnessEnvironment } from "@angular/cdk/testing/testbed";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { AbsoluteWidgetNode } from "@app/models/settings";

import { RacedayAbsoluteWidgetComponent } from "./raceday-absolute-widget.component";
import { RacedayAbsoluteWidgetHarness } from "./testing/raceday-absolute-widget.harness";

describe("RacedayAbsoluteWidgetComponent", () => {
  let component: RacedayAbsoluteWidgetComponent;
  let fixture: ComponentFixture<RacedayAbsoluteWidgetComponent>;
  let harness: RacedayAbsoluteWidgetHarness;
  let mockParent: any;
  let mockWidget: AbsoluteWidgetNode;

  beforeEach(async () => {
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
});

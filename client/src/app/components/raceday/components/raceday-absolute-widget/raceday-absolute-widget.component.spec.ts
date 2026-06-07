import { ComponentFixture, TestBed } from "@angular/core/testing";
import { AbsoluteWidgetNode } from "@app/models/settings";

import { RacedayAbsoluteWidgetComponent } from "./raceday-absolute-widget.component";

describe("RacedayAbsoluteWidgetComponent", () => {
  let component: RacedayAbsoluteWidgetComponent;
  let fixture: ComponentFixture<RacedayAbsoluteWidgetComponent>;
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
    component.widget = mockWidget;
    component.parentComponent = mockParent;
    component.isCustomizing = true;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should delegate moveForward to parent moveWidgetForward", () => {
    const event = new Event("click");
    spyOn(event, "stopPropagation");

    component.moveForward(event);

    expect(event.stopPropagation).toHaveBeenCalled();
    expect(mockParent.moveWidgetForward).toHaveBeenCalledWith("test-widget");
  });

  it("should delegate moveBackward to parent moveWidgetBackward", () => {
    const event = new Event("click");
    spyOn(event, "stopPropagation");

    component.moveBackward(event);

    expect(event.stopPropagation).toHaveBeenCalled();
    expect(mockParent.moveWidgetBackward).toHaveBeenCalledWith("test-widget");
  });

  it("should delegate removeWidget to parent removeWidget", () => {
    const event = new Event("click");
    spyOn(event, "stopPropagation");

    component.removeWidget(event);

    expect(event.stopPropagation).toHaveBeenCalled();
    expect(mockParent.removeWidget).toHaveBeenCalledWith("test-widget");
  });

  it("should delegate bringToFront to parent bringToFront", () => {
    component.bringToFront();
    expect(mockParent.bringToFront).toHaveBeenCalledWith("test-widget");
  });
});

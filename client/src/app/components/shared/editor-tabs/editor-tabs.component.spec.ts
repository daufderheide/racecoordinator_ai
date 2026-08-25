import { TestbedHarnessEnvironment } from "@angular/cdk/testing/testbed";
import { ComponentFixture, TestBed } from "@angular/core/testing";

import { EditorTab, EditorTabsComponent } from "./editor-tabs.component";
import { EditorTabsHarness } from "./testing/editor-tabs.harness";

describe("EditorTabsComponent", () => {
  let component: EditorTabsComponent;
  let fixture: ComponentFixture<EditorTabsComponent>;
  let harness: EditorTabsHarness;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditorTabsComponent],
    }).compileComponents();
  });

  beforeEach(async () => {
    fixture = TestBed.createComponent(EditorTabsComponent);
    component = fixture.componentInstance;
    harness = await TestbedHarnessEnvironment.harnessForFixture(
      fixture,
      EditorTabsHarness,
    );
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should not display tabs container when tabs list is empty", async () => {
    expect(await harness.isVisible()).toBeFalse();
    expect(await harness.getTabCount()).toBe(0);
  });

  it("should display tabs when tabs input is provided", async () => {
    const mockTabs: EditorTab[] = [
      { id: "tab-hardware", label: "Hardware" },
      { id: "tab-lanes", label: "Lanes" },
      { id: "tab-sectors", label: "Sectors" },
    ];
    fixture.componentRef.setInput("tabs", mockTabs);
    fixture.detectChanges();

    expect(await harness.isVisible()).toBeTrue();
    expect(await harness.getTabCount()).toBe(3);
    expect(await harness.getTabLabels()).toEqual([
      "Hardware",
      "Lanes",
      "Sectors",
    ]);
  });

  it("should emit tabClicked when a tab is clicked by index", async () => {
    const mockTabs: EditorTab[] = [
      { id: "tab-1", label: "Tab One" },
      { id: "tab-2", label: "Tab Two" },
    ];
    fixture.componentRef.setInput("tabs", mockTabs);
    fixture.detectChanges();

    const clickedSpy = jasmine.createSpy("tabClicked");
    component.tabClicked.subscribe(clickedSpy);

    await harness.clickTabByIndex(1);
    expect(clickedSpy).toHaveBeenCalledWith("tab-2");
  });

  it("should emit tabClicked when a tab is clicked by text", async () => {
    const mockTabs: EditorTab[] = [
      { id: "tab-overview", label: "Overview" },
      { id: "tab-details", label: "Details" },
    ];
    fixture.componentRef.setInput("tabs", mockTabs);
    fixture.detectChanges();

    const clickedSpy = jasmine.createSpy("tabClicked");
    component.tabClicked.subscribe(clickedSpy);

    await harness.clickTabByText("Overview");
    expect(clickedSpy).toHaveBeenCalledWith("tab-overview");
  });

  it("should emit tab id when onTabClick is invoked directly", () => {
    const clickedSpy = jasmine.createSpy("tabClicked");
    component.tabClicked.subscribe(clickedSpy);

    component.onTabClick("custom-tab-id");
    expect(clickedSpy).toHaveBeenCalledWith("custom-tab-id");
  });
});

import { TestbedHarnessEnvironment } from "@angular/cdk/testing/testbed";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { DataService } from "@app/data.service";

import { RacedayImageComponent } from "./raceday-image.component";
import { RacedayImageHarness } from "./testing/raceday-image.harness";

describe("RacedayImageComponent", () => {
  let component: RacedayImageComponent;
  let fixture: ComponentFixture<RacedayImageComponent>;
  let harness: RacedayImageHarness;
  let dataServiceMock: any;

  beforeEach(async () => {
    dataServiceMock = {
      serverUrl: "http://localhost:7070",
    };

    await TestBed.configureTestingModule({
      imports: [RacedayImageComponent],
      providers: [{ provide: DataService, useValue: dataServiceMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(RacedayImageComponent);
    component = fixture.componentInstance;
    harness = await TestbedHarnessEnvironment.harnessForFixture(
      fixture,
      RacedayImageHarness,
    );
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should display fallback premium placeholder SVG if no imageUrl is configured", async () => {
    const url = await harness.getImageUrl();
    expect(url).toContain("data:image/svg+xml;utf8");
    expect(url).toContain("No Image Selected");
  });

  it("should resolve relative image URLs to backend absolute URLs", async () => {
    fixture.componentRef.setInput("widget", {
      id: "widget-image",
      widgetType: "image",
      x: 0,
      y: 0,
      width: 384,
      height: 239,
      zIndex: 100,
      customSettings: {
        imageUrl: "/api/assets/download?filename=myimage.png",
      },
    });
    fixture.detectChanges();

    const url = await harness.getImageUrl();
    expect(url).toBe(
      "http://localhost:7070/api/assets/download?filename=myimage.png",
    );
  });

  it("should preserve absolute image URLs or data URIs", async () => {
    fixture.componentRef.setInput("widget", {
      id: "widget-image",
      widgetType: "image",
      x: 0,
      y: 0,
      width: 384,
      height: 239,
      zIndex: 100,
      customSettings: {
        imageUrl: "data:image/png;base64,iVBORw0KGgoAAA==",
      },
    });
    fixture.detectChanges();

    const url = await harness.getImageUrl();
    expect(url).toBe("data:image/png;base64,iVBORw0KGgoAAA==");
  });
});

import { TestbedHarnessEnvironment } from "@angular/cdk/testing/testbed";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FormsModule } from "@angular/forms";
import { of } from "rxjs";
import { DataService } from "@app/data.service";
import { TranslatePipe } from "@app/pipes/translate.pipe";

import { ImageInspectorComponent } from "./image-inspector.component";
import { ImageInspectorHarness } from "./testing/image-inspector.harness";

describe("ImageInspectorComponent", () => {
  let component: ImageInspectorComponent;
  let fixture: ComponentFixture<ImageInspectorComponent>;
  let harness: ImageInspectorHarness;
  let changeSpy: jasmine.Spy;
  let dataServiceSpy: jasmine.SpyObj<DataService>;

  beforeEach(async () => {
    const dataSpy = jasmine.createSpyObj("DataService", ["listAssets"]);
    dataSpy.listAssets.and.returnValue(
      of([
        {
          entity_id: "img1",
          name: "Image 1",
          type: "image",
          url: "/api/assets/download?filename=img1.png",
        },
        {
          entity_id: "sound1",
          name: "Sound 1",
          type: "sound",
          url: "/api/assets/download?filename=sound1.wav",
        },
      ]),
    );

    await TestBed.configureTestingModule({
      imports: [FormsModule, ImageInspectorComponent, TranslatePipe],
      providers: [{ provide: DataService, useValue: dataSpy }],
    }).compileComponents();

    fixture = TestBed.createComponent(ImageInspectorComponent);
    component = fixture.componentInstance;
    dataServiceSpy = TestBed.inject(DataService) as jasmine.SpyObj<DataService>;

    fixture.componentRef.setInput("settings", {
      imageUrl: "/api/assets/download?filename=img1.png",
    });

    harness = await TestbedHarnessEnvironment.harnessForFixture(
      fixture,
      ImageInspectorHarness,
    );

    changeSpy = spyOn(component.change, "emit");
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should load image assets on init", () => {
    expect(dataServiceSpy.listAssets).toHaveBeenCalled();
    expect(component.imageAssets.length).toBe(1);
    expect(component.imageAssets[0].entity_id).toBe("img1");
  });

  it("should emit change when image URL changes", () => {
    component.onImageUrlChange("new-url");
    expect(component.settings().imageUrl).toBe("new-url");
    expect(changeSpy).toHaveBeenCalled();
  });

  it("should read and clear values via harness", async () => {
    expect(await harness.getImageUrl()).toContain("img1.png");
    expect(await harness.hasRemoveButton()).toBeTrue();
    await harness.clickRemoveButton();
    expect(component.settings().imageUrl).toBe("");
    expect(changeSpy).toHaveBeenCalled();
  });
});

import { ChangeDetectorRef } from "@angular/core";
import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from "@angular/core/testing";
import { DataService } from "@app/data.service";

import { AssetPreviewComponent } from "./asset-preview.component";

describe("AssetPreviewComponent", () => {
  let component: AssetPreviewComponent;
  let fixture: ComponentFixture<AssetPreviewComponent>;
  let dataServiceSpy: jasmine.SpyObj<DataService>;

  beforeEach(async () => {
    const spy = jasmine.createSpyObj(
      "DataService",
      ["getAssetUrl", "resolveAssetUrl"],
      {
        baseUrl: "http://localhost:7070",
        serverUrl: "http://localhost:7070",
      },
    );
    spy.resolveAssetUrl.and.callFake((url?: string) => url || "");

    await TestBed.configureTestingModule({
      imports: [AssetPreviewComponent],
      providers: [{ provide: DataService, useValue: spy }, ChangeDetectorRef],
    }).compileComponents();

    dataServiceSpy = TestBed.inject(DataService) as jasmine.SpyObj<DataService>;
    fixture = TestBed.createComponent(AssetPreviewComponent);
    component = fixture.componentInstance;
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should show static image for type image", () => {
    fixture.componentRef.setInput("type", "image");
    fixture.componentRef.setInput("imageUrl", "http://test.com/img.png");
    fixture.detectChanges();

    const img = fixture.nativeElement.querySelector("img");
    expect(img).toBeTruthy();
    expect(img.src).toBe("http://test.com/img.png");
  });

  it("should show sound icon for type sound", () => {
    fixture.componentRef.setInput("type", "sound");
    fixture.detectChanges();

    const img = fixture.nativeElement.querySelector(".preview-icon");
    expect(img).toBeTruthy();
    expect(img.src).toContain("assets/images/default_audio_icon.png");
  });

  it("should show sound icon for type audio", () => {
    fixture.componentRef.setInput("type", "audio");
    fixture.detectChanges();

    const img = fixture.nativeElement.querySelector(".preview-icon");
    expect(img).toBeTruthy();
    expect(img.src).toContain("assets/images/default_audio_icon.png");
  });

  it("should animate image set", fakeAsync(() => {
    fixture.componentRef.setInput("type", "image_set");
    fixture.componentRef.setInput("images", [
      { url: "/assets/frame1.png", name: "Frame 1" },
      { url: "/assets/frame2.png", name: "Frame 2" },
    ]);
    fixture.componentRef.setInput("animate", true);

    // Trigger onInit/Changes
    fixture.detectChanges();

    // Initial frame
    expect(component.currentUrl()).toBe(
      "http://localhost:7070/assets/frame1.png",
    );

    // Wait for interval (1000ms)
    tick(1000);
    fixture.detectChanges();

    // Second frame
    expect(component.currentUrl()).toBe(
      "http://localhost:7070/assets/frame2.png",
    );

    // Wait for next interval (1000ms)
    tick(1000);
    fixture.detectChanges();

    // Loop back to first frame
    expect(component.currentUrl()).toBe(
      "http://localhost:7070/assets/frame1.png",
    );

    // Clean up
    component.ngOnDestroy();
  }));

  it("should not animate if animate is false", fakeAsync(() => {
    fixture.componentRef.setInput("type", "image_set");
    fixture.componentRef.setInput("images", [
      { url: "/assets/frame1.png", name: "Frame 1" },
      { url: "/assets/frame2.png", name: "Frame 2" },
    ]);
    fixture.componentRef.setInput("animate", false);

    fixture.detectChanges();

    expect(component.currentUrl()).toBe(
      "http://localhost:7070/assets/frame1.png",
    );

    tick(2000);
    fixture.detectChanges();

    // Should still be frame 1
    expect(component.currentUrl()).toBe(
      "http://localhost:7070/assets/frame1.png",
    );

    component.ngOnDestroy();
  }));

  it("should stop animation on destroy", fakeAsync(() => {
    fixture.componentRef.setInput("type", "image_set");
    fixture.componentRef.setInput("images", [
      { url: "/assets/frame1.png", name: "Frame 1" },
      { url: "/assets/frame2.png", name: "Frame 2" },
    ]);
    fixture.componentRef.setInput("animate", true);

    fixture.detectChanges();

    expect(component.currentUrl()).toBe(
      "http://localhost:7070/assets/frame1.png",
    );

    component.ngOnDestroy();

    tick(1000);
    fixture.detectChanges();

    // Should not have advanced
    expect(component.currentUrl()).toBe(
      "http://localhost:7070/assets/frame1.png",
    );
  }));

  it("should use assetId if imageUrl is not provided", () => {
    fixture.componentRef.setInput("type", "image");
    fixture.componentRef.setInput("assetId", "asset-123");
    dataServiceSpy.getAssetUrl.and.returnValue(
      "http://localhost:7070/api/asset/asset-123",
    );

    fixture.detectChanges();

    expect(component.currentUrl()).toBe(
      "http://localhost:7070/api/asset/asset-123",
    );
    expect(dataServiceSpy.getAssetUrl).toHaveBeenCalledWith("asset-123");
  });

  it("should resolve relative asset URLs via DataService", () => {
    dataServiceSpy.resolveAssetUrl.and.returnValue(
      "/assets/default_black-yellow_Helmet_Black-Yellow",
    );
    fixture.componentRef.setInput("type", "image");
    fixture.componentRef.setInput(
      "imageUrl",
      "assets/defaults/helmets/helmet_yellow.png",
    );
    fixture.detectChanges();

    expect(component.currentUrl()).toBe(
      "http://localhost:7070/assets/default_black-yellow_Helmet_Black-Yellow",
    );
    expect(dataServiceSpy.resolveAssetUrl).toHaveBeenCalledWith(
      "assets/defaults/helmets/helmet_yellow.png",
    );
  });
});

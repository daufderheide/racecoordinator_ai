import { Pipe, PipeTransform } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FormsModule } from "@angular/forms";
import { of } from "rxjs";
import { DataService } from "src/app/data.service";

import { AssetPickerComponent } from "./asset-picker.component";

@Pipe({ name: "translate" })
class MockTranslatePipe implements PipeTransform {
  transform(value: string): string {
    return value;
  }
}

import { Component, Input } from "@angular/core";
@Component({
  selector: "app-asset-preview",
  template: "",
  imports: [FormsModule],
})
class MockAssetPreviewComponent {
  @Input() assetId?: string;
  @Input() type: string = "image";
  @Input() imageUrl?: string;
  @Input() name: string = "";
  @Input() images?: any[];
  @Input() animate: boolean = true;
}

describe("AssetPickerComponent", () => {
  let component: AssetPickerComponent;
  let fixture: ComponentFixture<AssetPickerComponent>;
  let mockDataService: any;

  const mockAssets = [
    { name: "Image 1", type: "IMAGE", model: { entityId: "id-1" } },
    { name: "Audio 1", type: "AUDIO", model: { entityId: "id-2" } },
    {
      name: "Set 1",
      type: "IMAGE_SET",
      model: { entityId: "id-3" },
      images: [{ url: "set-url" }],
    },
  ];

  beforeEach(async () => {
    mockDataService = jasmine.createSpyObj("DataService", [
      "listAssets",
      "getAssetUrl",
    ]);
    mockDataService.listAssets.and.returnValue(of(mockAssets));
    mockDataService.getAssetUrl.and.callFake((id: string) => `url-${id}`);

    await TestBed.configureTestingModule({
      imports: [
        FormsModule,
        AssetPickerComponent,
        MockTranslatePipe,
        MockAssetPreviewComponent,
      ],
      providers: [{ provide: DataService, useValue: mockDataService }],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AssetPickerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should load and filter assets by type (IMAGE)", () => {
    component.type = "image";
    component.loadAssets();
    expect(component.assets.length).toBe(1);
    expect(component.assets[0].name).toBe("Image 1");
  });

  it("should load and filter assets by type (AUDIO)", () => {
    component.type = "audio";
    component.loadAssets();
    expect(component.assets.length).toBe(1);
    expect(component.assets[0].name).toBe("Audio 1");
  });

  it("should apply search filter", () => {
    component.type = "image";
    component.loadAssets();
    component.searchQuery = "non-existent";
    component.applyFilter();
    expect(component.filteredAssets.length).toBe(0);

    component.searchQuery = "Image";
    component.applyFilter();
    expect(component.filteredAssets.length).toBe(1);
  });

  it("should select an asset", () => {
    const asset = mockAssets[0];
    component.selectAsset(asset as any);
    expect(component.selectedAssetId).toBe("id-1");
  });

  it("should emit selected asset ID on confirm", () => {
    spyOn(component.close, "emit");
    component.selectedAssetId = "id-1";
    component.confirm();
    expect(component.close.emit).toHaveBeenCalledWith("id-1");
  });

  it("should emit null on cancel", () => {
    spyOn(component.close, "emit");
    component.cancel();
    expect(component.close.emit).toHaveBeenCalledWith(null);
  });

  it("should return correct asset URL", () => {
    const assetImg = mockAssets[0];
    expect(component.getAssetUrl(assetImg as any)).toBe("url-id-1");

    const assetSet = mockAssets[2];
    expect(component.getAssetUrl(assetSet as any)).toBe("set-url");
  });
});

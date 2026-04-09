import { CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { Pipe, PipeTransform } from "@angular/core";
import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from "@angular/core/testing";
import { FormsModule } from "@angular/forms";
import { Router } from "@angular/router";
import { BehaviorSubject, of } from "rxjs";
import { DataService } from "src/app/data.service";
import {
  ConnectionMonitorService,
  ConnectionState,
} from "src/app/services/connection-monitor.service";
import { TranslationService } from "src/app/services/translation.service";
import {
  mockDataService,
  mockRouter,
  mockTranslationService,
} from "src/app/testing/unit-test-mocks";

import { AssetManagerComponent } from "./asset-manager.component";

@Pipe({
  name: "translate",
  standalone: false,
})
class MockTranslatePipe implements PipeTransform {
  transform(value: string): string {
    return value;
  }
}

describe("AssetManagerComponent", () => {
  let component: AssetManagerComponent;
  let fixture: ComponentFixture<AssetManagerComponent>;
  let mockConnectionMonitor: jasmine.SpyObj<ConnectionMonitorService>;
  let connectionStateSubject: BehaviorSubject<ConnectionState>;

  beforeEach(async () => {
    // Reset mock calls before each test to ensure isolation
    mockDataService.listAssets.calls.reset();
    mockDataService.deleteAsset.calls.reset();
    mockDataService.renameAsset.calls.reset();
    mockDataService.getDrivers.calls.reset();
    mockDataService.uploadAsset.calls.reset();
    mockDataService.getCurrentDatabase.calls.reset();
    mockTranslationService.translate.calls.reset();
    mockRouter.navigate.calls.reset();

    connectionStateSubject = new BehaviorSubject<ConnectionState>(
      ConnectionState.CONNECTED,
    );
    mockConnectionMonitor = jasmine.createSpyObj("ConnectionMonitorService", [
      "startMonitoring",
      "stopMonitoring",
      "checkConnection",
    ]);
    Object.defineProperty(mockConnectionMonitor, "connectionState$", {
      get: () => connectionStateSubject.asObservable(),
    });
    mockConnectionMonitor.checkConnection.and.returnValue(of(true));

    await TestBed.configureTestingModule({
      declarations: [AssetManagerComponent, MockTranslatePipe],
      imports: [FormsModule],
      providers: [
        { provide: DataService, useValue: mockDataService },
        { provide: TranslationService, useValue: mockTranslationService },
        { provide: Router, useValue: mockRouter },
        { provide: ConnectionMonitorService, useValue: mockConnectionMonitor },
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AssetManagerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should filter assets by type", () => {
    component.assets = [
      {
        id: "1",
        name: "Img1",
        type: "image",
        size: "100 B",
        url: "",
        editMode: false,
      },
      {
        id: "2",
        name: "Snd1",
        type: "sound",
        size: "100 B",
        url: "",
        editMode: false,
      },
    ];

    component.setFilterType("image");
    expect(component.filterType).toBe("image");
    expect(component.filteredAssets.length).toBe(1);
    expect(component.filteredAssets[0].type).toBe("image");

    component.setFilterType("sound");
    expect(component.filterType).toBe("sound");
    expect(component.filteredAssets.length).toBe(1);
    expect(component.filteredAssets[0].type).toBe("sound");

    component.setFilterType("image_set");
    expect(component.filterType).toBe("image_set");
    expect(component.filteredAssets.length).toBe(0); // None in this mock data
  });

  it("should exclude image_sets when filtering by image", () => {
    component.assets = [
      {
        id: "1",
        name: "Img1",
        type: "image",
        size: "100 B",
        url: "",
        editMode: false,
      },
      {
        id: "2",
        name: "Set1",
        type: "image_set",
        size: "100 B",
        url: "",
        editMode: false,
      },
      {
        id: "3",
        name: "Snd1",
        type: "sound",
        size: "100 B",
        url: "",
        editMode: false,
      },
    ];

    component.setFilterType("image");
    expect(component.filteredAssets.length).toBe(1);
    expect(component.filteredAssets[0].type).toBe("image");
    expect(
      component.filteredAssets.some((a) => a.type === "image_set"),
    ).toBeFalse();
  });

  it("should filter assets by name", () => {
    component.assets = [
      {
        id: "1",
        name: "RaceTrack",
        type: "image",
        size: "100 B",
        url: "",
        editMode: false,
      },
      {
        id: "2",
        name: "CarSound",
        type: "sound",
        size: "100 B",
        url: "",
        editMode: false,
      },
    ];

    component.filterName = "Race";
    expect(component.filteredAssets.length).toBe(1);
    expect(component.filteredAssets[0].name).toBe("RaceTrack");
  });

  it("should open delete confirmation modal", () => {
    component.onDelete("1");
    expect(component.assetsToDeleteIds).toEqual(["1"]);
    expect(component.showDeleteConfirm).toBeTrue();
  });

  it("should delete asset on confirmation", () => {
    component.assetsToDeleteIds = ["1"];
    component.showDeleteConfirm = true;
    mockDataService.deleteAsset.and.returnValue(of(true));

    component.onConfirmDelete();

    expect(mockDataService.deleteAsset).toHaveBeenCalledWith("1");
    expect(mockDataService.listAssets).toHaveBeenCalled();
    expect(component.showDeleteConfirm).toBeFalse();
    expect(component.assetsToDeleteIds).toEqual([]);
  });

  it("should close modal on cancel", () => {
    component.assetsToDeleteIds = ["1"];
    component.showDeleteConfirm = true;

    component.onCancelDelete();

    expect(mockDataService.deleteAsset).not.toHaveBeenCalled();
    expect(component.showDeleteConfirm).toBeFalse();
    expect(component.assetsToDeleteIds).toEqual([]);
  });

  it("should rename an asset", () => {
    component.assets = [
      {
        id: "1",
        name: "OldName",
        type: "image",
        size: "100 B",
        url: "",
        editMode: false,
      },
    ];
    const asset = component.assets[0];

    // Start editing
    component.startEditing("1");
    expect(asset.editMode).toBeTrue();

    // Save
    const newName = "NewName";
    component.saveName("1", newName);

    expect(mockDataService.renameAsset).toHaveBeenCalledWith("1", newName);
    // Note: In real component, listAssets() is called on success which refreshes the list
    // verification of name change depends on mock behavior or manual update in component
    // current component implementation calls loadAssets() on success.
    expect(mockDataService.listAssets).toHaveBeenCalled();
  });

  it("should cycle preview index for image sets", fakeAsync(() => {
    component.assets = [
      {
        id: "1",
        name: "Fuel",
        type: "image_set",
        size: "100 B",
        url: "",
        images: [
          { url: "img1", percentage: 100 },
          { url: "img2", percentage: 90 },
        ],
        currentPreviewIndex: 0,
      },
    ];

    // Trigger preview cycling (starts in constructor/loadAssets)
    // For test, we can manually call startPreviewCycling if not already running
    (component as any).startPreviewCycling();

    tick(1100);
    expect(component.assets[0].currentPreviewIndex).toBe(1);

    tick(1100);
    expect(component.assets[0].currentPreviewIndex).toBe(0);

    // Cleanup handled by ngOnDestroy if called, but fakeAsync handles the ticks
  }));

  it("should toggle asset selection with Ctrl key", () => {
    const asset: any = {
      id: "1",
      name: "Img1",
      type: "image",
      selected: false,
    };
    const event = new MouseEvent("click", { ctrlKey: true });
    component.toggleSelection(asset, event);
    expect(asset.selected).toBeTrue();
    component.toggleSelection(asset, event);
    expect(asset.selected).toBeFalse();
  });

  it("should play sound asset", () => {
    const mockAudio = jasmine.createSpyObj("Audio", ["play"]);
    mockAudio.play.and.returnValue(Promise.resolve());
    spyOn(window, "Audio").and.returnValue(mockAudio);

    const asset: any = {
      id: "s1",
      name: "Sound1",
      type: "sound",
      url: "sound.mp3",
    };

    component.playAsset(asset);

    expect(window.Audio).toHaveBeenCalled();
    expect(mockAudio.play).toHaveBeenCalled();
  });

  it("should select range with Shift key", () => {
    component.assets = [
      {
        id: "1",
        name: "Img1",
        type: "image",
        size: "100 B",
        url: "",
        editMode: false,
        selected: false,
      },
      {
        id: "2",
        name: "Img2",
        type: "image",
        size: "100 B",
        url: "",
        editMode: false,
        selected: false,
      },
      {
        id: "3",
        name: "Img3",
        type: "image",
        size: "100 B",
        url: "",
        editMode: false,
        selected: false,
      },
    ];

    // First click (single)
    const event1 = new MouseEvent("click");
    component.toggleSelection(component.assets[0], event1);
    expect(component.assets[0].selected).toBeTrue();
    expect(component.lastSelectedIndex).toBe(0);

    // Shift click on third item
    const event2 = new MouseEvent("click", { shiftKey: true });
    component.toggleSelection(component.assets[2], event2);

    expect(component.assets[0].selected).toBeTrue();
    expect(component.assets[1].selected).toBeTrue();
    expect(component.assets[2].selected).toBeTrue();
  });

  it("should clear selection on single click", () => {
    component.assets = [
      {
        id: "1",
        name: "Img1",
        type: "image",
        size: "100 B",
        url: "",
        editMode: false,
        selected: true,
      },
      {
        id: "2",
        name: "Img2",
        type: "image",
        size: "100 B",
        url: "",
        editMode: false,
        selected: true,
      },
    ];

    const event = new MouseEvent("click");
    component.toggleSelection(component.assets[0], event);

    expect(component.assets[0].selected).toBeTrue();
    expect(component.assets[1].selected).toBeFalse();
  });

  it("should return correct selectedAssets", () => {
    component.assets = [
      {
        id: "1",
        name: "Img1",
        type: "image",
        size: "100 B",
        url: "",
        editMode: false,
        selected: true,
      },
      {
        id: "2",
        name: "Snd1",
        type: "sound",
        size: "100 B",
        url: "",
        editMode: false,
        selected: false,
      },
    ];
    expect(component.selectedAssets.length).toBe(1);
    expect(component.selectedAssets[0].id).toBe("1");
  });

  it("should open delete confirmation for multiple selected assets", () => {
    component.assets = [
      {
        id: "1",
        name: "Img1",
        type: "image",
        size: "100 B",
        url: "",
        editMode: false,
        selected: true,
      },
      {
        id: "2",
        name: "Snd1",
        type: "sound",
        size: "100 B",
        url: "",
        editMode: false,
        selected: true,
      },
    ];
    component.onDeleteSelected();
    expect(component.assetsToDeleteIds).toEqual(["1", "2"]);
    expect(component.showDeleteConfirm).toBeTrue();
  });

  it("should delete all selected assets on confirmation", () => {
    component.assetsToDeleteIds = ["1", "2"];
    component.showDeleteConfirm = true;
    mockDataService.deleteAsset.and.returnValue(of(true));

    component.onConfirmDelete();

    expect(mockDataService.deleteAsset).toHaveBeenCalledWith("1");
    expect(mockDataService.deleteAsset).toHaveBeenCalledWith("2");
    expect(mockDataService.listAssets).toHaveBeenCalled();
    expect(component.showDeleteConfirm).toBeFalse();
    expect(component.assetsToDeleteIds).toEqual([]);
  });

  it("should handle edit for single selected asset", () => {
    component.assets = [
      {
        id: "1",
        name: "Img1",
        type: "image",
        size: "100 B",
        url: "",
        editMode: false,
        selected: true,
      },
    ];
    spyOn(component, "startEditing");
    component.onEditSelected();
    expect(component.startEditing).toHaveBeenCalledWith("1");
  });

  it("should not handle edit for multiple selected assets", () => {
    component.assets = [
      {
        id: "1",
        name: "Img1",
        type: "image",
        size: "100 B",
        url: "",
        editMode: false,
        selected: true,
      },
      {
        id: "2",
        name: "Img2",
        type: "image",
        size: "100 B",
        url: "",
        editMode: false,
        selected: true,
      },
    ];
    spyOn(component, "startEditing");
    component.onEditSelected();
    expect(component.startEditing).not.toHaveBeenCalled();
  });
});

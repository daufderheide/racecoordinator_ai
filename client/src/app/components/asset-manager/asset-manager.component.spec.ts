import { CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { Pipe, PipeTransform } from "@angular/core";
import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from "@angular/core/testing";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { BehaviorSubject, of } from "rxjs";
import { AnalyticsService } from "src/app/analytics.service";
import { DataService } from "src/app/data.service";
import {
  ConnectionMonitorService,
  ConnectionState,
} from "src/app/services/connection-monitor.service";
import { HelpService } from "src/app/services/help.service";
import { SettingsService } from "src/app/services/settings.service";
import { TranslationService } from "src/app/services/translation.service";
import {
  mockAnalyticsService,
  mockDataService,
  mockRouter,
  mockSettingsService,
  mockTranslationService,
  resetMocks,
} from "src/app/testing/unit-test-mocks";

import { AssetManagerComponent } from "./asset-manager.component";

@Pipe({ name: "translate" })
class MockTranslatePipe implements PipeTransform {
  transform(value: string): string {
    return value;
  }
}

import { MOCK_ASSETS } from "src/app/testing/data/assets_data";

describe("AssetManagerComponent", () => {
  let component: AssetManagerComponent;
  let fixture: ComponentFixture<AssetManagerComponent>;
  let _dataService: any;
  let connectionStateSubject: BehaviorSubject<ConnectionState>;
  let mockConnectionMonitor: jasmine.SpyObj<ConnectionMonitorService>;
  let _mockHelpService: jasmine.SpyObj<HelpService>;
  const mockActivatedRoute = { queryParams: of({ help: "false" }) };

  beforeEach(async () => {
    mockTranslationService.translate.and.callFake((key: string) => key);

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
      imports: [FormsModule, AssetManagerComponent, MockTranslatePipe],
      providers: [
        { provide: DataService, useValue: mockDataService },
        { provide: TranslationService, useValue: mockTranslationService },
        { provide: Router, useValue: mockRouter },
        { provide: ConnectionMonitorService, useValue: mockConnectionMonitor },
        {
          provide: HelpService,
          useValue: jasmine.createSpyObj("HelpService", ["startGuide"], {
            isVisible$: of(false),
            currentStep$: of(null),
            hasNext$: of(false),
            hasPrevious$: of(false),
          }),
        },
        { provide: AnalyticsService, useValue: mockAnalyticsService },
        { provide: SettingsService, useValue: mockSettingsService },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();
  });

  afterEach(() => {
    resetMocks();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AssetManagerComponent);
    component = fixture.componentInstance;
    _dataService = TestBed.inject(DataService);

    // Default mock returns
    mockDataService.listAssets.and.returnValue(of(MOCK_ASSETS));
    mockDataService.deleteAsset.and.returnValue(of(true));
    mockDataService.renameAsset.and.returnValue(of(true));

    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should filter assets by type", () => {
    component.assets = JSON.parse(JSON.stringify(MOCK_ASSETS));

    component.setFilterType("image");
    expect(component.filterType).toBe("image");
    expect(component.filteredAssets.length).toBe(4);
    expect(component.filteredAssets[0].type).toBe("image");

    component.setFilterType("sound");
    expect(component.filterType).toBe("sound");
    expect(component.filteredAssets.length).toBe(1);
    expect(component.filteredAssets[0].type).toBe("sound");

    component.setFilterType("image_set");
    expect(component.filterType).toBe("image_set");
    expect(component.filteredAssets.length).toBe(1);

    component.setFilterType("audio_set");
    expect(component.filterType).toBe("audio_set");
    // Assuming MOCK_ASSETS has an audio_set or we add one
    expect(
      component.filteredAssets.every((a) => a.type === "audio_set"),
    ).toBeTrue();
  });

  it("should exclude image_sets when filtering by image", () => {
    component.assets = JSON.parse(JSON.stringify(MOCK_ASSETS));

    component.setFilterType("image");
    expect(component.filteredAssets.length).toBe(4);
    expect(component.filteredAssets[0].type).toBe("image");
    expect(
      component.filteredAssets.some((a) => a.type === "image_set"),
    ).toBeFalse();
  });

  it("should filter assets by name", () => {
    component.assets = JSON.parse(JSON.stringify(MOCK_ASSETS));

    component.filterName = "Red";
    expect(component.filteredAssets.length).toBe(2);
    expect(
      component.filteredAssets.some((a) => a.name === "RedCar"),
    ).toBeTrue();
    expect(
      component.filteredAssets.some((a) => a.name === "Start Lamp Red"),
    ).toBeTrue();
  });

  it("should open delete confirmation modal", () => {
    component.onDelete("a1");
    expect(component.assetsToDeleteIds).toEqual(["a1"]);
    expect(component.showDeleteConfirm).toBeTrue();
  });

  it("should delete asset on confirmation", () => {
    component.assetsToDeleteIds = ["a1"];
    component.showDeleteConfirm = true;
    mockDataService.deleteAsset.and.returnValue(of(true));

    component.onConfirmDelete();

    expect(mockDataService.deleteAsset).toHaveBeenCalledWith("a1");
    expect(mockDataService.listAssets).toHaveBeenCalled();
    expect(component.showDeleteConfirm).toBeFalse();
    expect(component.assetsToDeleteIds).toEqual([]);
  });

  it("should close modal on cancel", () => {
    component.assetsToDeleteIds = ["a1"];
    component.showDeleteConfirm = true;
    component.onCancelDelete();
    expect(component.showDeleteConfirm).toBeFalse();
    expect(component.assetsToDeleteIds).toEqual([]);
  });

  it("should rename an asset", () => {
    component.assets = JSON.parse(JSON.stringify(MOCK_ASSETS));
    const asset = component.assets[0];

    // Start editing
    component.startEditing("a1");
    expect(asset.editMode).toBeTrue();

    // Save
    const newName = "NewName";
    component.saveName("a1", newName);

    expect(mockDataService.renameAsset).toHaveBeenCalledWith("a1", newName);
    expect(mockDataService.listAssets).toHaveBeenCalled();
  });

  it("should cycle preview index for image sets", fakeAsync(() => {
    component.assets = JSON.parse(JSON.stringify(MOCK_ASSETS));
    const imageSet = component.assets.find((a) => a.type === "image_set");

    // Trigger preview cycling
    (component as any).startPreviewCycling();

    tick(1100);
    expect(imageSet!.currentPreviewIndex).toBe(1);

    tick(1100);
    expect(imageSet!.currentPreviewIndex).toBe(2);

    tick(1100);
    expect(imageSet!.currentPreviewIndex).toBe(0);
  }));

  it("should toggle asset selection with Ctrl key", () => {
    const asset: any = {
      id: "a1",
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
    component.assets = JSON.parse(JSON.stringify(MOCK_ASSETS));

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
        id: "a1",
        name: "Img1",
        type: "image",
        size: "100 B",
        url: "",
        editMode: false,
        selected: true,
      },
      {
        id: "a2",
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
    component.assets = JSON.parse(JSON.stringify(MOCK_ASSETS));
    component.assets[0].selected = true;
    expect(component.selectedAssets.length).toBe(1);
    expect(component.selectedAssets[0].id).toBe("a1");
  });

  it("should open delete confirmation for multiple selected assets", () => {
    component.assets = [
      {
        id: "a1",
        name: "Img1",
        type: "image",
        size: "100 B",
        url: "",
        editMode: false,
        selected: true,
      },
      {
        id: "a2",
        name: "Snd1",
        type: "sound",
        size: "100 B",
        url: "",
        editMode: false,
        selected: true,
      },
    ];
    component.onDeleteSelected();
    expect(component.assetsToDeleteIds).toEqual(["a1", "a2"]);
    expect(component.showDeleteConfirm).toBeTrue();
  });

  it("should delete all selected assets on confirmation", () => {
    component.assetsToDeleteIds = ["a1", "a2"];
    component.showDeleteConfirm = true;
    mockDataService.deleteAsset.and.returnValue(of(true));

    component.onConfirmDelete();

    expect(mockDataService.deleteAsset).toHaveBeenCalledWith("a1");
    expect(mockDataService.deleteAsset).toHaveBeenCalledWith("a2");
    expect(mockDataService.listAssets).toHaveBeenCalled();
    expect(component.showDeleteConfirm).toBeFalse();
    expect(component.assetsToDeleteIds).toEqual([]);
  });

  it("should handle edit for single selected asset", () => {
    component.assets = [
      {
        id: "a1",
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
    expect(component.startEditing).toHaveBeenCalledWith("a1");
  });

  it("should not handle edit for multiple selected assets", () => {
    component.assets = [
      {
        id: "a1",
        name: "Img1",
        type: "image",
        size: "100 B",
        url: "",
        editMode: false,
        selected: true,
      },
      {
        id: "a2",
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

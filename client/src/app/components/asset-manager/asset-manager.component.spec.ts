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
import { AnalyticsService } from "@app/analytics.service";
import { DataService } from "@app/data.service";
import {
  ConnectionMonitorService,
  ConnectionState,
} from "@app/services/connection-monitor.service";
import { HelpService } from "@app/services/help.service";
import { RaceConnectionService } from "@app/services/race-connection.service";
import { SettingsService } from "@app/services/settings.service";
import { TranslationService } from "@app/services/translation.service";
import {
  mockAnalyticsService,
  mockDataService,
  mockRouter,
  mockSettingsService,
  mockTranslationService,
  resetMocks,
} from "@app/testing/unit-test-mocks";

import { AssetManagerComponent } from "./asset-manager.component";

@Pipe({ name: "translate" })
class MockTranslatePipe implements PipeTransform {
  transform(value: string): string {
    return value;
  }
}

import { MOCK_ASSETS } from "@app/testing/data/assets_data";
import { deepCopy } from "@app/utils/clone.utils";

describe("AssetManagerComponent", () => {
  let component: AssetManagerComponent;
  let fixture: ComponentFixture<AssetManagerComponent>;
  let _dataService: any;
  let connectionStateSubject: BehaviorSubject<ConnectionState>;
  let mockConnectionMonitor: jasmine.SpyObj<ConnectionMonitorService>;
  let _mockHelpService: jasmine.SpyObj<HelpService>;
  let mockActivatedRoute: any;

  beforeEach(async () => {
    mockActivatedRoute = {
      snapshot: {
        queryParamMap: {
          get: jasmine.createSpy("get").and.returnValue(null),
        },
      },
      queryParams: of({ help: "false" }),
    };
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

    const mockRaceConnectionService = jasmine.createSpyObj(
      "RaceConnectionService",
      ["connect", "disconnect"],
    );

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
        { provide: RaceConnectionService, useValue: mockRaceConnectionService },
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
    component.assets = deepCopy(MOCK_ASSETS);

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
    component.assets = deepCopy(MOCK_ASSETS);

    component.setFilterType("image");
    expect(component.filteredAssets.length).toBe(4);
    expect(component.filteredAssets[0].type).toBe("image");
    expect(
      component.filteredAssets.some((a) => a.type === "image_set"),
    ).toBeFalse();
  });

  it("should filter assets by name", () => {
    component.assets = deepCopy(MOCK_ASSETS);

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
    component.assets = deepCopy(MOCK_ASSETS);
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
    component.assets = deepCopy(MOCK_ASSETS);
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

  it("should play sound asset and toggle currentlyPlayingAsset", async () => {
    const mockAudio = jasmine.createSpyObj("Audio", ["play", "pause"]);
    mockAudio.play.and.returnValue(Promise.resolve());
    const audioSpy = spyOn(window, "Audio").and.callFake(function (
      _url: string,
    ) {
      setTimeout(() => {
        if (mockAudio.onended) mockAudio.onended();
      }, 0);
      return mockAudio;
    } as any);

    const asset: any = {
      id: "s1",
      name: "Sound1",
      type: "sound",
      url: "sound.mp3",
    };

    component.playAsset(asset);
    expect(component.currentlyPlayingAsset).toBe(asset);

    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(component.currentlyPlayingAsset).toBeNull();
    expect(audioSpy).toHaveBeenCalled();
  });

  it("should stop sound asset playback on stopAsset", () => {
    const mockAudio = jasmine.createSpyObj("Audio", ["play", "pause"]);
    mockAudio.play.and.returnValue(new Promise(() => {}));
    spyOn(window, "Audio").and.returnValue(mockAudio);

    const asset: any = {
      id: "s1",
      name: "Sound1",
      type: "sound",
      url: "sound.mp3",
    };

    component.playAsset(asset);
    expect(component.currentlyPlayingAsset).toBe(asset);

    component.stopAsset();
    expect(component.currentlyPlayingAsset).toBeNull();
    expect(mockAudio.pause).toHaveBeenCalled();
  });

  it("should play audio set sequentially and stop on completion", async () => {
    const audioSet: any = {
      id: "as1",
      name: "AudioSet1",
      type: "audio_set",
      audioEntries: [
        { url: "1.mp3", type: "preset" },
        { url: "2.mp3", type: "preset" },
      ],
    };

    const mockAudio = jasmine.createSpyObj("Audio", ["play", "pause"]);
    mockAudio.play.and.returnValue(Promise.resolve());
    const audioSpy = spyOn(window, "Audio").and.callFake(function (
      _url: string,
    ) {
      setTimeout(() => {
        if (mockAudio.onended) mockAudio.onended();
      }, 0);
      return mockAudio;
    } as any);

    component.playAsset(audioSet);
    expect(component.currentlyPlayingAsset).toBe(audioSet);

    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(component.currentlyPlayingAsset).toBeNull();
    expect(audioSpy).toHaveBeenCalledTimes(2);
  });

  it("should select range with Shift key", () => {
    component.assets = deepCopy(MOCK_ASSETS);

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
    component.assets = deepCopy(MOCK_ASSETS);
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

  describe("Asset Calculations", () => {
    beforeEach(() => {
      component.assets = [
        {
          id: "a1",
          name: "Img1",
          type: "image",
          size: "100 KB",
          url: "",
        },
        {
          id: "a2",
          name: "ImgSet1",
          type: "image_set",
          size: "200 KB",
          url: "",
          images: [{ url: "1.png" }, { url: "2.png" }],
        },
        {
          id: "a3",
          name: "Snd1",
          type: "sound",
          size: "50 KB",
          url: "",
        },
        {
          id: "a4",
          name: "AudioSet1",
          type: "audio_set",
          size: "150 KB",
          url: "",
          audioEntries: [{ url: "1.mp3" }, { url: "2.mp3" }],
        },
        {
          id: "a5",
          name: "Rot1",
          type: "custom_rotation",
          size: "10 KB",
          url: "",
        },
      ];
    });

    it("should calculate totalBytes correctly", () => {
      // 100 + 200 + 50 + 150 + 10 = 510 KB
      // 510 * 1024 = 522240 bytes
      expect(component.totalBytes).toBe(510 * 1024);
    });

    it("should calculate bytes by type correctly", () => {
      expect(component.imageBytes).toBe(100 * 1024);
      expect(component.imageSetBytes).toBe(200 * 1024);
      expect(component.soundBytes).toBe(50 * 1024);
      expect(component.audioSetBytes).toBe(150 * 1024);
      expect(component.customRotationBytes).toBe(10 * 1024);
    });

    it("should calculate usage percentages correctly", () => {
      const total = 510;
      expect(component.imageUsagePercent).toBeCloseTo((100 / total) * 100, 2);
      expect(component.imageSetUsagePercent).toBeCloseTo(
        (200 / total) * 100,
        2,
      );
      expect(component.soundUsagePercent).toBeCloseTo((50 / total) * 100, 2);
      expect(component.audioSetUsagePercent).toBeCloseTo(
        (150 / total) * 100,
        2,
      );
      expect(component.customRotationUsagePercent).toBeCloseTo(
        (10 / total) * 100,
        2,
      );
    });

    it("should format tooltips correctly", () => {
      const bytes = 1024 * 1024; // 1 MB
      expect(component.formatAssetTooltip(bytes)).toBe(
        "1,048,576 bytes (1.00 MB)",
      );
    });

    it("should count only top-level assets", () => {
      expect(component.imageCount).toBe(1);
      expect(component.soundCount).toBe(1);
      expect(component.imageSetCount).toBe(1);
      expect(component.audioSetCount).toBe(1);
      expect(component.customRotationCount).toBe(1);
    });
    it("should filter custom rotations correctly", () => {
      component.assets = deepCopy(MOCK_ASSETS);
      const customRotationId = "cr1";

      // Select Audio Sets filter
      component.setFilterType("audio_set");
      expect(
        component.filteredAssets.some((a) => a.id === customRotationId),
      ).toBeFalse();

      // Select Custom Rotations filter
      component.setFilterType("custom_rotation");
      expect(
        component.filteredAssets.some((a) => a.id === customRotationId),
      ).toBeTrue();
      // Only custom rotations should be present
      expect(
        component.filteredAssets.every((a) => a.type === "custom_rotation"),
      ).toBeTrue();

      // Select All filter
      component.setFilterType("all");
      expect(
        component.filteredAssets.some((a) => a.id === customRotationId),
      ).toBeTrue();
    });
  });

  describe("Asset Upload & Drag-and-Drop Validation", () => {
    it("should accept and upload files when all files are valid images or audio", fakeAsync(() => {
      mockDataService.uploadAsset.calls.reset();
      mockDataService.listAssets.calls.reset();

      spyOn(window as any, "FileReader").and.callFake(function () {
        const mockReader: any = {
          readAsArrayBuffer: jasmine
            .createSpy("readAsArrayBuffer")
            .and.callFake(function () {
              setTimeout(() => {
                if (mockReader.onload) {
                  mockReader.onload({ target: { result: new ArrayBuffer(0) } });
                }
              });
            }),
          onload: null,
        };
        return mockReader;
      });

      const files = [
        new File([""], "test.png", { type: "image/png" }),
        new File([""], "test.mp3", { type: "audio/mpeg" }),
      ];

      const fileList = {
        0: files[0],
        1: files[1],
        length: files.length,
        item: (index: number) => files[index],
      } as unknown as FileList;

      component.uploadFiles(fileList);

      // Wait for FileReader promises to resolve and dataService.uploadAsset calls to complete
      tick();
      fixture.detectChanges();

      expect(component.errorMessage).toBeNull();
      expect(mockDataService.uploadAsset).toHaveBeenCalledTimes(2);
      expect(mockDataService.uploadAsset.calls.argsFor(0)[0]).toBe("test.png");
      expect(mockDataService.uploadAsset.calls.argsFor(0)[1]).toBe("image");
      expect(mockDataService.uploadAsset.calls.argsFor(1)[0]).toBe("test.mp3");
      expect(mockDataService.uploadAsset.calls.argsFor(1)[1]).toBe("sound");
      expect(mockDataService.listAssets).toHaveBeenCalled();
      expect(component.isUploading).toBeFalse();
    }));

    it("should reject uploads, block uploadAsset, and show error when any file is invalid", fakeAsync(() => {
      mockDataService.uploadAsset.calls.reset();

      const files = [
        new File([""], "test.png", { type: "image/png" }),
        new File([""], "unsupported.pdf", { type: "application/pdf" }),
      ];

      const fileList = {
        0: files[0],
        1: files[1],
        length: files.length,
        item: (index: number) => files[index],
      } as unknown as FileList;

      component.uploadFiles(fileList);

      tick();
      fixture.detectChanges();

      expect(component.errorMessage).toBe("AM_ERR_ONLY_IMAGE_AUDIO_SUPPORTED");
      expect(mockDataService.uploadAsset).not.toHaveBeenCalled();
      expect(component.isUploading).toBeFalse();
    }));

    it("should auto-dismiss the error message after exactly 5 seconds", fakeAsync(() => {
      const files = [
        new File([""], "unsupported.zip", { type: "application/zip" }),
      ];

      const fileList = {
        0: files[0],
        length: files.length,
        item: (index: number) => files[index],
      } as unknown as FileList;

      component.uploadFiles(fileList);
      fixture.detectChanges();

      expect(component.errorMessage).toBe("AM_ERR_ONLY_IMAGE_AUDIO_SUPPORTED");

      // Tick 4.9 seconds - should still be visible
      tick(4900);
      fixture.detectChanges();
      expect(component.errorMessage).toBe("AM_ERR_ONLY_IMAGE_AUDIO_SUPPORTED");

      // Tick remaining 100ms - should be dismissed
      tick(100);
      fixture.detectChanges();
      expect(component.errorMessage).toBeNull();
    }));

    it("should clear the dismissal timeout when ngOnDestroy is triggered to prevent memory leaks", fakeAsync(() => {
      const files = [
        new File([""], "unsupported.zip", { type: "application/zip" }),
      ];

      const fileList = {
        0: files[0],
        length: files.length,
        item: (index: number) => files[index],
      } as unknown as FileList;

      component.uploadFiles(fileList);
      fixture.detectChanges();

      expect(component.errorMessage).toBe("AM_ERR_ONLY_IMAGE_AUDIO_SUPPORTED");

      // Call ngOnDestroy to clear the timeout
      component.ngOnDestroy();

      // Ticking 5 seconds should not throw an error and since it was cleared, the error message won't be cleared by the timer
      tick(5000);
      fixture.detectChanges();
    }));
  });
});

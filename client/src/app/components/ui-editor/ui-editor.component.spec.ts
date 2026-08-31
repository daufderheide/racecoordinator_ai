import { Component, input, output, Pipe, PipeTransform } from "@angular/core";
import {
  ComponentFixture,
  fakeAsync,
  flush,
  TestBed,
  tick,
} from "@angular/core/testing";
import { FormsModule } from "@angular/forms";
import { By } from "@angular/platform-browser";
import { ActivatedRoute, Router } from "@angular/router";
import { BehaviorSubject, delay, of, Subject, throwError } from "rxjs";
import { AnchorPoint } from "@app/components/raceday/column_definition";
import { RacedayLayoutUtils } from "@app/components/raceday/utils/raceday-layout.utils";
import { DataService } from "@app/data.service";
import { CustomUI } from "@app/models/custom-ui";
import { Settings } from "@app/models/settings";
import { Theme } from "@app/models/theme";
import { ChildWindowManagerService } from "@app/services/child-window-manager.service";
import { CustomUiService } from "@app/services/custom-ui.service";
import { CustomWidgetService } from "@app/services/custom-widget.service";
import { FileSystemService } from "@app/services/file-system.service";
import { LoggerService } from "@app/services/logger.service";
import { RaceConnectionService } from "@app/services/race-connection.service";
import { SettingsService } from "@app/services/settings.service";
import { ThemeService } from "@app/services/theme.service";
import { TranslationService } from "@app/services/translation.service";
import { deepCopy } from "@app/utils/clone.utils";

import {
  BASE_AVAILABLE_COLUMNS,
  UIEditorComponent,
} from "./ui-editor.component";

@Component({
  selector: "app-image-selector",
  standalone: true,
  template: "",
  imports: [FormsModule],
})
class MockImageSelectorComponent {
  label = input<string | undefined>();
  imageUrl = input<string | undefined>();
  assets = input<any[]>([]);
  size = input<string | undefined>();
  disabled = input<boolean>(false);
  assetType = input<string>("image");
  assetId = input<string | undefined>();
  images = input<any[] | undefined>();
  imageUrlChange = output<string>();
  assetSelected = output<any>();
  uploadStarted = output<void>();
  uploadFinished = output<void>();
}

@Component({
  selector: "app-asset-preview",
  standalone: true,
  template: "",
  imports: [FormsModule],
})
class MockAssetPreviewComponent {
  assetId = input<string | undefined>();
  type = input<string>("image");
  imageUrl = input<string | undefined>();
  name = input<string>("");
  images = input<any[] | undefined>();
  animate = input<boolean>(true);
}

@Component({
  selector: "app-editor-title",
  standalone: true,
  template: "",
  imports: [FormsModule],
})
class MockEditorTitleComponent {
  titleKey = input<string>("");
  backRoute = input<string>("");
  undoManager = input<any>();
}

@Component({
  selector: "app-toolbar",
  standalone: true,
  template: "",
  imports: [FormsModule],
})
class MockToolbarComponent {
  showAdd = input<boolean>(false);
  showEdit = input<boolean>(false);
  showHelp = input<boolean>(false);
  showDelete = input<boolean>(false);
  showCopy = input<boolean>(false);
  showUndo = input<boolean>(false);
  showRedo = input<boolean>(false);
  isSaving = input<boolean>(false);
  disabledAdd = input<boolean>(false);
  disabledEdit = input<boolean>(false);
  disabledDelete = input<boolean>(false);
  disabledCopy = input<boolean>(false);
  showActivate = input<boolean>(false);
  disabledActivate = input<boolean>(false);
  showAnalytics = input<boolean>(true);
  undoManager = input<any>();
  add = output<void>();
  edit = output<void>();
  copy = output<void>();
  help = output<void>();
  delete = output<void>();
  activate = output<void>();
}

@Component({
  selector: "app-confirmation-modal",
  standalone: true,
  template: "",
  imports: [FormsModule],
})
class MockConfirmationModalComponent {
  visible = input<boolean>(false);
  title = input<string>("");
  message = input<string>("");
  messageParams = input<any>({});
  cancelText = input<string>("NO");
  confirmText = input<string>("YES");
  cancel = output<void>();
  confirm = output<void>();
}
@Component({
  selector: "app-acknowledgement-modal",
  standalone: true,
  template: "",
  imports: [FormsModule],
})
class MockAcknowledgementModalComponent {
  visible = input<boolean>(false);
  title = input<string>("");
  message = input<string>("");
  messageParams = input<any>({});
  acknowledge = output<void>();
}

@Component({
  selector: "app-audio-selector",
  standalone: true,
  template: "",
  imports: [FormsModule],
})
class MockAudioSelectorComponent {
  label = input<string>("");
  assets = input<any[]>([]);
  type = input<string>("preset");
  url = input<string | undefined>();
  text = input<string | undefined>();
  readonly = input<boolean>(false);
  context = input<any>();
  mode = input<"single" | "set">("single");
  typeChange = output<string>();
  urlChange = output<string>();
  textChange = output<string>();
}

@Pipe({ name: "translate" })
class MockTranslatePipe implements PipeTransform {
  transform(value: string): string {
    if (value === "UE_LABEL_DEFAULT_THEME") return "RaceCoordinator AI";
    if (value === "UE_LABEL_COPY_SUFFIX") return " (Copy)";
    return value;
  }
}

describe("UIEditorComponent", () => {
  let component: UIEditorComponent;
  let fixture: ComponentFixture<UIEditorComponent>;
  let mockSettingsService: any;
  let mockFileSystem: any;
  let mockDataService: any;
  let mockRouter: any;
  let mockThemeService: any;
  let mockTranslationService: any;
  let mockRaceConnectionService: any;
  let mockCustomWidgetService: any;

  afterEach(() => {
    if (fixture) {
      fixture.destroy();
    }
  });

  beforeEach(async () => {
    mockRaceConnectionService = jasmine.createSpyObj("RaceConnectionService", [
      "connect",
      "disconnect",
    ]);
    mockRaceConnectionService.raceFlag$ = of(0);
    mockRaceConnectionService.connectionState$ = of("CONNECTED");
    mockSettingsService = jasmine.createSpyObj("SettingsService", [
      "getSettings",
      "saveSettings",
    ]);
    mockFileSystem = jasmine.createSpyObj("FileSystemService", [
      "getCustomDirectoryHandle",
      "selectCustomFolder",
      "clearCustomFolder",
      "getCustomWidgetDirectoryHandle",
      "selectCustomWidgetFolder",
      "clearCustomWidgetFolder",
    ]);
    mockCustomWidgetService = jasmine.createSpyObj("CustomWidgetService", [
      "getCustomWidgets",
      "getWidgetDefinition",
      "reloadCustomWidgets",
      "exportStarterWidgets",
      "isCustomWidget",
      "getWidgetComponent",
    ]);
    mockDataService = jasmine.createSpyObj("DataService", [
      "listAssets",
      "getThemes",
      "updateTheme",
      "createTheme",
      "deleteTheme",
      "getThemeTemplates",
      "getAssetUrl",
      "updateRaceSubscription",
      "getSystemState",
      "getDrivers",
      "getTracks",
      "setConnectionIntent",
      "getCustomUIs",
      "getCustomUiTemplates",
      "createCustomUI",
      "updateCustomUI",
      "duplicateCustomUI",
      "deleteCustomUI",
    ]);
    mockDataService.socketConnected$ = of(true);
    mockDataService.systemState$ = new BehaviorSubject<any>({});
    mockDataService.getDrivers.and.returnValue(of([]));
    mockDataService.getTracks.and.returnValue(of([]));
    mockDataService.getCustomUIs.and.returnValue(of([]));
    mockDataService.getCustomUiTemplates.and.returnValue(of([]));
    mockDataService.getThemeTemplates.and.returnValue(of([]));
    mockDataService.updateTheme.and.returnValue(of({}));
    mockDataService.updateCustomUI.and.returnValue(of({}));
    mockDataService.createCustomUI.and.returnValue(of({}));
    mockDataService.duplicateCustomUI.and.returnValue(of({}));
    mockDataService.deleteCustomUI.and.returnValue(of({}));
    mockDataService.updateRaceSubscription.and.stub();
    mockRouter = jasmine.createSpyObj("Router", [
      "navigate",
      "getCurrentNavigation",
    ]);
    mockRouter.events = new Subject().asObservable();
    mockRouter.getCurrentNavigation.and.returnValue(null);
    mockThemeService = jasmine.createSpyObj("ThemeService", [
      "getActiveTheme",
      "isThemeActive",
      "getThemes",
      "refresh",
      "setActiveTheme",
      "deleteTheme",
      "duplicateTheme",
      "resolveAssetId",
    ]);
    mockTranslationService = jasmine.createSpyObj("TranslationService", [
      "translate",
      "getTranslationsLoaded",
    ]);
    mockTranslationService.getTranslationsLoaded.and.returnValue(of(true));
    const mockActivatedRoute = {
      queryParams: of({}),
      snapshot: {
        queryParamMap: {
          get: jasmine.createSpy("get").and.returnValue(null),
        },
      },
    };
    mockTranslationService.translate.and.callFake((key: string) => {
      if (key === "UE_LABEL_DEFAULT_THEME") return "RaceCoordinator AI";
      if (key === "UE_LABEL_COPY_SUFFIX") return " (Copy)";
      return key;
    });
    mockDataService.listAssets.and.returnValue(of([]));
    mockDataService.getThemes.and.returnValue(of([]));
    mockDataService.updateTheme.and.returnValue(of({}));
    mockDataService.deleteTheme.and.returnValue(of({}));
    mockDataService.createTheme.and.returnValue(of({}));

    const settings = Object.assign(new Settings(), {
      recentRaceIds: [],
      selectedDriverIds: [],
      serverIp: "127.0.0.1",
      serverPort: 8080,
      language: "en",
      racedaySetupWalkthroughSeen: true,
      flagRacing: "g",
      flagHeatPaused: "y",
      flagHeatOver: "r",
      flagOneLapToGo: "w",
      flagPenalty: "b",
      flagHeatFinishing: "c",
    });
    mockSettingsService.getSettings.and.returnValue(
      Object.assign(new Settings(), {
        sortByStandings: true,
        flagRacing: "g",
        flagHeatPaused: "y",
        flagHeatOver: "r",
        flagOneLapToGo: "w",
        flagPenalty: "b",
        flagHeatFinishing: "c",
      }),
    );
    mockSettingsService.saveSettings.and.returnValue(
      of(settings).pipe(delay(100)),
    );
    mockDataService.listAssets.and.returnValue(
      of([{ type: "image", url: "img1.png" }]),
    );
    mockFileSystem.getCustomDirectoryHandle.and.returnValue(
      of({ name: "CustomUI" }),
    );
    mockFileSystem.getCustomWidgetDirectoryHandle.and.returnValue(
      of({ name: "CustomWidgets" }),
    );
    mockCustomWidgetService.getCustomWidgets.and.returnValue([]);
    mockCustomWidgetService.reloadCustomWidgets.and.returnValue(
      Promise.resolve(),
    );
    mockCustomWidgetService.exportStarterWidgets.and.returnValue(
      Promise.resolve({
        success: true,
        count: 4,
        directory: "CustomWidgets",
      }),
    );
    mockCustomWidgetService.isCustomWidget.and.callFake(
      (t: string) => t?.startsWith("custom:") ?? false,
    );
    mockCustomWidgetService.getWidgetComponent.and.returnValue(null);
    mockDataService.getThemes.and.returnValue(of([]));
    mockThemeService.getActiveTheme.and.returnValue(null);
    mockThemeService.getThemes.and.returnValue([]);
    mockThemeService.resolveAssetId.and.returnValue(null);

    await TestBed.configureTestingModule({
      imports: [
        FormsModule,
        UIEditorComponent,
        MockImageSelectorComponent,
        MockEditorTitleComponent,

        MockAssetPreviewComponent,
        MockToolbarComponent,
        MockConfirmationModalComponent,
        MockAcknowledgementModalComponent,
        MockTranslatePipe,
        MockAudioSelectorComponent,
      ],
      providers: [
        { provide: SettingsService, useValue: mockSettingsService },
        { provide: FileSystemService, useValue: mockFileSystem },
        { provide: DataService, useValue: mockDataService },
        { provide: Router, useValue: mockRouter },
        { provide: ThemeService, useValue: mockThemeService },
        { provide: TranslationService, useValue: mockTranslationService },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: RaceConnectionService, useValue: mockRaceConnectionService },
        { provide: CustomWidgetService, useValue: mockCustomWidgetService },
        {
          provide: LoggerService,
          useValue: jasmine.createSpyObj("LoggerService", [
            "error",
            "info",
            "warn",
            ,
            "debug",
            "log",
          ]),
        },
      ],
    }).compileComponents();
  });

  afterEach(() => {
    if (fixture) {
      fixture.destroy();
    }
  });

  beforeEach(async () => {
    fixture = TestBed.createComponent(UIEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it("should create and load data", () => {
    expect(component).toBeTruthy();
    expect(component.isLoading).toBeFalse();
    expect(component.customDirectoryName).toBe("CustomUI");
    expect(component.assets.length).toBe(1);
    expect(mockRaceConnectionService.connect).toHaveBeenCalled();
  });

  it("should handle directory selection", fakeAsync(() => {
    mockFileSystem.selectCustomFolder.and.returnValue(Promise.resolve(true));
    mockFileSystem.getCustomDirectoryHandle.and.returnValue(
      Promise.resolve({ name: "NewDir" }),
    );

    component.selectDirectory();
    tick(); // Resolve selectCustomFolder promise
    tick(); // Resolve getCustomDirectoryHandle promise
    tick(1000);
    fixture.detectChanges();
    expect(mockFileSystem.selectCustomFolder).toHaveBeenCalled();
    expect(component.customDirectoryName).toBe("NewDir");
  }));

  it("should handle reset default", async () => {
    mockFileSystem.clearCustomFolder.and.returnValue(Promise.resolve());

    await component.resetDefault();

    expect(mockFileSystem.clearCustomFolder).toHaveBeenCalled();
    expect(component.customDirectoryName).toBeNull();
  });

  it("should handle custom widget directory selection", fakeAsync(() => {
    mockFileSystem.selectCustomWidgetFolder.and.returnValue(
      Promise.resolve(true),
    );
    mockFileSystem.getCustomWidgetDirectoryHandle.and.returnValue(
      Promise.resolve({ name: "MyWidgetsDir" }),
    );

    component.selectWidgetDirectory();
    tick(); // Resolve selectCustomWidgetFolder promise
    tick(); // Resolve getCustomWidgetDirectoryHandle promise
    tick(); // Resolve reloadCustomWidgets promise
    fixture.detectChanges();

    expect(mockFileSystem.selectCustomWidgetFolder).toHaveBeenCalled();
    expect(component.customWidgetDirectoryName).toBe("MyWidgetsDir");
    expect(mockCustomWidgetService.reloadCustomWidgets).toHaveBeenCalled();
  }));

  it("should handle custom widget reset default", async () => {
    mockFileSystem.clearCustomWidgetFolder.and.returnValue(Promise.resolve());

    await component.resetWidgetDefault();

    expect(mockFileSystem.clearCustomWidgetFolder).toHaveBeenCalled();
    expect(component.customWidgetDirectoryName).toBeNull();
    expect(mockCustomWidgetService.reloadCustomWidgets).toHaveBeenCalled();
  });

  it("should handle update sample widgets and show acknowledgement modal", async () => {
    await component.updateSampleWidgets();
    expect(mockCustomWidgetService.exportStarterWidgets).toHaveBeenCalled();
    expect(component.showSuccessModal).toBeTrue();
    expect(component.successModalTitle).toBe(
      "UE_UPDATE_SAMPLE_WIDGETS_SUCCESS_TITLE",
    );
    expect(component.successModalMessage).toBe(
      "UE_UPDATE_SAMPLE_WIDGETS_SUCCESS_MSG",
    );
    expect(component.successModalParams).toEqual({
      count: 4,
      directory: "CustomWidgets",
    });
  });

  it("should handle export starter widgets delegating to updateSampleWidgets", async () => {
    spyOn(component, "updateSampleWidgets").and.callThrough();
    await component.exportStarterWidgets();
    expect(component.updateSampleWidgets).toHaveBeenCalled();
  });

  it("should format widget label keys correctly for standard and custom widgets", () => {
    mockCustomWidgetService.getWidgetDefinition.and.callFake((key: string) => {
      if (key === "custom:telemetry") {
        return { manifest: { name: "Live Telemetry Gauge" } };
      }
      return undefined;
    });

    expect(component.getWidgetTypeLabelKey("leaderboard")).toBe(
      "UE_WIDGET_TYPE_LEADERBOARD",
    );
    expect(component.getWidgetTypeLabelKey("custom:telemetry")).toBe(
      "Live Telemetry Gauge",
    );
    expect(component.getWidgetTypeLabelKey("custom:unknown-widget")).toBe(
      "unknown-widget",
    );
    expect(component.isCustomWidget("custom:telemetry")).toBeTrue();
    expect(component.isCustomWidget("leaderboard")).toBeFalse();
    expect(component.isCustomWidget(undefined)).toBeFalse();
  });

  it("should sort available columns when translations are loaded", fakeAsync(() => {
    const loadedSubject = new BehaviorSubject<boolean>(false);
    mockTranslationService.getTranslationsLoaded.and.returnValue(
      loadedSubject.asObservable(),
    );

    const localFixture = TestBed.createComponent(UIEditorComponent);
    const localComponent = localFixture.componentInstance;

    spyOn<any>(localComponent, "sortAvailableColumns").and.callThrough();

    localFixture.detectChanges(); // triggers ngOnInit

    loadedSubject.next(true);
    tick();

    expect(localComponent["sortAvailableColumns"]).toHaveBeenCalled();
  }));

  it("should save settings and reset tracking", fakeAsync(() => {
    component.save();
    expect(component.isSaving).toBeTrue();
    expect(mockSettingsService.saveSettings).toHaveBeenCalled();

    tick(1000);
    expect(component.isSaving).toBeFalse();
  }));

  it("should navigate back", () => {
    component.onBack();
    expect(mockRouter.navigate).toHaveBeenCalledWith(["/raceday-setup"], {
      queryParams: {},
    });
  });

  it("should detect changes via undo manager", fakeAsync(() => {
    // Prevent auto-save from resetting the dirty state in this test
    component.isLoading = true;

    component.undoManager.initialize(component.editingState);
    component.editingSettings.sortByStandings =
      !component.editingSettings.sortByStandings;
    component.captureState();
    tick();

    expect(component.hasChanges()).toBeTrue();
  }));

  it("should return correct column slots", () => {
    component.editingSettings.racedayColumns = ["driver.name", "lapCount"];
    component.refreshDisplayProperties();
    const slots = component.displayColumnSlots;
    expect(slots.length).toBe(2);
    expect(slots[0].label).toBe("RD_COL_NAME");
    expect(slots[1].label).toBe("RD_COL_LAP");
  });

  it("should capture state on onColumnsChanged", () => {
    spyOn(component.undoManager, "captureState");
    component.onColumnsChanged();
    expect(component.undoManager.captureState).toHaveBeenCalled();
  });

  it("should reset layout to default values", () => {
    spyOn(component.undoManager, "captureState");

    // Set some custom values
    component.editingSettings.racedayColumns = ["custom-col"];
    component.editingSettings.columnLayouts = { "custom-col": {} };

    component.resetRacedayLayout();

    expect(component.editingSettings.racedayColumns).toEqual(
      Settings.DEFAULT_COLUMNS,
    );
    expect(component.undoManager.captureState).toHaveBeenCalled();
  });

  it("should calculate hasLaneViewWidget correctly based on active widgets", () => {
    // Initially no widgets
    component.editingSettings.racedayLayout = { widgets: [] };
    expect(component.hasLaneViewWidget).toBeFalse();

    // With random widgets
    component.editingSettings.racedayLayout = {
      widgets: [
        {
          id: "w1",
          widgetType: "leaderboard",
          x: 0,
          y: 0,
          width: 100,
          height: 100,
          zIndex: 1,
        },
      ],
    };
    expect(component.hasLaneViewWidget).toBeFalse();

    // With lane-view widget
    component.editingSettings.racedayLayout = {
      widgets: [
        {
          id: "w2",
          widgetType: "lane-view",
          x: 0,
          y: 0,
          width: 100,
          height: 100,
          zIndex: 1,
        },
      ],
    };
    expect(component.hasLaneViewWidget).toBeTrue();
  });

  it("should handle sortByStandings change", () => {
    component.editingSettings.sortByStandings = false;
    expect(component.editingSettings.sortByStandings).toBeFalse();
    component.editingSettings.sortByStandings = true;
    expect(component.editingSettings.sortByStandings).toBeTrue();
  });

  it("should handle highlightRowOnLap change", () => {
    component.editingSettings.highlightRowOnLap = true;
    expect(component.editingSettings.highlightRowOnLap).toBeTrue();
    component.editingSettings.highlightRowOnLap = false;
    expect(component.editingSettings.highlightRowOnLap).toBeFalse();
  });

  it("should handle highlightPracticeRowOnLap change", () => {
    component.editingSettings.highlightPracticeRowOnLap = true;
    expect(component.editingSettings.highlightPracticeRowOnLap).toBeTrue();
    component.editingSettings.highlightPracticeRowOnLap = false;
    expect(component.editingSettings.highlightPracticeRowOnLap).toBeFalse();
  });

  it("should include image sets in availableColumns correctly", () => {
    mockDataService.listAssets.and.returnValue(
      of([
        { type: "image", url: "img1.png" },
        { type: "image_set", name: "My Set", model: { entityId: "set123" } },
      ]),
    );

    component.loadData();

    const avatarCol = component.availableColumns.find(
      (c) => c.key === "driver.avatarUrl",
    );
    expect(avatarCol).toBeTruthy();
    expect(avatarCol?.label).toBe("RD_COL_AVATAR");

    const imageSetCol = component.availableColumns.find(
      (c) => c.key === "imageset_set123",
    );
    expect(imageSetCol).toBeTruthy();
    expect(imageSetCol?.label).toBe("My Set");
  });

  it("should populate soundAssets and assets correctly on loadData", () => {
    mockDataService.listAssets.and.returnValue(
      of([
        { type: "image", url: "img1.png" },
        { type: "audio", name: "Beep", model: { entityId: "sound1" } },
        { type: "audio", name: "Yellow Flag", model: { entityId: "sound2" } },
        { type: "audio_set", name: "Announcer", model: { entityId: "set1" } },
      ]),
    );

    component.loadData();

    expect(component.assets.length).toBe(4);
    expect(component.soundAssets.length).toBe(3);
    expect(component.soundAssets[0].type).toBe("audio");
    expect(component.soundAssets[1].type).toBe("audio");
    expect(component.soundAssets[2].type).toBe("audio_set");
  });

  it("should initialize previewTTSContext", () => {
    expect(component.previewTTSContext).toBeDefined();
    expect(component.previewTTSContext.driver).toBeDefined();
    expect(component.previewTTSContext.driver.name).toBe("Dave");
  });

  it("should deduplicate fuel gauge image set in availableColumns", () => {
    // Simulate multiple assets that could match "Fuel Gauge"
    // 1. One by name
    // 2. One by builtin entityId
    // 3. One with name "Default Fuel Gauge" / id "default_fuel_gauge"
    mockDataService.listAssets.and.returnValue(
      of([
        {
          type: "image_set",
          name: "Fuel Gauge",
          model: { entityId: "custom-id" },
        },
        {
          type: "image_set",
          name: "Default Fuel Gauge",
          model: { entityId: "default_fuel_gauge" },
        },
        {
          type: "image_set",
          name: "Custom Name",
          model: { entityId: "fuel-gauge-builtin" },
        },
        {
          type: "image_set",
          name: "Another Set",
          model: { entityId: "set456" },
        },
      ]),
    );

    component.loadData();

    const fuelGaugeCols = component.availableColumns.filter(
      (c) => c.key === "imageset_fuel-gauge-builtin",
    );

    // Should only have one, even though two assets matched the criteria
    expect(fuelGaugeCols.length).toBe(1);

    // The "Another Set" should still be there with its own key
    const otherSet = component.availableColumns.find(
      (c) => c.key === "imageset_set456",
    );
    expect(otherSet).toBeTruthy();
  });

  it("should return correct label for avatar column in columnSlots", () => {
    component.editingSettings.racedayColumns = ["driver.avatarUrl"];
    component.refreshDisplayProperties();
    const slots = component.displayColumnSlots;
    expect(slots.length).toBe(1);
    expect(slots[0].label).toBe("RD_COL_AVATAR");
  });

  it("should include velocity columns in availableColumns", () => {
    const mph = component.availableColumns.find((c) => c.key === "mph");
    const kph = component.availableColumns.find((c) => c.key === "kph");
    const fph = component.availableColumns.find((c) => c.key === "fph");

    expect(mph).toBeTruthy();
    expect(mph?.label).toBe("RD_COL_MPH");
    expect(kph).toBeTruthy();
    expect(kph?.label).toBe("RD_COL_KPH");
    expect(fph).toBeTruthy();
    expect(fph?.label).toBe("RD_COL_FPH");
  });

  it("should include totalTime column in availableColumns", () => {
    const totalTime = component.availableColumns.find(
      (c) => c.key === "totalTime",
    );
    expect(totalTime).toBeTruthy();
    expect(totalTime?.label).toBe("RD_COL_TOTAL_TIME");
  });

  it("should include recordLapTime column in availableColumns", () => {
    const recordLapTime = component.availableColumns.find(
      (c) => c.key === "recordLapTime",
    );
    expect(recordLapTime).toBeTruthy();
    expect(recordLapTime?.label).toBe("RD_COL_RECORD_LAP_TIME");
  });

  it("should include lapsLed column in availableColumns", () => {
    const lapsLed = component.availableColumns.find((c) => c.key === "lapsLed");
    expect(lapsLed).toBeTruthy();
    expect(lapsLed?.label).toBe("RD_COL_LAPS_LED");
  });

  it("should include driver flag column in availableColumns with label RD_COL_DRIVER_FLAG", () => {
    const flag = component.availableColumns.find((c) => c.key === "flag");
    expect(flag).toBeTruthy();
    expect(flag?.label).toBe("RD_COL_DRIVER_FLAG");
  });

  it("should include QR code columns in availableColumns", () => {
    const qrCode = component.availableColumns.find((c) => c.key === "qrCode");
    const driverViewQrCode = component.availableColumns.find(
      (c) => c.key === "driverViewQrCode",
    );

    expect(qrCode).toBeTruthy();
    expect(qrCode?.label).toBe("RD_COL_LANE_QR");
    expect(driverViewQrCode).toBeTruthy();
    expect(driverViewQrCode?.label).toBe("RD_COL_DRIVER_VIEW_QR");
  });

  it("should include all 7 pacing columns in availableColumns", () => {
    const pacingCols = [
      { key: "ghostPacing", label: "RD_COL_GHOST_PACING_LANE_RECORD" },
      { key: "ghostPacingPB", label: "RD_COL_GHOST_PACING_PERSONAL_BEST" },
      {
        key: "ghostPacingPersonalAvg",
        label: "RD_COL_GHOST_PACING_PERSONAL_AVG",
      },
      {
        key: "ghostPacingPersonalMedian",
        label: "RD_COL_GHOST_PACING_PERSONAL_MEDIAN",
      },
      {
        key: "ghostPacingLeaderAvg",
        label: "RD_COL_GHOST_PACING_LEADER_AVG",
      },
      {
        key: "ghostPacingLeaderMedian",
        label: "RD_COL_GHOST_PACING_LEADER_MEDIAN",
      },
      {
        key: "ghostPacingLeaderBest",
        label: "RD_COL_GHOST_PACING_LEADER_BEST",
      },
    ];

    pacingCols.forEach(({ key, label }) => {
      const col = component.availableColumns.find((c) => c.key === key);
      expect(col).toBeTruthy(`Expected column with key ${key} to exist`);
      expect(col?.label).toBe(label);
    });
  });

  describe("column integrity guardrails", () => {
    it("should have unique keys across all BASE_AVAILABLE_COLUMNS", () => {
      const keys = BASE_AVAILABLE_COLUMNS.map((c) => c.key);
      const uniqueKeys = new Set(keys);
      expect(uniqueKeys.size)
        .withContext("Duplicate keys found in BASE_AVAILABLE_COLUMNS")
        .toBe(keys.length);
    });

    it("should include all Settings.DEFAULT_COLUMNS in BASE_AVAILABLE_COLUMNS", () => {
      Settings.DEFAULT_COLUMNS.forEach((defaultCol) => {
        const found = BASE_AVAILABLE_COLUMNS.some((c) => c.key === defaultCol);
        expect(found)
          .withContext(
            `Default column ${defaultCol} is missing from BASE_AVAILABLE_COLUMNS`,
          )
          .toBeTrue();
      });
    });

    it("should include all default columnLayouts properties in BASE_AVAILABLE_COLUMNS", () => {
      const defaultSettings = new Settings();
      const anchorProperties = new Set<string>();
      Object.values(defaultSettings.columnLayouts).forEach((layout) => {
        Object.values(layout).forEach((val) => {
          if (val) {
            anchorProperties.add(val);
          }
        });
      });

      anchorProperties.forEach((prop) => {
        const found = BASE_AVAILABLE_COLUMNS.some((c) => c.key === prop);
        expect(found)
          .withContext(
            `Anchor property ${prop} from default columnLayouts is missing from BASE_AVAILABLE_COLUMNS`,
          )
          .toBeTrue();
      });
    });

    it("should preserve every BASE_AVAILABLE_COLUMNS item when loadData executes", () => {
      component.loadData();
      BASE_AVAILABLE_COLUMNS.forEach((baseCol) => {
        const found = component.availableColumns.find(
          (c) => c.key === baseCol.key,
        );
        expect(found)
          .withContext(`Column ${baseCol.key} was lost after loadData()`)
          .toBeTruthy();
        expect(found?.label).toBe(baseCol.label);
      });
    });

    it("should resolve valid label keys and widths for all BASE_AVAILABLE_COLUMNS in RacedayLayoutUtils", () => {
      BASE_AVAILABLE_COLUMNS.forEach((col) => {
        const labelKey = RacedayLayoutUtils.getLabelKeyForColumn(col.key);
        expect(labelKey)
          .withContext(
            `Column ${col.key} resolved to UNKNOWN in RacedayLayoutUtils.getLabelKeyForColumn`,
          )
          .not.toBe("UNKNOWN");
        const width = RacedayLayoutUtils.getDefaultColumnWidth(col.key);
        expect(width)
          .withContext(`Column ${col.key} has invalid default width ${width}`)
          .toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe("expander behavior", () => {
    beforeEach(() => {
      localStorage.clear();
      spyOn(localStorage, "getItem").and.callThrough();
      spyOn(localStorage, "setItem").and.callThrough();
    });

    it("should load expander state from localStorage on init", () => {
      const savedState = JSON.stringify({
        layout: false,
        config: true,
        flags: false,
      });
      (localStorage.getItem as jasmine.Spy).and.returnValue(savedState);

      // We need a new instance to test OnInit logic that calls loadExpanderState
      const newFixture = TestBed.createComponent(UIEditorComponent);
      const newComponent = newFixture.componentInstance;
      newFixture.detectChanges();

      expect(newComponent.sectionsExpanded["layout"]).toBeFalse();
      expect(newComponent.sectionsExpanded["config"]).toBeTrue();
      expect(newComponent.sectionsExpanded["flags"]).toBeFalse();
    });

    it("should toggle section and save to localStorage", () => {
      const initialLayout = component.sectionsExpanded["layout"];
      component.toggleSection("layout");

      expect(component.sectionsExpanded["layout"]).toBe(!initialLayout);
      expect(localStorage.setItem).toHaveBeenCalledWith(
        "ui_editor_expanders",
        JSON.stringify(component.sectionsExpanded),
      );
    });

    it("should handle localStorage errors gracefully when toggling", () => {
      const logger = TestBed.inject(LoggerService);
      (localStorage.setItem as jasmine.Spy).and.throwError(
        "QuotaExceededError",
      );

      const initialLayout = component.sectionsExpanded["layout"];
      component.toggleSection("layout");

      // State should still toggle locally even if save fails
      expect(component.sectionsExpanded["layout"]).toBe(!initialLayout);
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe("theme toolbar states", () => {
    it("should render a toolbar for each theme", () => {
      const themes: Theme[] = [
        {
          entity_id: "t1",
          name: "Default",
          is_default: true,
          slots: {},
        } as Theme,
        {
          entity_id: "t2",
          name: "Custom",
          is_default: false,
          slots: {},
        } as Theme,
      ];
      component.editingState.themes = themes;
      component.refreshDisplayProperties();
      themes.forEach(
        (t) => (component.sectionsExpanded[`theme_${t.entity_id}`] = true),
      );
      fixture.detectChanges();

      const toolbars = fixture.debugElement.queryAll(
        By.css(".theme-sub-section .theme-toolbar-container app-toolbar"),
      );
      expect(toolbars.length).toBe(themes.length);
    });

    it("should show Delete on all theme toolbars", () => {
      const themes: Theme[] = [
        {
          entity_id: "t1",
          name: "Default",
          is_default: true,
          slots: {},
        } as Theme,
        {
          entity_id: "t2",
          name: "Custom",
          is_default: false,
          slots: {},
        } as Theme,
      ];
      component.editingState.themes = themes;
      component.refreshDisplayProperties();
      themes.forEach(
        (t) => (component.sectionsExpanded[`theme_${t.entity_id}`] = true),
      );
      fixture.detectChanges();

      const toolbars = fixture.debugElement.queryAll(
        By.css(".theme-sub-section .theme-toolbar-container app-toolbar"),
      );

      // Default theme toolbar - Delete should be shown
      expect(toolbars[0].componentInstance.showDelete()).toBeTrue();

      // Custom theme toolbar - Delete should be shown and enabled
      expect(toolbars[1].componentInstance.showDelete()).toBeTrue();
      expect(toolbars[1].componentInstance.disabledDelete()).toBeFalse();
    });

    it("should show Add button on Themes header toolbar and not on individual themes", () => {
      const themes: Theme[] = [
        {
          entity_id: "t1",
          name: "Default",
          is_default: true,
          slots: {},
        } as Theme,
        {
          entity_id: "t2",
          name: "Custom",
          is_default: false,
          slots: {},
        } as Theme,
      ];
      component.editingState.themes = themes;
      component.refreshDisplayProperties();
      themes.forEach(
        (t) => (component.sectionsExpanded[`theme_${t.entity_id}`] = true),
      );
      fixture.detectChanges();

      const headerToolbar = fixture.debugElement.query(
        By.css("#help-themes .theme-toolbar-container app-toolbar"),
      );
      expect(headerToolbar.componentInstance.showAdd()).toBeTrue();

      const itemToolbars = fixture.debugElement.queryAll(
        By.css(".theme-sub-section .theme-toolbar-container app-toolbar"),
      );
      expect(itemToolbars[0].componentInstance.showAdd()).toBeFalse();
      expect(itemToolbars[1].componentInstance.showAdd()).toBeFalse();
    });

    it("should enable Edit and Copy on all theme toolbars", () => {
      const themes: Theme[] = [
        {
          entity_id: "t1",
          name: "Default",
          is_default: true,
          slots: {},
        } as Theme,
        {
          entity_id: "t2",
          name: "Custom",
          is_default: false,
          slots: {},
        } as Theme,
      ];
      component.editingState.themes = themes;
      component.refreshDisplayProperties();
      themes.forEach(
        (t) => (component.sectionsExpanded[`theme_${t.entity_id}`] = true),
      );
      fixture.detectChanges();

      const toolbars = fixture.debugElement.queryAll(
        By.css(".theme-sub-section .theme-toolbar-container app-toolbar"),
      );
      toolbars.forEach((toolbar) => {
        expect(toolbar.componentInstance.disabledEdit()).toBeFalse();
        expect(toolbar.componentInstance.disabledCopy()).toBeFalse();
      });
    });

    it("should always put default themes first in the themes list and preserve original order for others", () => {
      const themes: Theme[] = [
        { entity_id: "t2", name: "ZZZ", is_default: false } as Theme,
        {
          entity_id: "practice_theme_rc_ai",
          name: "Practice",
          is_default: true,
        } as Theme,
        { entity_id: "t3", name: "AAA", is_default: false } as Theme,
        {
          entity_id: "default_classic_rc_ai",
          name: "Default",
          is_default: true,
        } as Theme,
      ];
      component.editingState.themes = themes;
      component.refreshDisplayProperties();

      const sorted = component.displayThemes;
      expect(sorted.length).toBe(4);
      expect(sorted[0].entity_id).toBe("default_classic_rc_ai");
      expect(sorted[1].entity_id).toBe("practice_theme_rc_ai");
      expect(sorted[2].name).toBe("ZZZ");
      expect(sorted[3].name).toBe("AAA");
    });
    it("should not show activate button on theme toolbar and allow theme selection", () => {
      const themes: Theme[] = [
        {
          entity_id: "t1",
          is_default: true,
          name: "Default",
          slots: {},
        } as Theme,
        {
          entity_id: "t2",
          is_default: false,
          name: "Custom",
          slots: {},
        } as Theme,
      ];
      component.editingState.themes = themes;
      component.refreshDisplayProperties();
      component.editingSettings.activeThemeId = "t1";
      fixture.detectChanges();

      const toolbars = fixture.debugElement.queryAll(
        By.css(".theme-toolbar-container app-toolbar"),
      );

      // Toolbars should not show Activate button
      expect(toolbars[0].componentInstance.showActivate()).toBeFalse();
      expect(toolbars[1].componentInstance.showActivate()).toBeFalse();

      // Theme selection
      component.onThemeSelected("t2");
      expect(component.editingSettings.activeThemeId).toBe("t2");
      expect(mockThemeService.setActiveTheme).toHaveBeenCalledWith("t2");
    });

    it("should allow editing the name of any theme", fakeAsync(() => {
      const themes: Theme[] = [
        {
          entity_id: "t1",
          is_default: true,
          name: "Default",
          slots: {},
        } as Theme,
        {
          entity_id: "t2",
          is_default: false,
          name: "Custom",
          slots: {},
        } as Theme,
      ];
      component.editingState.themes = themes;
      component.refreshDisplayProperties();
      fixture.detectChanges();

      const inputs = fixture.debugElement.queryAll(By.css(".theme-name-input"));
      expect(inputs.length).toBe(2);

      inputs[1].nativeElement.value = "Updated Name";
      inputs[1].nativeElement.dispatchEvent(new Event("input"));
      inputs[1].nativeElement.dispatchEvent(new Event("change"));
      tick();

      expect(themes[1].name).toBe("Updated Name");
      expect(mockDataService.updateTheme).toHaveBeenCalledWith("t2", themes[1]);
    }));

    it("should enable image selectors for all themes including default", () => {
      const themes: Theme[] = [
        {
          entity_id: "t1",
          name: "Default",
          is_default: true,
          slots: {},
        } as Theme,
      ];
      component.editingState.themes = themes;
      component.refreshDisplayProperties();
      component.sectionsExpanded["theme_t1"] = true;
      component.sectionsExpanded["flags"] = true;
      component.sectionsExpanded["countdown"] = true;
      component.sectionsExpanded["fuelGauge"] = true;
      fixture.detectChanges();

      const selectors = fixture.debugElement.queryAll(
        By.css("app-image-selector"),
      );
      expect(selectors.length).toBeGreaterThan(0);
      selectors.forEach((s) => {
        expect(s.componentInstance.disabled()).toBeFalse();
      });
    });

    it("should allow updating theme slots on any theme including default", async () => {
      const theme = { entity_id: "t1", is_default: true, slots: {} } as Theme;

      await component.onThemeSlotChanged(theme, "flag.racing", {
        entity_id: "a1",
      });

      expect(theme.slots["flag.racing"]).toBe("a1");
    });

    it("should show confirmation modal for non-default theme deletion", () => {
      const theme = {
        entity_id: "t2",
        is_default: false,
        name: "Custom",
        slots: {},
      } as Theme;

      component.onDeleteTheme(theme);

      expect(component.showDeleteConfirm).toBeTrue();
      expect(component.themeToDelete).toBe(theme);
      expect(component.deleteThemeParams).toEqual({ name: "Custom" });
    });

    it("should handle cancellation of theme deletion", () => {
      component.showDeleteConfirm = true;
      component.themeToDelete = { name: "Custom" } as Theme;
      component.deleteThemeParams = { name: "Custom" };

      component.onCancelDeleteTheme();

      expect(component.showDeleteConfirm).toBeFalse();
      expect(component.themeToDelete).toBeNull();
      expect(component.deleteThemeParams).toEqual({});
    });

    it("should handle deletion confirmation and select default if deleted theme was active", fakeAsync(() => {
      const themes: Theme[] = [
        {
          entity_id: "t1",
          is_default: true,
          name: "Default",
          slots: {},
        } as Theme,
        {
          entity_id: "t2",
          is_default: false,
          name: "Custom",
          slots: {},
        } as Theme,
      ];
      component.editingState.themes = themes;
      component.refreshDisplayProperties();
      component.editingSettings.activeThemeId = "t2";
      component.themeToDelete = themes[1];
      component.showDeleteConfirm = true;

      mockThemeService.deleteTheme.and.returnValue(Promise.resolve());
      mockThemeService.refresh.and.returnValue(Promise.resolve());
      mockThemeService.getThemes.and.returnValue(themes.slice(0, 1));

      component.onConfirmDeleteTheme();
      tick();
      tick();

      expect(mockThemeService.deleteTheme).toHaveBeenCalledWith("t2");
      expect(component.editingSettings.activeThemeId).toBe("t1");
      expect(component.showDeleteConfirm).toBeFalse();
    }));

    it("should duplicate the default theme when creating a new theme without activating it", fakeAsync(() => {
      const defaultTheme = {
        entity_id: "t1",
        is_default: true,
        name: "Default",
        slots: {},
      } as Theme;
      const newTheme = {
        entity_id: "t3",
        is_default: false,
        name: "New Theme",
        slots: {},
      } as Theme;
      component.editingState.themes = [defaultTheme];
      component.refreshDisplayProperties();
      component.editingSettings.activeThemeId = "t1";

      mockThemeService.duplicateTheme.and.returnValue(
        Promise.resolve(newTheme),
      );

      component.createNewTheme();
      flush();

      const expectedName = "RaceCoordinator AI (Copy)";
      expect(mockThemeService.duplicateTheme).toHaveBeenCalledWith(
        "t1",
        expectedName,
      );
      expect(component.editingSettings.activeThemeId).toBe("t1");
      expect(component.displayThemes.length).toBe(2);
      expect(component.sectionsExpanded["theme_t3"]).toBeTrue();
    }));

    it("should duplicate a theme without activating the copy", fakeAsync(() => {
      const themes: Theme[] = [
        {
          entity_id: "t1",
          is_default: true,
          name: "Default",
          slots: {},
        } as Theme,
        {
          entity_id: "t2",
          is_default: false,
          name: "Custom",
          slots: {},
        } as Theme,
      ];
      const newTheme = {
        entity_id: "t2_copy",
        is_default: false,
        name: "Custom (Copy)",
      } as Theme;
      component.editingState.themes = themes;
      component.refreshDisplayProperties();
      component.editingSettings.activeThemeId = "t1";

      mockThemeService.duplicateTheme.and.returnValue(
        Promise.resolve(newTheme),
      );

      component.onDuplicateTheme(themes[1]);
      flush();

      const expectedName = "Custom (Copy)";

      expect(mockThemeService.duplicateTheme).toHaveBeenCalledWith(
        "t2",
        expectedName,
      );
      expect(component.editingSettings.activeThemeId).toBe("t1");
      expect(mockThemeService.setActiveTheme).not.toHaveBeenCalledWith(
        "t2_copy",
      );
    }));

    it("should use 'RaceCoordinator AI (Copy)' when duplicating the default theme via the Copy button", fakeAsync(() => {
      const themes: Theme[] = [
        {
          entity_id: "t1",
          is_default: true,
          name: "Default",
          slots: {},
        } as Theme,
      ];
      component.editingState.themes = themes;
      component.refreshDisplayProperties();

      mockThemeService.duplicateTheme.and.returnValue(
        Promise.resolve({ entity_id: "t2", slots: {} } as Theme),
      );

      component.onDuplicateTheme(themes[0]);
      flush();

      expect(mockThemeService.duplicateTheme).toHaveBeenCalledWith(
        "t1",
        "RaceCoordinator AI (Copy)",
      );
    }));

    it("should refresh and trigger change detection after duplication", fakeAsync(() => {
      const themes: Theme[] = [
        {
          entity_id: "t1",
          is_default: true,
          name: "Default",
          slots: {},
        } as Theme,
      ];
      component.editingState.themes = themes;
      component.refreshDisplayProperties();
      const cdr = (component as any).cdr;
      const markForCheckSpy = spyOn(cdr, "markForCheck").and.callThrough();

      mockThemeService.duplicateTheme.and.returnValue(
        Promise.resolve({ entity_id: "t2", slots: {} } as Theme),
      );

      component.onDuplicateTheme(themes[0]);
      flush();

      expect(markForCheckSpy).toHaveBeenCalled();
      expect(component.displayThemes.length).toBe(2);
    }));
    it("should capture state when creating a new theme to support undo", fakeAsync(() => {
      const defaultTheme = {
        entity_id: "t1",
        is_default: true,
        name: "Default",
      } as Theme;
      component.editingState.themes = [defaultTheme];
      component.refreshDisplayProperties();
      component.undoManager.initialize(component.editingState);
      mockThemeService.getThemes.and.returnValue([defaultTheme]);

      const newTheme = {
        entity_id: "t2",
        is_default: false,
        name: "Default (Copy)",
      } as Theme;
      mockThemeService.duplicateTheme.and.returnValue(
        Promise.resolve(newTheme),
      );

      spyOn(component, "captureState").and.callThrough();
      const initialUndoCount = component.undoManager.undoStackCount;

      component.createNewTheme();
      tick(); // resolve duplicateTheme

      expect(component.captureState).toHaveBeenCalled();
      expect(component.undoManager.undoStackCount).toBe(initialUndoCount + 1);
      expect(component.displayThemes.length).toBe(2);

      // Verify undo
      component.undoManager.undo();
      expect(component.editingState.themes.length).toBe(1);
      expect(component.editingState.themes[0].entity_id).toBe("t1");

      // Verify redo
      component.undoManager.redo();
      expect(component.editingState.themes.length).toBe(2);
      expect(
        component.editingState.themes.find((t) => t.entity_id === "t2"),
      ).toBeTruthy();
    }));

    it("should capture state when duplicating a theme", fakeAsync(() => {
      const theme = {
        entity_id: "t1",
        is_default: false,
        name: "Custom",
      } as Theme;
      component.editingState.themes = [theme];
      component.refreshDisplayProperties();
      component.undoManager.initialize(component.editingState);
      mockThemeService.getThemes.and.returnValue([theme]);

      const copy = {
        entity_id: "t2",
        is_default: false,
        name: "Custom (Copy)",
      } as Theme;
      mockThemeService.duplicateTheme.and.returnValue(Promise.resolve(copy));

      spyOn(component, "captureState").and.callThrough();
      const initialUndoCount = component.undoManager.undoStackCount;

      component.onDuplicateTheme(theme);
      tick();

      expect(component.captureState).toHaveBeenCalled();
      expect(component.undoManager.undoStackCount).toBe(initialUndoCount + 1);

      // Verify undo
      component.undoManager.undo();
      expect(component.editingState.themes.length).toBe(1);
      expect(component.editingState.themes[0].entity_id).toBe("t1");

      // Verify redo
      component.undoManager.redo();
      expect(component.editingState.themes.length).toBe(2);
      expect(
        component.editingState.themes.find((t) => t.entity_id === "t2"),
      ).toBeTruthy();
    }));
  });

  describe("toolbox visual states undo/redo", () => {
    it("should preserve toolbox visual states when undoing a change", fakeAsync(() => {
      component.undoManager.initialize(component.editingState);

      // Make a change that will be undoable
      component.editingSettings.sortByStandings =
        !component.editingSettings.sortByStandings;
      component.undoManager.captureState();

      expect(component.undoManager.undoStackCount).toBe(1);

      // Simulate the user dragging or minimizing the toolbox after the change was made
      component.editingSettings.layoutEditorMinimized = true;
      component.editingSettings.layoutEditorPositionX = 123;
      component.editingSettings.layoutEditorPositionY = 456;
      component.editingSettings.columnEditorMinimized = true;
      component.editingSettings.columnEditorPositionX = 321;
      component.editingSettings.columnEditorPositionY = 654;

      // Perform undo, which should rollback `sortByStandings` but NOT touch the editor positions
      component.undoManager.undo();

      expect(component.editingSettings.layoutEditorMinimized).toBeTrue();
      expect(component.editingSettings.layoutEditorPositionX).toBe(123);
      expect(component.editingSettings.layoutEditorPositionY).toBe(456);
      expect(component.editingSettings.columnEditorMinimized).toBeTrue();
      expect(component.editingSettings.columnEditorPositionX).toBe(321);
      expect(component.editingSettings.columnEditorPositionY).toBe(654);
    }));
  });

  describe("theme management undo/redo", () => {
    let themes: Theme[];

    beforeEach(() => {
      themes = [
        {
          entity_id: "t1",
          is_default: true,
          name: "Default",
          slots: {},
        } as Theme,
        {
          entity_id: "t2",
          is_default: false,
          name: "Custom",
          slots: {},
        } as Theme,
      ];
      component.editingState.themes = deepCopy(themes);
      component.refreshDisplayProperties();
      // Use initialize to clear stacks from previous tests
      component.undoManager.initialize(component.editingState);
    });

    it("should undo and redo theme name changes", fakeAsync(() => {
      const customTheme = component.editingState.themes.find(
        (t) => t.entity_id === "t2",
      )!;

      customTheme.name = "New Name";
      component.onThemeNameChanged(customTheme);
      expect(customTheme.name).toBe("New Name");
      expect(component.undoManager.undoStackCount).toBe(1);

      component.undoManager.undo();
      const undoneTheme = component.editingState.themes.find(
        (t) => t.entity_id === "t2",
      )!;
      expect(undoneTheme.name).toBe("Custom");

      component.undoManager.redo();
      const redoneTheme = component.editingState.themes.find(
        (t) => t.entity_id === "t2",
      )!;
      expect(redoneTheme.name).toBe("New Name");
    }));

    it("should undo and redo theme slot changes", fakeAsync(() => {
      const customTheme = component.editingState.themes.find(
        (t) => t.entity_id === "t2",
      )!;

      component.onThemeSlotChanged(customTheme, "flag.racing", {
        entity_id: "asset1",
      });
      expect(customTheme.slots["flag.racing"]).toBe("asset1");
      expect(component.undoManager.undoStackCount).toBe(1);

      component.undoManager.undo();
      const undoneTheme = component.editingState.themes.find(
        (t) => t.entity_id === "t2",
      )!;
      expect(undoneTheme.slots["flag.racing"]).toBeUndefined();

      component.undoManager.redo();
      const redoneTheme = component.editingState.themes.find(
        (t) => t.entity_id === "t2",
      )!;
      expect(redoneTheme.slots["flag.racing"]).toBe("asset1");
    }));

    it("should reset undo stack upon theme deletion", fakeAsync(() => {
      // Create some history
      const customTheme = component.editingState.themes.find(
        (t) => t.entity_id === "t2",
      )!;
      customTheme.name = "Changed";
      component.onThemeNameChanged(customTheme);
      expect(component.undoManager.undoStackCount).toBe(1);

      // Setup deletion
      component.themeToDelete = customTheme;
      mockThemeService.deleteTheme.and.returnValue(Promise.resolve());

      spyOn(component.undoManager, "resetTracking").and.callThrough();

      component.onConfirmDeleteTheme();
      tick();

      expect(component.undoManager.resetTracking).toHaveBeenCalled();
      expect(component.undoManager.undoStackCount).toBe(1); // History preserved but cleaned
      expect(component.undoManager.redoStackCount).toBe(0);
      expect(component.displayThemes.length).toBe(1);
    }));

    it("should purge deleted theme from history during deletion", fakeAsync(() => {
      // 1. Change a setting (captures state)
      component.editingSettings.sortByStandings =
        !component.editingSettings.sortByStandings;
      component.captureState();

      // 2. Setup deletion of Custom theme (t2)
      // Setup deletion of Custom theme (t2)
      const customTheme = component.editingState.themes.find(
        (t) => t.entity_id === "t2",
      )!;
      component.themeToDelete = customTheme;
      mockThemeService.deleteTheme.and.returnValue(Promise.resolve());

      spyOn(component.undoManager, "updateHistory").and.callThrough();

      component.onConfirmDeleteTheme();
      tick();

      // Verify updateHistory was called to clean up the theme
      expect(component.undoManager.updateHistory).toHaveBeenCalled();

      // Verify that even if we could undo (which we can't because stack was reset,
      // but the history itself should be clean if we looked at it),
      // the theme would be gone from the snapshots.
      // We can verify this by checking if any themes in the internal state of undoManager have t2
      // (This is a bit intrusive but validates the logic)
      const stack = component.undoManager.undoStackItems;
      stack.forEach((snapshot: any) => {
        const themeIds = snapshot.themes.map((t: any) => t.entity_id);
        expect(themeIds).not.toContain("t2");
      });
    }));

    it("should not allow undo/redo to resurrect a deleted theme", fakeAsync(() => {
      const customTheme = component.editingState.themes.find(
        (t) => t.entity_id === "t2",
      )!;

      // 1. Rename theme (undoStackCount = 1)
      customTheme.name = "Name 1";
      component.onThemeNameChanged(customTheme);

      // 2. Delete theme (resets stack)
      component.themeToDelete = customTheme;
      mockThemeService.deleteTheme.and.returnValue(Promise.resolve());

      component.onConfirmDeleteTheme();
      tick();

      expect(component.undoManager.undoStackCount).toBe(1); // Still 1 because resetTracking preserves stacks
      expect(component.editingState.themes.length).toBe(1);
      expect(component.editingState.themes[0].entity_id).toBe("t1");

      // 3. Try to undo (should do nothing)
      component.undoManager.undo();
      expect(component.editingState.themes.length).toBe(1);
      expect(component.editingState.themes[0].entity_id).toBe("t1");
    }));
  });

  describe("theme name validation", () => {
    it("should identify duplicate theme names", () => {
      const themes: Theme[] = [
        { entity_id: "t1", name: "Theme A", is_default: false } as Theme,
        { entity_id: "t2", name: "Theme B", is_default: false } as Theme,
        { entity_id: "t3", name: "theme a", is_default: false } as Theme, // Duplicate of t1
      ];
      component.editingState.themes = themes;
      component.refreshDisplayProperties();

      expect(component.isThemeNameDuplicate(themes[0])).toBeTrue(); // t1 has duplicate t3
      expect(component.isThemeNameDuplicate(themes[1])).toBeFalse(); // t2 is unique
      expect(component.isThemeNameDuplicate(themes[2])).toBeTrue(); // t3 has duplicate t1
    });

    it("should identify invalid theme names (empty or duplicate)", () => {
      const themes: Theme[] = [
        { entity_id: "t1", name: "  ", is_default: false } as Theme,
        { entity_id: "t2", name: "Theme B", is_default: false } as Theme,
        { entity_id: "t3", name: "Theme B", is_default: false } as Theme,
      ];
      component.editingState.themes = themes;
      component.refreshDisplayProperties();

      expect(component.isThemeNameInvalid(themes[0])).toBeTrue(); // Empty
      expect(component.isThemeNameInvalid(themes[1])).toBeTrue(); // Duplicate
      expect(component.isThemeNameInvalid(themes[2])).toBeTrue(); // Duplicate
    });

    it("should not auto-save if any theme name is invalid", fakeAsync(() => {
      const themes: Theme[] = [
        { entity_id: "t1", name: "Theme A", is_default: false } as Theme,
        { entity_id: "t2", name: "Theme A", is_default: false } as Theme,
      ];
      component.editingState = {
        settings: new Settings(),
        themes: themes,
      } as any;
      component.refreshDisplayProperties();
      component.undoManager.initialize(component.editingState);

      mockSettingsService.saveSettings.calls.reset();

      // Trigger a change
      component.editingState.settings.highlightRowOnLap =
        !component.editingState.settings.highlightRowOnLap;
      component.captureState();
      tick();

      // autoSaveState should be triggered by stateCommitted$, but should return early because of invalid name
      expect(mockSettingsService.saveSettings).not.toHaveBeenCalled();
    }));

    it("should apply invalid class to theme name input in template", () => {
      const themes: Theme[] = [
        {
          entity_id: "t1",
          name: "Duplicate",
          is_default: false,
          slots: {},
        } as Theme,
        {
          entity_id: "t2",
          name: "Duplicate",
          is_default: false,
          slots: {},
        } as Theme,
      ];
      component.editingState.themes = themes;
      component.refreshDisplayProperties();
      fixture.detectChanges();

      const containers = fixture.debugElement.queryAll(
        By.css(".theme-title-container.invalid"),
      );
      expect(containers.length).toBe(2);
    });
  });

  describe("navigation guard", () => {
    it("should show discard confirmation when dirty", fakeAsync(() => {
      // Ensure fresh state for tracking
      component.undoManager.initialize(component.editingState);

      // Prevent auto-save from resetting the dirty state in this test
      component.isLoading = true;

      // Make it dirty
      component.editingSettings.sortByStandings =
        !component.editingSettings.sortByStandings;
      component.captureState();
      tick();

      expect(component.hasChanges()).toBeTrue();

      let resolveValue: boolean | undefined;
      component.confirmDiscard().then((v) => (resolveValue = v));
      fixture.detectChanges();
      tick(); // Wait for confirmation modal

      expect(component.showDiscardConfirm).toBeTrue();

      // Find the confirmation modal and confirm
      component.onConfirmDiscard();
      tick();

      expect(component.showDiscardConfirm).toBeFalse();
      expect(resolveValue).toBeTrue();
    }));
  });

  describe("bug fixes", () => {
    it("should preserve unsaved duplicate theme names when creating another theme", fakeAsync(() => {
      const themes: Theme[] = [
        {
          entity_id: "t1",
          name: "Original",
          is_default: true,
          slots: {},
        } as Theme,
        {
          entity_id: "t2",
          name: "Custom",
          is_default: false,
          slots: {},
        } as Theme,
      ];
      component.editingState.themes = themes;
      component.refreshDisplayProperties();

      // Change Custom to a duplicate name "Original"
      themes[1].name = "Original";
      expect(component.isThemeNameDuplicate(themes[1])).toBeTrue();

      // Create another theme
      const newTheme = {
        entity_id: "t3",
        name: "New",
        is_default: false,
        slots: {},
      } as Theme;
      mockThemeService.duplicateTheme.and.returnValue(
        Promise.resolve(newTheme),
      );

      component.createNewTheme();
      flush();

      // Verify themes[1] is still named "Original" (not reverted to "Custom")
      const t2 = component.editingState.themes.find(
        (t) => t.entity_id === "t2",
      )!;
      expect(t2.name).toBe("Original");
      expect(component.isThemeNameDuplicate(t2)).toBeTrue();

      // Verify new theme is added
      expect(component.editingState.themes.length).toBe(3);
    }));
  });

  describe("getAssetForSlot fallback logic", () => {
    it("should resolve asset from theme slots if present", () => {
      const theme = {
        entity_id: "t1",
        slots: { "gauge.fuel": "asset-in-theme" },
      } as any;
      const asset = { entity_id: "asset-in-theme", name: "Theme Asset" };
      component.assets = [asset as any];

      const resolved = component.getAssetForSlot("gauge.fuel", theme);
      expect(resolved).toEqual(asset);
    });

    it("should fall back to global settings for gauge.fuel if theme slot is missing", () => {
      const theme = {
        entity_id: "t1",
        slots: {}, // missing gauge.fuel
      } as any;
      component.editingSettings.fuelGaugeImageSet = "global-asset-id";
      const globalAsset = {
        entity_id: "global-asset-id",
        name: "Global Asset",
      };
      component.assets = [globalAsset as any];

      const resolved = component.getAssetForSlot("gauge.fuel", theme);
      expect(resolved).toEqual(globalAsset);
    });

    it("should fall back to ThemeService.resolveAssetId if theme slot is missing and not gauge.fuel", () => {
      const theme = {
        entity_id: "t1",
        slots: {}, // missing flag.racing
      } as any;
      mockThemeService.resolveAssetId.and.returnValue("fallback-asset-id");
      const fallbackAsset = {
        entity_id: "fallback-asset-id",
        name: "Fallback Asset",
      };
      component.assets = [fallbackAsset as any];

      const resolved = component.getAssetForSlot("flag.racing", theme);
      expect(resolved).toEqual(fallbackAsset);
      expect(mockThemeService.resolveAssetId).toHaveBeenCalledWith(
        "flag.racing",
      );
    });

    it("should return undefined if no asset matches the resolved ID", () => {
      const theme = {
        entity_id: "t1",
        slots: { "gauge.fuel": "non-existent-asset" },
      } as any;
      component.assets = [];

      const resolved = component.getAssetForSlot("gauge.fuel", theme);
      expect(resolved).toBeUndefined();
    });
  });

  describe("areSettingsEqual – new fields", () => {
    function makeSettings(overrides: Partial<Settings> = {}): Settings {
      return Object.assign(new Settings(), {
        sortByStandings: true,
        flagRacing: "g",
        flagHeatPaused: "y",
        flagHeatOver: "r",
        flagOneLapToGo: "w",
        flagPenalty: "b",
        flagHeatFinishing: "c",
        activeThemeId: "theme-a",
        lampRedOn: "lamp-red-on",
        lampRedDim: "lamp-red-dim",
        lampGreen: "lamp-green",
        fuelGaugeImageSet: "default_fuel-gauge-builtin",
        columnAnchors: {},
        ...overrides,
      });
    }

    it("should report no changes when activeThemeId is the same", () => {
      const a = makeSettings({ activeThemeId: "t1" });
      const b = makeSettings({ activeThemeId: "t1" });
      expect((component as any).areSettingsEqual(a, b)).toBeTrue();
    });

    it("should ignore layout and column editor visual states when comparing states", () => {
      const a = makeSettings({
        layoutEditorPositionX: 10,
        layoutEditorPositionY: 20,
        layoutEditorMinimized: false,
        columnEditorPositionX: 5,
        columnEditorPositionY: 10,
        columnEditorMinimized: false,
      });
      const b = makeSettings({
        layoutEditorPositionX: 100,
        layoutEditorPositionY: 200,
        layoutEditorMinimized: true,
        columnEditorPositionX: 50,
        columnEditorPositionY: 100,
        columnEditorMinimized: true,
      });
      expect((component as any).areSettingsEqual(a, b)).toBeTrue();
    });

    it("should detect a change in activeThemeId", () => {
      const a = makeSettings({ activeThemeId: "t1" });
      const b = makeSettings({ activeThemeId: "t2" });
      expect((component as any).areSettingsEqual(a, b)).toBeFalse();
    });

    it("should detect a change in lampRedOn", () => {
      const a = makeSettings({ lampRedOn: "asset-a" });
      const b = makeSettings({ lampRedOn: "asset-b" });
      expect((component as any).areSettingsEqual(a, b)).toBeFalse();
    });

    it("should detect a change in lampRedDim", () => {
      const a = makeSettings({ lampRedDim: "asset-a" });
      const b = makeSettings({ lampRedDim: "asset-b" });
      expect((component as any).areSettingsEqual(a, b)).toBeFalse();
    });

    it("should detect a change in lampGreen", () => {
      const a = makeSettings({ lampGreen: "asset-a" });
      const b = makeSettings({ lampGreen: "asset-b" });
      expect((component as any).areSettingsEqual(a, b)).toBeFalse();
    });

    it("should detect a change in fuelGaugeImageSet", () => {
      const a = makeSettings({
        fuelGaugeImageSet: "default_fuel-gauge-builtin",
      });
      const b = makeSettings({ fuelGaugeImageSet: "custom-gauge-set" });
      expect((component as any).areSettingsEqual(a, b)).toBeFalse();
    });

    it("should detect a change in columnAnchors", () => {
      const a = makeSettings({ columnAnchors: {} });
      const b = makeSettings({
        columnAnchors: { lapCount: AnchorPoint.CenterCenter },
      });
      expect((component as any).areSettingsEqual(a, b)).toBeFalse();
    });

    it("should report equal when columnAnchors has the same keys and values", () => {
      const a = makeSettings({
        columnAnchors: { lapCount: AnchorPoint.CenterCenter },
      });
      const b = makeSettings({
        columnAnchors: { lapCount: AnchorPoint.CenterCenter },
      });
      expect((component as any).areSettingsEqual(a, b)).toBeTrue();
    });
  });

  describe("autoSaveState – Promise-based API", () => {
    beforeEach(() => {
      mockSettingsService.saveSettings.calls.reset();
    });

    it("should resolve immediately if isLoading is true", async () => {
      component.isLoading = true;
      await expectAsync((component as any).autoSaveState()).toBeResolved();
      expect(mockSettingsService.saveSettings).not.toHaveBeenCalled();
    });

    it("should resolve immediately if there are no changes", async () => {
      component.isLoading = false;
      (component as any).isSaving = false;
      // No changes by default (undo manager is at initial state)
      await expectAsync((component as any).autoSaveState()).toBeResolved();
      expect(mockSettingsService.saveSettings).not.toHaveBeenCalled();
    });

    it("should save and resolve when there are unsaved changes", fakeAsync(async () => {
      component.isLoading = false;
      (component as any).isSaving = false;

      // Force hasChanges() to be true by manipulating the undo manager baseline
      component.undoManager.initialize(component.editingState);
      component.editingSettings.sortByStandings =
        !component.editingSettings.sortByStandings;
      component.captureState();
      tick();

      mockDataService.updateTheme.and.returnValue(of({}));

      const promise = (component as any).autoSaveState();
      tick(600);
      await promise;

      expect(mockSettingsService.saveSettings).toHaveBeenCalled();
    }));

    it("should only call updateTheme for themes that have changed", fakeAsync(async () => {
      component.isLoading = false;
      (component as any).isSaving = false;

      const themeUnchanged = {
        entity_id: "t1",
        is_default: false,
        name: "Unchanged",
        slots: {},
      } as Theme;
      const themeChanged = {
        entity_id: "t2",
        is_default: false,
        name: "Changed",
        slots: {},
      } as Theme;

      component.editingState.themes = [themeUnchanged, themeChanged];
      component.refreshDisplayProperties();
      component.undoManager.initialize(component.editingState);

      // Modify themeChanged
      component.editingState.themes[1] = {
        ...themeChanged,
        name: "Changed New",
      };
      component.refreshDisplayProperties();

      // Force hasChanges() to be true by also changing a setting
      component.editingSettings.sortByStandings =
        !component.editingSettings.sortByStandings;
      component.captureState();
      tick();

      mockDataService.updateTheme.and.returnValue(of({}));

      const promise = (component as any).autoSaveState();
      tick(600);
      await promise;

      // Ensure updateTheme was only called for t2, not t1
      expect(mockDataService.updateTheme).toHaveBeenCalledTimes(1);
      expect(mockDataService.updateTheme).toHaveBeenCalledWith(
        "t2",
        jasmine.any(Object),
      );
    }));

    it("should reject and log an error if updateTheme fails", async () => {
      const logger = TestBed.inject(LoggerService);
      component.isLoading = false;
      (component as any).isSaving = false;

      // Add a non-default theme so updateTheme is called
      const customTheme = {
        entity_id: "t2",
        is_default: false,
        name: "Custom",
        slots: {},
      } as Theme;
      component.editingState.themes = [customTheme];
      component.refreshDisplayProperties();

      // Force hasChanges() to return true without relying on debounce timing
      spyOn(component, "hasChanges").and.returnValue(true);

      const error = { status: 500 };
      mockDataService.updateTheme.and.returnValue(throwError(() => error));

      let rejected = false;
      try {
        await (component as any).autoSaveState();
      } catch (e) {
        rejected = true;
      }

      expect(rejected).toBeTrue();
      expect(logger.error).toHaveBeenCalledWith("Auto-save failed", error);
    });
  });

  describe("confirmDiscard – auto-save before navigation", () => {
    it("should return true without modal if there are no changes", async () => {
      // Undo manager at initial state → no changes
      const result = await component.confirmDiscard();
      expect(result).toBeTrue();
      expect(component.showDiscardConfirm).toBeFalse();
    });

    it("should auto-save and return true without modal when changes are saveable", fakeAsync(async () => {
      component.isLoading = false;
      (component as any).isSaving = false;

      // Dirty the state
      component.undoManager.initialize(component.editingState);
      component.editingSettings.sortByStandings =
        !component.editingSettings.sortByStandings;
      component.captureState();
      tick();

      mockDataService.updateTheme.and.returnValue(of({}));

      const promise = component.confirmDiscard();
      tick(600);
      const result = await promise;

      expect(result).toBeTrue();
      expect(component.showDiscardConfirm).toBeFalse();
      expect(mockSettingsService.saveSettings).toHaveBeenCalled();
    }));

    it("should show modal if auto-save fails", async () => {
      const logger = TestBed.inject(LoggerService);
      component.isLoading = false;
      (component as any).isSaving = false;

      // Add non-default theme so updateTheme is called
      const customTheme = {
        entity_id: "t2",
        is_default: false,
        name: "Custom",
        slots: {},
      } as Theme;
      component.editingState.themes = [customTheme];
      component.refreshDisplayProperties();

      // Force hasChanges() to return true without relying on debounce timing
      spyOn(component, "hasChanges").and.returnValue(true);

      const error = { status: 500 };
      mockDataService.updateTheme.and.returnValue(throwError(() => error));

      const promise = component.confirmDiscard();
      // Wait for the auto-save promise chain to settle
      await Promise.resolve();

      expect(component.showDiscardConfirm).toBeTrue();
      expect(logger.error).toHaveBeenCalledWith(
        "Final auto-save failed before navigation",
        error,
      );

      // Resolve by confirming the discard modal
      component.onConfirmDiscard();
      const result = await promise;
      expect(result).toBeTrue();
    });
  });

  describe("success modal functionality", () => {
    it("should show success modal after duplicating a theme", fakeAsync(() => {
      const originalTheme = {
        entity_id: "t1",
        is_default: false,
        name: "Original Theme",
        slots: {},
      } as Theme;
      const duplicatedTheme = {
        entity_id: "t2",
        is_default: false,
        name: "Original Theme (Copy)",
        slots: {},
      } as Theme;
      component.editingState.themes = [originalTheme];
      component.refreshDisplayProperties();
      component.editingSettings.activeThemeId = "t1";

      mockThemeService.duplicateTheme.and.returnValue(
        Promise.resolve(duplicatedTheme),
      );

      component.onDuplicateTheme(originalTheme);
      flush();

      expect(component.showSuccessModal).toBeTrue();
      expect(component.successModalTitle).toBe("GEN_SUCCESS");
      expect(component.successModalMessage).toBe("UE_SUCCESS_DUPLICATE");
      expect(component.successModalParams).toEqual({
        name: "Original Theme (Copy)",
      });
    }));

    it("should show success modal after creating a new theme", fakeAsync(() => {
      const defaultTheme = {
        entity_id: "t1",
        is_default: true,
        name: "Default",
        slots: {},
      } as Theme;
      const newTheme = {
        entity_id: "t2",
        is_default: false,
        name: "RaceCoordinator AI (Copy)",
        slots: {},
      } as Theme;
      component.editingState.themes = [defaultTheme];
      component.refreshDisplayProperties();
      component.editingSettings.activeThemeId = "t1";

      mockThemeService.duplicateTheme.and.returnValue(
        Promise.resolve(newTheme),
      );

      component.createNewTheme();
      flush();

      expect(component.showSuccessModal).toBeTrue();
      expect(component.successModalTitle).toBe("GEN_SUCCESS");
      expect(component.successModalMessage).toBe("UE_SUCCESS_CREATE");
      expect(component.successModalParams).toEqual({
        name: "RaceCoordinator AI (Copy)",
      });
    }));

    it("should collapse all themes after acknowledging success modal", fakeAsync(() => {
      const originalTheme = {
        entity_id: "t1",
        is_default: false,
        name: "Original Theme",
        slots: {},
      } as Theme;
      const duplicatedTheme = {
        entity_id: "t2",
        is_default: false,
        name: "Original Theme (Copy)",
        slots: {},
      } as Theme;
      component.editingState.themes = [originalTheme];
      component.refreshDisplayProperties();
      component.editingSettings.activeThemeId = "t1";
      component.sectionsExpanded["theme_t1"] = true;

      mockThemeService.duplicateTheme.and.returnValue(
        Promise.resolve(duplicatedTheme),
      );

      component.onDuplicateTheme(originalTheme);
      flush();

      // Before acknowledgment, original theme should still be expanded
      expect(component.sectionsExpanded["theme_t1"]).toBeTrue();
      expect((component as any).themeToCollapseAfterSuccess).toBe("t1");

      // Acknowledge the success modal
      component.onSuccessModalAcknowledge();

      // After acknowledgment, all themes should be collapsed
      expect(component.sectionsExpanded["theme_t1"]).toBeFalse();
      expect(component.sectionsExpanded["theme_t2"]).toBeFalse();
      expect((component as any).themeToCollapseAfterSuccess).toBeNull();
      expect(component.showSuccessModal).toBeFalse();
    }));

    it("should preserve active theme during duplication", fakeAsync(() => {
      const activeTheme = {
        entity_id: "t1",
        is_default: false,
        name: "Active Theme",
        slots: {},
      } as Theme;
      const duplicatedTheme = {
        entity_id: "t2",
        is_default: false,
        name: "Active Theme (Copy)",
        slots: {},
      } as Theme;
      component.editingState.themes = [activeTheme];
      component.refreshDisplayProperties();
      component.editingSettings.activeThemeId = "t1";

      mockThemeService.duplicateTheme.and.returnValue(
        Promise.resolve(duplicatedTheme),
      );

      component.onDuplicateTheme(activeTheme);
      flush();

      // Active theme should remain the same
      expect(component.editingSettings.activeThemeId).toBe("t1");
      expect(mockThemeService.setActiveTheme).not.toHaveBeenCalledWith("t2");
    }));

    it("should hide success modal on acknowledge", () => {
      component.showSuccessModal = true;
      component.successModalTitle = "GEN_SUCCESS";
      component.successModalMessage = "UE_SUCCESS_DUPLICATE";
      component.successModalParams = { name: "Test Theme" };

      component.onSuccessModalAcknowledge();

      expect(component.showSuccessModal).toBeFalse();
      expect(component.successModalTitle).toBe("");
      expect(component.successModalMessage).toBe("");
      expect(component.successModalParams).toEqual({});
    });

    it("should render acknowledgement modal component when success modal is shown", fakeAsync(() => {
      const theme = {
        entity_id: "t1",
        is_default: false,
        name: "Test Theme",
        slots: {},
      } as Theme;
      const duplicatedTheme = {
        entity_id: "t2",
        is_default: false,
        name: "Test Theme (Copy)",
        slots: {},
      } as Theme;
      component.editingState.themes = [theme];
      component.refreshDisplayProperties();

      mockThemeService.duplicateTheme.and.returnValue(
        Promise.resolve(duplicatedTheme),
      );

      component.onDuplicateTheme(theme);
      flush();
      fixture.detectChanges();

      const modal = fixture.debugElement.query(
        By.css("app-acknowledgement-modal"),
      );
      expect(modal).toBeTruthy();

      // Verify component properties are set correctly
      expect(component.showSuccessModal).toBeTrue();
      expect(component.successModalTitle).toBe("GEN_SUCCESS");
      expect(component.successModalMessage).toBe("UE_SUCCESS_DUPLICATE");
      expect(component.successModalParams).toEqual({
        name: "Test Theme (Copy)",
      });
    }));
  });

  describe("Raceday Layout", () => {
    it("should handle raceday layout change", () => {
      spyOn(component.undoManager, "captureState");
      const newLayout = {
        widgets: [
          {
            id: "test",
            widgetType: "timer",
            x: 10,
            y: 20,
            width: 100,
            height: 100,
            zIndex: 1,
          },
        ],
      };

      component.onRacedayLayoutChanged(newLayout as any);

      expect(component.editingSettings.racedayLayout).toEqual(newLayout as any);
      expect(component.undoManager.captureState).toHaveBeenCalled();
    });

    it("should reset raceday layout", () => {
      spyOn(component.undoManager, "captureState");
      spyOn(component, "refreshDisplayProperties");

      component.resetRacedayLayout();

      const expectedLayout = (component as any).getScaledDefaultLayout(false);

      expect(component.editingSettings.racedayLayout).toEqual(expectedLayout);
      expect(component.editingState.settings.racedayLayout).toEqual(
        expectedLayout,
      );
      expect(component.undoManager.captureState).toHaveBeenCalled();
      expect(component.refreshDisplayProperties).toHaveBeenCalled();
    });

    it("should reset practice raceday layout", () => {
      spyOn(component.undoManager, "captureState");
      spyOn(component, "refreshDisplayProperties");

      component.editingSettings.practiceRacedayLayout = { widgets: [] };
      component.editingSettings.practiceRacedayColumns = ["test"];
      component.editingSettings.practiceColumnLayouts = { test: {} };
      component.editingSettings.practiceColumnVisibility = {};

      component.resetPracticeRacedayLayout();

      const expectedPracticeLayout = (component as any).getScaledDefaultLayout(
        true,
      );

      expect(component.selectedWidgetId).toBe("widget-lane-view");
      expect(component.editingSettings.practiceRacedayLayout).toEqual(
        expectedPracticeLayout,
      );
      expect(component.editingSettings.practiceRacedayColumns).toEqual(
        Settings.DEFAULT_PRACTICE_COLUMNS,
      );
      expect(component.editingSettings.practiceColumnLayouts).toEqual(
        new Settings().practiceColumnLayouts,
      );
      expect(component.editingSettings.practiceColumnVisibility).toEqual(
        new Settings().practiceColumnVisibility,
      );
      expect(component.undoManager.captureState).toHaveBeenCalled();
      expect(component.refreshDisplayProperties).toHaveBeenCalled();
    });

    describe("Layout Import/Export", () => {
      it("should export raceday layout", () => {
        spyOn(component as any, "downloadJson");
        component.exportRacedayLayout();
        expect((component as any).downloadJson).toHaveBeenCalledWith(
          jasmine.objectContaining({
            layout: component.editingSettings.racedayLayout,
            columns: component.editingSettings.racedayColumns,
          }),
          "raceday-layout.json",
        );
      });

      it("should export practice raceday layout", () => {
        spyOn(component as any, "downloadJson");
        component.exportPracticeRacedayLayout();
        expect((component as any).downloadJson).toHaveBeenCalledWith(
          jasmine.objectContaining({
            layout: component.editingSettings.practiceRacedayLayout,
            columns: component.editingSettings.practiceRacedayColumns,
          }),
          "practice-raceday-layout.json",
        );
      });

      it("should import raceday layout", () => {
        spyOn(component.undoManager, "captureState");
        spyOn(component, "refreshDisplayProperties");

        const mockLayout = { layout: { widgets: [] }, columns: ["col1"] };
        const file = new File([JSON.stringify(mockLayout)], "test.json", {
          type: "application/json",
        });
        const event = { target: { files: [file], value: "test" } } as any;

        const dummyFileReader = {
          readAsText: jasmine.createSpy("readAsText").and.callFake(function (
            this: any,
          ) {
            this.onload({ target: { result: JSON.stringify(mockLayout) } });
          }),
        };
        spyOn(window as any, "FileReader").and.returnValue(
          dummyFileReader as any,
        );

        component.onImportRacedayLayout(event);

        expect(component.editingSettings.racedayLayout).toEqual(
          mockLayout.layout as any,
        );
        expect(component.editingSettings.racedayColumns).toEqual(
          mockLayout.columns,
        );
        expect(component.undoManager.captureState).toHaveBeenCalled();
        expect(component.refreshDisplayProperties).toHaveBeenCalled();
        expect(event.target.value).toBe("");
      });

      it("should import practice raceday layout", () => {
        spyOn(component.undoManager, "captureState");
        spyOn(component, "refreshDisplayProperties");

        const mockLayout = { layout: { widgets: [] }, columns: ["col2"] };
        const file = new File([JSON.stringify(mockLayout)], "test.json", {
          type: "application/json",
        });
        const event = { target: { files: [file], value: "test" } } as any;

        const dummyFileReader = {
          readAsText: jasmine.createSpy("readAsText").and.callFake(function (
            this: any,
          ) {
            this.onload({ target: { result: JSON.stringify(mockLayout) } });
          }),
        };
        spyOn(window as any, "FileReader").and.returnValue(
          dummyFileReader as any,
        );

        component.onImportPracticeRacedayLayout(event);

        expect(component.editingSettings.practiceRacedayLayout).toEqual(
          mockLayout.layout as any,
        );
        expect(component.editingSettings.practiceRacedayColumns).toEqual(
          mockLayout.columns,
        );
        expect(component.undoManager.captureState).toHaveBeenCalled();
        expect(component.refreshDisplayProperties).toHaveBeenCalled();
        expect(event.target.value).toBe("");
      });
    });

    it("should select a widget and fallback to layout widget on deselect attempt", () => {
      (component.selectedWidgetId as any) = null;

      component.editingSettings.racedayLayout = {
        widgets: [
          {
            id: "widget-test-timer",
            widgetType: "timer",
            x: 10,
            y: 20,
            width: 100,
            height: 100,
            zIndex: 1,
          },
        ],
      };

      component.onWidgetSelected("widget-test-timer");
      expect(component.selectedWidgetId).toBe("widget-test-timer");
      expect(component.selectedWidget).toBeTruthy();
      expect(component.selectedWidget.widgetType).toBe("timer");

      // Attempting to deselect retains widget selection
      component.onWidgetSelected(null);
      expect(component.selectedWidgetId).toBe("widget-test-timer");
      expect(component.selectedWidget).toBeTruthy();

      // If layout has no widgets, selection is cleared
      component.editingSettings.racedayLayout = { widgets: [] };
      component.onWidgetSelected(null);
      expect(component.selectedWidgetId).toBeNull();
      expect(component.selectedWidget).toBeNull();
    });

    it("should mutate properties on the selected widget", () => {
      component.editingSettings.racedayLayout = {
        widgets: [
          {
            id: "widget-test-timer",
            widgetType: "timer",
            x: 10,
            y: 20,
            width: 100,
            height: 100,
            zIndex: 1,
          },
        ],
      };

      component.onWidgetSelected("widget-test-timer");
      expect(component.selectedWidget.fontFamily).toBe("");
      expect(component.selectedWidget.scaleMode).toBe("auto");
      expect(component.selectedWidget.fontSize).toBe(24);

      component.selectedWidget.fontFamily = "Orbitron";
      component.selectedWidget.scaleMode = "auto";
      component.selectedWidget.textScaleFactor = 1.15;

      const widget = component.selectedWidget;
      expect(widget.fontFamily).toBe("Orbitron");
      expect(widget.scaleMode).toBe("auto");
      expect(widget.textScaleFactor).toBe(1.15);
    });
  });

  describe("getAudioConfigForSlot", () => {
    it("should return existing audio_slots config if present with type", () => {
      const theme: any = {
        audio_slots: {
          "audio.countdown": { type: "audio_set", url: "my_set" },
        },
      };
      const config = component.getAudioConfigForSlot("audio.countdown", theme);
      expect(config).toEqual({ type: "audio_set", url: "my_set" });
    });

    it("should fall back to type audio_set for audio.countdown and audio.seconds_left", () => {
      const theme: any = {
        slots: {
          "audio.countdown": "legacy_countdown",
        },
        audio_slots: {},
      };
      const config = component.getAudioConfigForSlot("audio.countdown", theme);
      expect(config).toEqual({ type: "audio_set", url: "legacy_countdown" });
    });

    it("should default missing audio.countdown to default_countdown audio_set", () => {
      const theme: any = { audio_slots: {}, slots: {} };
      const config = component.getAudioConfigForSlot("audio.countdown", theme);
      expect(config).toEqual({ type: "audio_set", url: "default_countdown" });
    });
  });

  describe("getHelpSteps", () => {
    it("should execute all onEnter hooks in help steps and expand sections", () => {
      component.editingSettings.activeThemeId = "1";
      const defaultUi: CustomUI = {
        entity_id: "default_ui_layout_rc_ai",
        name: "Default UI",
        is_default: true,
      };
      component.displayCustomUIs = [defaultUi];
      component.activeCustomUiId = "default_ui_layout_rc_ai";

      const steps = component.getHelpSteps();
      expect(steps.length).toBeGreaterThan(0);

      for (const step of steps) {
        if (step.onEnter) {
          step.onEnter();
        }
      }

      expect(component.sectionsExpanded["customUIs"]).toBeTrue();
      expect(
        component.sectionsExpanded[`ui_${defaultUi.entity_id}`],
      ).toBeTrue();
      expect(component.sectionsExpanded["themes"]).toBeTrue();
      expect(component.sectionsExpanded["theme_1"]).toBeTrue();
      expect(component.sectionsExpanded["flags"]).toBeTrue();
      expect(component.sectionsExpanded["countdown"]).toBeTrue();
      expect(component.sectionsExpanded["fuelGauge"]).toBeTrue();
      expect(component.sectionsExpanded["audio"]).toBeTrue();
      expect(component.sectionsExpanded["config"]).toBeTrue();
    });

    it("should include all new custom UI and theme steps with valid selectors", () => {
      const steps = component.getHelpSteps();
      const selectors = steps.map((s) => s.selector).filter(Boolean);

      expect(selectors).toContain("#help-custom-uis");
      expect(selectors).toContain("#help-custom-uis-add");
      expect(selectors).toContain("#help-default-ui");
      expect(selectors).toContain("#help-raceday-sort");
      expect(selectors).toContain("#help-raceday-highlight");
      expect(selectors).toContain("#help-raceday-reset");
      expect(selectors).toContain("#help-raceday-import-export");
      expect(selectors).toContain("#help-raceday-canvas");
      expect(selectors).toContain("#help-widget-inspector");
      expect(selectors).toContain("#help-themes");
      expect(selectors).toContain("#help-themes-add");
      expect(selectors).toContain("#help-default-theme");
      expect(selectors).toContain("#help-theme-ui-selector");
      expect(selectors).toContain("#help-theme-flags");
      expect(selectors).toContain("#help-theme-countdown");
      expect(selectors).toContain("#help-theme-fuel");
      expect(selectors).toContain("#help-theme-audio");
      expect(selectors).toContain("#help-custom-ui");
      expect(selectors).toContain("#help-custom-ui-dir");
      expect(selectors).toContain("#help-export-template");
      expect(selectors).toContain("#help-page-transition");

      // Verify no obsolete badge or button selectors remain
      expect(selectors).not.toContain("#help-default-badge");
      expect(selectors).not.toContain("#help-readonly-badge");
      expect(selectors).not.toContain("#help-active-badge");
      expect(selectors).not.toContain("#activate-item-btn");
      expect(selectors).not.toContain("#copy-item-btn");
      expect(selectors).not.toContain("#add-item-btn");
    });

    it("should select lane-view widget when onEnter is called on widget inspector step", () => {
      const customUi: CustomUI = {
        entity_id: "custom_ui_1",
        name: "Custom UI 1",
        is_default: false,
        layoutJson: JSON.stringify({
          widgets: [{ id: "w-lane-view", widgetType: "lane-view" }],
        }),
      };
      component.displayCustomUIs = [customUi];
      component.activeCustomUiId = "custom_ui_1";

      const steps = component.getHelpSteps();
      const inspectorStep = steps.find(
        (s) => s.selector === "#help-widget-inspector",
      );
      expect(inspectorStep).toBeDefined();

      inspectorStep?.onEnter?.();
      expect(component.selectedWidgetId).toBe("w-lane-view");
    });
  });

  describe("Widget Selection and Practice Layout", () => {
    it("should initialize default widget properties on selection", () => {
      const widget = {
        id: "w1",
        widgetType: "flag",
        fontSize: 24,
        textScaleFactor: 1.0,
      };
      component.editingSettings.racedayLayout = {
        widgets: [widget as any],
      } as any;
      component.activeCustomUiId = "default_ui_layout_rc_ai";

      component.onWidgetSelected("w1");
      expect(component.selectedWidget).toEqual(
        jasmine.objectContaining({ id: "w1" }),
      );
      expect((widget as any).scaleMode).toBe("auto");
      expect((widget as any).fontFamily).toBe("");
      expect((widget as any).textColor).toBe("");
      expect((widget as any).backgroundColor).toBe("");
      expect((widget as any).fontSize).toBe(24);
      expect((widget as any).textScaleFactor).toBe(1.0);

      // Deselect falls back to default widget when layout has widgets
      component.onWidgetSelected(null);
      expect(component.selectedWidget).toEqual(
        jasmine.objectContaining({ id: "w1" }),
      );

      // Custom UI widget selection
      const practiceWidget = { id: "pw1", widgetType: "branding" };
      component.editingSettings.practiceRacedayLayout = {
        widgets: [practiceWidget as any],
      } as any;
      component.activeCustomUiId = "practice_ui_layout_rc_ai";

      component.onWidgetSelected("pw1");
      expect(component.selectedWidget).toEqual(
        jasmine.objectContaining({ id: "pw1" }),
      );
      expect((practiceWidget as any).scaleMode).toBe("auto");
    });
  });

  describe("ChildWindowManagerService integration", () => {
    let childWindowManager: ChildWindowManagerService;

    beforeEach(() => {
      childWindowManager = TestBed.inject(ChildWindowManagerService);
      spyOn(childWindowManager, "closeAllWindows");
    });

    it("should close all windows on onPageHide", () => {
      component.onPageHide({});
      expect(childWindowManager.closeAllWindows).toHaveBeenCalled();
    });

    it("should close all windows on ngOnDestroy when navigating to non-race-preserving route", () => {
      (component as any).pendingNavigationUrl = "/raceday-setup";
      component.ngOnDestroy();
      expect(childWindowManager.closeAllWindows).toHaveBeenCalled();
    });

    it("should not close windows on ngOnDestroy when navigating back to /raceday", () => {
      (component as any).pendingNavigationUrl = "/raceday";
      component.ngOnDestroy();
      expect(childWindowManager.closeAllWindows).not.toHaveBeenCalled();
    });

    it("should not close windows on ngOnDestroy when navigating back to /default-raceday", () => {
      (component as any).pendingNavigationUrl = "/default-raceday";
      component.ngOnDestroy();
      expect(childWindowManager.closeAllWindows).not.toHaveBeenCalled();
    });
  });

  describe("Custom UI layout switching and localization", () => {
    it("should correctly identify practice mode", () => {
      component.activeCustomUiId = "default_ui_layout_rc_ai";
      expect(component.isCurrentLayoutPractice).toBeFalse();
      expect(component.activeLayoutTitleKey).toBe("UE_LABEL_RACEDAY_LAYOUT");

      component.activeCustomUiId = "practice_ui_layout_rc_ai";
      expect(component.isCurrentLayoutPractice).toBeTrue();
      expect(component.activeLayoutTitleKey).toBe(
        "UE_LABEL_RACEDAY_LAYOUT_PRACTICE",
      );
    });

    it("should resolve currentSelectedWidget based on active custom UI", () => {
      const standardWidget = { id: "sw1", widgetType: "branding" };
      const practiceWidget = { id: "pw1", widgetType: "lane-view" };
      component.editingSettings.racedayLayout = {
        widgets: [standardWidget as any],
      };
      component.editingSettings.practiceRacedayLayout = {
        widgets: [practiceWidget as any],
      };

      component.selectedWidgetId = "sw1";
      component.activeCustomUiId = "default_ui_layout_rc_ai";
      expect(component.currentSelectedWidget).toEqual(
        jasmine.objectContaining({ id: "sw1" }),
      );

      component.selectedWidgetId = "pw1";
      component.activeCustomUiId = "practice_ui_layout_rc_ai";
      expect(component.currentSelectedWidget).toEqual(
        jasmine.objectContaining({ id: "pw1" }),
      );
    });

    it("should get correct display name keys for default and custom UIs", () => {
      const defaultUi: any = {
        entity_id: "default_ui_layout_rc_ai",
        is_default: true,
        name: "Default UI Layout",
      };
      const practiceUi: any = {
        entity_id: "practice_ui_layout_rc_ai",
        is_default: true,
        name: "Practice UI Layout",
      };
      const fuelUi: any = {
        entity_id: "default_fuel_ui_layout_rc_ai",
        is_default: true,
        name: "Default Fuel UI Layout",
      };
      const customUi: any = {
        entity_id: "custom_1",
        is_default: false,
        name: "My Custom Layout",
      };

      expect(component.getCustomUiDisplayNameKey(defaultUi)).toBe(
        "UE_LABEL_DEFAULT_RACEDAY_UI",
      );
      expect(component.getCustomUiDisplayNameKey(practiceUi)).toBe(
        "UE_LABEL_DEFAULT_PRACTICE_UI",
      );
      expect(component.getCustomUiDisplayNameKey(fuelUi)).toBe(
        "UE_LABEL_DEFAULT_FUEL_UI",
      );
      expect(component.getCustomUiDisplayNameKey(customUi)).toBe(
        "My Custom Layout",
      );

      expect(component.isCustomUiDefault(defaultUi)).toBeTrue();
      expect(component.isCustomUiDefault(practiceUi)).toBeTrue();
      expect(component.isCustomUiDefault(fuelUi)).toBeTrue();
      expect(component.isCustomUiDefault(customUi)).toBeFalse();

      const defaultTheme: any = {
        entity_id: "default_classic_rc_ai",
        is_default: true,
        name: "RaceCoordinator AI",
      };
      const practiceTheme: any = {
        entity_id: "practice_theme_rc_ai",
        is_default: true,
        name: "Practice Theme",
      };
      const fuelTheme: any = {
        entity_id: "default_fuel_theme_rc_ai",
        is_default: true,
        name: "Fuel Theme",
      };
      const customTheme: any = {
        entity_id: "custom_theme_1",
        is_default: false,
        name: "My Custom Theme",
      };

      expect(component.getThemeDisplayNameKey(defaultTheme)).toBe(
        "UE_LABEL_DEFAULT_THEME",
      );
      expect(component.getThemeDisplayNameKey(practiceTheme)).toBe(
        "UE_LABEL_PRACTICE_THEME",
      );
      expect(component.getThemeDisplayNameKey(fuelTheme)).toBe(
        "UE_LABEL_FUEL_THEME",
      );
      expect(component.getThemeDisplayNameKey(customTheme)).toBe(
        "My Custom Theme",
      );

      expect(component.isThemeDefault(defaultTheme)).toBeTrue();
      expect(component.isThemeDefault(practiceTheme)).toBeTrue();
      expect(component.isThemeDefault(fuelTheme)).toBeTrue();
      expect(component.isThemeDefault(customTheme)).toBeFalse();
    });

    it("should handle onCustomUiSelected and only select default widget when no valid widget is selected", () => {
      spyOn(component, "refreshDisplayProperties");
      (component.selectedWidgetId as any) = null;

      const practiceLayout = {
        baseWidth: 1920,
        baseHeight: 1080,
        widgets: [
          { id: "pw_timer", widgetType: "timer" },
          { id: "pw_lane", widgetType: "lane-view" },
        ],
      };
      component.editingSettings.practiceRacedayLayout = practiceLayout as any;

      // No widget selected initially -> selects lane-view by default
      component.onCustomUiSelected("practice_ui_layout_rc_ai");
      expect(component.activeCustomUiId).toBe("practice_ui_layout_rc_ai");
      expect(component.selectedWidgetId).toBe("pw_lane");

      // When another widget (pw_timer) is already selected -> preserves pw_timer selection
      component.selectedWidgetId = "pw_timer";
      component.onCustomUiSelected("practice_ui_layout_rc_ai");
      expect(component.selectedWidgetId).toBe("pw_timer");

      expect(component.refreshDisplayProperties).toHaveBeenCalled();
    });

    it("should delegate onLayoutChanged and resetCurrentLayout based on active layout mode", () => {
      spyOn(component, "resetRacedayLayout");
      spyOn(component, "resetPracticeRacedayLayout");
      spyOn(component.undoManager, "captureState");

      const newLayout = { baseWidth: 1920, baseHeight: 1080, widgets: [] };

      // Standard mode
      component.activeCustomUiId = "default_ui_layout_rc_ai";
      component.onLayoutChanged(newLayout);
      expect(component.editingSettings.racedayLayout).toEqual(newLayout);
      expect(component.undoManager.captureState).toHaveBeenCalled();

      component.resetCurrentLayout();
      expect(component.resetRacedayLayout).toHaveBeenCalled();

      // Practice mode
      component.activeCustomUiId = "practice_ui_layout_rc_ai";
      const newPracticeLayout = {
        baseWidth: 1280,
        baseHeight: 720,
        widgets: [],
      };
      component.onLayoutChanged(newPracticeLayout);
      expect(component.editingSettings.practiceRacedayLayout).toEqual(
        newPracticeLayout,
      );

      component.resetCurrentLayout();
      expect(component.resetPracticeRacedayLayout).toHaveBeenCalled();
    });

    it("should delegate import and export based on active layout mode", () => {
      spyOn(component, "exportRacedayLayout");
      spyOn(component, "exportPracticeRacedayLayout");
      spyOn(component, "onImportRacedayLayout");
      spyOn(component, "onImportPracticeRacedayLayout");

      const fakeEvent = {} as Event;

      component.activeCustomUiId = "default_ui_layout_rc_ai";
      component.exportCurrentLayout();
      expect(component.exportRacedayLayout).toHaveBeenCalled();
      component.onImportCurrentLayout(fakeEvent);
      expect(component.onImportRacedayLayout).toHaveBeenCalledWith(fakeEvent);

      component.activeCustomUiId = "practice_ui_layout_rc_ai";
      component.exportCurrentLayout();
      expect(component.exportPracticeRacedayLayout).toHaveBeenCalled();
      component.onImportCurrentLayout(fakeEvent);
      expect(component.onImportPracticeRacedayLayout).toHaveBeenCalledWith(
        fakeEvent,
      );
    });
  });

  describe("UI Layouts and Custom UI Management", () => {
    let dataService: any;
    let customUiService: any;

    beforeEach(() => {
      dataService = TestBed.inject(DataService);
      customUiService = TestBed.inject(CustomUiService);
    });

    it("should create a new custom UI by duplicating default UI layout", async () => {
      const createdUi: CustomUI = {
        entity_id: "custom_ui_new",
        name: "Default UI Layout (Copy)",
        is_default: false,
        layoutJson: JSON.stringify({
          baseWidth: 1920,
          baseHeight: 1080,
          widgets: [],
        }),
      };
      dataService.duplicateCustomUI.and.returnValue(of(createdUi));
      spyOn(component.undoManager, "captureState");

      await component.createNewCustomUi();

      expect(dataService.duplicateCustomUI).toHaveBeenCalledWith(
        "default_ui_layout_rc_ai",
        jasmine.any(String),
      );
      expect(
        component.displayCustomUIs.some((u) => u.entity_id === "custom_ui_new"),
      ).toBeTrue();
      expect(component.sectionsExpanded["ui_custom_ui_new"]).toBeTrue();
      expect(component.activeCustomUiId).toBe("custom_ui_new");
      expect(component.undoManager.captureState).toHaveBeenCalled();
    });

    it("should duplicate an existing custom UI", async () => {
      const sourceUi: CustomUI = {
        entity_id: "custom_1",
        name: "My Custom UI",
        is_default: false,
        layoutJson: JSON.stringify({
          baseWidth: 1280,
          baseHeight: 720,
          widgets: [],
        }),
      };
      const duplicatedUi: CustomUI = {
        entity_id: "custom_1_copy",
        name: "My Custom UI (Copy)",
        is_default: false,
        layoutJson: sourceUi.layoutJson,
      };
      dataService.duplicateCustomUI.and.returnValue(of(duplicatedUi));
      spyOn(component.undoManager, "captureState");

      await component.onDuplicateCustomUi(sourceUi);

      expect(dataService.duplicateCustomUI).toHaveBeenCalledWith(
        "custom_1",
        jasmine.any(String),
      );
      expect(
        component.displayCustomUIs.some((u) => u.entity_id === "custom_1_copy"),
      ).toBeTrue();
      expect(component.activeCustomUiId).toBe("custom_1_copy");
    });

    it("should handle error when duplicating custom UI with duplicate name", async () => {
      spyOn(window, "alert");
      dataService.duplicateCustomUI.and.returnValue(
        throwError(() => ({ status: 409 })),
      );

      await component.createNewCustomUi();

      expect(window.alert).toHaveBeenCalledWith("UE_ERROR_UI_NAME_EXISTS");
    });

    it("should show Add button on UI Layouts header toolbar and not on individual layouts", () => {
      component.sectionsExpanded["customUIs"] = true;
      fixture.detectChanges();

      const headerToolbar = fixture.debugElement.query(
        By.css("#help-custom-uis .custom-ui-toolbar-container app-toolbar"),
      );
      expect(headerToolbar.componentInstance.showAdd()).toBeTrue();

      const itemToolbars = fixture.debugElement.queryAll(
        By.css(
          ".custom-ui-sub-section .custom-ui-toolbar-container app-toolbar",
        ),
      );
      expect(itemToolbars.length).toBeGreaterThan(0);
      itemToolbars.forEach((toolbar) => {
        expect(toolbar.componentInstance.showAdd()).toBeFalse();
        expect(toolbar.componentInstance.showDelete()).toBeTrue();
      });
    });

    it("should prompt delete and successfully delete a custom UI", async () => {
      const customUi: CustomUI = {
        entity_id: "custom_to_delete",
        name: "To Delete",
        is_default: false,
      };
      component.editingState.customUIs = [
        ...(component.editingState.customUIs || []),
        customUi,
      ];
      component.editingState.themes = [
        {
          entity_id: "theme_using_ui",
          name: "Theme",
          uiId: "custom_to_delete",
          is_default: false,
          slots: {},
        } as Theme,
      ];
      component.activeCustomUiId = "custom_to_delete";
      component.refreshDisplayProperties();

      // Trigger delete on default UI
      const defaultUi = component.displayCustomUIs.find(
        (u) => u.entity_id === "default_ui_layout_rc_ai",
      )!;
      component.onDeleteCustomUi(defaultUi);
      expect(component.showDeleteUiConfirm).toBeTrue();
      expect(component.uiToDelete).toBe(defaultUi);
      component.cancelDeleteCustomUi();
      expect(component.showDeleteUiConfirm).toBeFalse();

      // Trigger delete on custom UI
      component.onDeleteCustomUi(customUi);
      expect(component.showDeleteUiConfirm).toBeTrue();
      expect(component.uiToDelete).toBe(customUi);

      // Cancel delete
      component.cancelDeleteCustomUi();
      expect(component.showDeleteUiConfirm).toBeFalse();
      expect(component.uiToDelete).toBeNull();

      // Confirm delete
      component.onDeleteCustomUi(customUi);
      dataService.deleteCustomUI.and.returnValue(of(null));
      spyOn(component.undoManager, "captureState");

      await component.confirmDeleteCustomUi();

      expect(dataService.deleteCustomUI).toHaveBeenCalledWith(
        "custom_to_delete",
      );
      expect(
        component.displayCustomUIs.some(
          (u) => u.entity_id === "custom_to_delete",
        ),
      ).toBeFalse();
      expect(component.activeCustomUiId).toBe("default_ui_layout_rc_ai");
      expect(
        component.editingState.themes.find(
          (t) => t.entity_id === "theme_using_ui",
        )?.uiId,
      ).toBe("default_ui_layout_rc_ai");
      expect(component.undoManager.captureState).toHaveBeenCalled();
    });

    it("should validate custom UI layout names correctly", () => {
      const custom1: CustomUI = {
        entity_id: "c1",
        name: "Layout One",
        is_default: false,
      };
      const custom2: CustomUI = {
        entity_id: "c2",
        name: "Layout Two",
        is_default: false,
      };
      component.editingState.customUIs = [
        ...(component.editingState.customUIs || []),
        custom1,
        custom2,
      ];
      component.refreshDisplayProperties();

      expect(component.isCustomUiNameInvalid(custom1)).toBeFalse();
      expect(component.isAnyCustomUiNameInvalid()).toBeFalse();

      // Empty name
      custom1.name = "   ";
      expect(component.isCustomUiNameInvalid(custom1)).toBeTrue();
      expect(component.isAnyCustomUiNameInvalid()).toBeTrue();

      // Duplicate name
      custom1.name = "Layout Two";
      expect(component.isCustomUiNameInvalid(custom1)).toBeTrue();
      expect(component.isAnyCustomUiNameInvalid()).toBeTrue();

      // Default UIs are never considered invalid
      const defaultUi = component.displayCustomUIs.find(
        (u) => u.entity_id === "default_ui_layout_rc_ai",
      )!;
      expect(component.isCustomUiNameInvalid(defaultUi)).toBeFalse();
    });

    it("should toggle UI sections and select corresponding UI layout", () => {
      component.toggleUiSection("practice_ui_layout_rc_ai");
      expect(
        component.sectionsExpanded["ui_practice_ui_layout_rc_ai"],
      ).toBeTrue();
      expect(
        component.sectionsExpanded["ui_default_ui_layout_rc_ai"],
      ).toBeFalse();
      expect(component.activeCustomUiId).toBe("practice_ui_layout_rc_ai");

      // Collapsing
      component.toggleUiSection("practice_ui_layout_rc_ai");
      expect(
        component.sectionsExpanded["ui_practice_ui_layout_rc_ai"],
      ).toBeFalse();
    });

    it("should not collide when a theme and custom UI layout share the same entity_id", () => {
      const themeWithSameId: Theme = {
        entity_id: "1",
        name: "Theme 1",
        is_default: false,
        slots: {},
        audio_slots: {},
      };
      const uiWithSameId: CustomUI = {
        entity_id: "1",
        name: "UI Layout 1",
        is_default: false,
        layoutJson: JSON.stringify({
          baseWidth: 1920,
          baseHeight: 1080,
          widgets: [],
        }),
      };
      component.editingState.themes = [themeWithSameId];
      component.editingState.customUIs = [uiWithSameId];
      component.refreshDisplayProperties();

      // Expanding theme 1 should NOT expand custom UI 1
      component.toggleThemeSection("1");
      expect(component.sectionsExpanded["theme_1"]).toBeTrue();
      expect(component.sectionsExpanded["ui_1"]).toBeFalsy();

      // Expanding custom UI 1 should NOT collapse or affect theme 1
      component.toggleUiSection("1");
      expect(component.sectionsExpanded["ui_1"]).toBeTrue();
      expect(component.sectionsExpanded["theme_1"]).toBeTrue();
    });

    it("should auto-save modified custom UIs and refresh customUiService", async () => {
      const customUi: CustomUI = {
        entity_id: "c_auto",
        name: "Auto Save UI",
        is_default: false,
        layoutJson: JSON.stringify({
          baseWidth: 1920,
          baseHeight: 1080,
          widgets: [],
        }),
      };
      component.editingState.customUIs = [
        ...(component.editingState.customUIs || []),
        customUi,
      ];
      component.refreshDisplayProperties();
      component.undoManager.resetTracking(component.editingState);

      // Modify layout
      customUi.layoutJson = JSON.stringify({
        baseWidth: 1920,
        baseHeight: 1080,
        widgets: [
          {
            id: "w_new",
            widgetType: "timer",
            x: 0,
            y: 0,
            width: 100,
            height: 100,
            zIndex: 1,
          },
        ],
      });

      dataService.updateCustomUI.and.returnValue(of(customUi));
      spyOn(customUiService, "initialize");

      await (component as any).autoSaveState();

      expect(dataService.updateCustomUI).toHaveBeenCalledWith(
        "c_auto",
        customUi,
      );
      expect(customUiService.initialize).toHaveBeenCalled();
    });

    it("should calculate consistent scale regardless of widget selection due to uniform inspector width", () => {
      spyOnProperty(window, "innerWidth", "get").and.returnValue(1920);
      const laneViewWidget: any = { id: "lv1", widgetType: "lane-view" };
      component.editingSettings.racedayLayout = {
        baseWidth: 1920,
        baseHeight: 1080,
        widgets: [laneViewWidget],
      };
      component.selectedWidgetId = "lv1";
      const scaleLaneView = component.getPreviewScaleNumber();

      const timerWidget: any = { id: "t1", widgetType: "timer" };
      component.editingSettings.racedayLayout = {
        baseWidth: 1920,
        baseHeight: 1080,
        widgets: [timerWidget],
      };
      component.selectedWidgetId = "t1";
      const scaleTimer = component.getPreviewScaleNumber();

      expect(scaleLaneView).toEqual(scaleTimer);
    });

    it("should display widget inspector for selected widget on the layout and remain open across widget selections", () => {
      const defaultUi: CustomUI = {
        entity_id: "default_ui_layout_rc_ai",
        name: "Default UI",
        is_default: true,
      };
      component.displayCustomUIs = [defaultUi];
      component.activeCustomUiId = "default_ui_layout_rc_ai";
      component.sectionsExpanded["ui_default_ui_layout_rc_ai"] = true;

      const laneViewWidget: any = { id: "lv1", widgetType: "lane-view" };
      const timerWidget: any = { id: "t1", widgetType: "timer" };
      component.editingSettings.racedayLayout = {
        baseWidth: 1920,
        baseHeight: 1080,
        widgets: [laneViewWidget, timerWidget],
      };

      // Select lane-view widget -> inspector should be visible
      component.onWidgetSelected("lv1");
      fixture.detectChanges();

      let inspector = fixture.debugElement.query(
        By.css("#help-widget-inspector"),
      );
      expect(inspector).toBeTruthy();
      expect(
        inspector.nativeElement.classList.contains("widget-inspector-panel"),
      ).toBeTrue();

      // Select timer widget -> inspector should remain open displaying timer settings
      component.onWidgetSelected("t1");
      fixture.detectChanges();

      inspector = fixture.debugElement.query(By.css("#help-widget-inspector"));
      expect(inspector).toBeTruthy();
      expect(
        inspector.nativeElement.classList.contains("widget-inspector-panel"),
      ).toBeTrue();

      // Ensure calling onWidgetSelected(null) retains active widget selection
      component.onWidgetSelected(null);
      fixture.detectChanges();

      inspector = fixture.debugElement.query(By.css("#help-widget-inspector"));
      expect(inspector).toBeTruthy();
    });

    it("should select replacement widget when currently selected widget is removed", () => {
      const w1: any = { id: "w1", widgetType: "timer" };
      const w2: any = { id: "w2", widgetType: "lane-view" };
      const initialLayout: any = {
        baseWidth: 1920,
        baseHeight: 1080,
        widgets: [w1, w2],
      };
      component.editingSettings.racedayLayout = initialLayout;
      component.activeCustomUiId = "default_ui_layout_rc_ai";
      component.selectedWidgetId = "w1";

      // Remove w1
      const updatedLayout: any = {
        baseWidth: 1920,
        baseHeight: 1080,
        widgets: [w2],
      };
      component.onLayoutChanged(updatedLayout);

      // w2 (lane-view) should now be selected as replacement
      expect(component.selectedWidgetId).toBe("w2");
    });

    it("should update layout and capture state when onWidgetInspectorChange is called", () => {
      spyOn(component.undoManager, "captureState");
      const customUi: any = {
        entity_id: "custom_ui_1",
        layoutJson: JSON.stringify({
          baseWidth: 1920,
          baseHeight: 1080,
          widgets: [
            {
              id: "cw1",
              widgetType: "custom:sample-detailed-leaderboard",
              customSettings: { showGap: true },
            },
          ],
        }),
      };
      component.displayCustomUIs = [customUi];
      component.activeCustomUiId = "custom_ui_1";
      component.selectedWidgetId = "cw1";

      const updatedWidget = {
        id: "cw1",
        widgetType: "custom:sample-detailed-leaderboard",
        customSettings: { showGap: false },
      };

      component.onWidgetInspectorChange(updatedWidget, customUi);

      const parsed = JSON.parse(customUi.layoutJson);
      expect(parsed.widgets[0].customSettings.showGap).toBeFalse();
      expect(component.undoManager.captureState).toHaveBeenCalled();
    });
  });
});

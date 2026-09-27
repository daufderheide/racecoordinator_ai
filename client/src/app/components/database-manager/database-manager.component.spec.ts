import { HarnessLoader } from "@angular/cdk/testing";
import { TestbedHarnessEnvironment } from "@angular/cdk/testing/testbed";
import { ChangeDetectorRef, CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { of, throwError } from "rxjs";
import { AnalyticsService } from "@app/analytics.service";
import { DataService } from "@app/data.service";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { ConnectionMonitorService } from "@app/services/connection-monitor.service";
import { HelpService } from "@app/services/help.service";
import { LoggerService } from "@app/services/logger.service";
import { RaceConnectionService } from "@app/services/race-connection.service";
import { SettingsService } from "@app/services/settings.service";
import { TranslationService } from "@app/services/translation.service";
import { MOCK_DATABASES } from "@app/testing/data/databases_data";
import {
  mockAnalyticsService,
  mockDataService,
  mockLoggerService,
  mockRouter,
  mockSettingsService,
  mockTranslationService,
  resetMocks,
} from "@app/testing/unit-test-mocks";
import { deepCopy } from "@app/utils/clone.utils";

import { DatabaseManagerComponent } from "./database-manager.component";

describe("DatabaseManagerComponent", () => {
  let component: DatabaseManagerComponent;
  let fixture: ComponentFixture<DatabaseManagerComponent>;
  let _loader: HarnessLoader;
  let dataService: any;
  let _router: any;
  let _activatedRoute: any;

  beforeEach(async () => {
    mockTranslationService.translate.and.callFake((key: string) => key);

    // Default mock returns
    mockDataService.getDatabases.and.returnValue(of(deepCopy(MOCK_DATABASES)));
    mockDataService.getCurrentDatabase.and.returnValue(
      of({ name: MOCK_DATABASES[0].name }),
    );
    mockDataService.switchDatabase.and.returnValue(
      of({ name: MOCK_DATABASES[1].name }),
    );
    mockDataService.createDatabase.and.returnValue(
      of({
        name: "newDB",
        driverCount: 0,
        teamCount: 0,
        trackCount: 0,
        raceCount: 0,
        eventCount: 0,
        seasonCount: 0,
        assetCount: 0,
        sizeBytes: 0,
      }),
    );
    mockDataService.copyDatabase.and.returnValue(
      of({ ...MOCK_DATABASES[0], name: "copyDB" }),
    );
    mockDataService.resetDatabase.and.returnValue(
      of({
        name: MOCK_DATABASES[0].name,
        driverCount: 0,
        teamCount: 0,
        trackCount: 0,
        raceCount: 0,
        eventCount: 0,
        seasonCount: 0,
        assetCount: 0,
        sizeBytes: 0,
      }),
    );
    mockDataService.deleteDatabase.and.returnValue(of(null));
    mockDataService.exportDatabaseBlob.and.returnValue(
      of(new Blob(["mock zip"], { type: "application/zip" })),
    );
    mockDataService.importDatabase.and.returnValue(
      of({
        name: "importedDB",
        driverCount: 1,
        teamCount: 1,
        trackCount: 1,
        raceCount: 1,
        eventCount: 1,
        seasonCount: 1,
        assetCount: 1,
        sizeBytes: 100,
      }),
    );

    const mockConnectionMonitor = jasmine.createSpyObj(
      "ConnectionMonitorService",
      ["startMonitoring", "stopMonitoring"],
      { connectionState$: of() },
    );

    const mockRaceConnectionService = jasmine.createSpyObj(
      "RaceConnectionService",
      ["connect", "disconnect"],
    );

    await TestBed.configureTestingModule({
      imports: [FormsModule, DatabaseManagerComponent, TranslatePipe],
      providers: [
        { provide: DataService, useValue: mockDataService },
        { provide: Router, useValue: mockRouter },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: { get: () => null },
              queryParamMap: { get: () => null },
            },
            queryParams: of({}),
          },
        },
        { provide: TranslationService, useValue: mockTranslationService },
        { provide: LoggerService, useValue: mockLoggerService },
        { provide: AnalyticsService, useValue: mockAnalyticsService },
        { provide: SettingsService, useValue: mockSettingsService },
        {
          provide: HelpService,
          useValue: { startGuide: jasmine.createSpy("startGuide") },
        },
        { provide: ConnectionMonitorService, useValue: mockConnectionMonitor },
        { provide: RaceConnectionService, useValue: mockRaceConnectionService },
        ChangeDetectorRef,
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();
  });

  afterEach(() => {
    resetMocks();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DatabaseManagerComponent);
    _loader = TestbedHarnessEnvironment.loader(fixture);
    component = fixture.componentInstance;
    dataService = TestBed.inject(DataService);
    _router = TestBed.inject(Router);
    _activatedRoute = TestBed.inject(ActivatedRoute);
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should load databases and current database on init", () => {
    expect(dataService.getDatabases).toHaveBeenCalled();
    expect(dataService.getCurrentDatabase).toHaveBeenCalled();
    expect(component.databases).toEqual(MOCK_DATABASES);
    expect(component.currentDatabaseName).toEqual(MOCK_DATABASES[0].name);
    expect(component.selectedDatabase).toEqual(MOCK_DATABASES[0]);
  });

  it("should handle error during initial load", () => {
    dataService.getDatabases.and.returnValue(
      throwError(() => new Error("Error")),
    );
    component.initialLoad();
    expect(component.loading).toBeFalse();
    expect(component.showAckModal).toBeTrue();
    expect(component.ackModalMessage).toBe("DBM_ERR_LOAD_INFO");
    expect(mockLoggerService.error).toHaveBeenCalled();
  });

  it("should select a database", () => {
    component.selectDatabase(MOCK_DATABASES[1]);
    expect(component.selectedDatabase).toEqual(MOCK_DATABASES[1]);
  });

  describe("useDatabase", () => {
    it("should not switch if already on current database", () => {
      component.selectedDatabase = MOCK_DATABASES[0]; // db-active (current)
      component.useDatabase();
      expect(component.showConfirmModal).toBeFalse();
    });

    it("should open confirm modal if selecting different database", () => {
      component.selectedDatabase = MOCK_DATABASES[1]; // db-inactive
      component.useDatabase();
      expect(component.showConfirmModal).toBeTrue();
      expect(component.confirmModalTitle).toBe("DBM_CONFIRM_SWITCH_TITLE");
    });

    it("should call switchDatabase when confirmed", () => {
      component.selectedDatabase = MOCK_DATABASES[1];
      component.useDatabase();
      component.onConfirm();

      expect(dataService.switchDatabase).toHaveBeenCalledWith(
        MOCK_DATABASES[1].name,
      );
      expect(component.currentDatabaseName).toBe(MOCK_DATABASES[1].name);
    });

    it("should handle error during switch", () => {
      dataService.switchDatabase.and.returnValue(
        throwError(() => new Error("Error")),
      );
      component.selectedDatabase = MOCK_DATABASES[1];
      component.useDatabase();
      component.onConfirm();

      expect(component.loading).toBeFalse();
      expect(component.showAckModal).toBeTrue();
      expect(component.ackModalMessage).toBe("DBM_ERR_SWITCH");
      expect(mockLoggerService.error).toHaveBeenCalled();
    });
  });

  describe("createDatabase", () => {
    it("should open input modal", () => {
      component.createDatabase();
      expect(component.showInputModal).toBeTrue();
      expect(component.inputModalTitle).toBe("DBM_PROMPT_CREATE_TITLE");
    });

    it("should call createDatabase when input confirmed", () => {
      component.createDatabase();
      component.inputValue = "newDB";
      component.onInputConfirm();

      expect(dataService.createDatabase).toHaveBeenCalledWith("newDB");
      expect(component.currentDatabaseName).toBe("newDB");
      expect(component.selectedDatabase.name).toBe("newDB");
    });

    it("should handle general error during creation", () => {
      dataService.createDatabase.and.returnValue(
        throwError(() => new Error("Error")),
      );

      component.createDatabase();
      component.inputValue = "newDB";
      component.onInputConfirm();

      expect(component.loading).toBeFalse();
      expect(component.showAckModal).toBeTrue();
      expect(component.ackModalMessage).toBe("DBM_ERR_CREATE");
      expect(mockLoggerService.error).toHaveBeenCalled();
    });

    it("should handle conflict error during creation", () => {
      dataService.createDatabase.and.returnValue(
        throwError(() => ({ status: 409 })),
      );

      component.createDatabase();
      component.inputValue = "existingDB";
      component.onInputConfirm();

      expect(component.loading).toBeFalse();
      expect(component.showAckModal).toBeTrue();
      expect(component.ackModalMessage).toBe("DBM_ERR_EXISTS");
    });
  });

  describe("copyDatabase", () => {
    it("should return if no database selected", () => {
      component.selectedDatabase = null;
      component.copyDatabase();
      expect(component.showInputModal).toBeFalse();
    });

    it("should open input modal for any database", () => {
      component.selectedDatabase = MOCK_DATABASES[1]; // inactive
      component.copyDatabase();
      expect(component.showInputModal).toBeTrue();
      expect(component.inputModalTitle).toBe("DBM_PROMPT_COPY_TITLE");
    });

    it("should call copyDatabase when input confirmed with source database", () => {
      component.selectedDatabase = MOCK_DATABASES[1]; // inactive
      component.copyDatabase();
      component.inputValue = "copyDB";
      component.onInputConfirm();

      expect(dataService.copyDatabase).toHaveBeenCalledWith(
        "copyDB",
        MOCK_DATABASES[1].name,
      );
      expect(component.showAckModal).toBeTrue();
      expect(component.ackModalMessage).toBe("DBM_SUCCESS_COPY");
    });

    it("should handle conflict error (409)", () => {
      dataService.copyDatabase.and.returnValue(
        throwError(() => ({ status: 409 })),
      );
      component.selectedDatabase = MOCK_DATABASES[0];
      component.copyDatabase();
      component.inputValue = "copyDB";
      component.onInputConfirm();

      expect(component.loading).toBeFalse();
      expect(component.showAckModal).toBeTrue();
      expect(component.ackModalMessage).toBe("DBM_ERR_EXISTS");
    });
  });

  describe("resetDatabase", () => {
    it("should return if no database selected", () => {
      component.selectedDatabase = null;
      component.resetDatabase();
      expect(component.showConfirmModal).toBeFalse();
    });

    it("should allow resetting inactive database", () => {
      component.selectedDatabase = MOCK_DATABASES[1];
      component.resetDatabase();
      expect(component.showConfirmModal).toBeTrue();
      expect(component.confirmModalMessage).toBe("DBM_CONFIRM_RESET_MSG_1");
    });

    it("should require double confirmation and pass database name", () => {
      component.selectedDatabase = MOCK_DATABASES[1]; // inactive
      component.resetDatabase();

      // First confirm
      expect(component.showConfirmModal).toBeTrue();
      expect(component.confirmModalTitle).toBe("DBM_CONFIRM_RESET_TITLE");
      expect(component.confirmModalMessage).toBe("DBM_CONFIRM_RESET_MSG_1");

      component.onConfirm();

      // Second confirm
      expect(component.showConfirmModal).toBeTrue();
      expect(component.confirmModalTitle).toBe("DBM_CONFIRM_RESET_TITLE");
      expect(component.confirmModalMessage).toBe("DBM_CONFIRM_RESET_MSG_2");

      component.onConfirm();

      expect(dataService.resetDatabase).toHaveBeenCalledWith(
        MOCK_DATABASES[1].name,
      );
      expect(component.showAckModal).toBeTrue();
      expect(component.ackModalMessage).toBe("DBM_SUCCESS_RESET");
    });
  });

  describe("deleteDatabase", () => {
    it("should return if no database selected", () => {
      component.selectedDatabase = null;
      component.deleteDatabase();
      expect(component.showConfirmModal).toBeFalse();
    });

    it("should show error if deleting active database", () => {
      component.selectedDatabase = MOCK_DATABASES[0]; // active
      component.deleteDatabase();
      expect(component.showAckModal).toBeTrue();
      expect(component.ackModalMessage).toBe("DBM_ERR_DELETE_ACTIVE");
    });

    it("should show confirm modal for inactive database", () => {
      component.selectedDatabase = MOCK_DATABASES[1];
      component.deleteDatabase();
      expect(component.showConfirmModal).toBeTrue();
      expect(component.confirmModalTitle).toBe("DBM_CONFIRM_DELETE_TITLE");
    });

    it("should call deleteDatabase when confirmed", () => {
      component.selectedDatabase = MOCK_DATABASES[1];
      component.deleteDatabase();
      component.onConfirm();

      expect(dataService.deleteDatabase).toHaveBeenCalledWith(
        MOCK_DATABASES[1].name,
      );
      // After delete, it reloads and selects the current database if none selected
      expect(component.selectedDatabase).toEqual(MOCK_DATABASES[0]);
      expect(component.showAckModal).toBeTrue();
      expect(component.ackModalMessage).toBe("DBM_SUCCESS_DELETE");
    });
  });

  describe("exportDatabase", () => {
    let originalShowSaveFilePicker: any;

    beforeEach(() => {
      originalShowSaveFilePicker = (window as any).showSaveFilePicker;
    });

    afterEach(() => {
      (window as any).showSaveFilePicker = originalShowSaveFilePicker;
    });

    it("should call exportDatabaseBlob and showSaveFilePicker with selected database", async () => {
      const mockWritable = {
        write: jasmine.createSpy("write").and.returnValue(Promise.resolve()),
        close: jasmine.createSpy("close").and.returnValue(Promise.resolve()),
      };
      const mockHandle = {
        createWritable: jasmine
          .createSpy("createWritable")
          .and.returnValue(Promise.resolve(mockWritable)),
      };
      (window as any).showSaveFilePicker = jasmine
        .createSpy("showSaveFilePicker")
        .and.returnValue(Promise.resolve(mockHandle));

      component.selectedDatabase = MOCK_DATABASES[1];
      await component.exportDatabase();

      expect(dataService.exportDatabaseBlob).toHaveBeenCalledWith(
        MOCK_DATABASES[1].name,
      );
      expect((window as any).showSaveFilePicker).toHaveBeenCalledWith({
        suggestedName: `${MOCK_DATABASES[1].name}.zip`,
        types: [
          {
            description: "ZIP Files",
            accept: { "application/zip": [".zip"] },
          },
        ],
      });
      expect(mockWritable.write).toHaveBeenCalled();
      expect(mockWritable.close).toHaveBeenCalled();
    });

    it("should handle error when export fails", async () => {
      dataService.exportDatabaseBlob.and.returnValue(
        throwError(() => new Error("Network error")),
      );
      component.selectedDatabase = MOCK_DATABASES[1];
      await component.exportDatabase();
      expect(component.showAckModal).toBeTrue();
      expect(component.ackModalMessage).toBe("DBM_ERR_EXPORT");
    });

    it("should ignore cancellation when user cancels showSaveFilePicker", async () => {
      const abortErr = new Error("User cancelled");
      abortErr.name = "AbortError";
      (window as any).showSaveFilePicker = jasmine
        .createSpy("showSaveFilePicker")
        .and.returnValue(Promise.reject(abortErr));

      component.selectedDatabase = MOCK_DATABASES[1];
      await component.exportDatabase();
      expect(component.showAckModal).toBeFalse();
    });
  });

  it("should handle cancel confirm", () => {
    component.showConfirmModal = true;
    component.onCancelConfirm();
    expect(component.showConfirmModal).toBeFalse();
  });

  it("should handle cancel input", () => {
    component.showInputModal = true;
    component.onCancelInput();
    expect(component.showInputModal).toBeFalse();
  });

  describe("importDatabaseNaming", () => {
    it("should default name to filename without extension", () => {
      const event = {
        target: { files: [{ name: "mybackup.zip" }], value: "test" },
      };
      component.onFileSelected(event);
      expect(component.inputValue).toBe("mybackup");
    });

    it("should add postfix if name already exists", () => {
      // db-active and db-inactive exist in MOCK_DATABASES
      const event = {
        target: { files: [{ name: "db-active.zip" }], value: "test" },
      };
      component.onFileSelected(event);
      expect(component.inputValue).toBe("db-active_1");
    });

    it("should increment postfix if multiple exist", () => {
      component.databases.push({ name: "db-active_1" });
      const event = {
        target: { files: [{ name: "db-active.zip" }], value: "test" },
      };
      component.onFileSelected(event);
      expect(component.inputValue).toBe("db-active_2");
    });
  });

  it("should handle error during import", () => {
    dataService.importDatabase.and.returnValue(
      throwError(() => new Error("Error")),
    );
    const event = { target: { files: [{ name: "db.zip" }], value: "test" } };
    component.onFileSelected(event);
    component.inputValue = "importedDB";
    component.onInputConfirm();

    expect(component.loading).toBeFalse();
    expect(component.showAckModal).toBeTrue();
    expect(component.ackModalMessage).toBe("DBM_ERR_IMPORT");
    expect(mockLoggerService.error).toHaveBeenCalled();
  });

  it("should handle success during import", () => {
    const event = { target: { files: [{ name: "db.zip" }], value: "test" } };
    component.onFileSelected(event);
    component.inputValue = "importedDB";
    component.onInputConfirm();

    expect(dataService.importDatabase).toHaveBeenCalledWith(
      "importedDB",
      event.target.files[0] as any,
    );
    expect(component.showAckModal).toBeTrue();
    expect(component.ackModalMessage).toBe("DBM_SUCCESS_IMPORT");
  });

  it("should render eventCount and seasonCount in the stats grid", () => {
    component.selectedDatabase = {
      name: "test-db",
      driverCount: 5,
      teamCount: 2,
      trackCount: 1,
      raceCount: 4,
      eventCount: 3,
      seasonCount: 2,
      assetCount: 10,
      sizeBytes: 1000,
      raceRecordCount: 0,
      raceRecordSizeBytes: 0,
      savedRaceCount: 0,
      savedRaceSizeBytes: 0,
    };
    fixture.detectChanges();

    const statLabels =
      fixture.nativeElement.querySelectorAll(".stat-item .label");
    const statValues =
      fixture.nativeElement.querySelectorAll(".stat-item .value");

    const labelsText = Array.from(statLabels).map((el: any) =>
      el.textContent.trim(),
    );
    const valuesText = Array.from(statValues).map((el: any) =>
      el.textContent.trim(),
    );

    expect(labelsText).toContain("DBM_STAT_EVENTS");
    expect(labelsText).toContain("DBM_STAT_SEASONS");

    const eventsIndex = labelsText.indexOf("DBM_STAT_EVENTS");
    const seasonsIndex = labelsText.indexOf("DBM_STAT_SEASONS");

    expect(valuesText[eventsIndex]).toBe("3");
    expect(valuesText[seasonsIndex]).toBe("2");
  });

  it("should apply size-stat-item class to DBM_STAT_RACE_RECORDS element", () => {
    component.selectedDatabase = MOCK_DATABASES[0];
    fixture.detectChanges();

    const sizeStatItem = fixture.nativeElement.querySelector(".size-stat-item");
    expect(sizeStatItem).not.toBeNull();
    expect(sizeStatItem.textContent).toContain("DBM_STAT_RACE_RECORDS");
  });
});

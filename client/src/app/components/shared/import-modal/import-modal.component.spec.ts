import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from "@angular/core/testing";
import { FormsModule } from "@angular/forms";
import { of, throwError } from "rxjs";
import { DataService } from "@app/data.service";
import {
  DriverImportPreview,
  DriverImportResult,
  DriverImportRow,
} from "@app/models/driver-import.model";
import { AvatarUrlPipe } from "@app/pipes/avatar-url.pipe";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { TranslationService } from "@app/services/translation.service";

import { ImportModalComponent } from "./import-modal.component";

describe("ImportModalComponent", () => {
  let component: ImportModalComponent;
  let fixture: ComponentFixture<ImportModalComponent>;
  let mockDataService: jasmine.SpyObj<DataService>;
  let mockTranslationService: jasmine.SpyObj<TranslationService>;

  const createMockPreview = (): DriverImportPreview => ({
    totalRows: 3,
    validCount: 1,
    conflictCount: 1,
    errorCount: 1,
    importedAssetNames: ["custom_avatar.png"],
    detectedAudioDefault: "system",
    existingDrivers: [
      { entityId: "d-bob-existing", name: "Bob Smith", nickname: "Bob" },
    ],
    rows: [
      {
        rowIndex: 1,
        status: "VALID",
        conflictType: "NONE",
        rawName: "Alice Walker",
        rawNickname: "AliceW",
        resolvedName: "Alice Walker",
        resolvedNickname: "AliceW",
        selectedResolution: "AUTO_RENAME",
        defaultAudioMode: "file",
        avatarUrl: "/assets/alice_helmet.png",
        audioSlots: {
          lap: { type: "preset", url: "default_lap.wav" },
        },
      },
      {
        rowIndex: 2,
        status: "CONFLICT",
        conflictType: "DUPLICATE_NAME",
        rawName: "Bob Smith",
        rawNickname: "Bob",
        resolvedName: "Bob Smith",
        resolvedNickname: "Bob",
        selectedResolution: "AUTO_RENAME",
        existingDriverId: "d-bob-existing",
        defaultAudioMode: "file",
        audioSlots: {},
      },
      {
        rowIndex: 3,
        status: "ERROR",
        conflictType: "NONE",
        rawName: "",
        rawNickname: "Ghost",
        resolvedName: "",
        resolvedNickname: "Ghost",
        selectedResolution: "SKIP",
        message: "DIM_ERROR_NAME_REQUIRED",
        defaultAudioMode: "file",
        audioSlots: {},
      },
    ],
  });

  beforeEach(async () => {
    mockDataService = jasmine.createSpyObj("DataService", [
      "validateDriverImport",
      "commitDriverImport",
      "downloadDriverImportTemplate",
    ]);

    (mockDataService as any).serverUrl = "http://localhost:7070";
    (mockDataService as any).resolveAssetUrl = jasmine
      .createSpy("resolveAssetUrl")
      .and.callFake((url: string) => url);

    mockTranslationService = jasmine.createSpyObj("TranslationService", [
      "translate",
    ]);
    mockTranslationService.translate.and.callFake((key: string) => key);

    await TestBed.configureTestingModule({
      imports: [
        FormsModule,
        ImportModalComponent,
        TranslatePipe,
        AvatarUrlPipe,
      ],
      providers: [
        { provide: DataService, useValue: mockDataService },
        { provide: TranslationService, useValue: mockTranslationService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ImportModalComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput("visible", true);
    fixture.detectChanges();
  });

  it("should create in upload step", () => {
    expect(component).toBeTruthy();
    expect(component.step).toBe("upload");
    expect(component.selectedFile).toBeNull();
    expect(component.companionFiles.length).toBe(0);
    expect(component.errorMessage).toBeNull();
  });

  describe("File selection & Drag-and-drop", () => {
    it("should handle drag over and drag leave", () => {
      const dragEvent = new DragEvent("dragover");
      component.onDragOver(dragEvent);
      expect(component.isDragging).toBeTrue();

      const leaveEvent = new DragEvent("dragleave");
      component.onDragLeave(leaveEvent);
      expect(component.isDragging).toBeFalse();
    });

    it("should handle dropped files with main file and companion assets", () => {
      const mainFile = new File(["name,nickname\nJohn,Johnny"], "drivers.csv", {
        type: "text/csv",
      });
      const soundFile = new File(["audio-bytes"], "engine.wav", {
        type: "audio/wav",
      });
      const imgFile = new File(["image-bytes"], "avatar.png", {
        type: "image/png",
      });

      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(mainFile);
      dataTransfer.items.add(soundFile);
      dataTransfer.items.add(imgFile);

      const dropEvent = new DragEvent("drop", { dataTransfer });
      component.onDrop(dropEvent);

      expect(component.isDragging).toBeFalse();
      expect(component.selectedFile?.name).toBe("drivers.csv");
      expect(component.companionFiles.length).toBe(2);
      expect(component.companionFiles[0].name).toBe("engine.wav");
      expect(component.companionFiles[1].name).toBe("avatar.png");
    });

    it("should set error when no valid data file is provided", () => {
      const imgFile = new File(["image-bytes"], "avatar.png", {
        type: "image/png",
      });
      component.handleSelectedFiles([imgFile]);

      expect(component.selectedFile).toBeNull();
      expect(component.errorMessage).toBe("DIM_ERROR_NO_DATA_FILE");
    });

    it("should remove file and clear companion files", () => {
      component.selectedFile = new File([""], "drivers.json");
      component.companionFiles = [new File([""], "audio.wav")];
      component.removeFile();

      expect(component.selectedFile).toBeNull();
      expect(component.companionFiles.length).toBe(0);
    });

    it("should not remove file when isLoading is true", () => {
      const file = new File([""], "drivers.json");
      component.selectedFile = file;
      component.companionFiles = [new File([""], "audio.wav")];
      component.isLoading = true;
      component.removeFile();

      expect(component.selectedFile).toBe(file);
      expect(component.companionFiles.length).toBe(1);
    });

    it("should trigger native file input click", () => {
      const inputEl = document.createElement("input");
      spyOn(inputEl, "click");
      component.fileInputRef = { nativeElement: inputEl };

      component.triggerFilePicker();
      expect(inputEl.click).toHaveBeenCalled();
    });

    it("should handle file input change event", () => {
      const file = new File(["name,nickname"], "drivers.xlsx");
      const event = {
        target: {
          files: [file],
        },
      } as unknown as Event;

      component.onFileInputChange(event);
      expect(component.selectedFile?.name).toBe("drivers.xlsx");
    });
  });

  describe("Download Template", () => {
    it("should request template download from DataService", fakeAsync(() => {
      const blob = new Blob(["sample content"], { type: "text/csv" });
      mockDataService.downloadDriverImportTemplate.and.returnValue(of(blob));

      spyOn(window.URL, "createObjectURL").and.returnValue(
        "blob:http://mock-url",
      );
      spyOn(window.URL, "revokeObjectURL");

      component.downloadTemplate("csv");
      tick();

      expect(mockDataService.downloadDriverImportTemplate).toHaveBeenCalledWith(
        "csv",
      );
      expect(window.URL.createObjectURL).toHaveBeenCalledWith(blob);
      expect(window.URL.revokeObjectURL).toHaveBeenCalledWith(
        "blob:http://mock-url",
      );
    }));

    it("should set error when template download fails", fakeAsync(() => {
      mockDataService.downloadDriverImportTemplate.and.returnValue(
        throwError(() => new Error("Network error")),
      );

      component.downloadTemplate("xlsx");
      tick();

      expect(component.errorMessage).toBe("DIM_ERROR_TEMPLATE_DOWNLOAD");
    }));
  });

  describe("Validation & Preview Step", () => {
    it("should not validate if no file selected", () => {
      component.selectedFile = null;
      component.startValidation();
      expect(mockDataService.validateDriverImport).not.toHaveBeenCalled();
    });

    it("should send file and companion assets in FormData and proceed to preview", fakeAsync(() => {
      const csvFile = new File(["name,nickname"], "drivers.csv");
      const wavFile = new File(["wav"], "engine.wav");
      component.selectedFile = csvFile;
      component.companionFiles = [wavFile];

      const previewRes = createMockPreview();
      mockDataService.validateDriverImport.and.returnValue(of(previewRes));

      component.startValidation();
      tick();

      expect(mockDataService.validateDriverImport).toHaveBeenCalled();
      expect(component.preview).toBe(previewRes);
      expect(component.step).toBe("preview");
      expect(component.isLoading).toBeFalse();
    }));

    it("should handle validation failure", fakeAsync(() => {
      component.selectedFile = new File(["bad"], "drivers.csv");
      mockDataService.validateDriverImport.and.returnValue(
        throwError(() => ({ error: "Parse error in line 1" })),
      );

      component.startValidation();
      tick();

      expect(component.step).toBe("upload");
      expect(component.errorMessage).toBe("Parse error in line 1");
      expect(component.isLoading).toBeFalse();
    }));

    it("should apply none audio default mode to preview rows", () => {
      component.preview = createMockPreview();
      component.audioDefaultMode = "none";
      component.applyAudioDefaultToPreview();

      const row = component.preview.rows[0];
      expect(row.defaultAudioMode).toBe("none");
      expect(row.audioSlots!["lap"].type).toBe("none");
    });
  });

  describe("Filtering & Tabs", () => {
    beforeEach(() => {
      component.preview = createMockPreview();
      component.step = "preview";
    });

    it("should filter rows by tab", () => {
      component.activeTab = "all";
      expect(component.filteredRows.length).toBe(3);

      component.activeTab = "valid";
      expect(component.filteredRows.length).toBe(1);
      expect(component.filteredRows[0].resolvedName).toBe("Alice Walker");

      component.activeTab = "conflicts";
      expect(component.filteredRows.length).toBe(1);
      expect(component.filteredRows[0].resolvedName).toBe("Bob Smith");

      component.activeTab = "errors";
      expect(component.filteredRows.length).toBe(1);
      expect(component.filteredRows[0].resolvedNickname).toBe("Ghost");
    });

    it("should filter rows by search text", () => {
      component.activeTab = "all";
      component.filterText = "bob";
      expect(component.filteredRows.length).toBe(1);
      expect(component.filteredRows[0].resolvedName).toBe("Bob Smith");
    });
  });

  describe("Conflict Resolution & Inline Editing", () => {
    beforeEach(() => {
      component.preview = createMockPreview();
      component.step = "preview";
    });

    it("should apply bulk conflict resolution to conflicting rows", () => {
      component.bulkConflictResolution = "OVERWRITE";
      component.applyBulkConflictResolution();

      const conflictRow = component.preview!.rows.find(
        (r) => r.status === "CONFLICT",
      );
      expect(conflictRow?.selectedResolution).toBe("OVERWRITE");
    });

    it("should change individual row resolution", () => {
      const row = component.preview!.rows[1];
      component.onRowResolutionChange(row, "SKIP");
      expect(row.selectedResolution).toBe("SKIP");
    });

    it("should change red outline to yellow warning when row is marked as SKIP", () => {
      const row = component.preview!.rows[1];
      expect(row.status).toBe("CONFLICT");
      // Initially, with AUTO_RENAME (not applied yet), it is invalid (red)
      expect(component.isRowNameInvalid(row)).toBeTrue();
      expect(component.isRowNicknameInvalid(row)).toBeTrue();
      expect(component.isRowNameWarning(row)).toBeFalse();
      expect(component.isRowNicknameWarning(row)).toBeFalse();

      component.onRowResolutionChange(row, "SKIP");
      expect(row.selectedResolution).toBe("SKIP");

      // Now marked as SKIP: skipped is true, warning is true
      expect(component.isRowSkipped(row)).toBeTrue();
      expect(component.isRowNameWarning(row)).toBeTrue();
      expect(component.isRowNicknameWarning(row)).toBeTrue();

      fixture.detectChanges();
      const rows = fixture.nativeElement.querySelectorAll(
        ".preview-table tbody tr",
      );
      const row1NameInput = rows[1].querySelector(".col-name input");
      const row1NickInput = rows[1].querySelector(".col-nick input");

      expect(row1NameInput.classList).not.toContain("invalid");
      expect(row1NameInput.classList).toContain("warning");
      expect(row1NameInput.classList).toContain("skipped");
      expect(row1NickInput.classList).not.toContain("invalid");
      expect(row1NickInput.classList).toContain("warning");
      expect(row1NickInput.classList).toContain("skipped");

      // Changing to OVERWRITE restores invalid red outline
      component.onRowResolutionChange(row, "OVERWRITE");
      fixture.detectChanges();
      expect(component.isRowSkipped(row)).toBeFalse();
      expect(component.isRowNameWarning(row)).toBeFalse();
      expect(row1NameInput.classList).toContain("invalid");
      expect(row1NameInput.classList).not.toContain("warning");
    });

    it("should update all conflict inputs to yellow warning when bulk resolution is set to SKIP", () => {
      const row = component.preview!.rows[1];
      component.bulkConflictResolution = "SKIP";
      component.applyBulkConflictResolution();

      expect(row.selectedResolution).toBe("SKIP");
      expect(component.isRowSkipped(row)).toBeTrue();
      expect(component.isRowNameWarning(row)).toBeTrue();
      expect(component.isRowNicknameWarning(row)).toBeTrue();

      fixture.detectChanges();
      const rows = fixture.nativeElement.querySelectorAll(
        ".preview-table tbody tr",
      );
      const row1NameInput = rows[1].querySelector(".col-name input");
      expect(row1NameInput.classList).not.toContain("invalid");
      expect(row1NameInput.classList).toContain("warning");
    });

    it("should auto-rename name and nickname, remove red invalid outlines, and transition to VALID when AUTO_RENAME is selected", () => {
      const row = component.preview!.rows[1];
      expect(row.status).toBe("CONFLICT");
      expect(component.isRowNameInvalid(row)).toBeTrue();
      expect(component.isRowNicknameInvalid(row)).toBeTrue();

      component.onRowResolutionChange(row, "AUTO_RENAME");

      expect(row.selectedResolution).toBe("AUTO_RENAME");
      expect(row.resolvedName).toBe("Bob Smith (1)");
      expect(row.resolvedNickname).toBe("Bob (1)");
      expect(row.status).toBe("VALID");
      expect(row.conflictType).toBe("NONE");
      expect(component.isRowNameInvalid(row)).toBeFalse();
      expect(component.isRowNicknameInvalid(row)).toBeFalse();
      expect(component.preview!.conflictCount).toBe(0);
      expect(component.preview!.validCount).toBe(2);
    });

    it("should auto-rename only name when nickname does not collide and nickname is distinct", () => {
      const row = component.preview!.rows[1];
      row.rawNickname = "UniqueNick";
      row.resolvedNickname = "UniqueNick";
      component.recheckAllRows();

      expect(row.status).toBe("CONFLICT");
      expect(component.isRowNameInvalid(row)).toBeTrue();
      expect(component.isRowNicknameInvalid(row)).toBeFalse();

      component.onRowResolutionChange(row, "AUTO_RENAME");

      expect(row.resolvedName).toBe("Bob Smith (1)");
      expect(row.resolvedNickname).toBe("UniqueNick");
      expect(row.status).toBe("VALID");
      expect(component.isRowNameInvalid(row)).toBeFalse();
      expect(component.isRowNicknameInvalid(row)).toBeFalse();
    });

    it("should auto-rename only nickname when name does not collide", () => {
      const row = component.preview!.rows[1];
      row.rawName = "UniqueName";
      row.resolvedName = "UniqueName";
      row.rawNickname = "Bob";
      row.resolvedNickname = "Bob";
      component.recheckAllRows();

      expect(row.status).toBe("CONFLICT");
      expect(component.isRowNameInvalid(row)).toBeFalse();
      expect(component.isRowNicknameInvalid(row)).toBeTrue();

      component.onRowResolutionChange(row, "AUTO_RENAME");

      expect(row.resolvedName).toBe("UniqueName");
      expect(row.resolvedNickname).toBe("Bob (1)");
      expect(row.status).toBe("VALID");
      expect(component.isRowNameInvalid(row)).toBeFalse();
      expect(component.isRowNicknameInvalid(row)).toBeFalse();
    });

    it("should auto-rename both name and nickname to the same value when rawNickname was empty", () => {
      const row = component.preview!.rows[1];
      row.rawNickname = "";
      row.rawName = "Bob";
      row.resolvedName = "Bob";
      row.resolvedNickname = "Bob";
      component.recheckAllRows();

      expect(row.status).toBe("CONFLICT");
      expect(component.isRowNameInvalid(row)).toBeTrue();
      expect(component.isRowNicknameInvalid(row)).toBeTrue();

      component.onRowResolutionChange(row, "AUTO_RENAME");

      expect(row.resolvedName).toBe("Bob (1)");
      expect(row.resolvedNickname).toBe("Bob (1)");
      expect(row.status).toBe("VALID");
      expect(component.isRowNameInvalid(row)).toBeFalse();
      expect(component.isRowNicknameInvalid(row)).toBeFalse();
    });

    it("should auto-rename in bulk and clear all conflict red boxes when bulk resolution is AUTO_RENAME", () => {
      // Add a second conflicting row
      component.preview!.rows.push({
        rowIndex: 4,
        status: "CONFLICT",
        conflictType: "DUPLICATE_NAME",
        rawName: "Bob Smith",
        rawNickname: "Bob",
        resolvedName: "Bob Smith",
        resolvedNickname: "Bob",
        selectedResolution: "SKIP",
        existingDriverId: "d-bob-existing",
        defaultAudioMode: "file",
        audioSlots: {},
      });
      component.recheckAllRows();

      const conflictRows = component.preview!.rows.filter(
        (r) => r.status === "CONFLICT",
      );
      expect(conflictRows.length).toBe(2);

      component.bulkConflictResolution = "AUTO_RENAME";
      component.applyBulkConflictResolution();

      expect(component.preview!.conflictCount).toBe(0);
      expect(component.isRowNameInvalid(conflictRows[0])).toBeFalse();
      expect(component.isRowNameInvalid(conflictRows[1])).toBeFalse();
      expect(conflictRows[0].status).toBe("VALID");
      expect(conflictRows[1].status).toBe("VALID");
      expect(conflictRows[0].resolvedName).toBe("Bob Smith (1)");
      expect(conflictRows[1].resolvedName).toBe("Bob Smith (2)");
    });

    it("should auto-rename duplicate in file rows to unique names and validate both", () => {
      // Setup row 0 and row 1 to be duplicate in file (not matching DB)
      const row0 = component.preview!.rows[0];
      const row1 = component.preview!.rows[1];
      row0.rawName = "Charlie";
      row0.resolvedName = "Charlie";
      row0.rawNickname = "Charlie";
      row0.resolvedNickname = "Charlie";

      row1.rawName = "Charlie";
      row1.resolvedName = "Charlie";
      row1.rawNickname = "Charlie";
      row1.resolvedNickname = "Charlie";
      row1.existingDriverId = undefined;

      component.recheckAllRows();

      expect(row1.status).toBe("CONFLICT");
      expect(row1.conflictType).toBe("DUPLICATE_IN_FILE");
      expect(component.isRowNameInvalid(row1)).toBeTrue();

      component.onRowResolutionChange(row1, "AUTO_RENAME");

      expect(row1.status).toBe("VALID");
      expect(row0.status).toBe("VALID");
      expect(row1.resolvedName).toBe("Charlie (1)");
      expect(row1.resolvedNickname).toBe("Charlie (1)");
      expect(component.isRowNameInvalid(row0)).toBeFalse();
      expect(component.isRowNameInvalid(row1)).toBeFalse();
    });

    it("should recheck row validity when name changes", () => {
      const row = component.preview!.rows[0];
      component.onRowNameChange(row, "");
      expect(row.status).toBe("ERROR");
      expect(row.message).toBe("DIM_ERROR_NAME_REQUIRED");

      component.onRowNameChange(row, "New Name");
      expect(row.status).toBe("VALID");
      expect(row.conflictType).toBe("NONE");
    });

    it("should detect duplicate in file on inline rename", () => {
      const row = component.preview!.rows[0];
      component.onRowNameChange(row, "Bob Smith");
      expect(row.status).toBe("CONFLICT");
      expect(row.conflictType).toBe("DUPLICATE_IN_FILE");
    });

    it("should recheck row validity when nickname changes", () => {
      const row = component.preview!.rows[0];
      component.onRowNicknameChange(row, "");
      expect(row.status).toBe("ERROR");
      expect(row.message).toBe("DIM_ERROR_NICK_REQUIRED");

      component.onRowNicknameChange(row, "Speedy");
      expect(row.status).toBe("VALID");
    });

    it("should remain in CONFLICT when name is renamed but nickname is still a database duplicate", () => {
      const conflictRow = component.preview!.rows[1];
      expect(conflictRow.status).toBe("CONFLICT");
      expect(conflictRow.resolvedName).toBe("Bob Smith");
      expect(conflictRow.resolvedNickname).toBe("Bob");

      // Change name to Bob Smith_1 - nickname Bob is still duplicate in DB
      component.onRowNameChange(conflictRow, "Bob Smith_1");
      expect(conflictRow.status).toBe("CONFLICT");
      expect(conflictRow.conflictType).toBe("DUPLICATE_NICKNAME");
      expect(conflictRow.message).toContain("DIM_CONFLICT_DUPLICATE_NICKNAME");
      expect(component.preview!.conflictCount).toBe(1);

      // Now change nickname to Bob_1 as well
      component.onRowNicknameChange(conflictRow, "Bob_1");
      expect(conflictRow.status).toBe("VALID");
      expect(conflictRow.conflictType).toBe("NONE");
      expect(component.preview!.conflictCount).toBe(0);
      expect(component.preview!.validCount).toBe(2);
    });

    it("should outline name and nickname inputs in red when invalid or conflicting", () => {
      fixture.detectChanges();

      const row0 = component.preview!.rows[0];
      const row1 = component.preview!.rows[1];
      const row2 = component.preview!.rows[2];

      expect(component.isRowNameInvalid(row0)).toBeFalse();
      expect(component.isRowNicknameInvalid(row0)).toBeFalse();

      // Row 1 has both name and nickname colliding with existing driver
      expect(component.isRowNameInvalid(row1)).toBeTrue();
      expect(component.isRowNicknameInvalid(row1)).toBeTrue();

      // Row 2 has empty name error
      expect(component.isRowNameInvalid(row2)).toBeTrue();
      expect(component.isRowNicknameInvalid(row2)).toBeFalse();

      const rows = fixture.nativeElement.querySelectorAll(
        ".preview-table tbody tr",
      );
      expect(rows.length).toBe(3);

      const row1NameInput = rows[1].querySelector(".col-name input");
      const row1NickInput = rows[1].querySelector(".col-nick input");
      expect(row1NameInput.classList).toContain("invalid");
      expect(row1NickInput.classList).toContain("invalid");

      const row2NameInput = rows[2].querySelector(".col-name input");
      const row2NickInput = rows[2].querySelector(".col-nick input");
      expect(row2NameInput.classList).toContain("invalid");
      expect(row2NickInput.classList).not.toContain("invalid");

      // Edit row 1 name to Bob Smith_1 -> name is no longer invalid, nickname remains invalid
      component.onRowNameChange(row1, "Bob Smith_1");
      fixture.detectChanges();

      expect(component.isRowNameInvalid(row1)).toBeFalse();
      expect(component.isRowNicknameInvalid(row1)).toBeTrue();
      expect(row1NameInput.classList).not.toContain("invalid");
      // Because row1 switched to SKIP on collision, nickname input has warning instead of invalid
      expect(row1NickInput.classList).not.toContain("invalid");
      expect(row1NickInput.classList).toContain("warning");

      // Edit row 1 nickname to Bob_1 -> neither is invalid
      component.onRowNicknameChange(row1, "Bob_1");
      fixture.detectChanges();

      expect(component.isRowNameInvalid(row1)).toBeFalse();
      expect(component.isRowNicknameInvalid(row1)).toBeFalse();
      expect(row1NameInput.classList).not.toContain("invalid");
      expect(row1NickInput.classList).not.toContain("invalid");
    });

    it("should switch to skip if an auto-generated or edited name/nickname is changed to a conflict", () => {
      const row = component.preview!.rows[1];
      // Auto-rename row to make it valid
      component.onRowResolutionChange(row, "AUTO_RENAME");
      expect(row.status).toBe("VALID");
      expect(row.resolvedName).toBe("Bob Smith (1)");
      expect(row.selectedResolution).toBe("AUTO_RENAME");

      // User changes auto-generated name back to conflicting "Bob Smith"
      component.onRowNameChange(row, "Bob Smith");
      expect(row.status).toBe("CONFLICT");
      expect(row.selectedResolution).toBe("SKIP");
      expect(component.isRowSkipped(row)).toBeTrue();
      expect(component.isRowNameWarning(row)).toBeTrue();

      // User changes name to a valid unique name
      component.onRowNameChange(row, "Brand New Name");
      expect(row.status).toBe("VALID");
      expect(component.isRowNameWarning(row)).toBeFalse();

      // User changes nickname to a conflicting "Bob"
      component.onRowNicknameChange(row, "Bob");
      expect(row.status).toBe("CONFLICT");
      expect(row.selectedResolution).toBe("SKIP");
      expect(component.isRowNicknameWarning(row)).toBeTrue();

      // User changes nickname to a valid unique nickname
      component.onRowNicknameChange(row, "Brand New Nick");
      expect(row.status).toBe("VALID");
      expect(component.isRowNicknameWarning(row)).toBeFalse();
    });

    it("should handle edge cases in collision detection and row invalidity", () => {
      const dummyRow: DriverImportRow = {
        rowIndex: 99,
        status: "CONFLICT",
        conflictType: "DUPLICATE_IN_FILE",
        rawName: "InFileDup",
        rawNickname: "DupNick",
        resolvedName: "InFileDup",
        resolvedNickname: "DupNick",
        message: "Duplicate driver name in import file",
        selectedResolution: "SKIP",
      };

      // Empty/whitespace collision checks
      expect(component.hasNameCollision("", dummyRow)).toBeFalse();
      expect(component.hasNicknameCollision("   ", dummyRow)).toBeFalse();

      // Isolated row with DUPLICATE_IN_FILE and name in message
      component.preview = null;
      expect(component.hasNameCollision("InFileDup", dummyRow)).toBeFalse();
      expect(component.hasNicknameCollision("DupNick", dummyRow)).toBeFalse();
      expect(component.isRowNameInvalid(dummyRow)).toBeTrue();
      expect(component.isRowNicknameInvalid(dummyRow)).toBeFalse();

      // Message with nickname
      dummyRow.message = "Duplicate driver nickname in import file";
      expect(component.isRowNameInvalid(dummyRow)).toBeFalse();
      expect(component.isRowNicknameInvalid(dummyRow)).toBeTrue();
    });

    it("should compute resolvable count correctly", () => {
      expect(component.resolvableCount).toBe(2); // Valid (1) + Conflict AUTO_RENAME (1)
      component.preview!.rows[1].selectedResolution = "SKIP";
      expect(component.resolvableCount).toBe(1);
    });
  });

  describe("Commit Import", () => {
    beforeEach(() => {
      component.preview = createMockPreview();
      component.step = "preview";
    });

    it("should submit commit request and update state to summary on success", fakeAsync(() => {
      const result: DriverImportResult = {
        success: true,
        importedCount: 2,
        updatedCount: 0,
        skippedCount: 1,
        createdDriverIds: ["d1", "d2"],
        messages: [],
      };
      mockDataService.commitDriverImport.and.returnValue(of(result));
      spyOn(component.imported, "emit");

      component.commitImport();
      tick();

      expect(mockDataService.commitDriverImport).toHaveBeenCalled();
      expect(component.importResult).toBe(result);
      expect(component.step).toBe("summary");
      expect(component.isLoading).toBeFalse();
      expect(component.imported.emit).toHaveBeenCalledWith(result);
    }));

    it("should handle commit failure gracefully", fakeAsync(() => {
      mockDataService.commitDriverImport.and.returnValue(
        throwError(() => ({ error: "Database error during driver insert" })),
      );

      component.commitImport();
      tick();

      expect(component.isLoading).toBeFalse();
      expect(component.errorMessage).toBe(
        "Database error during driver insert",
      );
      expect(component.step).toBe("preview");
    }));
  });

  describe("Close & Reset", () => {
    it("should reset state and emit close event", () => {
      component.step = "summary";
      component.selectedFile = new File([""], "test.csv");
      component.preview = createMockPreview();
      spyOn(component.close, "emit");

      component.onClose();

      expect(component.step).toBe("upload");
      expect(component.selectedFile).toBeNull();
      expect(component.preview).toBeNull();
      expect(component.showAssetsModal).toBeFalse();
      expect(component.close.emit).toHaveBeenCalled();
    });
  });

  describe("Assets Details Modal", () => {
    it("should identify audio file extensions accurately", () => {
      expect(component.isAudioFile("engine.wav")).toBeTrue();
      expect(component.isAudioFile("VOICE.MP3")).toBeTrue();
      expect(component.isAudioFile("beep.ogg")).toBeTrue();
      expect(component.isAudioFile("avatar.png")).toBeFalse();
      expect(component.isAudioFile("photo.jpg")).toBeFalse();
      expect(component.isAudioFile("drivers.csv")).toBeFalse();
      expect(component.isAudioFile("")).toBeFalse();
    });

    it("should toggle showAssetsModal state", () => {
      expect(component.showAssetsModal).toBeFalse();
      component.openAssetsModal();
      expect(component.showAssetsModal).toBeTrue();
      component.closeAssetsModal();
      expect(component.showAssetsModal).toBeFalse();
    });

    it("should open and close assets modal via pill click in preview step", () => {
      component.step = "preview";
      component.preview = {
        totalRows: 1,
        validCount: 1,
        conflictCount: 0,
        errorCount: 0,
        importedAssetNames: ["engine.wav", "driver_headshot.png"],
        detectedAudioDefault: "system",
        rows: [
          {
            rowIndex: 1,
            status: "VALID",
            conflictType: "NONE",
            rawName: "Dan Gurney",
            resolvedName: "Dan Gurney",
            resolvedNickname: "Dan",
            selectedResolution: "AUTO_RENAME",
          },
        ],
      };
      fixture.detectChanges();

      const pill = fixture.nativeElement.querySelector("#pill-assets-badge");
      expect(pill).toBeTruthy();

      pill.click();
      fixture.detectChanges();

      expect(component.showAssetsModal).toBeTrue();
      const dialogBackdrop = fixture.nativeElement.querySelector(
        "#assets-dialog-backdrop",
      );
      expect(dialogBackdrop).toBeTruthy();

      const rows = fixture.nativeElement.querySelectorAll(".asset-list-row");
      expect(rows.length).toBe(2);
      expect(rows[0].textContent).toContain("engine.wav");
      expect(rows[0].textContent).toContain("DIM_ASSET_AUDIO");
      expect(rows[1].textContent).toContain("driver_headshot.png");
      expect(rows[1].textContent).toContain("DIM_ASSET_IMAGE");

      // Close via close button
      const closeBtn = fixture.nativeElement.querySelector(
        "#btn-close-assets-modal",
      );
      closeBtn.click();
      fixture.detectChanges();

      expect(component.showAssetsModal).toBeFalse();
      expect(
        fixture.nativeElement.querySelector("#assets-dialog-backdrop"),
      ).toBeNull();
    });

    it("should close assets modal on backdrop click and stop propagation on card click", () => {
      component.step = "preview";
      component.preview = {
        totalRows: 1,
        validCount: 1,
        conflictCount: 0,
        errorCount: 0,
        importedAssetNames: ["test.wav"],
        detectedAudioDefault: "system",
        rows: [],
      };
      component.showAssetsModal = true;
      fixture.detectChanges();

      const card = fixture.nativeElement.querySelector("#assets-dialog-card");
      expect(card).toBeTruthy();
      const cardClickEvent = new MouseEvent("click", { bubbles: true });
      spyOn(cardClickEvent, "stopPropagation").and.callThrough();
      card.dispatchEvent(cardClickEvent);
      expect(cardClickEvent.stopPropagation).toHaveBeenCalled();
      expect(component.showAssetsModal).toBeTrue();

      const backdrop = fixture.nativeElement.querySelector(
        "#assets-dialog-backdrop",
      );
      backdrop.click();
      expect(component.showAssetsModal).toBeFalse();
    });

    it("should open assets modal from summary step card", () => {
      component.step = "summary";
      component.preview = {
        totalRows: 1,
        validCount: 1,
        conflictCount: 0,
        errorCount: 0,
        importedAssetNames: ["sample_clip.mp3"],
        detectedAudioDefault: "system",
        rows: [],
      };
      component.importResult = {
        success: true,
        importedCount: 1,
        updatedCount: 0,
        skippedCount: 0,
        createdDriverIds: ["d1"],
        messages: [],
      };
      fixture.detectChanges();

      const summaryAssetCard = fixture.nativeElement.querySelector(
        "#summary-assets-card",
      );
      expect(summaryAssetCard).toBeTruthy();

      summaryAssetCard.click();
      fixture.detectChanges();

      expect(component.showAssetsModal).toBeTrue();
      expect(
        fixture.nativeElement.querySelector("#assets-dialog-backdrop"),
      ).toBeTruthy();
    });
  });

  describe("Avatar Thumbnail Display & Fallbacks", () => {
    beforeEach(() => {
      component.preview = createMockPreview();
      component.step = "preview";
      fixture.detectChanges();
    });

    it("should display avatar thumbnail image when avatarUrl is present", () => {
      const rows = fixture.nativeElement.querySelectorAll(
        ".preview-table tbody tr",
      );
      const row1Avatar = rows[0].querySelector(".col-avatar");
      expect(row1Avatar).toBeTruthy();

      const img = row1Avatar.querySelector("img.avatar-thumbnail");
      expect(img).toBeTruthy();
      expect(img.getAttribute("src")).toBe(
        "http://localhost:7070/assets/alice_helmet.png",
      );
      expect(img.getAttribute("alt")).toBe("Alice Walker");

      const text = row1Avatar.querySelector(".avatar-text");
      expect(text.textContent).toContain("/assets/alice_helmet.png");
    });

    it("should display dash when avatarUrl is missing", () => {
      const rows = fixture.nativeElement.querySelectorAll(
        ".preview-table tbody tr",
      );
      const row2Avatar = rows[1].querySelector(".col-avatar");
      expect(row2Avatar.querySelector("img.avatar-thumbnail")).toBeNull();
      expect(row2Avatar.textContent.trim()).toBe("—");
    });

    it("should display broken_image fallback icon when avatar image fails to load", () => {
      const rows = fixture.nativeElement.querySelectorAll(
        ".preview-table tbody tr",
      );
      const img = rows[0].querySelector("img.avatar-thumbnail");
      expect(img).toBeTruthy();

      component.onAvatarError(1);
      fixture.detectChanges();

      expect(component.avatarErrors.has(1)).toBeTrue();
      const row1Avatar = rows[0].querySelector(".col-avatar");
      expect(row1Avatar.querySelector("img.avatar-thumbnail")).toBeNull();

      const fallbackIcon = row1Avatar.querySelector(".avatar-fallback-icon");
      expect(fallbackIcon).toBeTruthy();
      expect(fallbackIcon.textContent.trim()).toBe("broken_image");
    });

    it("should clear avatarErrors when resetState is called", () => {
      component.avatarErrors.add(1);
      expect(component.avatarErrors.size).toBe(1);

      component.resetState();
      expect(component.avatarErrors.size).toBe(0);
    });

    it("should clear avatarErrors when startValidation succeeds", () => {
      component.selectedFile = new File(["test"], "test.csv");
      component.avatarErrors.add(1);
      expect(component.avatarErrors.size).toBe(1);

      const previewRes = createMockPreview();
      mockDataService.validateDriverImport.and.returnValue(of(previewRes));

      component.startValidation();
      expect(component.avatarErrors.size).toBe(0);
    });
  });
});

import { ComponentFixture, TestBed } from "@angular/core/testing";
import { of, throwError } from "rxjs";
import { DataService } from "@app/data.service";
import {
  ClubImportPreview,
  ClubImportResult,
} from "@app/models/club-package.model";
import { TranslationService } from "@app/services/translation.service";

import { ClubImportModalComponent } from "./club-import-modal.component";

// https://github.com/daufderheide/racecoordinator_ai/issues/972
describe("ClubImportModalComponent", () => {
  let fixture: ComponentFixture<ClubImportModalComponent>;
  let component: ClubImportModalComponent;
  let dataService: jasmine.SpyObj<DataService>;

  const preview = (): ClubImportPreview => ({
    formatVersion: 1,
    sourceAppVersion: "1.2.0",
    exportedAt: 1700000000000,
    season: {
      clubId: "c-season",
      name: "Hobby Club 2026",
      packageDrops: 1,
      matchType: "NONE",
      resolution: "CREATE",
      usePackageDrops: true,
    },
    drivers: [
      {
        ref: "d1",
        clubId: "c-dave",
        name: "Dave Jackson",
        matchType: "NAME",
        existingId: "7",
        existingName: "Dave Jackson",
        differences: ["CRI_DIFF_NICKNAME"],
        resolution: "MATCH",
      },
      {
        ref: "d2",
        clubId: "c-abby",
        name: "Abby",
        matchType: "NONE",
        differences: [],
        resolution: "CREATE",
      },
    ],
    tracks: [],
    raceClasses: [],
    raceNights: [
      {
        key: "h1",
        historyId: "h1",
        raceName: "NSR Classics",
        timestamp: 1000,
        driverCount: 3,
        hasHistory: true,
        status: "NEW",
        resolution: "ADD",
      },
      {
        key: "h2",
        historyId: "h2",
        raceName: "NSR Classics",
        timestamp: 2000,
        driverCount: 3,
        hasHistory: true,
        status: "SAME",
        resolution: "SKIP",
      },
    ],
    existing: {
      seasons: [{ id: "3", name: "Old Season" }],
      drivers: [
        { id: "7", name: "Dave Jackson" },
        { id: "8", name: "Gene" },
      ],
    },
    warnings: [],
    packageData: { format: "rc-ai-club-package" },
  });

  beforeEach(async () => {
    dataService = jasmine.createSpyObj("DataService", [
      "previewClubImport",
      "commitClubImport",
    ]);
    await TestBed.configureTestingModule({
      imports: [ClubImportModalComponent],
      providers: [
        { provide: DataService, useValue: dataService },
        {
          provide: TranslationService,
          useValue: {
            translate: (k: string) => k,
            getTranslationsLoaded: () => of(true),
            getCurrentLanguage: () => "en",
          },
        },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(ClubImportModalComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput("visible", true);
    fixture.detectChanges();
  });

  it("should start on the upload step", () => {
    expect(component.step).toBe("upload");
    expect(
      fixture.nativeElement.querySelector("#club-import-dropzone"),
    ).toBeTruthy();
  });

  it("should show the preview after reading a package", () => {
    dataService.previewClubImport.and.returnValue(of(preview()));
    component.loadPreview(new File(["{}"], "club.rcclub.json"));
    fixture.detectChanges();

    expect(component.step).toBe("preview");
    expect(
      fixture.nativeElement.querySelector("#club-import-nights tbody").children
        .length,
    ).toBe(2);
    expect(component.nightsToImport).toBe(1);
    expect(component.countStatus("SAME")).toBe(1);
  });

  it("should show a translated error for a file that isn't a club package", () => {
    dataService.previewClubImport.and.returnValue(
      throwError(() => ({ error: "CRI_ERR_NOT_A_CLUB_PACKAGE" })),
    );
    component.loadPreview(new File(["x"], "x.json"));

    expect(component.step).toBe("upload");
    expect(component.errorMessage).toBe("CRI_ERR_NOT_A_CLUB_PACKAGE");
  });

  it("should switch an item between an existing one and add as new", () => {
    dataService.previewClubImport.and.returnValue(of(preview()));
    component.loadPreview(new File(["{}"], "c.json"));
    const dave = component.preview!.drivers[0];

    component.setTarget("drivers", dave, "new");
    expect(dave.resolution).toBe("CREATE");
    expect(component.targetOf(dave)).toBe("new");

    component.setTarget("drivers", dave, "8");
    expect(dave.resolution).toBe("MATCH");
    expect(dave.existingId).toBe("8");
    expect(dave.existingName).toBe("Gene");

    component.setUpdate(dave, true);
    expect(dave.resolution).toBe("UPDATE");
  });

  it("should let the championship merge into an existing season", () => {
    dataService.previewClubImport.and.returnValue(of(preview()));
    component.loadPreview(new File(["{}"], "c.json"));

    component.setSeasonTarget("3");

    expect(component.preview!.season.resolution).toBe("MERGE");
    expect(component.preview!.season.existingId).toBe("3");
    expect(component.seasonTarget()).toBe("3");
    component.setSeasonTarget("new");
    expect(component.seasonTarget()).toBe("new");
  });

  it("should offer add/skip for new nights and update/skip for known ones", () => {
    const p = preview();
    expect(component.nightOptions(p.raceNights[0])).toEqual(["ADD", "SKIP"]);
    expect(component.nightOptions(p.raceNights[1])).toEqual(["UPDATE", "SKIP"]);
  });

  it("should send the choices on import and show the summary", () => {
    const result = {
      success: true,
      seasonId: "12",
      seasonName: "Hobby Club 2026",
      nightsAdded: 1,
      nightsSkipped: 1,
    } as ClubImportResult;
    dataService.previewClubImport.and.returnValue(of(preview()));
    dataService.commitClubImport.and.returnValue(of(result));
    const emitted: ClubImportResult[] = [];
    component.imported.subscribe((r) => emitted.push(r));
    component.loadPreview(new File(["{}"], "c.json"));
    component.preview!.raceNights[1].resolution = "UPDATE";

    component.commit();
    fixture.detectChanges();

    const sent = dataService.commitClubImport.calls.mostRecent().args[0];
    expect(sent.packageData).toEqual({ format: "rc-ai-club-package" });
    expect(sent.raceNights[1].resolution).toBe("UPDATE");
    expect(component.step).toBe("summary");
    expect(emitted).toEqual([result]);
    expect(
      fixture.nativeElement.querySelector("#club-import-summary"),
    ).toBeTruthy();
  });

  it("should keep the preview when the import fails", () => {
    dataService.previewClubImport.and.returnValue(of(preview()));
    dataService.commitClubImport.and.returnValue(throwError(() => ({})));
    component.loadPreview(new File(["{}"], "c.json"));

    component.commit();

    expect(component.step).toBe("preview");
    expect(component.errorMessage).toBe("CRI_ERR_COMMIT_FAILED");
  });

  it("should reset when closed", () => {
    dataService.previewClubImport.and.returnValue(of(preview()));
    component.loadPreview(new File(["{}"], "c.json"));
    let closed = false;
    component.close.subscribe(() => (closed = true));

    component.onClose();

    expect(closed).toBeTrue();
    expect(component.step).toBe("upload");
    expect(component.preview).toBeNull();
  });
});

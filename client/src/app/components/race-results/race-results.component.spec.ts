import { ChangeDetectorRef, ViewContainerRef } from "@angular/core";
import {
  ComponentFixture,
  discardPeriodicTasks,
  fakeAsync,
  TestBed,
  tick,
} from "@angular/core/testing";
import { DynamicComponentService } from "@app/services/dynamic-component.service";
import { FileSystemService } from "@app/services/file-system.service";
import { LoggerService } from "@app/services/logger.service";

import { DefaultRaceResultsComponent } from "./default-race-results.component";
import { RaceResultsComponent } from "./race-results.component";

describe("RaceResultsComponent", () => {
  let component: RaceResultsComponent;
  let fixture: ComponentFixture<RaceResultsComponent>;
  let mockFileSystemService: jasmine.SpyObj<FileSystemService>;
  let mockContainer: jasmine.SpyObj<ViewContainerRef>;
  let mockDynamicComponentService: jasmine.SpyObj<DynamicComponentService>;
  let mockLoggerService: jasmine.SpyObj<LoggerService>;
  let mockCdr: jasmine.SpyObj<ChangeDetectorRef>;

  beforeEach(async () => {
    mockFileSystemService = jasmine.createSpyObj("FileSystemService", [
      "hasCustomFiles",
      "getCustomFile",
    ]);
    mockContainer = jasmine.createSpyObj("ViewContainerRef", [
      "clear",
      "createComponent",
    ]);
    mockDynamicComponentService = jasmine.createSpyObj(
      "DynamicComponentService",
      ["createDynamicComponent"],
    );
    mockLoggerService = jasmine.createSpyObj("LoggerService", [
      "debug",
      "info",
      "warn",
      "error",
      "log",
    ]);
    mockCdr = jasmine.createSpyObj("ChangeDetectorRef", ["detectChanges"]);

    await TestBed.configureTestingModule({
      providers: [
        { provide: FileSystemService, useValue: mockFileSystemService },
        {
          provide: DynamicComponentService,
          useValue: mockDynamicComponentService,
        },
        { provide: LoggerService, useValue: mockLoggerService },
        { provide: ChangeDetectorRef, useValue: mockCdr },
      ],
      imports: [RaceResultsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(RaceResultsComponent);
    component = fixture.componentInstance;
    component.container = mockContainer;
  });

  afterEach(() => {
    fixture.destroy();
    try {
      discardPeriodicTasks();
    } catch (e) {}
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  describe("Custom UI Loading Logic", () => {
    it("should try to load from 'race-results' subfolder first", fakeAsync(() => {
      mockFileSystemService.hasCustomFiles.and.callFake(
        (file?: string, subfolder?: string) => {
          if (subfolder === "race-results") return Promise.resolve(true);
          return Promise.resolve(false);
        },
      );
      mockFileSystemService.getCustomFile.and.returnValue(
        Promise.resolve("<html></html>"),
      );
      mockDynamicComponentService.createDynamicComponent.and.returnValue(
        class {},
      );
      mockContainer.createComponent.and.returnValue({ instance: {} } as any);

      component.ngOnInit();
      tick();

      expect(mockFileSystemService.hasCustomFiles).toHaveBeenCalledWith(
        "race-results.component.html",
        "race-results",
      );
      expect(mockFileSystemService.getCustomFile).toHaveBeenCalledWith(
        "race-results.component.html",
        "race-results",
      );
    }));

    it("should fall back to root custom folder if subfolder missing", fakeAsync(() => {
      mockFileSystemService.hasCustomFiles.and.callFake(
        (file?: string, subfolder?: string) => {
          if (subfolder === "race-results") return Promise.resolve(false);
          if (!subfolder) return Promise.resolve(true);
          return Promise.resolve(false);
        },
      );
      mockFileSystemService.getCustomFile.and.returnValue(
        Promise.resolve("<html></html>"),
      );
      mockDynamicComponentService.createDynamicComponent.and.returnValue(
        class {},
      );
      mockContainer.createComponent.and.returnValue({ instance: {} } as any);

      component.ngOnInit();
      tick();

      expect(mockFileSystemService.hasCustomFiles).toHaveBeenCalledWith(
        "race-results.component.html",
        "race-results",
      );
      expect(mockFileSystemService.hasCustomFiles).toHaveBeenCalledWith(
        "race-results.component.html",
      );
      expect(mockFileSystemService.getCustomFile).toHaveBeenCalledWith(
        "race-results.component.html",
        undefined,
      );
    }));

    it("should load default component if both custom locations missing", fakeAsync(() => {
      mockFileSystemService.hasCustomFiles.and.returnValue(
        Promise.resolve(false),
      );
      mockContainer.createComponent.and.returnValue({
        instance: {},
      } as any);

      component.ngOnInit();
      tick();

      expect(mockFileSystemService.hasCustomFiles).toHaveBeenCalledWith(
        "race-results.component.html",
        "race-results",
      );
      expect(mockFileSystemService.hasCustomFiles).toHaveBeenCalledWith(
        "race-results.component.html",
      );
      expect(mockContainer.createComponent).toHaveBeenCalledWith(
        DefaultRaceResultsComponent as any,
      );
    }));

    it("should fetch default stylesheet if custom CSS is not found", fakeAsync(() => {
      mockFileSystemService.hasCustomFiles.and.callFake(
        (file?: string, subfolder?: string) => {
          if (subfolder === "race-results") return Promise.resolve(true);
          return Promise.resolve(false);
        },
      );
      mockFileSystemService.getCustomFile.and.callFake(
        (filename: string, _subfolder?: string) => {
          if (filename === "race-results.component.html") {
            return Promise.resolve("<html></html>");
          }
          if (filename === "race-results.component.css") {
            return Promise.reject(new Error("File not found"));
          }
          return Promise.resolve("");
        },
      );

      const mockFetchResponse = {
        ok: true,
        text: () => Promise.resolve(".default-style {}"),
      };
      spyOn(window, "fetch").and.returnValue(
        Promise.resolve(mockFetchResponse as any),
      );
      mockDynamicComponentService.createDynamicComponent.and.returnValue(
        class {},
      );
      mockContainer.createComponent.and.returnValue({ instance: {} } as any);

      component.ngOnInit();
      tick();

      expect(window.fetch).toHaveBeenCalledWith(
        "/assets/default-styles/race-results/default-race-results.component.css",
      );
      expect(
        mockDynamicComponentService.createDynamicComponent,
      ).toHaveBeenCalledWith(
        jasmine.any(Function),
        "<html></html>",
        ".default-style {}",
        jasmine.any(String),
      );
    }));
  });
});

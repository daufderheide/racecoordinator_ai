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

import { DefaultHeatResultsComponent } from "./default-heat-results.component";
import { HeatResultsComponent } from "./heat-results.component";

describe("HeatResultsComponent Wrapper", () => {
  let component: HeatResultsComponent;
  let fixture: ComponentFixture<HeatResultsComponent>;
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
      imports: [HeatResultsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(HeatResultsComponent);
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

  it("should load the default component if no custom files exist", fakeAsync(() => {
    mockFileSystemService.hasCustomFiles.and.returnValue(
      Promise.resolve(false),
    );
    mockContainer.createComponent.and.returnValue({ instance: {} } as any);

    component.ngOnInit();
    tick();

    expect(mockContainer.createComponent).toHaveBeenCalledWith(
      DefaultHeatResultsComponent as any,
    );
  }));

  it("should load the custom component if custom html exists", fakeAsync(() => {
    mockFileSystemService.hasCustomFiles.and.returnValue(Promise.resolve(true));
    mockFileSystemService.getCustomFile.and.returnValue(
      Promise.resolve("content"),
    );
    mockDynamicComponentService.createDynamicComponent.and.returnValue(
      Promise.resolve(class {} as any),
    );
    mockContainer.createComponent.and.returnValue({ instance: {} } as any);

    component.ngOnInit();
    tick();

    expect(
      mockDynamicComponentService.createDynamicComponent,
    ).toHaveBeenCalled();
    expect(mockContainer.createComponent).toHaveBeenCalled();
  }));
});

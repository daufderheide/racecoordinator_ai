import { TestBed } from "@angular/core/testing";
import { of, Subject, throwError } from "rxjs";
import { DataService } from "@app/data.service";
import { CustomUI } from "@app/models/custom-ui";
import { LoggerService } from "@app/services/logger.service";

import { CustomUiService } from "./custom-ui.service";

describe("CustomUiService", () => {
  let service: CustomUiService;
  let dataServiceSpy: jasmine.SpyObj<DataService>;
  let loggerSpy: jasmine.SpyObj<LoggerService>;

  const mockCustomUIs: CustomUI[] = [
    {
      entity_id: "default_ui_layout_rc_ai",
      name: "Default UI Layout",
      is_default: true,
      layoutJson: "[]",
    },
    {
      entity_id: "custom-layout-1",
      name: "My Custom Layout",
      is_default: false,
      layoutJson: '[{"type":"lane-view"}]',
    },
  ];

  beforeEach(() => {
    const dataSpy = jasmine.createSpyObj("DataService", ["getCustomUIs"]);
    dataSpy.socketConnected$ = of(true);
    const lSpy = jasmine.createSpyObj("LoggerService", [
      "info",
      "warn",
      "error",
      "debug",
      "log",
    ]);

    TestBed.configureTestingModule({
      providers: [
        CustomUiService,
        { provide: DataService, useValue: dataSpy },
        { provide: LoggerService, useValue: lSpy },
      ],
    });

    service = TestBed.inject(CustomUiService);
    dataServiceSpy = TestBed.inject(DataService) as jasmine.SpyObj<DataService>;
    loggerSpy = TestBed.inject(LoggerService) as jasmine.SpyObj<LoggerService>;

    dataServiceSpy.getCustomUIs.and.returnValue(of(mockCustomUIs));
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should initialize and load custom UIs and emit on customUIs$", async () => {
    let emittedUIs: CustomUI[] = [];
    service.customUIs$.subscribe((uis) => {
      emittedUIs = uis;
    });

    await service.initialize();
    expect(service.isInitialized()).toBeTrue();
    expect(service.getCustomUIs().length).toBe(2);
    expect(service.getCustomUI("custom-layout-1")?.name).toBe(
      "My Custom Layout",
    );
    expect(service.getCustomUI("non-existent")).toBeUndefined();
    expect(emittedUIs.length).toBe(2);
    expect(emittedUIs[1].name).toBe("My Custom Layout");
  });

  it("should handle initialization error when server is offline (status 0)", async () => {
    dataServiceSpy.getCustomUIs.and.returnValue(
      throwError(() => ({ status: 0, message: "Offline" })),
    );

    await service.initialize();
    expect(service.isInitialized()).toBeTrue();
    expect(service.getCustomUIs().length).toBe(0);
    expect(loggerSpy.debug).toHaveBeenCalled();
  });

  it("should handle initialization error when server returns error (status 500)", async () => {
    dataServiceSpy.getCustomUIs.and.returnValue(
      throwError(() => ({ status: 500, message: "Internal error" })),
    );

    await service.initialize();
    expect(service.isInitialized()).toBeTrue();
    expect(service.getCustomUIs().length).toBe(0);
    expect(loggerSpy.error).toHaveBeenCalled();
  });

  it("should auto-initialize custom UIs when socketConnected$ emits true", () => {
    const socketSubject = new Subject<boolean>();
    const customDataSpy = jasmine.createSpyObj("DataService", ["getCustomUIs"]);
    customDataSpy.socketConnected$ = socketSubject.asObservable();
    customDataSpy.getCustomUIs.and.returnValue(of(mockCustomUIs));

    const customLoggerSpy = jasmine.createSpyObj("LoggerService", [
      "info",
      "error",
      "debug",
      "log",
    ]);

    spyOn(CustomUiService.prototype, "initialize").and.callThrough();

    new CustomUiService(customDataSpy as any, customLoggerSpy as any);

    expect(CustomUiService.prototype.initialize).not.toHaveBeenCalled();

    socketSubject.next(true);

    expect(CustomUiService.prototype.initialize).toHaveBeenCalled();
  });
});

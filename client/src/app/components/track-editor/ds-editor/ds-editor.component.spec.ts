import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from "@angular/core/testing";
import { FormsModule } from "@angular/forms";
import { of, Subject, throwError } from "rxjs";
import {
  CustomOptionComponent,
  CustomSelectComponent,
} from "@app/components/shared/custom-select/custom-select.component";
import { DataService } from "@app/data.service";
import { DsType } from "@app/models/track";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { InterfaceStatus } from "@app/proto/antigravity";
import { HelpLinkService } from "@app/services/help-link.service";
import { LoggerService } from "@app/services/logger.service";
import { TranslationService } from "@app/services/translation.service";
import { TranslationServiceMock } from "@app/testing/translation-service.mock";

import { DsEditorComponent } from "./ds-editor.component";

describe("DsEditorComponent", () => {
  let component: DsEditorComponent;
  let fixture: ComponentFixture<DsEditorComponent>;
  let mockDataService: any;
  let mockLogger: any;
  let mockHelpLinkService: jasmine.SpyObj<HelpLinkService>;
  let getSerialPortsSubject: Subject<string[]>;
  let getInterfaceEventsSubject: Subject<any>;

  beforeEach(async () => {
    getSerialPortsSubject = new Subject<string[]>();
    getInterfaceEventsSubject = new Subject<any>();
    mockHelpLinkService = jasmine.createSpyObj("HelpLinkService", ["openHelp"]);

    mockDataService = {
      getSerialPorts: jasmine
        .createSpy("getSerialPorts")
        .and.returnValue(getSerialPortsSubject),
      getInterfaceEvents: jasmine
        .createSpy("getInterfaceEvents")
        .and.returnValue(getInterfaceEventsSubject),
      updateInterfaceConfig: jasmine
        .createSpy("updateInterfaceConfig")
        .and.returnValue(of({ success: true })),
    };

    mockLogger = jasmine.createSpyObj("LoggerService", [
      "info",
      "warn",
      "error",
    ]);

    await TestBed.configureTestingModule({
      imports: [
        DsEditorComponent,
        FormsModule,
        TranslatePipe,
        CustomSelectComponent,
        CustomOptionComponent,
      ],
      providers: [
        { provide: DataService, useValue: mockDataService },
        { provide: TranslationService, useClass: TranslationServiceMock },
        { provide: LoggerService, useValue: mockLogger },
        { provide: HelpLinkService, useValue: mockHelpLinkService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DsEditorComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput("config", {
      name: "DS Box",
      commPort: "COM3",
      type: DsType.DS_300,
      baudRate: 57600,
    });
    fixture.componentRef.setInput("interfaceIndex", 1);
    fixture.componentRef.setInput("isEditMode", true);
    fixture.detectChanges();
  });

  it("should create and initialize ports and default state", () => {
    expect(component).toBeTruthy();
    expect(component.status).toBe("DISCONNECTED");
    expect(mockDataService.getSerialPorts).toHaveBeenCalled();

    getSerialPortsSubject.next(["COM1", "COM3"]);
    expect(component.serialPorts).toEqual(["COM1", "COM3"]);
  });

  it("should default type to DS_300 if type is undefined or null", () => {
    fixture.componentRef.setInput("config", {
      name: "DS Box",
      commPort: "COM3",
    } as any);
    component.ngOnInit();
    expect(component.config().type).toBe(DsType.DS_300);
    expect(component.config().baudRate).toBe(57600);
  });

  it("should calculate correct baud rate for each DS type", () => {
    fixture.componentRef.setInput("config", {
      name: "DS",
      commPort: "COM1",
      type: DsType.DS_030,
    });
    expect(component.baudRate).toBe(4800);

    fixture.componentRef.setInput("config", {
      name: "DS",
      commPort: "COM1",
      type: DsType.DS_200,
    });
    expect(component.baudRate).toBe(4800);

    fixture.componentRef.setInput("config", {
      name: "DS",
      commPort: "COM1",
      type: DsType.DS_200B,
    });
    expect(component.baudRate).toBe(57600);

    fixture.componentRef.setInput("config", {
      name: "DS",
      commPort: "COM1",
      type: DsType.DS_300,
    });
    expect(component.baudRate).toBe(57600);

    fixture.componentRef.setInput("config", {
      name: "DS",
      commPort: "COM1",
      type: DsType.DS_300RC,
    });
    expect(component.baudRate).toBe(57600);
  });

  it("should log error if loadSerialPorts fails", () => {
    mockDataService.getSerialPorts.and.returnValue(
      throwError(() => new Error("Serial port error")),
    );
    component["loadSerialPorts"]();
    expect(mockLogger.error).toHaveBeenCalledWith(
      "Failed to load serial ports for DS interface",
      jasmine.any(Error),
    );
  });

  it("should toggle section expanded states", () => {
    expect(component.sectionsExpanded.ds).toBeTrue();
    component.toggleSection("ds");
    expect(component.sectionsExpanded.ds).toBeFalse();

    expect(component.sectionsExpanded.main).toBeTrue();
    component.toggleSection("main");
    expect(component.sectionsExpanded.main).toBeFalse();

    expect(component.sectionsExpanded.lanes).toBeTrue();
    component.toggleSection("lanes");
    expect(component.sectionsExpanded.lanes).toBeFalse();
  });

  it("should ensure all sections expanded", () => {
    component.sectionsExpanded.ds = false;
    component.sectionsExpanded.main = false;
    component.sectionsExpanded.lanes = false;

    component.ensureSectionsExpanded();
    expect(component.sectionsExpanded.ds).toBeTrue();
    expect(component.sectionsExpanded.main).toBeTrue();
    expect(component.sectionsExpanded.lanes).toBeTrue();
  });

  it("should emit remove on onRemove", () => {
    spyOn(component.remove, "emit");
    const mockEvent = jasmine.createSpyObj("Event", ["stopPropagation"]);
    component.onRemove(mockEvent);

    expect(mockEvent.stopPropagation).toHaveBeenCalled();
    expect(component.remove.emit).toHaveBeenCalled();
  });

  it("should handle onPortChange, update backend config, and emit change", () => {
    spyOn(component.change, "emit");
    component.onPortChange("COM4");

    expect(component.config().commPort).toBe("COM4");
    expect(mockDataService.updateInterfaceConfig).toHaveBeenCalledWith(
      null,
      1,
      null,
      component.config(),
    );
    expect(component.change.emit).toHaveBeenCalled();
  });

  it("should handle onTypeChange with number, update baudRate, update backend, and emit change", () => {
    spyOn(component.change, "emit");
    component.onTypeChange(DsType.DS_030);

    expect(component.config().type).toBe(DsType.DS_030);
    expect(component.config().baudRate).toBe(4800);
    expect(mockDataService.updateInterfaceConfig).toHaveBeenCalledWith(
      null,
      1,
      null,
      component.config(),
    );
    expect(component.change.emit).toHaveBeenCalled();
  });

  it("should handle onTypeChange with string value", () => {
    spyOn(component.change, "emit");
    component.onTypeChange("1");

    expect(component.config().type).toBe(1);
    expect(component.config().baudRate).toBe(4800);
    expect(component.change.emit).toHaveBeenCalled();
  });

  it("should log error if updateInterfaceConfig fails", () => {
    mockDataService.updateInterfaceConfig.and.returnValue(
      throwError(() => new Error("Update failed")),
    );
    component["updateBackendConfig"]();
    expect(mockLogger.error).toHaveBeenCalledWith(
      "Failed to update DS interface config",
      jasmine.any(Error),
    );
  });

  it("should update status when event matches this interface index", () => {
    getInterfaceEventsSubject.next({
      status: {
        interfaceIndex: 1,
        status: InterfaceStatus.CONNECTED,
      },
    });
    expect(component.status).toBe("CONNECTED");

    getInterfaceEventsSubject.next({
      status: {
        interfaceIndex: 1,
        status: InterfaceStatus.NO_DATA,
      },
    });
    expect(component.status).toBe("NO_DATA");

    getInterfaceEventsSubject.next({
      status: {
        interfaceIndex: 1,
        status: InterfaceStatus.DISCONNECTED,
      },
    });
    expect(component.status).toBe("DISCONNECTED");
  });

  it("should ignore status events for other interface indexes", () => {
    getInterfaceEventsSubject.next({
      status: {
        interfaceIndex: 0,
        status: InterfaceStatus.CONNECTED,
      },
    });
    expect(component.status).toBe("DISCONNECTED");
  });

  it("should trigger lane activity on lap event, set status to CONNECTED, and revert to grey after 1 second", fakeAsync(() => {
    expect(component.laneBadges[2]).toBeFalse();
    getInterfaceEventsSubject.next({
      lap: {
        interfaceIndex: 1,
        lane: 2,
        lapTime: 5.432,
      },
    });

    expect(component.laneBadges[2]).toBeTrue();
    expect(component.status).toBe("CONNECTED");

    // Advance 500ms: still active (green)
    tick(500);
    expect(component.laneBadges[2]).toBeTrue();

    // Advance remaining 500ms (1000ms total): reverts to grey
    tick(500);
    expect(component.laneBadges[2]).toBeFalse();
  }));

  it("should ignore lap events for other interface indexes", fakeAsync(() => {
    getInterfaceEventsSubject.next({
      lap: {
        interfaceIndex: 0,
        lane: 2,
        lapTime: 5.432,
      },
    });

    expect(component.laneBadges[2]).toBeFalse();
  }));

  it("should return guide steps and expand sections onEnter", () => {
    const steps = component.getHelpSteps();
    expect(steps.length).toBe(5);
    expect(steps[0].selector).toBe("#ds-editor-1");
    expect(steps[0].title).toBe("TE_HELP_DS_TITLE");
    expect(steps[1].selector).toBe("#commPort-1");
    expect(steps[2].selector).toBe("#ds-status-badge-1");
    expect(steps[3].selector).toBe("#dsType-1");
    expect(steps[4].selector).toBe("#ds-lanes-1");
    expect(steps[4].title).toBe("TE_HELP_DS_LANES_TITLE");

    component.sectionsExpanded.ds = false;
    component.sectionsExpanded.main = false;
    component.sectionsExpanded.lanes = false;

    steps[0].onEnter!();
    expect(component.sectionsExpanded.ds).toBeTrue();
    expect(component.sectionsExpanded.main).toBeTrue();
    expect(component.sectionsExpanded.lanes).toBeTrue();
  });

  it("should open help center with track-editor and ds-interface anchor", () => {
    const mockEvent = jasmine.createSpyObj("Event", [
      "preventDefault",
      "stopPropagation",
    ]);
    component.openHelpCenter(mockEvent);

    expect(mockEvent.preventDefault).toHaveBeenCalled();
    expect(mockEvent.stopPropagation).toHaveBeenCalled();
    expect(mockHelpLinkService.openHelp).toHaveBeenCalledWith(
      "track-editor",
      "ds-interface",
    );
  });

  it("should render under-development badge in the header", () => {
    fixture.detectChanges();
    const badge = fixture.nativeElement.querySelector(
      ".interface-badge.under-development-badge",
    );
    expect(badge).toBeTruthy();
  });

  it("should trigger openHelpCenter when clicking the learn-more link", () => {
    fixture.detectChanges();
    spyOn(component, "openHelpCenter").and.callFake((e) => e?.preventDefault());
    const link = fixture.nativeElement.querySelector(".learn-more-link");
    expect(link).toBeTruthy();
    link.click();
    expect(component.openHelpCenter).toHaveBeenCalled();
  });
});

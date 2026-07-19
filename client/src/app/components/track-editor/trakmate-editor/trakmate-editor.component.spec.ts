import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from "@angular/core/testing";
import { FormsModule } from "@angular/forms";
import { of, Subject } from "rxjs";
import { DataService } from "@app/data.service";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { InterfaceStatus, PinBehavior } from "@app/proto/antigravity";
import { TranslationService } from "@app/services/translation.service";
import { TranslationServiceMock } from "@app/testing/translation-service.mock";

import { TrakmateEditorComponent } from "./trakmate-editor.component";

describe("TrakmateEditorComponent", () => {
  let component: TrakmateEditorComponent;
  let fixture: ComponentFixture<TrakmateEditorComponent>;
  let mockDataService: any;
  let getSerialPortsSubject: Subject<string[]>;
  let getInterfaceStatusSubject: Subject<any>;
  let getInterfaceEventsSubject: Subject<any>;

  beforeEach(async () => {
    getSerialPortsSubject = new Subject<string[]>();
    getInterfaceStatusSubject = new Subject<any>();
    getInterfaceEventsSubject = new Subject<any>();

    mockDataService = {
      getSerialPorts: jasmine
        .createSpy("getSerialPorts")
        .and.returnValue(getSerialPortsSubject),
      getInterfaceStatus: jasmine
        .createSpy("getInterfaceStatus")
        .and.returnValue(getInterfaceStatusSubject),
      getInterfaceEvents: jasmine
        .createSpy("getInterfaceEvents")
        .and.returnValue(getInterfaceEventsSubject),
      setMainPower: jasmine.createSpy("setMainPower"),
      setLanePower: jasmine.createSpy("setLanePower"),
    };

    await TestBed.configureTestingModule({
      imports: [TrakmateEditorComponent, FormsModule, TranslatePipe],
      providers: [
        { provide: DataService, useValue: mockDataService },
        { provide: TranslationService, useClass: TranslationServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TrakmateEditorComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput("config", {
      name: "Trakmate 1",
      commPort: "COM1",
      lapPinBehaviors: [
        PinBehavior.BEHAVIOR_LAP_BASE,
        PinBehavior.BEHAVIOR_LAP_BASE + 1,
      ],
      numLanes: 2,
      normallyClosedRelays: true,
      normallyClosedLaneSensors: false,
      useIR: false,
      debounce: 1,
      hasPerLaneRelays: false,
      lapPinPitBehavior: 0,
    });
    fixture.componentRef.setInput("lanes", 2);
    fixture.componentRef.setInput("interfaceIndex", 0);
    fixture.detectChanges();
  });

  it("should create and restore expanded state from local storage", () => {
    spyOn(localStorage, "getItem").and.returnValue(
      JSON.stringify({
        trakmate: true,
        main: false,
        rw: false,
      }),
    );
    component.ngOnInit();
    expect(component).toBeTruthy();
    expect(component.sectionsExpanded.main).toBeFalse();
    expect(component.sectionsExpanded.rw).toBeFalse();
  });

  it("should toggle main config section and save to local storage", () => {
    spyOn(localStorage, "setItem");
    expect(component.sectionsExpanded.main).toBeTrue();
    component.toggleSection("main");
    expect(component.sectionsExpanded.main).toBeFalse();
    expect(localStorage.setItem).toHaveBeenCalledWith(
      `rc.trakmate-editor.sections.0`,
      jasmine.any(String),
    );
  });

  it("should emit change on config change", () => {
    spyOn(component.change, "emit");
    component.onConfigChange();
    expect(component.change.emit).toHaveBeenCalled();
  });

  it("should emit remove on remove click", () => {
    spyOn(component.remove, "emit");
    component.onRemove();
    expect(component.remove.emit).toHaveBeenCalled();
  });
  it("should update status on interface status event", () => {
    getInterfaceEventsSubject.next({
      status: { interfaceIndex: 0, status: InterfaceStatus.CONNECTED },
    });
    expect(component.status).toBe("CONNECTED");

    getInterfaceEventsSubject.next({
      status: { interfaceIndex: 0, status: InterfaceStatus.NO_DATA },
    });
    expect(component.status).toBe("NO_DATA");

    getInterfaceEventsSubject.next({
      status: { interfaceIndex: 0, status: InterfaceStatus.DISCONNECTED },
    });
    expect(component.status).toBe("DISCONNECTED");
  });

  it("should update readBadges on lap event", fakeAsync(() => {
    expect(component.readBadges[2]).toBeFalse();

    getInterfaceEventsSubject.next({
      lap: { interfaceIndex: 0, interfaceId: 2 },
    });
    expect(component.readBadges[2]).toBeTrue();

    tick(500);
    expect(component.readBadges[2]).toBeFalse();
  }));

  it("should update readBadges on segment event", fakeAsync(() => {
    expect(component.readBadges[1]).toBeFalse();

    getInterfaceEventsSubject.next({
      segment: { interfaceIndex: 0, interfaceId: 1 },
    });
    expect(component.readBadges[1]).toBeTrue();

    tick(500);
    expect(component.readBadges[1]).toBeFalse();
  }));

  it("should update readBadges on digitalPin event when tripped", fakeAsync(() => {
    expect(component.readBadges[3]).toBeFalse();

    // normallyClosedLaneSensors is false in test config, so state 0 is a trip
    getInterfaceEventsSubject.next({
      digitalPin: { interfaceIndex: 0, pin: 3, state: 0 },
    });
    expect(component.readBadges[3]).toBeTrue();

    tick(500);
    expect(component.readBadges[3]).toBeFalse();
  }));

  it("should not update readBadges on digitalPin event when not tripped", fakeAsync(() => {
    expect(component.readBadges[3]).toBeFalse();

    // normallyClosedLaneSensors is false in test config, so state 1 is NOT a trip
    getInterfaceEventsSubject.next({
      digitalPin: { interfaceIndex: 0, pin: 3, state: 1 },
    });
    expect(component.readBadges[3]).toBeFalse();
  }));

  it("should update callbuttonStatus on callbutton event with explicit interfaceIndex", fakeAsync(() => {
    expect(component.callbuttonStatus).toBeFalse();

    getInterfaceEventsSubject.next({
      callbutton: { interfaceIndex: 0 },
    });
    expect(component.callbuttonStatus).toBeTrue();

    tick(500);
    expect(component.callbuttonStatus).toBeFalse();
  }));

  it("should update callbuttonStatus on callbutton event with undefined interfaceIndex defaulting to 0", fakeAsync(() => {
    expect(component.callbuttonStatus).toBeFalse();

    // Protobuf JSON serialization omits zero values.
    // Ensure that an omitted interfaceIndex defaults to 0 and correctly matches this interface.
    getInterfaceEventsSubject.next({
      callbutton: {},
    });
    expect(component.callbuttonStatus).toBeTrue();

    tick(500);
    expect(component.callbuttonStatus).toBeFalse();
  }));

  it("should toggle master relay and call dataService.setMainPower", () => {
    mockDataService.setMainPower.and.returnValue(of({ success: true }));
    expect(component.mainRelayStatus).toBeFalse();

    component.toggleMasterRelay();

    expect(component.mainRelayStatus).toBeTrue();
    expect(mockDataService.setMainPower).toHaveBeenCalledWith(true);

    component.toggleMasterRelay();

    expect(component.mainRelayStatus).toBeFalse();
    expect(mockDataService.setMainPower).toHaveBeenCalledWith(false);
  });

  it("should toggle lane relay and call dataService.setLanePower", () => {
    mockDataService.setLanePower.and.returnValue(of({ success: true }));
    expect(component.relayStatuses[0]).toBeFalse();

    component.toggleLaneRelay(0);

    expect(component.relayStatuses[0]).toBeTrue();
    // 1-based indexing for lane
    expect(mockDataService.setLanePower).toHaveBeenCalledWith(1, true);

    component.toggleLaneRelay(0);

    expect(component.relayStatuses[0]).toBeFalse();
    expect(mockDataService.setLanePower).toHaveBeenCalledWith(1, false);
  });
});

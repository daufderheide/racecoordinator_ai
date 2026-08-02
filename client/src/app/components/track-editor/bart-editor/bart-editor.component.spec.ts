import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from "@angular/core/testing";
import { FormsModule } from "@angular/forms";
import { Subject } from "rxjs";
import { DataService } from "@app/data.service";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { InterfaceStatus, PinBehavior } from "@app/proto/antigravity";
import { LoggerService } from "@app/services/logger.service";
import { TranslationService } from "@app/services/translation.service";
import { TranslationServiceMock } from "@app/testing/translation-service.mock";

import { BartEditorComponent } from "./bart-editor.component";

describe("BartEditorComponent", () => {
  let component: BartEditorComponent;
  let fixture: ComponentFixture<BartEditorComponent>;
  let mockDataService: any;
  let getInterfaceEventsSubject: Subject<any>;

  beforeEach(async () => {
    getInterfaceEventsSubject = new Subject<any>();

    mockDataService = {
      getInterfaceEvents: jasmine
        .createSpy("getInterfaceEvents")
        .and.returnValue(getInterfaceEventsSubject),
    };

    await TestBed.configureTestingModule({
      imports: [BartEditorComponent, FormsModule, TranslatePipe],
      providers: [
        { provide: DataService, useValue: mockDataService },
        { provide: TranslationService, useClass: TranslationServiceMock },
        {
          provide: LoggerService,
          useValue: jasmine.createSpyObj("LoggerService", [
            "info",
            "warn",
            "error",
            "debug",
          ]),
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(BartEditorComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput("config", {
      deviceName: "BART_0001",
      deviceAddress: "AA:BB:CC:DD:EE:FF",
      minLapMs: 1000,
      debounce: 1,
      lapPinBehaviors: [
        PinBehavior.BEHAVIOR_LAP_BASE,
        PinBehavior.BEHAVIOR_LAP_BASE + 1,
        PinBehavior.BEHAVIOR_LAP_BASE + 2,
        PinBehavior.BEHAVIOR_LAP_BASE + 3,
      ],
      lapPinPitBehavior: 3,
    });
    fixture.componentRef.setInput("lanes", 4);
    fixture.componentRef.setInput("interfaceIndex", 0);
    fixture.detectChanges();
  });

  it("should create and initialize default section states", () => {
    expect(component).toBeTruthy();
    expect(component.sectionsExpanded.bart).toBeTrue();
    expect(component.sectionsExpanded.main).toBeTrue();
    expect(component.sectionsExpanded.rw).toBeTrue();
  });

  it("should toggle sections when toggleSection is called", () => {
    expect(component.sectionsExpanded.main).toBeTrue();
    component.toggleSection("main");
    expect(component.sectionsExpanded.main).toBeFalse();
  });

  it("should emit change event when onConfigChange is called", () => {
    spyOn(component.change, "emit");
    component.onConfigChange();
    expect(component.change.emit).toHaveBeenCalled();
  });

  it("should emit remove event when onRemove is called", () => {
    spyOn(component.remove, "emit");
    component.onRemove();
    expect(component.remove.emit).toHaveBeenCalled();
  });

  it("should update status property on interface status event", () => {
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

  it("should update readBadges on lap event and reset after 1500ms timeout", fakeAsync(() => {
    expect(component.readBadges[1]).toBeFalse();

    getInterfaceEventsSubject.next({
      lap: { interfaceIndex: 0, interfaceId: 1 },
    });
    expect(component.readBadges[1]).toBeTrue();

    tick(1500);
    expect(component.readBadges[1]).toBeFalse();
  }));

  it("should update readBadges on segment event", fakeAsync(() => {
    expect(component.readBadges[2]).toBeFalse();

    getInterfaceEventsSubject.next({
      segment: { interfaceIndex: 0, interfaceId: 2 },
    });
    expect(component.readBadges[2]).toBeTrue();

    tick(1500);
    expect(component.readBadges[2]).toBeFalse();
  }));

  it("should update readBadges on digitalPin event", fakeAsync(() => {
    expect(component.readBadges[0]).toBeFalse();

    getInterfaceEventsSubject.next({
      digitalPin: { interfaceIndex: 0, pin: 0 },
    });
    expect(component.readBadges[0]).toBeTrue();

    tick(1500);
    expect(component.readBadges[0]).toBeFalse();
  }));

  it("should emit change event when behavior in lapPinBehaviors is modified", () => {
    spyOn(component.change, "emit");
    component.config().lapPinBehaviors[0] = PinBehavior.BEHAVIOR_PIT_IN_BASE;
    component.onConfigChange();

    expect(component.config().lapPinBehaviors[0]).toBe(
      PinBehavior.BEHAVIOR_PIT_IN_BASE,
    );
    expect(component.change.emit).toHaveBeenCalled();
  });
});

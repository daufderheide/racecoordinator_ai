import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FormsModule } from "@angular/forms";
import { Subject } from "rxjs";
import { DataService } from "@app/data.service";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { PinBehavior } from "@app/proto/antigravity";
import { TranslationService } from "@app/services/translation.service";
import { TranslationServiceMock } from "@app/testing/translation-service.mock";

import { TrakmateEditorComponent } from "./trakmate-editor.component";

describe("TrakmateEditorComponent", () => {
  let component: TrakmateEditorComponent;
  let fixture: ComponentFixture<TrakmateEditorComponent>;
  let mockDataService: any;
  let getSerialPortsSubject: Subject<string[]>;
  let getInterfaceStatusSubject: Subject<any[]>;
  let getInterfaceEventsSubject: Subject<any[]>;

  beforeEach(async () => {
    getSerialPortsSubject = new Subject<string[]>();
    getInterfaceStatusSubject = new Subject<any[]>();
    getInterfaceEventsSubject = new Subject<any[]>();

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
});

import { Pipe, PipeTransform } from "@angular/core";
import { Component, EventEmitter, Input, Output } from "@angular/core";
import {
  ComponentFixture,
  discardPeriodicTasks,
  fakeAsync,
  TestBed,
  tick,
} from "@angular/core/testing";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { BehaviorSubject, of } from "rxjs";
import { AnalyticsService } from "src/app/analytics.service";
import { DataService } from "src/app/data.service";
import { ConnectionMonitorService } from "src/app/services/connection-monitor.service";
import { HelpService } from "src/app/services/help.service";
import { TranslationService } from "src/app/services/translation.service";

import { DriverEditorComponent } from "./driver-editor.component";

// Mock Child Components
@Component({
  selector: "app-back-button",
  template: "",
  imports: [FormsModule],
})
class MockBackButtonComponent {
  @Input() route: string | null = null;
  @Input() queryParams: any = {};
  @Input() label: string = "";
  @Input() confirm: boolean = false;
  @Input() confirmTitle: string = "";
  @Input() confirmMessage: string = "";
}

@Component({
  selector: "app-audio-selector",
  template: "",
  imports: [FormsModule],
})
class MockAudioSelectorComponent {
  @Input() label: string = "";
  @Input() type: any;
  @Output() typeChange = new EventEmitter<any>();
  @Input() url: any;
  @Output() urlChange = new EventEmitter<any>();
  @Input() text: any;
  @Output() textChange = new EventEmitter<any>();
  @Input() assets: any[] = [];
  @Input() backButtonRoute: string | null = null;
  @Input() backButtonQueryParams: any = {};
  @Input() context: any;
}

@Component({
  selector: "app-image-selector",
  template: "",
  imports: [FormsModule],
})
class MockImageSelectorComponent {
  @Input() label?: string;
  @Input() imageUrl?: string;
  @Input() assets: any[] = [];
  @Input() size?: string;
  @Output() imageUrlChange = new EventEmitter<string>();
  @Output() uploadStarted = new EventEmitter<void>();
  @Output() uploadFinished = new EventEmitter<void>();
}

@Component({
  selector: "app-item-selector",
  template: "",
  imports: [FormsModule],
})
class MockItemSelectorComponent {
  @Input() items: any[] = [];
  @Input() visible: boolean = false;
  @Output() select = new EventEmitter<any>();
  @Output() close = new EventEmitter<void>();
  @Input() itemType: string = "image";
  @Input() backButtonRoute: string | null = null;
  @Input() backButtonQueryParams: any = {};
  @Input() title: string = "";
}

@Component({
  selector: "app-undo-redo-controls",
  template: "",
  imports: [FormsModule],
})
class MockUndoRedoControlsComponent {
  @Input() manager: any;
}

@Component({
  selector: "app-editor-title",
  template: "",
  imports: [FormsModule],
})
class MockEditorTitleComponent {
  @Input() titleKey: string = "";
  @Input() backRoute: string = "";
  @Input() backConfirm: boolean = false;
  @Input() backQueryParams: any = {};
  @Input() backConfirmTitle: string = "";
  @Input() backConfirmMessage: string = "";
  @Input() undoManager: any;
  @Input() showUndo: boolean = true;
  @Input() showRedo: boolean = true;
  @Input() showHelp: boolean = true;
  @Input() showCopy: boolean = false;
  @Input() showAdd: boolean = false;
  @Input() showDelete: boolean = false;
  @Input() isSaving: boolean = false;
  @Input() helpSteps: any[] = [];
  @Input() helpTitle: string = "";
  @Input() helpRecordName?: string;
  @Output() help = new EventEmitter<void>();
  @Output() back = new EventEmitter<void>();
  @Output() copy = new EventEmitter<void>();
  @Output() add = new EventEmitter<void>();
  @Output() delete = new EventEmitter<void>();
}

@Component({
  selector: "app-help-overlay",
  template: "",
  imports: [FormsModule],
})
class MockHelpOverlayComponent {
  @Input() steps: any[] = [];
  @Input() showHelp: boolean = false;
  @Output() helpClosed = new EventEmitter<void>();
}

@Pipe({ name: "translate" })
class MockTranslatePipe implements PipeTransform {
  transform(value: string): string {
    return value;
  }
}

@Pipe({ name: "avatarUrl" })
class MockAvatarUrlPipe implements PipeTransform {
  transform(value: string): string {
    return value;
  }
}

describe("DriverEditorComponent Reproduction", () => {
  let component: DriverEditorComponent;
  let fixture: ComponentFixture<DriverEditorComponent>;
  let mockDataService: any;
  let mockTranslationService: any;
  let mockConnectionMonitor: any;
  let mockRouter: any;
  let mockActivatedRoute: any;
  let mockHelpService: any;
  let mockAnalyticsService: any;

  beforeEach(async () => {
    mockDataService = jasmine.createSpyObj("DataService", [
      "getDrivers",
      "listAssets",
      "createDriver",
      "updateDriver",
      "deleteDriver",
      "uploadAsset",
    ]);
    mockTranslationService = jasmine.createSpyObj("TranslationService", [
      "translate",
    ]);
    mockConnectionMonitor = {
      connectionState$: new BehaviorSubject("CONNECTED"),
      startMonitoring: jasmine.createSpy("startMonitoring"),
      stopMonitoring: jasmine.createSpy("stopMonitoring"),
    };
    mockRouter = jasmine.createSpyObj("Router", [
      "navigate",
      "serializeUrl",
      "createUrlTree",
    ]);
    mockRouter.createUrlTree.and.returnValue({});
    mockRouter.serializeUrl.and.returnValue("/new-url");

    mockActivatedRoute = {
      snapshot: {
        queryParamMap: {
          get: jasmine.createSpy("get").and.returnValue("d1"),
        },
      },
      queryParams: of({}),
    };

    mockHelpService = jasmine.createSpyObj("HelpService", ["startGuide"]);
    mockHelpService.isVisible$ = of(false);
    mockHelpService.currentStep$ = of(null);
    mockHelpService.hasNext$ = of(false);
    mockHelpService.hasPrevious$ = of(false);

    mockAnalyticsService = jasmine.createSpyObj("AnalyticsService", [
      "isEnabled",
      "trackClick",
    ]);
    mockAnalyticsService.isEnabled.and.returnValue(true);

    mockDataService.getDrivers.and.returnValue(
      of([{ entity_id: "d1", name: "Original", nickname: "" }]),
    );
    mockDataService.listAssets.and.returnValue(of([]));
    mockDataService.createDriver.and.returnValue(of({ entity_id: "d2" }));
    mockDataService.updateDriver.and.returnValue(of({ entity_id: "d2" }));
    mockTranslationService.translate.and.callFake((key: string) => key);

    await TestBed.configureTestingModule({
      imports: [
        FormsModule,
        DriverEditorComponent,
        MockBackButtonComponent,
        MockAudioSelectorComponent,
        MockItemSelectorComponent,
        MockUndoRedoControlsComponent,
        MockImageSelectorComponent,
        MockEditorTitleComponent,
        MockHelpOverlayComponent,
        MockTranslatePipe,
        MockAvatarUrlPipe,
      ],
      providers: [
        { provide: DataService, useValue: mockDataService },
        { provide: TranslationService, useValue: mockTranslationService },
        { provide: ConnectionMonitorService, useValue: mockConnectionMonitor },
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: HelpService, useValue: mockHelpService },
        { provide: AnalyticsService, useValue: mockAnalyticsService },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DriverEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
    try {
      discardPeriodicTasks();
    } catch (e) {
      // Not in fakeAsync zone
    }
  });

  it("should correctly maintain clean state after duplicate + rename + auto-save + blur", fakeAsync(() => {
    // 1. Load initial driver
    component.loadData();
    tick();
    expect(component.editingDriver?.name).toBe("Original");
    expect(component.isDirtyState()).toBeFalse();

    // 2. Duplicate (Save as New)
    component.saveAsNew();
    tick();
    expect(mockDataService.createDriver).toHaveBeenCalled();
    expect(component.editingDriver?.entity_id).toBe("d2");
    expect(component.isDirtyState()).toBeFalse();

    // 3. Change name (triggers auto-save)
    component.onInputFocus();
    component.editingDriver!.name = "New Name";
    component.onInputChange();
    tick(200); // Trigger undoManager debounce

    expect(mockDataService.updateDriver).toHaveBeenCalled();
    expect(component.isDirtyState()).toBeFalse(); // Should be clean after auto-save

    // 4. Simulate blur (as if clicking Back)
    component.onInputBlur();

    // Verify that the state remains clean (FIXED behavior)
    expect(component.isDirtyState()).toBeFalse();

    discardPeriodicTasks();
  }));
});

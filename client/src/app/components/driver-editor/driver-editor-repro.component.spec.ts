import { Pipe, PipeTransform } from "@angular/core";
import { Component, input, output } from "@angular/core";
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
import { AnalyticsService } from "@app/analytics.service";
import { DataService } from "@app/data.service";
import { ConnectionMonitorService } from "@app/services/connection-monitor.service";
import { HelpService } from "@app/services/help.service";
import { TranslationService } from "@app/services/translation.service";

import { createDriverManagerDataServiceMock } from "../driver-manager/testing/driver-manager_helper";
import { DriverEditorComponent } from "./driver-editor.component";

// Mock Child Components
@Component({
  selector: "app-back-button",
  standalone: true,
  template: "",
  imports: [FormsModule],
})
class MockBackButtonComponent {
  route = input<string | null>(null);
  queryParams = input<any>({});
  label = input<string>("");
  confirm = input<boolean>(false);
  confirmTitle = input<string>("");
  confirmMessage = input<string>("");
}

@Component({
  selector: "app-audio-selector",
  standalone: true,
  template: "",
  imports: [FormsModule],
})
class MockAudioSelectorComponent {
  label = input<string>("");
  type = input<any>();
  typeChange = output<any>();
  url = input<any>();
  urlChange = output<any>();
  text = input<any>();
  textChange = output<any>();
  assets = input<any[]>([]);
  backButtonRoute = input<string | null>(null);
  backButtonQueryParams = input<any>({});
  context = input<any>();
}

@Component({
  selector: "app-image-selector",
  standalone: true,
  template: "",
  imports: [FormsModule],
})
class MockImageSelectorComponent {
  label = input<string | undefined>();
  imageUrl = input<string | undefined>();
  assets = input<any[]>([]);
  size = input<string | undefined>();
  imageUrlChange = output<string>();
  uploadStarted = output<void>();
  uploadFinished = output<void>();
}

@Component({
  selector: "app-item-selector",
  standalone: true,
  template: "",
  imports: [FormsModule],
})
class MockItemSelectorComponent {
  items = input<any[]>([]);
  visible = input<boolean>(false);
  select = output<any>();
  close = output<void>();
  itemType = input<string>("image");
  backButtonRoute = input<string | null>(null);
  backButtonQueryParams = input<any>({});
  title = input<string>("");
}

@Component({
  selector: "app-editor-title",
  standalone: true,
  template: "",
  imports: [FormsModule],
})
class MockEditorTitleComponent {
  titleKey = input<string>("");
  backRoute = input<string>("");
  backConfirm = input<boolean>(false);
  backQueryParams = input<any>({});
  backConfirmTitle = input<string>("");
  backConfirmMessage = input<string>("");
  undoManager = input<any>();
  showUndo = input<boolean>(true);
  showRedo = input<boolean>(true);
  showHelp = input<boolean>(true);
  showCopy = input<boolean>(false);
  showAdd = input<boolean>(false);
  showDelete = input<boolean>(false);
  isSaving = input<boolean>(false);
  helpSteps = input<any[]>([]);
  helpTitle = input<string>("");
  helpRecordName = input<string | undefined>();
  help = output<void>();
  back = output<void>();
  copy = output<void>();
  add = output<void>();
  delete = output<void>();
}

@Component({
  selector: "app-help-overlay",
  standalone: true,
  template: "",
  imports: [FormsModule],
})
class MockHelpOverlayComponent {
  steps = input<any[]>([]);
  showHelp = input<boolean>(false);
  helpClosed = output<void>();
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
    mockDataService = createDriverManagerDataServiceMock();
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
      "trackEvent",
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

import {
  Component,
  input,
  output,
  TemplateRef,
  ViewChild,
} from "@angular/core";
import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from "@angular/core/testing";
import { FormsModule } from "@angular/forms";
import { By } from "@angular/platform-browser";
import { ActivatedRoute, Router } from "@angular/router";
import { of } from "rxjs";
import { DefaultRacedayComponent } from "@app/components/raceday/default-raceday.component";
import { EditorTitleComponent } from "@app/components/shared/editor-title/editor-title.component";
import { DataService } from "@app/data.service";
import { CustomUI } from "@app/models/custom-ui";
import { Settings } from "@app/models/settings";
import { ChildWindowManagerService } from "@app/services/child-window-manager.service";
import { CustomUiService } from "@app/services/custom-ui.service";
import { LoggerService } from "@app/services/logger.service";
import { NavigationService } from "@app/services/navigation.service";
import { RaceConnectionService } from "@app/services/race-connection.service";
import { SettingsService } from "@app/services/settings.service";
import { TranslationService } from "@app/services/translation.service";

import { LayoutEditorComponent } from "./layout-editor.component";

@Component({
  selector: "app-default-raceday",
  template:
    '<ng-template #toolboxTemplate><div class="layout-customizer-toolbox-wrapper"></div></ng-template>',
  standalone: true,
})
class MockDefaultRacedayComponent {
  @ViewChild("toolboxTemplate", { static: true })
  toolboxTemplate?: TemplateRef<any>;
  isLayoutEditorMinimized = false;
  layoutEditorPosition = { x: 0, y: 0 };
  ensureToolboxVisible = jasmine.createSpy("ensureToolboxVisible");
  resetLayoutEditorPosition = jasmine.createSpy("resetLayoutEditorPosition");
  isUIEditorMode = input<boolean>(false);
  layoutCustomizing = input<boolean>(false);
  isPracticeLayoutEditor = input<boolean>(false);
  editingSettings = input<any>();
  activeCustomUi = input<any>();
  uiScale = input<number>(1);
  selectedWidgetId = input<string>("");
  selectedAnchor = input<any>();
  isCountdownPreviewActive = input<boolean>(false);
  gridSession = input<any>();
  widgetSelected = output<any>();
  anchorSelected = output<any>();
  layoutChanged = output<any>();
  columnsChanged = output<any>();
  finishGrid = output<any>();
  deleteGrid = output<any>();
  gridBoundsChange = output<any>();
  syncLayoutFromEditor(_layout: any): void {}
}

describe("LayoutEditorComponent", () => {
  let component: LayoutEditorComponent;
  let fixture: ComponentFixture<LayoutEditorComponent>;
  let mockDataService: any;
  let mockSettingsService: any;
  let mockTranslationService: any;
  let mockLogger: any;
  let mockRouter: any;
  let mockActivatedRoute: any;
  let mockNavigationService: any;
  let mockRaceConnectionService: any;
  let mockChildWindowManagerService: any;
  let mockCustomUiService: any;

  let testCustomUIs: CustomUI[];
  let testSettings: Settings;

  beforeEach(async () => {
    testCustomUIs = [
      {
        entity_id: "default_ui_layout_rc_ai",
        name: "default",
        is_default: true,
        layoutJson: JSON.stringify({
          widgets: [
            {
              id: "w1",
              widgetType: "leaderboard",
              x: 10,
              y: 10,
              width: 200,
              height: 100,
            },
          ],
        }),
      },
      {
        entity_id: "practice_ui_layout_rc_ai",
        name: "practice",
        is_default: true,
        layoutJson: JSON.stringify({
          widgets: [
            {
              id: "w2",
              widgetType: "lane-view",
              x: 20,
              y: 20,
              width: 300,
              height: 150,
            },
          ],
        }),
      },
      {
        entity_id: "custom_ui_1",
        name: "Custom Grand Prix",
        is_default: false,
        layoutJson: JSON.stringify({
          widgets: [
            {
              id: "w3",
              widgetType: "clock",
              x: 30,
              y: 30,
              width: 100,
              height: 50,
            },
          ],
        }),
      },
    ];

    testSettings = new Settings();

    mockDataService = {
      getCustomUIs: jasmine
        .createSpy("getCustomUIs")
        .and.returnValue(of(testCustomUIs)),
      createCustomUI: jasmine.createSpy("createCustomUI").and.callFake((ui) =>
        of({
          ...ui,
          entity_id: "created_id_" + Math.random().toString(36).substring(7),
        }),
      ),
      updateCustomUI: jasmine
        .createSpy("updateCustomUI")
        .and.callFake((id, ui) => of(ui)),
      deleteCustomUI: jasmine
        .createSpy("deleteCustomUI")
        .and.returnValue(of(true)),
      updateRaceSubscription: jasmine.createSpy("updateRaceSubscription"),
    };

    mockSettingsService = {
      getSettings: jasmine
        .createSpy("getSettings")
        .and.returnValue(testSettings),
      saveSettings: jasmine.createSpy("saveSettings"),
    };

    mockTranslationService = {
      translate: jasmine.createSpy("translate").and.callFake((key: string) => {
        if (key === "UE_LABEL_DEFAULT_RACEDAY_UI") return "Default Raceday UI";
        if (key === "UE_LABEL_DEFAULT_PRACTICE_UI")
          return "Default Practice UI";
        if (key === "LE_TITLE") return "Layout Editor";
        if (key === "LE_ERROR_NAME_INVALID") return "Name invalid";
        if (key === "UE_DEFAULT_CUSTOM_UI_NAME") return "New UI Layout";
        return key;
      }),
    };

    mockLogger = {
      info: jasmine.createSpy("info"),
      warn: jasmine.createSpy("warn"),
      error: jasmine.createSpy("error"),
      debug: jasmine.createSpy("debug"),
    };

    mockRouter = {
      navigate: jasmine.createSpy("navigate"),
      navigateByUrl: jasmine.createSpy("navigateByUrl"),
      getCurrentNavigation: jasmine
        .createSpy("getCurrentNavigation")
        .and.returnValue(null),
      events: of(),
      url: "/layout-editor",
    };

    mockRaceConnectionService = {
      connect: jasmine.createSpy("connect"),
      disconnect: jasmine.createSpy("disconnect"),
    };

    mockChildWindowManagerService = {
      isRacePreservingRoute: jasmine
        .createSpy("isRacePreservingRoute")
        .and.callFake((url: string) => {
          if (!url) return false;
          if (url.includes("raceday-setup")) return false;
          return (
            url.startsWith("/default-raceday") ||
            url === "/raceday" ||
            url.startsWith("/layout-editor")
          );
        }),
      closeAllWindows: jasmine.createSpy("closeAllWindows"),
    };

    mockCustomUiService = {
      initialize: jasmine
        .createSpy("initialize")
        .and.returnValue(Promise.resolve()),
    };

    mockActivatedRoute = {
      queryParams: of({ id: "default_ui_layout_rc_ai" }),
      snapshot: {
        queryParamMap: {
          get: jasmine.createSpy("get").and.returnValue(null),
        },
      },
    };

    mockNavigationService = {
      canGoBack: jasmine.createSpy("canGoBack").and.returnValue(false),
      goBack: jasmine.createSpy("goBack"),
      setLastEditedId: jasmine.createSpy("setLastEditedId"),
      getLastEditedId: jasmine
        .createSpy("getLastEditedId")
        .and.returnValue(null),
      clearLastEditedId: jasmine.createSpy("clearLastEditedId"),
    };

    TestBed.overrideComponent(LayoutEditorComponent, {
      remove: { imports: [DefaultRacedayComponent] },
      add: { imports: [MockDefaultRacedayComponent] },
    });

    await TestBed.configureTestingModule({
      imports: [FormsModule, LayoutEditorComponent],
      providers: [
        { provide: DataService, useValue: mockDataService },
        { provide: SettingsService, useValue: mockSettingsService },
        { provide: TranslationService, useValue: mockTranslationService },
        { provide: LoggerService, useValue: mockLogger },
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: NavigationService, useValue: mockNavigationService },
        { provide: RaceConnectionService, useValue: mockRaceConnectionService },
        {
          provide: ChildWindowManagerService,
          useValue: mockChildWindowManagerService,
        },
        { provide: CustomUiService, useValue: mockCustomUiService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LayoutEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  afterEach(() => {
    localStorage.removeItem("rc.last_edited_layout_id");
  });

  it("should initialize and load default layout", () => {
    expect(component).toBeTruthy();
    expect(component.allLayouts.length).toBe(3);
    expect(component.selectedLayoutId).toBe("default_ui_layout_rc_ai");
    expect(component.editingLayout).toBeTruthy();
    expect(component.isEditMode).toBeFalse();
    expect(component.isDefaultLayout).toBeTrue();
    const defaultSettings = new Settings();
    expect(component.editingLayout?.columnLayoutsJson).toBe(
      JSON.stringify(defaultSettings.columnLayouts),
    );
    const practiceLayout = component.allLayouts.find(
      (u) => u.entity_id === "practice_ui_layout_rc_ai",
    );
    expect(practiceLayout?.columnLayoutsJson).toBe(
      JSON.stringify(defaultSettings.practiceColumnLayouts),
    );
  });

  it("should build select items sorted naturally with localized default names", () => {
    const items = component.layoutSelectItems;
    expect(items.length).toBe(3);
    expect(items.some((i) => i.name === "Default Raceday UI")).toBeTrue();
  });

  describe("Selection and Navigation", () => {
    it("should select another layout when not dirty", () => {
      component.onSelectLayoutById("custom_ui_1");
      expect(component.selectedLayoutId).toBe("custom_ui_1");
      expect(component.editingLayout?.entity_id).toBe("custom_ui_1");
      expect(component.isDefaultLayout).toBeFalse();
    });

    it("should not switch layout if target ID matches current ID", () => {
      spyOn(component, "selectLayoutById");
      component.onSelectLayoutById("default_ui_layout_rc_ai");
      expect(component.selectLayoutById).not.toHaveBeenCalled();
    });

    it("should prompt discard confirmation when dirty and switching layouts", fakeAsync(() => {
      component.onToggleEditMode(); // enter edit mode
      component.editingLayout!.name = "Modified Name";
      component.captureState();

      expect(component.isDirtyState()).toBeTrue();

      spyOn(component.lifecycle, "confirmDiscard").and.returnValue(
        Promise.resolve(true),
      );
      component.onSelectLayoutById("custom_ui_1");
      tick();

      expect(component.lifecycle.confirmDiscard).toHaveBeenCalled();
      expect(component.selectedLayoutId).toBe("custom_ui_1");
    }));

    it("should update URL with replaceUrl: true when selecting another layout", () => {
      component.selectLayoutById("custom_ui_1", true);
      expect(mockRouter.navigate).toHaveBeenCalledWith([], {
        relativeTo: mockActivatedRoute,
        queryParams: { id: "custom_ui_1" },
        queryParamsHandling: "merge",
        replaceUrl: true,
      });
    });

    it("should navigate to returnUrl when onBack is called and returnUrl is present", () => {
      mockActivatedRoute.snapshot.queryParamMap.get.and.callFake(
        (key: string) => {
          if (key === "returnUrl") return "/default-raceday";
          return null;
        },
      );
      component.onBack();
      expect(mockRouter.navigateByUrl).toHaveBeenCalledWith("/default-raceday");
    });

    it("should use navigationService.goBack when onBack is called without returnUrl and canGoBack is true", () => {
      mockActivatedRoute.snapshot.queryParamMap.get.and.returnValue(null);
      mockNavigationService.canGoBack.and.returnValue(true);
      component.onBack();
      expect(mockNavigationService.goBack).toHaveBeenCalled();
    });

    it("should navigate to /raceday-setup when onBack is called without returnUrl and cannot go back", () => {
      mockActivatedRoute.snapshot.queryParamMap.get.and.returnValue(null);
      mockNavigationService.canGoBack.and.returnValue(false);
      component.onBack();
      expect(mockRouter.navigate).toHaveBeenCalledWith(["/raceday-setup"]);
    });
  });

  describe("Edit mode and Read-only mode", () => {
    it("should toggle into edit mode via onToggleEditMode", () => {
      expect(component.isEditMode).toBeFalse();
      component.onToggleEditMode();
      expect(component.isEditMode).toBeTrue();
    });

    it("should exit edit mode without saving when not dirty", () => {
      component.onToggleEditMode();
      expect(component.isEditMode).toBeTrue();
      component.onToggleEditMode();
      expect(component.isEditMode).toBeFalse();
      expect(mockDataService.updateCustomUI).not.toHaveBeenCalled();
    });

    it("should save changes and exit edit mode when dirty and valid", fakeAsync(() => {
      component.onSelectLayoutById("custom_ui_1");
      component.onToggleEditMode();

      component.editingLayout!.name = "Custom Grand Prix Updated";
      component.captureState();
      expect(component.isDirtyState()).toBeTrue();

      component.onToggleEditMode();
      tick();

      expect(mockDataService.updateCustomUI).toHaveBeenCalledWith(
        "custom_ui_1",
        jasmine.objectContaining({ name: "Custom Grand Prix Updated" }),
      );
      expect(component.isEditMode).toBeFalse();
    }));

    it("should alert and remain in edit mode if layout name is empty or duplicate", () => {
      spyOn(window, "alert");
      component.onSelectLayoutById("custom_ui_1");
      component.onToggleEditMode();

      component.editingLayout!.name = "";
      component.captureState();

      component.onToggleEditMode();
      expect(window.alert).toHaveBeenCalledWith("Name invalid");
      expect(component.isEditMode).toBeTrue();
      expect(mockDataService.updateCustomUI).not.toHaveBeenCalled();
    });
  });

  describe("Add, Copy, Delete", () => {
    it("should create new layout on onAddNewLayout", fakeAsync(() => {
      component.onAddNewLayout();
      tick();

      expect(mockDataService.createCustomUI).toHaveBeenCalled();
      expect(component.isEditMode).toBeTrue();
    }));

    it("should duplicate current layout on onCopyLayout", fakeAsync(() => {
      component.onCopyLayout();
      tick();

      expect(mockDataService.createCustomUI).toHaveBeenCalled();
      expect(component.isEditMode).toBeTrue();
    }));

    it("should allow deleting default system layouts and have delete button enabled", fakeAsync(() => {
      component.onSelectLayoutById("default_ui_layout_rc_ai");
      fixture.detectChanges();
      const editorTitle = fixture.debugElement.query(
        By.directive(EditorTitleComponent),
      )?.componentInstance as EditorTitleComponent;
      expect(editorTitle.disabledDelete()).toBeFalse();

      component.onDeleteLayout();
      expect(component.showDeleteConfirm).toBeTrue();

      component.onConfirmDeleteLayout();
      tick();

      expect(mockDataService.deleteCustomUI).toHaveBeenCalledWith(
        "default_ui_layout_rc_ai",
      );
      expect(
        component.allLayouts.some(
          (u) => u.entity_id === "default_ui_layout_rc_ai",
        ),
      ).toBeFalse();
    }));

    it("should show confirmation and delete custom layout on onConfirmDeleteLayout", fakeAsync(() => {
      component.onSelectLayoutById("custom_ui_1");
      component.onDeleteLayout();
      expect(component.showDeleteConfirm).toBeTrue();

      component.onConfirmDeleteLayout();
      tick();

      expect(mockDataService.deleteCustomUI).toHaveBeenCalledWith(
        "custom_ui_1",
      );
      expect(
        component.allLayouts.some((u) => u.entity_id === "custom_ui_1"),
      ).toBeFalse();
    }));

    it("should cancel delete layout", () => {
      component.showDeleteConfirm = true;
      component.onCancelDeleteLayout();
      expect(component.showDeleteConfirm).toBeFalse();
    });
  });

  describe("Dirty Checking & Deactivation", () => {
    it("canDeactivate should return true when clean", () => {
      expect(component.canDeactivate()).toBeTrue();
    });

    it("canDeactivate should prompt lifecycle confirmDiscard when dirty", () => {
      component.onToggleEditMode();
      component.editingLayout!.name = "Dirty Name";
      component.captureState();

      spyOn(component.lifecycle, "confirmDiscard").and.returnValue(
        Promise.resolve(false),
      );
      component.canDeactivate();
      expect(component.lifecycle.confirmDiscard).toHaveBeenCalled();
    });

    it("confirmDiscard should delegate to lifecycle.confirmDiscard", () => {
      spyOn(component.lifecycle, "confirmDiscard").and.returnValue(
        Promise.resolve(true),
      );
      component.confirmDiscard();
      expect(component.lifecycle.confirmDiscard).toHaveBeenCalled();
    });

    it("autoSaveLayout should save layout in background without exiting edit mode", async () => {
      component.onSelectLayoutById("custom_ui_1");
      component.onToggleEditMode();
      expect(component.isEditMode).toBeTrue();

      mockDataService.updateCustomUI.calls.reset();
      component.editingLayout!.name = "Auto Saved Name";
      component.captureState();

      await (component as any).lifecycle.activeSavePromise;

      expect(mockDataService.updateCustomUI).toHaveBeenCalledWith(
        "custom_ui_1",
        jasmine.objectContaining({ name: "Auto Saved Name" }),
      );
      expect(component.isEditMode).toBeTrue();
      expect(component.isDirtyState()).toBeFalse();
    });

    it("canDeactivate should auto-save dirty layout before navigation", async () => {
      component.onSelectLayoutById("custom_ui_1");
      component.onToggleEditMode();

      component.editingLayout!.name = "Nav Save Name";

      mockDataService.updateCustomUI.calls.reset();
      const allowed = await component.canDeactivate();

      expect(allowed).toBeTrue();
      expect(mockDataService.updateCustomUI).toHaveBeenCalledWith(
        "custom_ui_1",
        jasmine.objectContaining({ name: "Nav Save Name" }),
      );
      expect(component.isDirtyState()).toBeFalse();
    });

    it("onBeforeUnload should prevent default when dirty", () => {
      const event: any = {
        preventDefault: jasmine.createSpy("preventDefault"),
      };
      component.onBeforeUnload(event);
      expect(event.preventDefault).not.toHaveBeenCalled();

      component.onToggleEditMode();
      component.editingLayout!.name = "Dirty";
      component.captureState();

      component.onBeforeUnload(event);
      expect(event.preventDefault).toHaveBeenCalled();
    });
  });

  describe("Layout Actions and Controls", () => {
    it("should adjust zoom levels correctly", () => {
      expect(component.getLayoutZoom()).toBe(100);
      component.stepZoom(10);
      expect(component.getLayoutZoom()).toBe(110);
      component.stepZoom(-20);
      expect(component.getLayoutZoom()).toBe(90);
      component.resetLayoutZoom();
      expect(component.getLayoutZoom()).toBe(100);
    });

    it("should allow zooming out far enough that entire canvas fits on screen, including 9:16 layouts", () => {
      // Standard 16:9 layout
      const min16x9 = component.getMinLayoutZoom();
      expect(min16x9).toBeLessThanOrEqual(25);

      // Test 9:16 portrait layout (e.g. Driver Station)
      const layout9x16: any = {
        entity_id: "driver_station_9_16",
        name: "Driver Station 9:16",
        layoutJson: JSON.stringify({
          baseWidth: 1080,
          baseHeight: 1920,
          aspectRatio: "9:16",
          widgets: [],
        }),
      };
      component.editingLayout = layout9x16;
      const min9x16 = component.getMinLayoutZoom();
      const fit9x16 = component.getFitZoom();

      expect(min9x16).toBeLessThanOrEqual(25);
      expect(fit9x16).toBeLessThan(100);
      expect(min9x16).toBeLessThanOrEqual(fit9x16);

      // Verify zoom can be set down to minZoom (far below previous 75% limit)
      component.onZoomInput({ target: { value: min9x16.toString() } } as any);
      expect(component.getLayoutZoom()).toBe(min9x16);

      // When zoomed to fit, container height must fit within available viewport height
      component.onZoomInput({ target: { value: fit9x16.toString() } } as any);
      const containerH = component.getPreviewContainerHeight();
      const maxH = component.getCanvasViewportMaxHeight();
      expect(containerH).toBeLessThanOrEqual(maxH + 20);
    });

    it("should allow canvas viewport and widget inspector to fill full height without inline constraints", () => {
      const maxH = component.getCanvasViewportMaxHeight();
      const inspectorH = component.getInspectorHeight();
      expect(maxH).toBeGreaterThanOrEqual(500);
      expect(inspectorH).toBe(maxH);

      component.onToggleEditMode();
      const widgets = component.getLayoutWidgets();
      if (widgets.length > 0) {
        component.onWidgetSelected(widgets[0]);
      }
      fixture.detectChanges();

      const canvasEl: HTMLElement = fixture.nativeElement.querySelector(
        ".raceday-canvas-viewport",
      );
      expect(canvasEl).toBeTruthy();
      expect(canvasEl.style.maxHeight).toBe("");

      if (component.currentSelectedWidget) {
        const inspectorEl: HTMLElement = fixture.nativeElement.querySelector(
          ".widget-inspector-panel",
        );
        expect(inspectorEl).toBeTruthy();
        expect(inspectorEl.style.height).toBe("");
      }
    });

    it("should change aspect ratio and scale mode", () => {
      component.onToggleEditMode();
      component.setLayoutAspectRatio("16:10");
      expect(component.getLayoutAspectRatio()).toBe("16:10");

      component.setLayoutScaleMode("stretch");
      expect(component.getLayoutScaleMode()).toBe("stretch");
    });

    it("should toggle countdown preview state", () => {
      expect(component.isCountdownPreviewActive()).toBeFalse();
      component.toggleCountdownPreview();
      expect(component.isCountdownPreviewActive()).toBeTrue();
      component.toggleCountdownPreview();
      expect(component.isCountdownPreviewActive()).toBeFalse();
    });

    it("should reset and clear layout in edit mode", () => {
      component.racedayComp = jasmine.createSpyObj("DefaultRacedayComponent", [
        "syncLayoutFromEditor",
        "ensureToolboxVisible",
      ]);
      component.onToggleEditMode();

      // Reset layout cancel
      component.onResetLayout();
      expect(component.showResetConfirm).toBeTrue();
      component.onCancelResetLayout();
      expect(component.showResetConfirm).toBeFalse();

      // Reset layout confirm
      component.onResetLayout();
      expect(component.showResetConfirm).toBeTrue();
      component.onConfirmResetLayout();
      expect(component.showResetConfirm).toBeFalse();
      expect(component.racedayComp?.syncLayoutFromEditor).toHaveBeenCalled();

      // Clear layout cancel
      component.onClearLayout();
      expect(component.showClearConfirm).toBeTrue();
      component.onCancelClearLayout();
      expect(component.showClearConfirm).toBeFalse();

      // Clear layout confirm
      component.onClearLayout();
      expect(component.showClearConfirm).toBeTrue();
      component.onConfirmClearLayout();
      expect(component.showClearConfirm).toBeFalse();
      expect(component.getLayoutWidgets().length).toBe(0);
      expect(component.getSelectedWidgetId()).toBe("");
    });

    it("should not open reset or clear confirm when not in edit mode", () => {
      component.isEditMode = false;
      component.onResetLayout();
      expect(component.showResetConfirm).toBeFalse();

      component.onClearLayout();
      expect(component.showClearConfirm).toBeFalse();
    });

    it("should render reset and clear confirmation modals in template", () => {
      component.showResetConfirm = true;
      fixture.detectChanges();
      let modals = fixture.debugElement.queryAll(
        By.css("app-confirmation-modal"),
      );
      const resetModal = modals.find(
        (m) => m.componentInstance.title() === "LE_CONFIRM_RESET_TITLE",
      );
      expect(resetModal).toBeTruthy();
      expect(resetModal?.componentInstance.visible()).toBeTrue();

      component.showResetConfirm = false;
      component.showClearConfirm = true;
      fixture.detectChanges();
      modals = fixture.debugElement.queryAll(By.css("app-confirmation-modal"));
      const clearModal = modals.find(
        (m) => m.componentInstance.title() === "LE_CONFIRM_CLEAR_TITLE",
      );
      expect(clearModal).toBeTruthy();
      expect(clearModal?.componentInstance.visible()).toBeTrue();
    });

    it("should select widget from dropdown or canvas", () => {
      component.onSelectLayoutById("default_ui_layout_rc_ai");
      component.onWidgetDropdownSelect("w1");
      expect(component.currentSelectedWidget?.id).toBe("w1");
      expect(component.getSelectedWidgetId()).toBe("w1");

      component.onWidgetDropdownSelect("");
      expect(component.currentSelectedWidget).toBeNull();
    });

    it("should modify widget dimensions in inspector", () => {
      component.onSelectLayoutById("default_ui_layout_rc_ai");
      component.onToggleEditMode();
      component.onWidgetDropdownSelect("w1");

      component.onWidgetXChange(50);
      component.onWidgetYChange(60);
      component.onWidgetWidthChange(350);
      component.onWidgetHeightChange(180);

      expect(component.currentSelectedWidget.x).toBe(50);
      expect(component.currentSelectedWidget.y).toBe(60);
      expect(component.currentSelectedWidget.width).toBe(350);
      expect(component.currentSelectedWidget.height).toBe(180);
    });

    it("should handle grid and columns events", () => {
      component.onAnchorSelected("Center");
      expect(component.selectedAnchor).toBe("Center");

      component.onAnchorSelected({ widgetId: "w1", anchor: "Bottom" });
      expect(component.selectedAnchor).toBe("Bottom");
      expect(component.getSelectedWidgetId()).toBe("w1");

      component.onSelectedAnchorChange("Top");
      expect(component.selectedAnchor).toBe("Top");

      component.finishGridSession();
      expect(component.activeGridSession).toBeNull();
    });

    it("should handle onReplicateLanes", () => {
      component.editingLayout = {
        entity_id: "layout-1",
        name: "Test Layout",
        layoutJson: JSON.stringify({
          baseWidth: 1920,
          baseHeight: 1080,
          widgets: [
            {
              id: "w1",
              type: "leaderboard",
              x: 10,
              y: 10,
              width: 100,
              height: 100,
              customSettings: { lane: 1 },
            },
          ],
        }),
      } as any;
      component.onReplicateLanes({
        sourceBindingMode: "lane",
        sourceIndex: 1,
        targetCount: 2,
        direction: "vertical",
        distributionMode: "auto-fit",
        headerPlacement: "none",
        headerHeight: 0,
        linkColumns: true,
        sortByBindingMode: false,
        replaceExisting: false,
      });
      expect(component.editingLayout?.layoutJson).toContain("leaderboard");
    });

    it("should export layout file", () => {
      spyOn(window.URL, "createObjectURL").and.returnValue("blob:mock");
      spyOn(window.URL, "revokeObjectURL");
      component.exportLayout();
      expect(mockLogger.error).not.toHaveBeenCalled();
    });

    it("should return guide help steps and activate widget on inspector step onEnter", () => {
      const steps = component.getHelpSteps();
      expect(steps.length).toBeGreaterThan(2);
      expect(steps[0].selector).toBe("#editor-object-selector");

      const inspectorStep = steps.find(
        (s) => s.selector === "#help-widget-inspector",
      );
      expect(inspectorStep).toBeDefined();
      inspectorStep?.onEnter?.();
      expect(component.currentSelectedWidget).toBeTruthy();
    });

    it("should include widget library step in guide help", () => {
      const steps = component.getHelpSteps();
      const widgetLibStep = steps.find(
        (s) => s.selector === "#help-raceday-widget-library",
      );
      expect(widgetLibStep).toBeDefined();
    });

    it("should handle toggleWidgetLibrary across visibility and minimized states", () => {
      const mockRaceday = {
        ensureToolboxVisible: jasmine.createSpy("ensureToolboxVisible"),
        resetLayoutEditorPosition: jasmine.createSpy(
          "resetLayoutEditorPosition",
        ),
        isLayoutEditorMinimized: false,
        layoutEditorPosition: { x: 50, y: 50 },
      };
      component.racedayComp = mockRaceday as any;

      // When not in edit mode, toggleWidgetLibrary does nothing
      component.isEditMode = false;
      component.isWidgetLibraryVisible = false;
      component.toggleWidgetLibrary();
      expect(component.isWidgetLibraryVisible).toBeFalse();
      expect(mockRaceday.ensureToolboxVisible).not.toHaveBeenCalled();

      // In edit mode: if hidden, make visible and call ensureToolboxVisible
      component.isEditMode = true;
      component.isWidgetLibraryVisible = false;
      component.toggleWidgetLibrary();
      expect(component.isWidgetLibraryVisible).toBeTrue();
      expect(mockRaceday.ensureToolboxVisible).toHaveBeenCalled();

      // If visible but minimized, unminimize via ensureToolboxVisible
      mockRaceday.ensureToolboxVisible.calls.reset();
      mockRaceday.isLayoutEditorMinimized = true;
      component.toggleWidgetLibrary();
      expect(component.isWidgetLibraryVisible).toBeTrue();
      expect(mockRaceday.ensureToolboxVisible).toHaveBeenCalled();

      // If visible and not minimized but positioned off-screen (>= 9000), reset position
      mockRaceday.isLayoutEditorMinimized = false;
      mockRaceday.layoutEditorPosition = { x: 9999, y: 9999 };
      component.toggleWidgetLibrary();
      expect(component.isWidgetLibraryVisible).toBeTrue();
      expect(mockRaceday.resetLayoutEditorPosition).toHaveBeenCalled();

      // If visible, not minimized, and valid position, toggles to hidden
      mockRaceday.layoutEditorPosition = { x: 50, y: 50 };
      component.toggleWidgetLibrary();
      expect(component.isWidgetLibraryVisible).toBeFalse();
    });

    it("should render widget library toggle button and reflect edit mode and click interactions", () => {
      fixture.detectChanges();
      const btn = fixture.nativeElement.querySelector(
        "#toggle-widget-library-btn",
      );
      expect(btn).toBeTruthy();
      expect(btn.disabled).toBeTrue();

      component.onToggleEditMode();
      fixture.detectChanges();

      expect(btn.disabled).toBeFalse();
      expect(btn.classList.contains("active")).toBeTrue();

      spyOn(component, "toggleWidgetLibrary").and.callThrough();
      btn.click();
      expect(component.toggleWidgetLibrary).toHaveBeenCalled();
    });

    it("should render inspector panel and geometry inputs with autocomplete off in edit mode", () => {
      component.onToggleEditMode();
      component.onSelectLayoutById("default_ui_layout_rc_ai");
      component.onWidgetDropdownSelect("w1");
      fixture.detectChanges();

      const inspector = fixture.nativeElement.querySelector(
        "#help-widget-inspector",
      );
      expect(inspector).toBeTruthy();

      const xInput = fixture.nativeElement.querySelector("#inspector-pos-x");
      const yInput = fixture.nativeElement.querySelector("#inspector-pos-y");
      const wInput = fixture.nativeElement.querySelector("#inspector-pos-w");
      const hInput = fixture.nativeElement.querySelector("#inspector-pos-h");

      expect(xInput).toBeTruthy();
      expect(yInput).toBeTruthy();
      expect(wInput).toBeTruthy();
      expect(hInput).toBeTruthy();

      expect(xInput.getAttribute("autocomplete")).toBe("off");
      expect(yInput.getAttribute("autocomplete")).toBe("off");
      expect(wInput.getAttribute("autocomplete")).toBe("off");
      expect(hInput.getAttribute("autocomplete")).toBe("off");

      const deleteBtn = fixture.nativeElement.querySelector(
        ".inspector-delete-btn",
      );
      expect(deleteBtn).toBeTruthy();
      spyOn(component, "removeSelectedWidget");
      deleteBtn.click();
      expect(component.removeSelectedWidget).toHaveBeenCalled();
    });

    it("should correctly report hasChanges and getUnsavedReasons", () => {
      expect(component.hasChanges()).toBeFalse();
      expect(component.getUnsavedReasons().length).toBe(0);

      component.onToggleEditMode();
      component.editingLayout!.name = "Modified Name";
      component.captureState();

      expect(component.hasChanges()).toBeTrue();
      expect(component.getUnsavedReasons().length).toBeGreaterThan(0);
    });

    it("should handle stacked columns checks and migration helpers", () => {
      expect(component.hasStackedColumns()).toBeFalse();
      expect(typeof component.getStackedColumnsBannerDesc()).toBe("string");
      expect(component.isMigratedLayout()).toBeFalse();

      component.restorePreMigrationBackup();
      component.openReviewStackedColumnsModal();
      expect(component.showReviewStackedColumnsModal).toBeTrue();

      component.quickFixStackedColumns();
      expect(component.editingLayout).toBeTruthy();
    });

    it("should calculate preview scale and dimensions to use available editor width", () => {
      const width = component.getPreviewContainerWidth();
      const height = component.getPreviewContainerHeight();
      const scaleStr = component.getPreviewScale();
      const scaleNum = component.getPreviewScaleNumber();

      expect(width).toBeGreaterThan(0);
      expect(height).toBeGreaterThan(0);
      expect(scaleNum).toBeGreaterThan(0);
      expect(scaleStr).toContain("scale(");

      spyOn(component.cdr, "markForCheck");
      component.onResize();
      expect(component.cdr.markForCheck).toHaveBeenCalled();
    });

    it("should sync live raceday preview when syncRacedayPreview is called", () => {
      component.racedayComp = jasmine.createSpyObj("DefaultRacedayComponent", [
        "syncLayoutFromEditor",
      ]);
      const layout = { baseWidth: 1920, baseHeight: 1080, widgets: [] };
      component.syncRacedayPreview(layout as any);
      expect(component.racedayComp?.syncLayoutFromEditor).toHaveBeenCalledWith(
        layout,
      );
    });

    it("should sync preview when removeSelectedWidget is executed", () => {
      spyOn(component, "syncRacedayPreview");
      component.onToggleEditMode();
      const mockWidget = {
        id: "w-delete-test",
        widgetType: "timer",
        x: 10,
        y: 10,
        width: 100,
        height: 50,
      };
      component.editingLayout!.layoutJson = JSON.stringify({
        baseWidth: 1920,
        baseHeight: 1080,
        widgets: [mockWidget],
      });
      component.selectedWidgetId = "w-delete-test";
      component.removeSelectedWidget();
      expect(component.syncRacedayPreview).toHaveBeenCalled();
    });

    it("should maintain canvas aspect ratio and fill width regardless of scaleMode setting", () => {
      const baseW = component.getLayoutBaseWidth();
      const baseH = component.getLayoutBaseHeight();
      const expectedAspect = baseW / baseH;

      const w1 = component.getPreviewContainerWidth();
      const h1 = component.getPreviewContainerHeight();
      expect(w1 / h1).toBeCloseTo(expectedAspect, 2);
      expect(component.getPreviewScale()).toBe(
        `scale(${component.getPreviewScaleNumber()})`,
      );

      // In read mode, scaleMode cannot be changed
      expect(component.isEditMode).toBeFalse();
      component.setLayoutScaleMode("stretch");
      expect(component.isDirtyState()).toBeFalse();

      component.onToggleEditMode();
      expect(component.isEditMode).toBeTrue();

      component.setLayoutScaleMode("stretch");
      expect(component.getLayoutScaleMode()).toBe("stretch");

      // In edit mode with inspector open, canvas adjusts to available width while strictly preserving aspect ratio
      const w2 = component.getPreviewContainerWidth();
      const h2 = component.getPreviewContainerHeight();
      expect(component.getPreviewScale()).toBe(
        `scale(${component.getPreviewScaleNumber()})`,
      );
      expect(w2 / h2).toBeCloseTo(expectedAspect, 2);

      // Changing scaleMode must not alter display dimensions
      component.setLayoutScaleMode("fit-width");
      expect(component.getLayoutScaleMode()).toBe("fit-width");
      const parsed = JSON.parse(component.editingLayout?.layoutJson || "{}");
      expect(parsed.scaleMode).toBe("fit-width");

      const w3 = component.getPreviewContainerWidth();
      const h3 = component.getPreviewContainerHeight();
      expect(w3).toBe(w2);
      expect(h3).toBe(h2);
      expect(w3 / h3).toBeCloseTo(expectedAspect, 2);
    });
  });

  describe("Race Persistence and Lifecycle", () => {
    it("should connect RaceConnectionService on initialization", () => {
      expect(mockRaceConnectionService.connect).toHaveBeenCalled();
    });

    it("should disconnect RaceConnectionService on destroy", () => {
      fixture.destroy();
      expect(mockRaceConnectionService.disconnect).toHaveBeenCalled();
    });

    it("should close all child windows on destroy when navigating away from race preserving routes", () => {
      mockRouter.url = "/raceday-setup";
      mockRouter.getCurrentNavigation.and.returnValue({
        extractedUrl: { toString: () => "/raceday-setup" },
      });
      fixture.destroy();
      expect(mockChildWindowManagerService.closeAllWindows).toHaveBeenCalled();
    });

    it("should preserve child windows on destroy when navigating to a race preserving route", () => {
      mockRouter.url = "/default-raceday";
      mockRouter.getCurrentNavigation.and.returnValue({
        extractedUrl: { toString: () => "/default-raceday" },
      });
      fixture.destroy();
      expect(
        mockChildWindowManagerService.closeAllWindows,
      ).not.toHaveBeenCalled();
    });

    it("should disconnect and close windows on pagehide", () => {
      component.onPageHide();
      expect(mockRaceConnectionService.disconnect).toHaveBeenCalled();
      expect(mockChildWindowManagerService.closeAllWindows).toHaveBeenCalled();
    });
  });

  describe("Last Edited Layout Selection", () => {
    it("should set lastEditedId in NavigationService when layout is initialized from query params", () => {
      expect(mockNavigationService.setLastEditedId).toHaveBeenCalledWith(
        "layout",
        "default_ui_layout_rc_ai",
      );
    });

    it("should update lastEditedId in NavigationService when selecting another layout", () => {
      component.selectLayoutById("practice_ui_layout_rc_ai");
      expect(mockNavigationService.setLastEditedId).toHaveBeenCalledWith(
        "layout",
        "practice_ui_layout_rc_ai",
      );
    });

    it("should select last edited layout from NavigationService when navigating without id query param", async () => {
      mockNavigationService.getLastEditedId.and.callFake((type: string) =>
        type === "layout" ? "custom_ui_1" : null,
      );
      component.route.queryParams = of({});
      await component.loadData();
      expect(component.selectedLayoutId).toBe("custom_ui_1");
    });

    it("should fallback to localStorage when NavigationService returns null and query param is omitted", async () => {
      mockNavigationService.getLastEditedId.and.returnValue(null);
      localStorage.setItem(
        "rc.last_edited_layout_id",
        "practice_ui_layout_rc_ai",
      );
      component.route.queryParams = of({});
      await component.loadData();
      expect(component.selectedLayoutId).toBe("practice_ui_layout_rc_ai");
    });

    it("should fallback to first layout when no query param and no last edited layout exists", async () => {
      mockNavigationService.getLastEditedId.and.returnValue(null);
      localStorage.removeItem("rc.last_edited_layout_id");
      component.route.queryParams = of({});
      await component.loadData();
      expect(component.selectedLayoutId).toBe("default_ui_layout_rc_ai");
    });

    it("should fallback to last edited layout when query param id does not exist", async () => {
      mockNavigationService.getLastEditedId.and.callFake((type: string) =>
        type === "layout" ? "custom_ui_1" : null,
      );
      component.route.queryParams = of({ id: "non_existent_layout" });
      await component.loadData();
      expect(component.selectedLayoutId).toBe("custom_ui_1");
    });

    it("should update lastEditedId when saving layout", async () => {
      component.selectLayoutById("custom_ui_1");
      mockNavigationService.setLastEditedId.calls.reset();
      component.isEditMode = true;
      await component.saveCurrentLayout();
      expect(mockNavigationService.setLastEditedId).toHaveBeenCalledWith(
        "layout",
        "custom_ui_1",
      );
    });

    it("should clear lastEditedId when the last remaining layout is deleted", async () => {
      const soleLayout = component.allLayouts[0];
      component.selectLayoutById(soleLayout.entity_id);
      component.allLayouts = [soleLayout];
      mockDataService.deleteCustomUI.and.returnValue(of(true));
      await component.onConfirmDeleteLayout();
      expect(mockNavigationService.clearLastEditedId).toHaveBeenCalledWith(
        "layout",
      );
    });

    it("should re-initialize CustomUiService when saving layout", async () => {
      component.selectLayoutById("custom_ui_1");
      mockCustomUiService.initialize.calls.reset();
      component.isEditMode = true;
      await component.saveCurrentLayout();
      expect(mockCustomUiService.initialize).toHaveBeenCalled();
    });

    it("should re-initialize CustomUiService when starting a new layout", async () => {
      mockCustomUiService.initialize.calls.reset();
      await component.startNewLayout();
      expect(mockCustomUiService.initialize).toHaveBeenCalled();
    });

    it("should re-initialize CustomUiService when duplicating current layout", async () => {
      component.selectLayoutById("custom_ui_1");
      mockCustomUiService.initialize.calls.reset();
      await component.duplicateCurrentLayout();
      expect(mockCustomUiService.initialize).toHaveBeenCalled();
    });

    it("should re-initialize CustomUiService when deleting layout", async () => {
      component.selectLayoutById("custom_ui_1");
      mockCustomUiService.initialize.calls.reset();
      mockDataService.deleteCustomUI.and.returnValue(of(true));
      await component.onConfirmDeleteLayout();
      expect(mockCustomUiService.initialize).toHaveBeenCalled();
    });

    it("should update editingSettings.racedayLayout and save to settingsService when saving default layout", async () => {
      component.selectLayoutById("default_ui_layout_rc_ai");
      mockSettingsService.saveSettings.calls.reset();
      component.isEditMode = true;
      component.editingLayout!.layoutJson = JSON.stringify({
        widgets: [
          {
            id: "last-laps-col",
            widgetType: "lane-column",
            customSettings: {
              columnKey: "lastLaps",
              lastLapsCount: 8,
              lastLapsShowBorder: true,
            },
          },
        ],
      });
      await component.saveCurrentLayout();

      expect(mockSettingsService.saveSettings).toHaveBeenCalled();
      expect(
        component.editingSettings.racedayLayout?.widgets?.[0]?.customSettings?.[
          "lastLapsCount"
        ],
      ).toBe(8);
      expect(
        component.editingSettings.racedayLayout?.widgets?.[0]?.customSettings?.[
          "lastLapsShowBorder"
        ],
      ).toBe(true);
    });

    it("should update editingSettings.practiceRacedayLayout and save to settingsService when saving practice layout", async () => {
      component.selectLayoutById("practice_ui_layout_rc_ai");
      mockSettingsService.saveSettings.calls.reset();
      component.isEditMode = true;
      component.editingLayout!.layoutJson = JSON.stringify({
        widgets: [
          {
            id: "practice-last-laps",
            widgetType: "lane-column",
            customSettings: {
              columnKey: "lastLaps",
              lastLapsCount: 12,
            },
          },
        ],
      });
      await component.saveCurrentLayout();

      expect(mockSettingsService.saveSettings).toHaveBeenCalled();
      expect(
        component.editingSettings.practiceRacedayLayout?.widgets?.[0]
          ?.customSettings?.["lastLapsCount"],
      ).toBe(12);
    });

    it("should sync editingSettings from loaded default and practice UIs during loadData", async () => {
      mockSettingsService.saveSettings.calls.reset();
      await component.loadData();

      expect(mockSettingsService.saveSettings).toHaveBeenCalled();
      expect(component.editingSettings.racedayLayout?.widgets?.[0]?.id).toBe(
        "w1",
      );
      expect(
        component.editingSettings.practiceRacedayLayout?.widgets?.[0]?.id,
      ).toBe("w2");
    });
  });
});

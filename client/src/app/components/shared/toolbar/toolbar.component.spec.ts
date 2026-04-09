import { TestbedHarnessEnvironment } from "@angular/cdk/testing/testbed";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { of } from "rxjs";
import { AnalyticsService } from "src/app/analytics.service";
import { AcknowledgementModalComponent } from "src/app/components/shared/acknowledgement-modal/acknowledgement-modal.component";
import { UndoManager } from "src/app/components/shared/undo-redo-controls/undo-manager";
import { TranslatePipe } from "src/app/pipes/translate.pipe";
import { TranslationService } from "src/app/services/translation.service";

import { ToolbarHarness } from "./testing/toolbar.harness";
import { ToolbarComponent } from "./toolbar.component";

describe("ToolbarComponent", () => {
  let component: ToolbarComponent;
  let fixture: ComponentFixture<ToolbarComponent>;
  let harness: ToolbarHarness;
  let translationServiceSpy: jasmine.SpyObj<TranslationService>;
  let analyticsServiceSpy: jasmine.SpyObj<AnalyticsService>;

  beforeEach(async () => {
    translationServiceSpy = jasmine.createSpyObj("TranslationService", [
      "translate",
    ]);
    translationServiceSpy.translate.and.callFake((key: string) => key);

    analyticsServiceSpy = jasmine.createSpyObj("AnalyticsService", [
      "isEnabled",
      "toggleAnalytics",
      "trackClick",
    ]);
    analyticsServiceSpy.isEnabled.and.returnValue(true);
    analyticsServiceSpy.toggleAnalytics.and.returnValue(of({ success: true }));

    await TestBed.configureTestingModule({
      declarations: [
        ToolbarComponent,
        TranslatePipe,
        AcknowledgementModalComponent,
      ],
      providers: [
        { provide: TranslationService, useValue: translationServiceSpy },
        { provide: AnalyticsService, useValue: analyticsServiceSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ToolbarComponent);
    component = fixture.componentInstance;
    harness = await TestbedHarnessEnvironment.harnessForFixture(
      fixture,
      ToolbarHarness,
    );
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should show edit button when showEdit is true", async () => {
    component.showEdit = true;
    expect(await harness.isEditVisible()).toBeTrue();
  });

  it("should emit edit event when edit button is clicked", async () => {
    spyOn(component.edit, "emit");
    component.showEdit = true;
    await harness.clickEdit();
    expect(component.edit.emit).toHaveBeenCalled();
  });

  it("should show help button when showHelp is true", async () => {
    component.showHelp = true;
    expect(await harness.isHelpVisible()).toBeTrue();
  });

  it("should emit help event when help button is clicked", async () => {
    spyOn(component.help, "emit");
    component.showHelp = true;
    await harness.clickHelp();
    expect(component.help.emit).toHaveBeenCalled();
  });

  it("should show delete button when showDelete is true", async () => {
    component.showDelete = true;
    expect(await harness.isDeleteVisible()).toBeTrue();
  });

  it("should emit delete event when delete button is clicked", async () => {
    spyOn(component.delete, "emit");
    component.showDelete = true;
    await harness.clickDelete();
    expect(component.delete.emit).toHaveBeenCalled();
  });

  it("should show undo/redo when showUndo/showRedo are true", async () => {
    component.showUndo = true;
    component.showRedo = true;
    expect(await harness.isUndoVisible()).toBeTrue();
    expect(await harness.isRedoVisible()).toBeTrue();
  });

  it("should call undoManager.undo() when undo button is clicked", async () => {
    const config = {
      clonner: (item: any) => ({ ...item }),
      equalizer: (a: any, b: any) => JSON.stringify(a) === JSON.stringify(b),
      applier: () => {},
    };
    let state = { foo: "bar" };
    const manager = new UndoManager<any>(config, () => state);
    spyOn(manager, "undo");

    component.showUndo = true;
    component.undoManager = manager;

    // First commit captures initial snapshot
    manager.commitState();

    // Second commit after change pushes to undo stack
    state = { foo: "baz" };
    manager.commitState();

    expect(await harness.isUndoDisabled()).toBeFalse();
    await harness.clickUndo();
    expect(manager.undo).toHaveBeenCalled();
  });

  it("should call undoManager.redo() when redo button is clicked", async () => {
    const config = {
      clonner: (item: any) => ({ ...item }),
      equalizer: (a: any, b: any) => JSON.stringify(a) === JSON.stringify(b),
      applier: () => {},
    };
    let state = { foo: "bar" };
    const manager = new UndoManager<any>(config, () => state);
    spyOn(manager, "redo");

    component.showRedo = true;
    component.undoManager = manager;

    manager.commitState();
    state = { foo: "baz" };
    manager.commitState();
    manager.undo(); // Now redoStackCount is 1

    expect(await harness.isRedoDisabled()).toBeFalse();
    await harness.clickRedo();
    expect(manager.redo).toHaveBeenCalled();
  });

  it("should disable buttons when isSaving is true", async () => {
    component.showEdit = true;
    component.showDelete = true;
    component.isSaving = true;

    expect(await harness.isEditDisabled()).toBeTrue();
    expect(await harness.isDeleteDisabled()).toBeTrue();
  });

  describe("Analytics", () => {
    it("should show analytics icon", async () => {
      expect(await harness.isAnalyticsVisible()).toBeTrue();
    });

    it("should NOT show modal on successful toggle (localhost or remote)", async () => {
      analyticsServiceSpy.toggleAnalytics.and.returnValue(
        of({ success: true }),
      );

      await harness.clickAnalytics();
      fixture.detectChanges();

      expect(analyticsServiceSpy.toggleAnalytics).toHaveBeenCalled();
      expect(component.showAnalyticsModal).toBeFalse();
    });

    it("should show error modal on synchronization failure (localhost)", async () => {
      const errorResult = {
        success: false,
        titleKey: "RDS_ANALYTICS_ENABLED_TITLE",
        messageKey: "RDS_ANALYTICS_SYNC_ERROR",
      };
      analyticsServiceSpy.toggleAnalytics.and.returnValue(of(errorResult));

      await harness.clickAnalytics();
      fixture.detectChanges();

      expect(analyticsServiceSpy.toggleAnalytics).toHaveBeenCalled();
      expect(component.showAnalyticsModal).toBeTrue();
      expect(component.analyticsModalTitle).toBe("RDS_ANALYTICS_ENABLED_TITLE");
      expect(component.analyticsModalMessage).toBe("RDS_ANALYTICS_SYNC_ERROR");
    });

    it("should close analytics modal on acknowledge", async () => {
      component.showAnalyticsModal = true;
      fixture.detectChanges();

      component.onAnalyticsModalAcknowledge();
      fixture.detectChanges();

      expect(component.showAnalyticsModal).toBeFalse();
    });
  });
});

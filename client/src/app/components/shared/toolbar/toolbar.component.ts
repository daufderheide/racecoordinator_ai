import {
  ChangeDetectorRef,
  Component,
  input,
  OnInit,
  output,
} from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { AnalyticsService } from "src/app/analytics.service";
import { UndoManager } from "src/app/components/shared/undo-redo-controls/undo-manager";
import { Settings } from "src/app/models/settings";
import { GuideStep, HelpService } from "src/app/services/help.service";
import { SettingsService } from "src/app/services/settings.service";
import { TranslationService } from "src/app/services/translation.service";

import { AcknowledgementModalComponent } from "../acknowledgement-modal/acknowledgement-modal.component";
import { TranslatePipe } from "src/app/pipes/translate.pipe";

@Component({
  standalone: true,
  selector: "app-toolbar",
  templateUrl: "./toolbar.component.html",
  styleUrls: ["./toolbar.component.css"],
  imports: [AcknowledgementModalComponent, TranslatePipe],
})
export class ToolbarComponent implements OnInit {
  showAdd = input(false);
  showEdit = input(false);
  showHelp = input(false);
  showDelete = input(false);
  showCopy = input(false);
  showUndo = input(false);
  showRedo = input(false);
  isSaving = input(false);
  showAnalytics = input(true);
  disabledAdd = input(false);
  disabledEdit = input(false);
  disabledDelete = input(false);
  disabledCopy = input(false);
  showActivate = input(false);
  disabledActivate = input(false);
  undoManager = input<UndoManager<any>>();
  helpSteps = input<GuideStep[]>([]);
  helpTitle = input("");
  helpRecordName = input<keyof Settings>();

  showAnalyticsModal = false;
  analyticsModalTitle = "";
  analyticsModalMessage = "";

  constructor(
    private analyticsService: AnalyticsService,
    private translationService: TranslationService,
    private cdr: ChangeDetectorRef,
    private helpService: HelpService,
    private route: ActivatedRoute,
    private settingsService: SettingsService,
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      const forceHelp = params["help"] === "true";
      const settings = this.settingsService.getSettings();
      const helpRecName = this.helpRecordName();
      const needsHelp = helpRecName && !settings[helpRecName as keyof Settings];

      if (forceHelp || needsHelp) {
        // Small delay to ensure the view and translations are ready
        setTimeout(() => {
          this.onHelp();

          // If it was the first visit, mark as shown
          if (needsHelp && !forceHelp && helpRecName) {
            (settings as any)[helpRecName] = true;
            this.settingsService.saveSettings(settings);
          }
        }, 500);
      }
    });
  }

  add = output<void>();
  edit = output<void>();
  copy = output<void>();
  help = output<void>();
  delete = output<void>();

  activate = output<void>();

  onActivate() {
    this.activate.emit();
  }

  onAdd() {
    this.add.emit();
  }

  onEdit() {
    this.edit.emit();
  }

  getToolbarHelpSteps(): GuideStep[] {
    const defaultSteps: GuideStep[] = [];

    if (this.showActivate()) {
      defaultSteps.push({
        targetId: "activate-item-btn",
        title: this.translationService.translate("TOOLBAR_HELP_ACTIVATE_TITLE"),
        content: this.translationService.translate(
          "TOOLBAR_HELP_ACTIVATE_CONTENT",
        ),
        position: "bottom",
      });
    }

    if (this.showUndo()) {
      defaultSteps.push({
        targetId: "undo-btn",
        title: this.translationService.translate("TOOLBAR_HELP_UNDO_TITLE"),
        content: this.translationService.translate("TOOLBAR_HELP_UNDO_CONTENT"),
        position: "bottom",
      });
    }

    if (this.showRedo()) {
      defaultSteps.push({
        targetId: "redo-btn",
        title: this.translationService.translate("TOOLBAR_HELP_REDO_TITLE"),
        content: this.translationService.translate("TOOLBAR_HELP_REDO_CONTENT"),
        position: "bottom",
      });
    }

    if (this.showEdit()) {
      defaultSteps.push({
        targetId: "edit-track-btn",
        title: this.translationService.translate("TOOLBAR_HELP_EDIT_TITLE"),
        content: this.translationService.translate("TOOLBAR_HELP_EDIT_CONTENT"),
        position: "bottom",
      });
    }

    if (this.showCopy()) {
      defaultSteps.push({
        targetId: "copy-item-btn",
        title: this.translationService.translate("TOOLBAR_HELP_COPY_TITLE"),
        content: this.translationService.translate("TOOLBAR_HELP_COPY_CONTENT"),
        position: "bottom",
      });
    }

    if (this.showAdd()) {
      defaultSteps.push({
        targetId: "add-item-btn",
        title: this.translationService.translate("TOOLBAR_HELP_ADD_TITLE"),
        content: this.translationService.translate("TOOLBAR_HELP_ADD_CONTENT"),
        position: "bottom",
      });
    }

    if (this.showDelete()) {
      defaultSteps.push({
        targetId: "delete-track-btn",
        title: this.translationService.translate("TOOLBAR_HELP_DELETE_TITLE"),
        content: this.translationService.translate(
          "TOOLBAR_HELP_DELETE_CONTENT",
        ),
        position: "bottom",
      });
    }

    if (this.showAnalytics()) {
      defaultSteps.push({
        targetId: "analytics-btn",
        title: this.translationService.translate(
          "TOOLBAR_HELP_ANALYTICS_TITLE",
        ),
        content: this.translationService.translate(
          "TOOLBAR_HELP_ANALYTICS_CONTENT",
        ),
        position: "bottom",
      });
    }

    if (this.showHelp()) {
      defaultSteps.push({
        targetId: "help-track-btn",
        title: this.translationService.translate("TOOLBAR_HELP_HELP_TITLE"),
        content: this.translationService.translate("TOOLBAR_HELP_HELP_CONTENT"),
        position: "bottom",
      });
    }

    return defaultSteps;
  }

  onHelp() {
    const steps = [...this.helpSteps(), ...this.getToolbarHelpSteps()];
    this.helpService.startGuide(steps);
    this.help.emit();
  }

  onDelete() {
    this.delete.emit();
  }

  onCopy() {
    this.copy.emit();
  }

  isAnalyticsEnabled(): boolean {
    return this.analyticsService.isEnabled();
  }

  onToggleAnalytics() {
    this.analyticsService.toggleAnalytics().subscribe((result) => {
      if (!result.success && result.titleKey && result.messageKey) {
        this.analyticsModalTitle = this.translationService.translate(
          result.titleKey,
        );
        this.analyticsModalMessage = this.translationService.translate(
          result.messageKey,
        );
        this.showAnalyticsModal = true;
      }
      this.cdr.detectChanges();
    });
  }

  onAnalyticsModalAcknowledge() {
    this.showAnalyticsModal = false;
    this.cdr.detectChanges();
  }

  undo() {
    this.undoManager()?.undo();
  }

  redo() {
    this.undoManager()?.redo();
  }

  get canUndo(): boolean {
    return (this.undoManager()?.undoStackCount ?? 0) > 0;
  }

  get canRedo(): boolean {
    return (this.undoManager()?.redoStackCount ?? 0) > 0;
  }
}

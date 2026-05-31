import {
  ChangeDetectorRef,
  Component,
  inject,
  input,
  OnInit,
  output,
} from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { AnalyticsService } from "@app/analytics.service";
import { AcknowledgementModalComponent } from "@app/components/shared/acknowledgement-modal/acknowledgement-modal.component";
import { UndoManager } from "@app/components/shared/undo-redo-controls/undo-manager";
import { Role } from "@app/models/role";
import { Settings } from "@app/models/settings";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { AuthService } from "@app/services/auth.service";
import { GuideStep, HelpService } from "@app/services/help.service";
import { SettingsService } from "@app/services/settings.service";
import { TranslationService } from "@app/services/translation.service";

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
  showImport = input(false);
  showImportRc1 = input(false);
  showExport = input(false);
  importTitleKey = input("DBM_BTN_IMPORT");
  importRc1TitleKey = input("AM_BTN_IMPORT_RC1_ROTATION");
  importRc1Icon = input("upload_file");
  exportTitleKey = input("DBM_BTN_EXPORT");
  showReset = input(false);
  disabledImport = input(false);
  disabledImportRc1 = input(false);
  disabledExport = input(false);
  disabledReset = input(false);
  showRegenerate = input(false);
  disabledRegenerate = input(false);
  showLaneCheck = input(false);
  disabledLaneCheck = input(false);
  isHeatsEqual = input<boolean | undefined>(undefined);

  showAnalyticsModal = false;
  analyticsModalTitle = "";
  analyticsModalMessage = "";

  public authService = inject(AuthService);
  public Role = Role;

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
  import = output<void>();
  importRc1 = output<void>();
  export = output<void>();
  reset = output<void>();
  regenerate = output<void>();
  laneCheck = output<void>();

  onActivate() {
    this.activate.emit();
  }

  onImport() {
    this.import.emit();
  }

  onImportRc1() {
    this.importRc1.emit();
  }

  onExport() {
    this.export.emit();
  }

  onReset() {
    this.reset.emit();
  }

  onRegenerate() {
    this.regenerate.emit();
  }

  onLaneCheck() {
    this.laneCheck.emit();
  }

  onAdd() {
    this.add.emit();
  }

  onEdit() {
    this.edit.emit();
  }

  // eslint-disable-next-line max-lines-per-function
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

    if (this.showImport()) {
      defaultSteps.push({
        targetId: "import-btn",
        title: this.translationService.translate("TOOLBAR_HELP_IMPORT_TITLE"),
        content: this.translationService.translate(
          "TOOLBAR_HELP_IMPORT_CONTENT",
        ),
        position: "bottom",
      });
    }

    if (this.showExport()) {
      defaultSteps.push({
        targetId: "export-btn",
        title: this.translationService.translate("TOOLBAR_HELP_EXPORT_TITLE"),
        content: this.translationService.translate(
          "TOOLBAR_HELP_EXPORT_CONTENT",
        ),
        position: "bottom",
      });
    }

    if (this.showReset()) {
      defaultSteps.push({
        targetId: "reset-btn",
        title: this.translationService.translate("TOOLBAR_HELP_RESET_TITLE"),
        content: this.translationService.translate(
          "TOOLBAR_HELP_RESET_CONTENT",
        ),
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

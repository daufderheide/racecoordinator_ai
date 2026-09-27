import {
  ChangeDetectorRef,
  Component,
  inject,
  input,
  OnInit,
  output,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
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
  imports: [AcknowledgementModalComponent, TranslatePipe, FormsModule],
})
export class ToolbarComponent implements OnInit {
  showAdd = input(false);
  showEdit = input(false);
  isEditMode = input(false);
  showExpandCollapse = input(false);
  allExpanded = input(false);
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
  copyDisabledTooltipKey = input("");
  getCopyTooltip(): string {
    const key =
      this.disabledCopy() && this.copyDisabledTooltipKey()
        ? this.copyDisabledTooltipKey()
        : "TEM_BTN_SAVE_AS_NEW";
    return this.translationService.translate(key);
  }
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
  importRc1Icon = input("file_download");
  exportTitleKey = input("DBM_BTN_EXPORT");
  showReset = input(false);
  resetTitleKey = input("DBM_BTN_RESET");
  resetDisabledTooltipKey = input("");
  getResetTooltip(): string {
    const key =
      this.disabledReset() && this.resetDisabledTooltipKey()
        ? this.resetDisabledTooltipKey()
        : this.resetTitleKey();
    return this.translationService.translate(key);
  }
  disabledImport = input(false);
  disabledImportRc1 = input(false);
  disabledExport = input(false);
  disabledReset = input(false);
  showRegenerate = input(false);
  disabledRegenerate = input(false);
  showLaneCheck = input(false);
  disabledLaneCheck = input(false);
  isHeatsEqual = input<boolean | undefined>(undefined);

  showZoom = input(false);
  zoomLevel = input(100);

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
    this.route?.queryParams?.subscribe((params) => {
      const forceHelp = params["help"] === "true";
      const settings = this.settingsService.getSettings();
      const helpRecName = this.helpRecordName();
      const needsHelp = helpRecName && !settings[helpRecName as keyof Settings];

      if (forceHelp || needsHelp) {
        // Small delay to ensure the view and translations are ready
        const delay = (window as any).__karma__ ? 0 : 500;
        setTimeout(() => {
          this.onHelp();

          // If it was the first visit, mark as shown
          if (needsHelp && !forceHelp && helpRecName) {
            (settings as any)[helpRecName] = true;
            this.settingsService.saveSettings(settings);
          }
        }, delay);
      }
    });
  }

  add = output<void>();
  edit = output<void>();
  expandCollapse = output<void>();
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
  zoomLevelChange = output<number>();

  onZoomIn() {
    if (this.zoomLevel() < 150) {
      this.zoomLevelChange.emit(this.zoomLevel() + 10);
    }
  }

  onZoomOut() {
    if (this.zoomLevel() > 50) {
      this.zoomLevelChange.emit(this.zoomLevel() - 10);
    }
  }

  onZoomSliderChange(event: any) {
    this.zoomLevelChange.emit(Number(event));
  }

  onActivate() {
    this.activate.emit();
  }

  onExpandCollapse() {
    this.expandCollapse.emit();
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

  private createGuideStep(
    targetId: string,
    titleKey: string,
    contentKey: string,
  ): GuideStep {
    return {
      targetId,
      title: this.translationService.translate(titleKey),
      content: this.translationService.translate(contentKey),
      position: "bottom",
    };
  }

  private getActionHelpSteps(): GuideStep[] {
    const steps: GuideStep[] = [];
    if (this.showActivate()) {
      steps.push(
        this.createGuideStep(
          "activate-item-btn",
          "TOOLBAR_HELP_ACTIVATE_TITLE",
          "TOOLBAR_HELP_ACTIVATE_CONTENT",
        ),
      );
    }
    if (this.showUndo()) {
      steps.push(
        this.createGuideStep(
          "undo-btn",
          "TOOLBAR_HELP_UNDO_TITLE",
          "TOOLBAR_HELP_UNDO_CONTENT",
        ),
      );
    }
    if (this.showRedo()) {
      steps.push(
        this.createGuideStep(
          "redo-btn",
          "TOOLBAR_HELP_REDO_TITLE",
          "TOOLBAR_HELP_REDO_CONTENT",
        ),
      );
    }
    if (this.showEdit()) {
      steps.push(
        this.createGuideStep(
          "edit-track-btn",
          "TOOLBAR_HELP_EDIT_TITLE",
          "TOOLBAR_HELP_EDIT_CONTENT",
        ),
      );
    }
    if (this.showExpandCollapse()) {
      steps.push(
        this.createGuideStep(
          "expand-collapse-all-btn",
          "TOOLBAR_HELP_EXPAND_COLLAPSE_TITLE",
          "TOOLBAR_HELP_EXPAND_COLLAPSE_CONTENT",
        ),
      );
    }
    if (this.showCopy()) {
      steps.push(
        this.createGuideStep(
          "copy-item-btn",
          "TOOLBAR_HELP_COPY_TITLE",
          "TOOLBAR_HELP_COPY_CONTENT",
        ),
      );
    }
    if (this.showAdd()) {
      steps.push(
        this.createGuideStep(
          "add-item-btn",
          "TOOLBAR_HELP_ADD_TITLE",
          "TOOLBAR_HELP_ADD_CONTENT",
        ),
      );
    }
    if (this.showDelete()) {
      steps.push(
        this.createGuideStep(
          "delete-track-btn",
          "TOOLBAR_HELP_DELETE_TITLE",
          "TOOLBAR_HELP_DELETE_CONTENT",
        ),
      );
    }
    return steps;
  }

  private getDataAndUtilityHelpSteps(): GuideStep[] {
    const steps: GuideStep[] = [];
    if (this.showImport()) {
      steps.push(
        this.createGuideStep(
          "import-btn",
          "TOOLBAR_HELP_IMPORT_TITLE",
          "TOOLBAR_HELP_IMPORT_CONTENT",
        ),
      );
    }
    if (this.showExport()) {
      steps.push(
        this.createGuideStep(
          "export-btn",
          "TOOLBAR_HELP_EXPORT_TITLE",
          "TOOLBAR_HELP_EXPORT_CONTENT",
        ),
      );
    }
    if (this.showReset()) {
      steps.push(
        this.createGuideStep(
          "reset-btn",
          "TOOLBAR_HELP_RESET_TITLE",
          "TOOLBAR_HELP_RESET_CONTENT",
        ),
      );
    }
    if (this.showAnalytics()) {
      steps.push(
        this.createGuideStep(
          "analytics-btn",
          "TOOLBAR_HELP_ANALYTICS_TITLE",
          "TOOLBAR_HELP_ANALYTICS_CONTENT",
        ),
      );
    }
    if (this.showHelp()) {
      steps.push(
        this.createGuideStep(
          "help-track-btn",
          "TOOLBAR_HELP_HELP_TITLE",
          "TOOLBAR_HELP_HELP_CONTENT",
        ),
      );
    }
    return steps;
  }

  getToolbarHelpSteps(): GuideStep[] {
    return [...this.getActionHelpSteps(), ...this.getDataAndUtilityHelpSteps()];
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
    if (!this.canUndo) {
      return;
    }
    this.undoManager()?.undo();
  }

  redo() {
    if (!this.canRedo) {
      return;
    }
    this.undoManager()?.redo();
  }

  get canUndo(): boolean {
    if (this.showEdit() && !this.isEditMode()) {
      return false;
    }
    return (this.undoManager()?.undoStackCount ?? 0) > 0;
  }

  get canRedo(): boolean {
    if (this.showEdit() && !this.isEditMode()) {
      return false;
    }
    return (this.undoManager()?.redoStackCount ?? 0) > 0;
  }
}

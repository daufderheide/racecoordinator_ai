import { CommonModule } from "@angular/common";
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { catchError, firstValueFrom, of, Subscription } from "rxjs";
import { AudioSelectorComponent } from "@app/components/shared/audio-selector/audio-selector.component";
import { ConfirmationModalComponent } from "@app/components/shared/confirmation-modal/confirmation-modal.component";
import {
  CustomOptionComponent,
  CustomSelectComponent,
} from "@app/components/shared/custom-select/custom-select.component";
import { DriverAudioConfigComponent } from "@app/components/shared/driver-audio-config/driver-audio-config.component";
import { EditorTitleComponent } from "@app/components/shared/editor-title/editor-title.component";
import { ImageSelectorComponent } from "@app/components/shared/image-selector/image-selector.component";
import { UndoManager } from "@app/components/shared/undo-redo-controls/undo-manager";
import { MAIN_AUDIO_SLOTS } from "@app/components/ui-editor/ui-editor-constants";
import {
  getCustomUiDisplayNameKey,
  getThemeDisplayNameKey,
  isThemeDefault,
} from "@app/components/ui-editor/ui-editor-crud.helper";
import {
  getThemeAudioConfigForSlot,
  getThemeAudioUrl,
  resolveThemeAsset,
  resolveThemeFlag,
  resolveThemeFuelGauge,
  resolveThemeLamp,
} from "@app/components/ui-editor/ui-editor-theme-assets.helper";
import { DataService } from "@app/data.service";
import { AutoSelectDefaultDirective } from "@app/directives/auto-select-default.directive";
import { DirtyComponent } from "@app/interfaces/dirty-component";
import { CustomUI } from "@app/models/custom-ui";
import { AudioConfig } from "@app/models/driver";
import { Settings } from "@app/models/settings";
import { Theme } from "@app/models/theme";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { GuideStep } from "@app/services/help.service";
import { LoggerService } from "@app/services/logger.service";
import { NavigationService } from "@app/services/navigation.service";
import { SettingsService } from "@app/services/settings.service";
import { ThemeService } from "@app/services/theme.service";
import { TranslationService } from "@app/services/translation.service";
import { mockTTSContext } from "@app/utils/audio";
import { EditorLifecycleHelper } from "@app/utils/editor-lifecycle.helper";
import { ExpanderStateManager, SelectItem } from "@app/utils/editor-utils";

import {
  areThemesEqual,
  buildThemeSelectItems,
  cloneTheme,
  getLastEditedThemeId,
  getThemeUnsavedReasons,
  isThemeNameUnique,
  resolveInitialTheme,
  setLastEditedThemeId,
} from "./theme-editor.helper";
import {
  handleDeleteCurrentTheme,
  handleDriverAudioOverrideChange,
  handleDuplicateCurrentTheme,
  handleResetDriverAudioOverrides,
  handleSaveCurrentTheme,
  handleStartNewTheme,
  handleThemeAudioChange,
  handleThemeSlotChange,
} from "./theme-editor-actions.helper";
import { buildThemeEditorHelpSteps } from "./theme-editor-help.helper";

export interface ThemeEditorSections extends Record<string, boolean> {
  flags: boolean;
  countdown: boolean;
  fuelGauge: boolean;
  audio: boolean;
  driverAudioOverrides: boolean;
}

@Component({
  standalone: true,
  selector: "app-theme-editor",
  templateUrl: "./theme-editor.component.html",
  styleUrls: ["./theme-editor.component.css"],
  imports: [
    CommonModule,
    FormsModule,
    EditorTitleComponent,
    ConfirmationModalComponent,
    CustomSelectComponent,
    CustomOptionComponent,
    ImageSelectorComponent,
    AudioSelectorComponent,
    DriverAudioConfigComponent,
    TranslatePipe,
    AutoSelectDefaultDirective,
  ],
})
export class ThemeEditorComponent implements OnInit, OnDestroy, DirtyComponent {
  isEditMode = false;
  isLoading = true;
  isSaving = false;
  isAutoSaving = false;
  showDeleteConfirm = false;
  isNavigationApproved = false;

  allThemes: Theme[] = [];
  selectedThemeId: string | undefined = undefined;
  editingTheme: Theme | null = null;
  originalTheme: Theme | null = null;
  defaultThemeNames: { [id: string]: string } = {};

  displayCustomUIs: CustomUI[] = [];
  assets: any[] = [];
  soundAssets: any[] = [];
  editingSettings: Settings = new Settings();
  previewTTSContext: any = mockTTSContext();

  mainAudioSlots = MAIN_AUDIO_SLOTS;

  undoManager!: UndoManager<Theme>;
  lifecycle!: EditorLifecycleHelper;
  expanderManager!: ExpanderStateManager<ThemeEditorSections>;

  sectionsExpanded: ThemeEditorSections = {
    flags: true,
    countdown: false,
    fuelGauge: false,
    audio: false,
    driverAudioOverrides: false,
  };

  private subscriptions: Subscription[] = [];
  private queryParamSub?: Subscription;

  constructor(
    public dataService: DataService,
    public settingsService: SettingsService,
    public themeService: ThemeService,
    public translationService: TranslationService,
    public navigationService: NavigationService,
    public logger: LoggerService,
    public router: Router,
    public route: ActivatedRoute,
    public cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.expanderManager = new ExpanderStateManager(
      "theme_editor_expanders",
      this.sectionsExpanded,
      this.logger,
    );
    this.sectionsExpanded = this.expanderManager.load();

    this.initUndoManager();
    this.initLifecycle();
    this.loadData();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());
    this.queryParamSub?.unsubscribe();
  }

  get themeSelectItems(): SelectItem[] {
    return buildThemeSelectItems(this.allThemes, this.translationService);
  }

  get displayThemes(): Theme[] {
    return this.allThemes;
  }

  private initUndoManager(): void {
    this.undoManager = new UndoManager<Theme>(
      {
        clonner: (item: Theme) => cloneTheme(item) as Theme,
        equalizer: (a: Theme, b: Theme) => areThemesEqual(a, b),
        applier: (item: Theme) => {
          this.editingTheme = cloneTheme(item);
          this.cdr.markForCheck();
        },
      },
      () =>
        this.editingTheme
          ? (cloneTheme(this.editingTheme) ?? undefined)
          : undefined,
    );

    this.subscriptions.push(
      this.undoManager.stateCommitted$.subscribe((event) => {
        if (
          event.type === "push" ||
          event.type === "undo" ||
          event.type === "redo"
        ) {
          this.autoSaveTheme();
        }
      }),
    );
  }

  private initLifecycle(): void {
    this.lifecycle = new EditorLifecycleHelper({
      cdr: this.cdr,
      translationService: this.translationService,
      getUnsavedReasons: () =>
        getThemeUnsavedReasons(
          this.editingTheme,
          this.originalTheme,
          this.allThemes,
          this.translationService,
        ),
      onRevert: () => {
        if (this.originalTheme) {
          this.editingTheme = cloneTheme(this.originalTheme);
          if (this.editingTheme) {
            this.undoManager.initialize(this.editingTheme);
          }
        }
        this.isEditMode = false;
        this.cdr.markForCheck();
      },
      undoManager: this.undoManager,
      hasChanges: () => this.isDirtyState(),
      isSaveValid: () => this.isConfigValid(),
      isSaving: () => this.isSaving,
      onAutoSave: () => this.saveCurrentTheme(true),
      autoSaveOnDiscard: true,
      logger: this.logger,
    });
  }

  async loadData(): Promise<void> {
    this.isLoading = true;
    try {
      this.editingSettings =
        this.settingsService.getSettings() || new Settings();

      const [themes, uis, rawAssets] = await Promise.all([
        firstValueFrom(
          this.dataService.getThemes().pipe(catchError(() => of([]))),
        ),
        firstValueFrom(
          this.dataService.getCustomUIs().pipe(catchError(() => of([]))),
        ),
        firstValueFrom(
          this.dataService.listAssets().pipe(catchError(() => of([]))),
        ),
      ]);

      const assetList: any[] = Array.isArray(rawAssets) ? rawAssets : [];
      this.allThemes = themes || [];
      this.displayCustomUIs = uis || [];
      this.assets = assetList.filter(
        (a: any) =>
          a.type === "image" ||
          a.type === "sound" ||
          a.type === "image_set" ||
          a.type === "audio_set",
      );
      this.soundAssets = assetList.filter(
        (a: any) => a.type === "sound" || a.type === "audio_set",
      );

      for (const t of this.allThemes) {
        this.defaultThemeNames[t.entity_id] = t.name;
      }

      this.queryParamSub = this.route.queryParams.subscribe((params) => {
        const targetId = params["id"] || params["themeId"];
        const lastEditedId = getLastEditedThemeId(this.navigationService);
        const initial = resolveInitialTheme(
          targetId,
          this.allThemes,
          lastEditedId,
        );
        if (initial && initial.entity_id !== this.selectedThemeId) {
          this.selectThemeById(initial.entity_id, false);
        }
        if (params["edit"] === "true") {
          this.isEditMode = true;
        }
      });
    } catch (err) {
      this.logger.error("Failed to load data in theme editor", err);
    } finally {
      this.isLoading = false;
      this.cdr.markForCheck();
    }
  }

  selectThemeById(id: string, updateUrl = true): void {
    const theme = this.allThemes.find((t) => t.entity_id === id);
    if (!theme) return;
    this.selectedThemeId = id;
    setLastEditedThemeId(id, this.navigationService);
    this.editingTheme = cloneTheme(theme);
    this.originalTheme = cloneTheme(theme);
    this.defaultThemeNames[id] = theme.name;
    if (this.editingTheme) {
      this.undoManager.initialize(this.editingTheme);
    }

    if (updateUrl) {
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { id },
        queryParamsHandling: "merge",
        replaceUrl: true,
      });
    }
    this.cdr.markForCheck();
  }

  onSelectThemeById(id: string): void {
    if (id === this.selectedThemeId) return;
    if (this.isDirtyState()) {
      this.lifecycle.confirmDiscard().then((confirmed) => {
        if (confirmed) {
          this.isEditMode = false;
          this.selectThemeById(id);
        }
      });
    } else {
      this.isEditMode = false;
      this.selectThemeById(id);
    }
  }

  onToggleEditMode(): void {
    if (!this.isEditMode) {
      this.isEditMode = true;
      this.cdr.markForCheck();
      return;
    }

    if (this.isSaving) return;

    if (this.isDirtyState()) {
      if (!this.isConfigValid()) {
        alert(this.translationService.translate("THM_ERROR_NAME_INVALID"));
        return;
      }
      this.saveCurrentTheme();
    } else {
      this.isEditMode = false;
      this.cdr.markForCheck();
    }
  }

  onAddNewTheme(): void {
    if (this.isEditMode && this.isDirtyState()) {
      this.lifecycle.confirmDiscard().then((confirmed) => {
        if (confirmed) {
          handleStartNewTheme(this);
        }
      });
    } else {
      handleStartNewTheme(this);
    }
  }

  onCopyTheme(): void {
    if (!this.editingTheme || this.isSaving) return;
    if (this.isEditMode && this.isDirtyState()) {
      this.lifecycle.confirmDiscard().then((confirmed) => {
        if (confirmed) {
          handleDuplicateCurrentTheme(this);
        }
      });
    } else {
      handleDuplicateCurrentTheme(this);
    }
  }

  onDeleteTheme(): void {
    if (!this.editingTheme || this.isSaving) return;
    if (isThemeDefault(this.editingTheme)) return;
    this.showDeleteConfirm = true;
  }

  onConfirmDeleteTheme(): Promise<void> {
    return handleDeleteCurrentTheme(this);
  }

  onCancelDeleteTheme(): void {
    this.showDeleteConfirm = false;
  }

  saveCurrentTheme(isAutoSave = false): Promise<any> {
    return handleSaveCurrentTheme(this, isAutoSave);
  }

  autoSaveTheme(): Promise<any> {
    if (!this.editingTheme || !this.isEditMode) return Promise.resolve();
    if (!this.isConfigValid()) return Promise.resolve();
    return this.lifecycle.scheduleAutoSave(() => this.saveCurrentTheme(true));
  }

  captureState(): void {
    if (this.isEditMode) {
      this.undoManager.captureState();
      this.cdr.markForCheck();
    }
  }

  isDirtyState(): boolean {
    if (!this.isEditMode || !this.editingTheme || !this.originalTheme) {
      return false;
    }
    return (
      !areThemesEqual(this.editingTheme, this.originalTheme) ||
      (this.undoManager ? this.undoManager.hasChanges() : false)
    );
  }

  isConfigValid(): boolean {
    if (!this.editingTheme?.name || !this.editingTheme.name.trim()) {
      return false;
    }
    return isThemeNameUnique(
      this.editingTheme.name,
      this.originalTheme?.entity_id,
      this.allThemes,
    );
  }

  isThemeDefault(theme: Theme | null): boolean {
    return isThemeDefault(theme as Theme);
  }

  getCustomUiDisplayNameKey(ui: CustomUI): string {
    return getCustomUiDisplayNameKey(ui, this.translationService);
  }

  getThemeDisplayNameKey(theme: Theme): string {
    return getThemeDisplayNameKey(theme, this.translationService);
  }

  // --- Image & Audio Slot Resolvers ---
  getFlagUrl(slot: string): string | undefined {
    return resolveThemeFlag(this, slot, this.editingTheme || undefined);
  }

  getLampUrl(slot: string): string | undefined {
    return resolveThemeLamp(this, slot, this.editingTheme || undefined);
  }

  getFuelGaugeUrl(): string | undefined {
    return resolveThemeFuelGauge(this, this.editingTheme || undefined);
  }

  getAudioUrl(slot: string): string | undefined {
    if (!this.editingTheme) return undefined;
    return getThemeAudioUrl(
      slot,
      this.editingTheme,
      this.dataService,
      this.assets,
    );
  }

  getAudioConfigForSlot(slot: string): AudioConfig {
    if (!this.editingTheme) return { type: "preset" };
    return getThemeAudioConfigForSlot(slot, this.editingTheme);
  }

  getAssetForSlot(slot: string): any | undefined {
    return resolveThemeAsset(this, slot, this.editingTheme || undefined);
  }

  onThemeSlotChanged(slot: string, asset: any): void {
    handleThemeSlotChange(this, slot, asset);
  }

  onThemeAudioChanged(
    slot: string,
    field: "type" | "url" | "text",
    value: any,
  ): void {
    handleThemeAudioChange(this, slot, field, value);
  }

  onAudioAssetSelected(slot: string, asset: any): void {
    const assetId = asset?.model?.entityId || asset?.entity_id || asset?.id;
    if (assetId) {
      this.onThemeAudioChanged(slot, "url", assetId);
    }
  }

  onDriverAudioOverrideChange(event: {
    key: string;
    config: AudioConfig | null;
  }): void {
    handleDriverAudioOverrideChange(this, event);
  }

  onResetDriverAudioOverrides(): void {
    handleResetDriverAudioOverrides(this);
  }

  // --- Expanders ---
  toggleSection(section: keyof ThemeEditorSections): void {
    this.expanderManager.toggle(this.sectionsExpanded, section);
    this.cdr.markForCheck();
  }

  areAllSectionsExpanded(): boolean {
    return Object.values(this.sectionsExpanded).every(Boolean);
  }

  toggleAllSections(): void {
    const next = !this.areAllSectionsExpanded();
    (
      Object.keys(this.sectionsExpanded) as Array<keyof ThemeEditorSections>
    ).forEach((key) => {
      this.sectionsExpanded[key] = next;
    });
    this.expanderManager.save(this.sectionsExpanded);
    this.cdr.markForCheck();
  }

  // --- Guided Tour ---
  getHelpSteps(): GuideStep[] {
    return buildThemeEditorHelpSteps({
      translationService: this.translationService,
      expandSection: (sectionKey: string) => {
        if (sectionKey in this.sectionsExpanded) {
          this.sectionsExpanded[sectionKey as keyof ThemeEditorSections] = true;
          this.cdr.markForCheck();
        }
      },
    });
  }

  onBack(): void {
    const returnUrl = this.route.snapshot.queryParamMap.get("returnUrl");
    if (returnUrl) {
      this.router.navigateByUrl(returnUrl);
    } else if (this.navigationService?.canGoBack()) {
      this.navigationService.goBack();
    } else {
      this.router.navigate(["/raceday-setup"]);
    }
  }

  hasChanges(): boolean {
    return this.isDirtyState();
  }

  getUnsavedReasons(): string[] {
    return getThemeUnsavedReasons(
      this.editingTheme,
      this.originalTheme,
      this.allThemes,
      this.translationService,
    );
  }

  confirmDiscard(): Promise<boolean> {
    return this.lifecycle.confirmDiscard();
  }

  canDeactivate(): Promise<boolean> | boolean {
    if (this.isDirtyState()) {
      return this.lifecycle.confirmDiscard();
    }
    return true;
  }
}

import { Location } from "@angular/common";
import {
  ChangeDetectorRef,
  Component,
  HostListener,
  OnDestroy,
  OnInit,
  ViewChild,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { forkJoin, Subscription } from "rxjs";
import { ConfirmationModalComponent } from "@app/components/shared/confirmation-modal/confirmation-modal.component";
import {
  CustomOptionComponent,
  CustomSelectComponent,
} from "@app/components/shared/custom-select/custom-select.component";
import { DriverExportModalComponent } from "@app/components/shared/driver-export-modal/driver-export-modal.component";
import { EditorTitleComponent } from "@app/components/shared/editor-title/editor-title.component";
import { ImageSelectorComponent } from "@app/components/shared/image-selector/image-selector.component";
import { UndoManager } from "@app/components/shared/undo-redo-controls/undo-manager";
import { DataService } from "@app/data.service";
import { AutoSelectDefaultDirective } from "@app/directives/auto-select-default.directive";
import { DirtyComponent } from "@app/interfaces/dirty-component";
import { Car, CAR_SCALE_OPTIONS } from "@app/models/car";
import { CarField, sortCarFields } from "@app/models/car-field";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import {
  ConnectionMonitorService,
  ConnectionState,
} from "@app/services/connection-monitor.service";
import { GuideStep, HelpService } from "@app/services/help.service";
import { LoggerService } from "@app/services/logger.service";
import { NavigationService } from "@app/services/navigation.service";
import { TranslationService } from "@app/services/translation.service";
import { EditorLifecycleHelper } from "@app/utils/editor-lifecycle.helper";
import {
  getNextSelectionAfterDelete,
  isEntityNameUnique,
  mapToSelectItems,
} from "@app/utils/editor-utils";

import {
  areCarsEqual,
  choiceOptions,
  cloneCar,
  generateUniqueCarName,
  getCarEditorHelpSteps,
  getCarUnsavedReasons,
  getKnownCarClasses,
  setCustomValue,
  withoutField,
} from "./car-editor.helper";
import { CarFieldManagerComponent } from "./car-field-manager/car-field-manager.component";

/** Key for NavigationService's "last edited" memory. */
const NAV_KEY = "car";

/**
 * The Slotcar editor: a list of slotcars with a fixed set of fields. Works
 * like the Team editor (pick in the title bar, edit, auto-save, undo).
 */
@Component({
  standalone: true,
  selector: "app-car-editor",
  templateUrl: "./car-editor.component.html",
  styleUrls: ["./car-editor.component.css"],
  imports: [
    AutoSelectDefaultDirective,
    EditorTitleComponent,
    ImageSelectorComponent,
    FormsModule,
    TranslatePipe,
    ConfirmationModalComponent,
    CustomSelectComponent,
    CustomOptionComponent,
    CarFieldManagerComponent,
    DriverExportModalComponent,
  ],
})
export class CarEditorComponent implements OnInit, OnDestroy, DirtyComponent {
  lifecycle!: EditorLifecycleHelper;
  showDeleteConfirm = false;

  get showDiscardConfirm(): boolean {
    return this.lifecycle.showDiscardConfirm;
  }
  set showDiscardConfirm(val: boolean) {
    this.lifecycle.showDiscardConfirm = val;
  }

  get isNavigationApproved(): boolean {
    return this.lifecycle.isNavigationApproved;
  }
  set isNavigationApproved(val: boolean) {
    this.lifecycle.isNavigationApproved = val;
  }

  get pendingDeactivate(): ((value: boolean) => void) | null {
    return this.lifecycle.pendingDeactivate;
  }
  set pendingDeactivate(val: ((value: boolean) => void) | null) {
    this.lifecycle.pendingDeactivate = val;
  }

  private isReverting = false;
  private isSwitchingSelection = false;
  @ViewChild(EditorTitleComponent) titleComponent!: EditorTitleComponent;
  private isDestroyed = false;
  private dataSubscription: Subscription | null = null;
  selectedCar?: Car;
  editingCar?: Car;
  originalCar: Car | null = null;
  selectedCarId?: string;
  carSelectItems: { id: string; name: string }[] = [];
  isEditMode: boolean = false;
  private isPreservingEditModeOnNavigation: boolean = false;
  isLoading: boolean = true;
  isSaving: boolean = false;
  isDirty: boolean = false;
  isAutoSaving: boolean = false;
  transitionToReadOnlyOnSave: boolean = false;
  public navigateBackOnSave = false;
  defaultCarName: string = "";
  private initialLastEditedId: string | null = null;

  readonly scaleOptions = CAR_SCALE_OPTIONS;

  /** The setup fields on the right, in order (all free text). */
  readonly setupFields: {
    key: "motor" | "magnet" | "chassis" | "gears" | "tyres";
    labelKey: string;
    placeholderKey: string;
  }[] = [
    {
      key: "motor",
      labelKey: "CE_LABEL_MOTOR",
      placeholderKey: "CE_PLACEHOLDER_MOTOR",
    },
    {
      key: "magnet",
      labelKey: "CE_LABEL_MAGNET",
      placeholderKey: "CE_PLACEHOLDER_MAGNET",
    },
    {
      key: "chassis",
      labelKey: "CE_LABEL_CHASSIS",
      placeholderKey: "CE_PLACEHOLDER_CHASSIS",
    },
    {
      key: "gears",
      labelKey: "CE_LABEL_GEARS",
      placeholderKey: "CE_PLACEHOLDER_GEARS",
    },
    {
      key: "tyres",
      labelKey: "CE_LABEL_TYRES",
      placeholderKey: "CE_PLACEHOLDER_TYRES",
    },
  ];

  undoManager!: UndoManager<Car>;
  allCars: Car[] = [];
  /** Classes used on other cars, offered as suggestions in the Class field. */
  knownClasses: string[] = [];
  imageAssets: any[] = [];
  /** The user's own fields, in editor order. */
  carFields: CarField[] = [];
  isFieldManagerOpen = false;
  /** The export dialog (#1210, step 6a). */
  showExportModal = false;

  isConnectionLost = false;
  private connectionSubscription: Subscription | null = null;
  private subscriptions: Subscription[] = [];

  constructor(
    private dataService: DataService,
    private cdr: ChangeDetectorRef,
    private translationService: TranslationService,
    private router: Router,
    protected route: ActivatedRoute,
    private connectionMonitor: ConnectionMonitorService,
    private location: Location,
    private helpService: HelpService,
    private logger: LoggerService,
    private navigationService: NavigationService,
  ) {
    this.undoManager = new UndoManager<Car>(
      {
        clonner: (c) => cloneCar(c),
        equalizer: (a, b) => areCarsEqual(a, b),
        applier: (c) => {
          const currentId = this.editingCar?.entity_id;
          this.editingCar = c;
          if (currentId && this.editingCar) {
            this.editingCar.entity_id = currentId;
          }
        },
      },
      () => this.editingCar,
    );
    this.lifecycle = new EditorLifecycleHelper({
      cdr: this.cdr,
      translationService: this.translationService,
      getUnsavedReasons: () => this.getUnsavedReasons(),
      undoManager: this.undoManager,
      hasChanges: () => this.hasChanges(),
      isSaveValid: () => !this.isNameInvalid,
      isSaving: () => this.isSaving,
      onAutoSave: () => this.updateCar(false, true),
      logger: this.logger,
    });
  }

  ngOnInit() {
    this.initialLastEditedId = this.navigationService.getLastEditedId(NAV_KEY);
    this.connectionMonitor.startMonitoring();
    this.monitorConnection();

    if (this.route.queryParamMap) {
      this.subscriptions.push(
        this.route.queryParamMap.subscribe((paramMap) => {
          if (this.isReverting) {
            this.isReverting = false;
            return;
          }
          const isEditorRoute =
            !this.router.url ||
            this.router.url === "/" ||
            this.router.url.startsWith("/car-editor") ||
            this.router.url.includes("mock");
          if (!isEditorRoute) {
            return;
          }
          if (this.isSwitchingSelection) {
            this.isSwitchingSelection = false;
            return;
          }
          const nextId = paramMap.get("id");
          if (nextId && nextId !== "new") {
            this.navigationService.setLastEditedId(NAV_KEY, nextId);
          }
          const currentId = this.editingCar?.entity_id;
          if (
            currentId &&
            nextId !== currentId &&
            this.hasChanges() &&
            !this.isNavigationApproved
          ) {
            this.confirmDiscard().then((confirmed) => {
              if (confirmed) {
                this.loadData();
              } else {
                this.isReverting = true;
                this.router.navigate([], {
                  relativeTo: this.route,
                  queryParams: {
                    id: currentId,
                    returnUrl:
                      this.route.snapshot.queryParamMap.get("returnUrl"),
                  },
                  queryParamsHandling: "merge",
                });
              }
            });
          } else {
            this.loadData();
          }
        }),
      );
    } else {
      this.loadData();
    }

    this.subscriptions.push(
      this.undoManager.stateCommitted$.subscribe((event) => {
        if (
          event.type === "push" ||
          event.type === "undo" ||
          event.type === "redo"
        ) {
          this.autoSaveCar();
        }
      }),
    );
  }

  ngOnDestroy() {
    this.isDestroyed = true;
    this.connectionMonitor.stopMonitoring();
    this.connectionSubscription?.unsubscribe();
    this.dataSubscription?.unsubscribe();
    this.subscriptions.forEach((s) => s.unsubscribe());
    this.undoManager.destroy();
  }

  @HostListener("window:keydown", ["$event"])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (!this.isEditMode) return;
    if ((event.metaKey || event.ctrlKey) && event.key === "z") {
      event.preventDefault();
      if (event.shiftKey) {
        this.redo();
      } else {
        this.undo();
      }
    }
    if ((event.metaKey || event.ctrlKey) && event.key === "y") {
      event.preventDefault();
      this.redo();
    }
  }

  focusNameInput() {
    setTimeout(() => {
      const el = document.getElementById("car-name-input") as HTMLInputElement;
      if (el) {
        el.focus();
        el.select();
      }
    }, 0);
  }

  loadData() {
    this.isNavigationApproved = false;
    this.isLoading = true;
    this.dataSubscription = forkJoin({
      cars: this.dataService.getCars(),
      assets: this.dataService.listAssets(),
      fields: this.dataService.getCarFields(),
    }).subscribe({
      next: (result) => {
        try {
          this.carFields = sortCarFields(
            ((result.fields as any[]) || []).map((f) => CarField.fromJSON(f)),
          );
          this.setAllCars((result.cars as any[]) || []);
          this.imageAssets = (result.assets || []).filter(
            (a: any) => a && a.type === "image",
          );
          this.selectInitialCar();
        } finally {
          this.isLoading = false;
          if (!this.isDestroyed) {
            this.cdr.detectChanges();
          }
        }
      },
      error: (err) => {
        this.logger.error("Failed to load slotcars", err);
        this.isLoading = false;
        if (!this.isDestroyed) {
          this.cdr.detectChanges();
        }
      },
    });
  }

  private setAllCars(raw: any[]) {
    this.allCars = raw.map((c) => Car.fromJSON(c));
    this.updateCarSelectItems();
  }

  get isNameInvalid(): boolean {
    if (this.isLoading || !this.editingCar) return false;
    return !isEntityNameUnique(
      this.editingCar.name,
      this.editingCar.entity_id,
      this.allCars,
      true,
    );
  }

  monitorConnection() {
    this.connectionSubscription =
      this.connectionMonitor.connectionState$.subscribe((state) => {
        this.isConnectionLost = state === ConnectionState.DISCONNECTED;
        if (this.isConnectionLost) {
          this.handleConnectionLoss();
        }
      });
  }

  handleConnectionLoss() {
    const startTime = Date.now();
    const intervalId = setInterval(() => {
      if (!this.isConnectionLost) {
        clearInterval(intervalId);
        return;
      }
      if (Date.now() - startTime > 5000) {
        clearInterval(intervalId);
        this.router.navigate(["/raceday-setup"]);
      }
    }, 1000);
  }

  /** Picks the car from ?id=, else the last edited one, else the first. */
  private selectInitialCar() {
    const idParam = this.route.snapshot.queryParamMap.get("id");
    const byId = (id: string | null | undefined) =>
      id ? this.allCars.find((c) => c.entity_id === id) : undefined;

    if (idParam === "new") {
      this.startNewCar();
    } else {
      const found =
        byId(idParam) ||
        byId(this.navigationService.getLastEditedId(NAV_KEY)) ||
        byId(this.initialLastEditedId) ||
        this.sortedCars()[0];
      if (found) {
        this.selectCar(found);
        this.isEditMode = false;
        this.navigationService.setLastEditedId(NAV_KEY, found.entity_id);
      } else {
        this.startNewCar();
      }
    }

    const isNew = this.route.snapshot.queryParamMap.get("isNew") === "true";
    if (this.isPreservingEditModeOnNavigation || (isNew && this.editingCar)) {
      this.isPreservingEditModeOnNavigation = false;
      this.isEditMode = true;
      this.defaultCarName = this.editingCar?.name || "";
      this.focusNameInput();
    }
  }

  private sortedCars(): Car[] {
    const order = this.carSelectItems.map((i) => i.id);
    return [...this.allCars].sort(
      (a, b) => order.indexOf(a.entity_id) - order.indexOf(b.entity_id),
    );
  }

  selectCar(car: Car) {
    this.selectedCar = car;
    this.editingCar = cloneCar(car);
    this.originalCar = cloneCar(car);
    this.selectedCarId = car.entity_id;
    this.undoManager.initialize(this.editingCar);
  }

  updateCarSelectItems() {
    this.carSelectItems = mapToSelectItems(this.allCars);
    this.knownClasses = getKnownCarClasses(this.allCars);
  }

  onSelectCarById(id: string) {
    if (this.isEditMode) return;
    if (this.selectedCarId === id) return;
    const found = this.allCars.find((c) => c.entity_id === id);
    if (found) {
      this.isSwitchingSelection = true;
      this.selectCar(found);
      this.navigationService.setLastEditedId(NAV_KEY, found.entity_id);
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { id: found.entity_id },
        queryParamsHandling: "merge",
        replaceUrl: true,
      });
    }
  }

  onToggleEditMode() {
    if (!this.isEditMode) {
      this.isEditMode = true;
      this.focusNameInput();
      return;
    }
    if (this.isSaving) {
      this.transitionToReadOnlyOnSave = true;
      return;
    }
    if (this.isDirtyState()) {
      if (!this.isConfigValid()) {
        alert(this.translationService.translate("CE_ERROR_NAME_EXISTS"));
        return;
      }
      this.updateCar(false, false);
    } else {
      this.isEditMode = false;
    }
  }

  onAddNewCar() {
    if (this.isEditMode && this.isDirtyState()) {
      this.confirmDiscard().then((confirmed) => {
        if (confirmed) {
          this.startNewCar();
        }
      });
    } else {
      this.startNewCar();
    }
  }

  /** Creates a car with a free default name and opens it for editing. */
  startNewCar() {
    this.isSaving = true;
    const defaultName =
      this.translationService.translate("CE_DEFAULT_CAR_NAME") || "New Slotcar";
    const uniqueName = generateUniqueCarName(defaultName, this.allCars, false);
    const newCar = new Car("new", uniqueName);

    this.subscriptions.push(
      this.dataService.createCar(newCar).subscribe({
        next: (result) => {
          this.isSaving = false;
          this.isEditMode = true;
          this.isPreservingEditModeOnNavigation = true;
          this.navigationService.setLastEditedId(NAV_KEY, result.entity_id);

          const savedCar = new Car(result.entity_id, uniqueName);
          this.editingCar = cloneCar(savedCar);
          this.selectedCar = cloneCar(savedCar);
          this.originalCar = cloneCar(savedCar);
          this.selectedCarId = savedCar.entity_id;
          this.undoManager.resetTracking(savedCar);
          this.defaultCarName = savedCar.name;
          this.upsertInList(savedCar);

          this.cdr.detectChanges();
          this.focusNameInput();
          this.router.navigate([], {
            queryParams: { id: result.entity_id },
            queryParamsHandling: "merge",
            replaceUrl: true,
          });
        },
        error: (err) => {
          this.logger.error("Failed to create slotcar", err);
          this.isSaving = false;
          this.cdr.detectChanges();
        },
      }),
    );
  }

  private upsertInList(car: Car) {
    const idx = this.allCars.findIndex((c) => c.entity_id === car.entity_id);
    if (idx >= 0) {
      this.allCars[idx] = cloneCar(car);
    } else {
      this.allCars.push(cloneCar(car));
    }
    this.updateCarSelectItems();
  }

  onCopyCar() {
    if (!this.editingCar || !this.isConfigValid()) return;
    this.saveAsNew();
  }

  onDeleteCar() {
    if (!this.editingCar || this.editingCar.entity_id === "new") return;
    this.showDeleteConfirm = true;
  }

  onCancelDelete() {
    this.showDeleteConfirm = false;
  }

  onConfirmDelete() {
    this.showDeleteConfirm = false;
    if (!this.editingCar || this.editingCar.entity_id === "new") return;
    this.isSaving = true;
    const idToDelete = this.editingCar.entity_id;
    this.dataService.deleteCar(idToDelete).subscribe({
      next: () => {
        this.isSaving = false;
        this.isEditMode = false;
        const nextCar = getNextSelectionAfterDelete(this.allCars, idToDelete);
        this.allCars = this.allCars.filter((c) => c.entity_id !== idToDelete);
        this.updateCarSelectItems();
        if (nextCar) {
          this.selectCar(nextCar);
          this.router.navigate([], {
            relativeTo: this.route,
            queryParams: { id: nextCar.entity_id },
            queryParamsHandling: "merge",
            replaceUrl: true,
          });
        } else {
          this.startNewCar();
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.logger.error("Failed to delete slotcar", err);
        this.isSaving = false;
        this.cdr.detectChanges();
      },
    });
  }

  undo() {
    if (!this.isEditMode) return;
    this.undoManager.undo();
  }
  redo() {
    if (!this.isEditMode) return;
    this.undoManager.redo();
  }
  onInputFocus() {
    this.undoManager.onInputFocus();
  }
  onInputChange() {
    this.isDirty = true;
    this.undoManager.onInputChange();
    this.cdr.detectChanges();
  }
  onInputBlur() {
    this.undoManager.onInputBlur();
    this.cdr.detectChanges();
  }
  captureState() {
    this.undoManager.captureState();
    this.cdr.detectChanges();
  }

  onScaleChange(value: string) {
    if (!this.editingCar) return;
    this.editingCar.scale = value || "";
    this.captureState();
  }

  onModifiedChange(value: boolean) {
    if (!this.editingCar) return;
    this.editingCar.modified = value === true;
    this.captureState();
  }

  /** A car's value for one of the user's fields ("" when not set). */
  customValue(field: CarField): string {
    return this.editingCar?.customValues[field.entity_id] ?? "";
  }

  isChecked(field: CarField): boolean {
    return this.customValue(field) === "true";
  }

  choicesFor(field: CarField): string[] {
    return choiceOptions(field, this.customValue(field));
  }

  /** Typing in a text or number field: part of the focus/blur undo step. */
  onCustomInput(field: CarField, value: string | number | null) {
    if (!this.editingCar) return;
    setCustomValue(this.editingCar, field.entity_id, value);
    this.onInputChange();
  }

  /** A yes/no or choice field: one undo step per change. */
  onCustomPick(field: CarField, value: string | boolean | null) {
    if (!this.editingCar) return;
    setCustomValue(
      this.editingCar,
      field.entity_id,
      value === true ? "true" : value,
    );
    this.captureState();
  }

  /** Car Stats (#1210), starting with the car on screen. */
  openCarStats() {
    const carId = this.selectedCarId;
    this.router.navigate(["/car-stats"], {
      queryParams: carId ? { carId } : {},
    });
  }

  openFieldManager() {
    // Leave the field being edited first, so typing can't change it behind the dialog.
    (document.activeElement as HTMLElement | null)?.blur();
    this.isFieldManagerOpen = true;
  }

  closeFieldManager() {
    this.isFieldManagerOpen = false;
  }

  onFieldsChange(fields: CarField[]) {
    this.carFields = sortCarFields(fields);
    this.cdr.detectChanges();
  }

  /**
   * The server removed the field's values from every car; drop them here
   * too, without counting that as an edit of this car.
   */
  onFieldDeleted(fieldId: string) {
    this.allCars = this.allCars.map((c) => withoutField(c, fieldId));
    if (this.originalCar)
      this.originalCar = withoutField(this.originalCar, fieldId);
    if (this.selectedCar)
      this.selectedCar = withoutField(this.selectedCar, fieldId);
    if (this.editingCar && fieldId in this.editingCar.customValues) {
      const next = { ...this.editingCar.customValues };
      delete next[fieldId];
      this.editingCar.customValues = next;
      // Without other edits, the car now matches what the server has:
      // start undo from here, so it doesn't count as an unsaved change.
      if (this.originalCar && areCarsEqual(this.editingCar, this.originalCar)) {
        this.isDirty = false;
        this.undoManager.resetTracking(this.editingCar);
      }
    }
    this.cdr.detectChanges();
  }

  private autoSaveCar(): Promise<any> {
    if (!this.editingCar || this.isNameInvalid) {
      return Promise.resolve();
    }
    return this.lifecycle.scheduleAutoSave(() => this.updateCar(false, true));
  }

  onBackClicked() {
    if (this.isConfigValid() && this.isDirtyState()) {
      this.navigateBackOnSave = true;
      this.updateCar();
    } else {
      this.onBack();
    }
  }

  isConfigValid(): boolean {
    return !this.isNameInvalid;
  }

  isDirtyState(): boolean {
    if (!this.undoManager) return false;
    const umChanges = this.undoManager.hasChanges();
    if (!this.editingCar || !this.originalCar) return umChanges;
    const manualChanges = !areCarsEqual(this.editingCar, this.originalCar);
    return this.isDirty || umChanges || manualChanges;
  }

  onBack() {
    this.isNavigationApproved = true;
    const returnUrl = this.route.snapshot.queryParamMap.get("returnUrl");
    if (returnUrl) {
      this.router.navigateByUrl(returnUrl);
    } else {
      this.router.navigate(["/raceday-setup"]);
    }
  }

  hasChanges(): boolean {
    return this.isDirtyState();
  }

  getUnsavedReasons(): string[] {
    return getCarUnsavedReasons(
      this.editingCar,
      this.allCars,
      this.isSaving,
      this.isDirtyState(),
    );
  }

  get discardMessage(): string {
    return this.lifecycle.discardMessage;
  }

  confirmDiscard(): Promise<boolean> {
    return this.lifecycle.confirmDiscard();
  }

  onConfirmDiscard() {
    this.lifecycle.onConfirmDiscard(() => {
      if (this.originalCar) {
        this.editingCar = cloneCar(this.originalCar);
        this.undoManager.resetTracking(this.editingCar);
      } else if (this.allCars.length > 0) {
        this.selectCar(this.allCars[0]);
      }
      this.isEditMode = false;
    });
  }

  onCancelDiscard() {
    this.lifecycle.onCancelDiscard();
  }

  updateCar(
    isSaveAsNew: boolean = false,
    isAutoSave: boolean = false,
  ): Promise<any> {
    if (!this.editingCar || this.isSaving) return Promise.resolve();
    if (!isSaveAsNew && !this.isDirtyState()) return Promise.resolve();
    this.isSaving = true;
    this.isAutoSaving = isAutoSave;
    return this.saveCarData(isSaveAsNew, isAutoSave);
  }

  private saveCarData(isSaveAsNew: boolean, isAutoSave: boolean): Promise<any> {
    if (!this.editingCar) return Promise.resolve();
    const carToSend = cloneCar(this.editingCar);
    const wasNew = isSaveAsNew || carToSend.entity_id === "new";
    if (wasNew) {
      carToSend.entity_id = "new";
    }
    const obs =
      carToSend.entity_id === "new"
        ? this.dataService.createCar(carToSend)
        : this.dataService.updateCar(carToSend.entity_id, carToSend);

    return new Promise((resolve, reject) => {
      obs.subscribe({
        next: (result) => {
          this.handleSaveSuccess(result, carToSend, wasNew, isAutoSave);
          resolve(result);
        },
        error: (err) => {
          this.handleSaveError(err, isAutoSave);
          reject(err);
        },
      });
    });
  }

  private handleSaveSuccess(
    result: any,
    carToSend: Car,
    wasNew: boolean,
    isAutoSave: boolean,
  ) {
    this.isSaving = false;
    this.isAutoSaving = false;
    const savedId = result?.entity_id || carToSend.entity_id;
    this.navigationService.setLastEditedId(NAV_KEY, savedId);

    const savedCar = cloneCar(carToSend);
    savedCar.entity_id = savedId;

    if (wasNew) {
      this.isEditMode = true;
      this.isPreservingEditModeOnNavigation = true;
      this.defaultCarName = savedCar.name;
    } else if (!isAutoSave || this.transitionToReadOnlyOnSave) {
      this.isEditMode = false;
      this.transitionToReadOnlyOnSave = false;
    }

    if (this.editingCar) {
      this.editingCar.entity_id = savedId;
      this.isDirty = false;
      this.selectedCar = cloneCar(savedCar);
      this.originalCar = cloneCar(savedCar);
      this.selectedCarId = savedId;
      this.undoManager.resetTracking(savedCar);
    }
    this.upsertInList(this.editingCar ? this.editingCar : savedCar);

    this.cdr.detectChanges();
    if (wasNew) {
      this.focusNameInput();
      this.handleNewCarNavigation(savedId, isAutoSave);
    }
    if (this.navigateBackOnSave) {
      this.navigateBackOnSave = false;
      this.onBack();
    }
    if (this.isDirtyState()) {
      this.autoSaveCar();
    }
    this.refreshCarList();
  }

  private handleNewCarNavigation(newId: string, isAutoSave: boolean) {
    const queryParams = {
      id: newId,
      returnUrl: this.route.snapshot.queryParamMap.get("returnUrl"),
    };
    if (isAutoSave) {
      const url = this.router.serializeUrl(
        this.router.createUrlTree(["/car-editor"], { queryParams }),
      );
      this.location.replaceState(url);
    } else {
      this.router.navigate(["/car-editor"], { queryParams, replaceUrl: true });
    }
  }

  private handleSaveError(err: any, isAutoSave: boolean) {
    this.logger.error("Failed to save slotcar", err);
    if (!isAutoSave) {
      if (err.status === 409) {
        alert(this.translationService.translate("CE_ERROR_NAME_EXISTS"));
      } else {
        alert(
          this.translationService.translate("CE_ERROR_SAVE_FAILED") +
            (err.error || err.message),
        );
      }
    }
    this.isSaving = false;
    this.isAutoSaving = false;
    this.transitionToReadOnlyOnSave = false;
    this.cdr.detectChanges();
  }

  private refreshCarList() {
    this.dataService.getCars().subscribe({
      next: (cars) => {
        this.setAllCars((cars as any[]) || []);
        this.cdr.detectChanges();
      },
      error: (err) => this.logger.error("Failed to refresh slotcars", err),
    });
  }

  saveAsNew() {
    if (!this.editingCar || this.isSaving) return;
    this.editingCar.name = generateUniqueCarName(
      this.editingCar.name,
      this.allCars,
      true,
    );
    this.isEditMode = true;
    this.isPreservingEditModeOnNavigation = true;
    this.defaultCarName = this.editingCar.name;
    this.focusNameInput();
    this.updateCar(true);
  }

  getHelpSteps(): GuideStep[] {
    return getCarEditorHelpSteps(this.translationService);
  }

  startHelp() {
    this.helpService.startGuide(this.getHelpSteps());
  }
}

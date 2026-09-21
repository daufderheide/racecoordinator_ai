import {
  AfterViewChecked,
  ChangeDetectorRef,
  Component,
  computed,
  HostListener,
  input,
  output,
  ViewChild,
} from "@angular/core";
import { BrowserNavigationComponent } from "@app/components/shared/browser-navigation/browser-navigation.component";
import {
  CustomOptionComponent,
  CustomSelectComponent,
} from "@app/components/shared/custom-select/custom-select.component";
import { ToolbarComponent } from "@app/components/shared/toolbar/toolbar.component";
import { UndoManager } from "@app/components/shared/undo-redo-controls/undo-manager";
import { Settings } from "@app/models/settings";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { GuideStep } from "@app/services/help.service";

@Component({
  standalone: true,
  selector: "app-editor-title",
  templateUrl: "./editor-title.component.html",
  styleUrls: ["./editor-title.component.css"],
  imports: [
    ToolbarComponent,
    TranslatePipe,
    BrowserNavigationComponent,
    CustomSelectComponent,
    CustomOptionComponent,
  ],
})
export class EditorTitleComponent implements AfterViewChecked {
  @ViewChild(ToolbarComponent) toolbar!: ToolbarComponent;
  titleKey = input("");
  itemName = input<string | undefined>(undefined);
  trimmedItemName = computed(() => {
    const name = this.itemName();
    return name && name.trim() ? name.trim() : "";
  });
  items = input<{ id: string; name: string }[]>([]);
  selectedId = input<string | undefined>(undefined);
  isEditMode = input(false);
  showEdit = input(false);
  disabledEdit = input(false);
  showExpandCollapse = input(false);
  allExpanded = input(false);
  undoManager = input<UndoManager<any>>();
  showUndo = input(true);
  showRedo = input(true);
  showHelp = input(true);
  showCopy = input(false);
  disabledCopy = input(false);
  copyDisabledTooltipKey = input("");
  showAdd = input(false);
  showDelete = input(false);
  disabledDelete = input(false);
  showRegenerate = input(false);
  disabledRegenerate = input(false);
  showLaneCheck = input(false);
  disabledLaneCheck = input(false);
  isHeatsEqual = input<boolean | undefined>(undefined);
  showImport = input(false);
  showImportRc1 = input(false);
  showExport = input(false);
  importTitleKey = input("DBM_BTN_IMPORT");
  importRc1TitleKey = input("AM_BTN_IMPORT_RC1_ROTATION");
  importRc1Icon = input("file_download");
  exportTitleKey = input("DBM_BTN_EXPORT");
  disabledImport = input(false);
  disabledImportRc1 = input(false);
  disabledExport = input(false);
  marginTop = input<number>(0);
  marginBottom = input<number>(0);
  isSaving = input(false);

  showZoom = input(false);
  zoomLevel = input(100);

  helpSteps = input<GuideStep[]>([]);
  helpTitle = input("");
  helpRecordName = input<keyof Settings>();

  help = output<void>();
  copy = output<void>();
  add = output<void>();
  delete = output<void>();
  regenerate = output<void>();
  laneCheck = output<void>();
  import = output<void>();
  importRc1 = output<void>();
  export = output<void>();
  zoomLevelChange = output<number>();
  selectedIdChange = output<string>();
  edit = output<void>();
  expandCollapse = output<void>();

  currentIndex = computed(() => {
    const currentId = this.selectedId();
    const list = this.items();
    if (!currentId || !list || list.length === 0) return -1;
    return list.findIndex((i) => i.id === currentId);
  });

  hasPrevious = computed(() => {
    return this.currentIndex() > 0;
  });

  hasNext = computed(() => {
    const idx = this.currentIndex();
    return idx >= 0 && idx < this.items().length - 1;
  });

  constructor(private cdr: ChangeDetectorRef) {}

  ngAfterViewChecked() {
    // This can help with NG0100 when translations load late
    this.cdr.detectChanges();
  }

  onEdit() {
    this.edit.emit();
  }

  onSelectionChange(id: string) {
    this.selectedIdChange.emit(id);
  }

  selectPrevious() {
    if (this.isEditMode() || !this.hasPrevious()) return;
    const prevItem = this.items()[this.currentIndex() - 1];
    if (prevItem) {
      this.onSelectionChange(prevItem.id);
    }
  }

  selectNext() {
    if (this.isEditMode() || !this.hasNext()) return;
    const nextItem = this.items()[this.currentIndex() + 1];
    if (nextItem) {
      this.onSelectionChange(nextItem.id);
    }
  }

  onExpandCollapse() {
    this.expandCollapse.emit();
  }

  @HostListener("window:keydown", ["$event"])
  handleKeyDown(event: KeyboardEvent) {
    if (this.isEditMode()) return;

    // Suppress if focus is in an input or editable field
    const activeEl = document.activeElement;
    if (
      activeEl &&
      (activeEl.tagName === "INPUT" ||
        activeEl.tagName === "TEXTAREA" ||
        activeEl.tagName === "SELECT" ||
        (activeEl as HTMLElement).isContentEditable)
    ) {
      return;
    }

    // Suppress if any modal dialog is open
    if (document.querySelector(".modal-backdrop")) {
      return;
    }

    // Never interfere with system shortcuts (Cmd/Ctrl)
    if (event.metaKey || event.ctrlKey) return;

    const key = event.key.toLowerCase();

    // Next Object: ArrowRight, ], e
    if (event.key === "ArrowRight" || event.key === "]" || key === "e") {
      if (this.hasNext()) {
        event.preventDefault();
        this.selectNext();
      }
      return;
    }

    // Previous Object: ArrowLeft, [, q
    if (event.key === "ArrowLeft" || event.key === "[" || key === "q") {
      if (this.hasPrevious()) {
        event.preventDefault();
        this.selectPrevious();
      }
      return;
    }

    // Toggle Expand/Collapse All: x
    if (key === "x" && this.showExpandCollapse()) {
      event.preventDefault();
      this.onExpandCollapse();
      return;
    }
  }

  onHelp() {
    this.help.emit();
  }

  onCopy() {
    this.copy.emit();
  }

  onAdd() {
    this.add.emit();
  }

  onDelete() {
    this.delete.emit();
  }

  onRegenerate() {
    this.regenerate.emit();
  }

  onLaneCheck() {
    this.laneCheck.emit();
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

  onZoomLevelChange(level: number) {
    this.zoomLevelChange.emit(level);
  }
}

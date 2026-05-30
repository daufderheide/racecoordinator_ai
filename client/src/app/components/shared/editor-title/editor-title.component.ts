import {
  AfterViewChecked,
  ChangeDetectorRef,
  Component,
  input,
  output,
  ViewChild,
} from "@angular/core";
import { Router } from "@angular/router";
import { BackButtonComponent } from "@app/components/shared/back-button/back-button.component";
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
  imports: [BackButtonComponent, ToolbarComponent, TranslatePipe],
})
export class EditorTitleComponent implements AfterViewChecked {
  @ViewChild(ToolbarComponent) toolbar!: ToolbarComponent;
  titleKey = input("");
  backRoute = input("");
  backQueryParams = input<any>({});
  backConfirm = input(false);
  backConfirmTitle = input("");
  backConfirmMessage = input("");
  undoManager = input<UndoManager<any>>();
  showUndo = input(true);
  showRedo = input(true);
  showBack = input(true);
  showHelp = input(true);
  showCopy = input(false);
  showAdd = input(false);
  showDelete = input(false);
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
  importRc1Icon = input("upload_file");
  exportTitleKey = input("DBM_BTN_EXPORT");
  disabledImport = input(false);
  disabledImportRc1 = input(false);
  disabledExport = input(false);
  marginTop = input<number>(60);
  marginBottom = input<number>(40);
  isSaving = input(false);
  helpSteps = input<GuideStep[]>([]);
  helpTitle = input("");
  helpRecordName = input<keyof Settings>();

  back = output<void>();
  help = output<void>();
  copy = output<void>();
  add = output<void>();
  delete = output<void>();
  regenerate = output<void>();
  laneCheck = output<void>();
  import = output<void>();
  importRc1 = output<void>();
  export = output<void>();

  constructor(
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  ngAfterViewChecked() {
    // This can help with NG0100 when translations load late
    this.cdr.detectChanges();
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

  onBack() {
    this.back.emit();
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
}

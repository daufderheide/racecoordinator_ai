import {
  Component,
  EventEmitter,
  Input,
  Output,
  ViewChild,
} from "@angular/core";
import { Router } from "@angular/router";
import { ToolbarComponent } from "src/app/components/shared/toolbar/toolbar.component";
import { UndoManager } from "src/app/components/shared/undo-redo-controls/undo-manager";
import { Settings } from "src/app/models/settings";
import { GuideStep } from "src/app/services/help.service";
import { BackButtonComponent } from "../back-button/back-button.component";
import { ToolbarComponent as ToolbarComponent_1 } from "../toolbar/toolbar.component";
import { TranslatePipe } from "src/app/pipes/translate.pipe";

@Component({
  standalone: true,
  selector: "app-editor-title",
  templateUrl: "./editor-title.component.html",
  styleUrls: ["./editor-title.component.css"],
  imports: [BackButtonComponent, ToolbarComponent_1, TranslatePipe],
})
export class EditorTitleComponent {
  @ViewChild(ToolbarComponent) toolbar!: ToolbarComponent;
  @Input() titleKey: string = "";
  @Input() backRoute: string = "";
  @Input() backQueryParams: any = {};
  @Input() backConfirm: boolean = false;
  @Input() backConfirmTitle: string = "";
  @Input() backConfirmMessage: string = "";
  @Input() undoManager!: UndoManager<any>;
  @Input() showUndo: boolean = true;
  @Input() showRedo: boolean = true;
  @Input() showHelp: boolean = true;
  @Input() showCopy: boolean = false;
  @Input() showAdd: boolean = false;
  @Input() showDelete: boolean = false;
  @Input() isSaving: boolean = false;
  @Input() helpSteps: GuideStep[] = [];
  @Input() helpTitle: string = "";
  @Input() helpRecordName?: keyof Settings;

  @Output() help = new EventEmitter<void>();
  @Output() back = new EventEmitter<void>();
  @Output() copy = new EventEmitter<void>();
  @Output() add = new EventEmitter<void>();
  @Output() delete = new EventEmitter<void>();

  constructor(private router: Router) {}

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

  onBack() {
    if (this.back.observed) {
      this.back.emit();
    } else {
      this.router.navigate([this.backRoute], {
        queryParams: this.backQueryParams,
      });
    }
  }
}

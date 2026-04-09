import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  Output,
} from "@angular/core";
import { AnalyticsService } from "src/app/analytics.service";
import { UndoManager } from "src/app/components/shared/undo-redo-controls/undo-manager";
import { TranslationService } from "src/app/services/translation.service";

@Component({
  selector: "app-toolbar",
  templateUrl: "./toolbar.component.html",
  styleUrls: ["./toolbar.component.css"],
  standalone: false,
})
export class ToolbarComponent {
  @Input() showAdd = false;
  @Input() showEdit = false;
  @Input() showHelp = false;
  @Input() showDelete = false;
  @Input() showCopy = false;
  @Input() showUndo = false;
  @Input() showRedo = false;
  @Input() isSaving = false;
  @Input() undoManager?: UndoManager<any>;

  showAnalyticsModal = false;
  analyticsModalTitle = "";
  analyticsModalMessage = "";

  constructor(
    private analyticsService: AnalyticsService,
    private translationService: TranslationService,
    private cdr: ChangeDetectorRef,
  ) {}

  @Output() add = new EventEmitter<void>();
  @Output() edit = new EventEmitter<void>();
  @Output() copy = new EventEmitter<void>();
  @Output() help = new EventEmitter<void>();
  @Output() delete = new EventEmitter<void>();

  onAdd() {
    this.add.emit();
  }

  onEdit() {
    this.edit.emit();
  }

  onHelp() {
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
    this.undoManager?.undo();
  }

  redo() {
    this.undoManager?.redo();
  }

  get canUndo(): boolean {
    return (this.undoManager?.undoStackCount ?? 0) > 0;
  }

  get canRedo(): boolean {
    return (this.undoManager?.redoStackCount ?? 0) > 0;
  }
}

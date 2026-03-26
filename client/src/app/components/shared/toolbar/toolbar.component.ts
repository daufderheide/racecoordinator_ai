import { Component, EventEmitter, Input, Output } from '@angular/core';
import { UndoManager } from '../undo-redo-controls/undo-manager';

@Component({
  selector: 'app-toolbar',
  templateUrl: './toolbar.component.html',
  styleUrls: ['./toolbar.component.css'],
  standalone: false
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

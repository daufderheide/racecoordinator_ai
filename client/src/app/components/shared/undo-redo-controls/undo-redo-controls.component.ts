import { Component, Input } from '@angular/core';
import { UndoManager } from './undo-manager';

@Component({
  selector: 'app-undo-redo-controls',
  templateUrl: './undo-redo-controls.component.html',
  styleUrls: ['./undo-redo-controls.component.css'],
  standalone: false
})
export class UndoRedoControlsComponent {
  @Input() manager?: UndoManager<any>;

  undo() {
    this.manager?.undo();
  }

  redo() {
    this.manager?.redo();
  }

  get canUndo(): boolean {
    return this.manager?.canUndo() ?? false;
  }

  get canRedo(): boolean {
    return this.manager?.canRedo() ?? false;
  }
}

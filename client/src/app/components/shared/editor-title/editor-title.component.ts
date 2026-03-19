import { Component, Input, Output, EventEmitter } from '@angular/core';
import { UndoManager } from '../undo-redo-controls/undo-manager';
import { Router } from '@angular/router';

@Component({
  selector: 'app-editor-title',
  templateUrl: './editor-title.component.html',
  styleUrls: ['./editor-title.component.css'],
  standalone: false
})
export class EditorTitleComponent {
  @Input() titleKey: string = '';
  @Input() backRoute: string = '';
  @Input() backQueryParams: any = {};
  @Input() backConfirm: boolean = false;
  @Input() backConfirmTitle: string = '';
  @Input() backConfirmMessage: string = '';
  @Input() undoManager!: UndoManager<any>;
  @Input() showUndo: boolean = true;
  @Input() showRedo: boolean = true;
  @Input() showHelp: boolean = true;

  @Output() help = new EventEmitter<void>();
  @Output() back = new EventEmitter<void>();

  constructor(private router: Router) {}

  onHelp() {
    this.help.emit();
  }

  onBack() {
    if (this.back.observed) {
      this.back.emit();
    } else {
      this.router.navigate([this.backRoute], { queryParams: this.backQueryParams });
    }
  }
}

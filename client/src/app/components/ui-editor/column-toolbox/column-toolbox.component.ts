import { DragDropModule } from "@angular/cdk/drag-drop";
import { CommonModule } from "@angular/common";
import {
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from "@angular/core";
import { Settings } from "@app/models/settings";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { TranslationService } from "@app/services/translation.service";

@Component({
  standalone: true,
  selector: "app-column-toolbox",
  templateUrl: "./column-toolbox.component.html",
  styleUrl: "./column-toolbox.component.css",
  imports: [CommonModule, TranslatePipe, DragDropModule],
})
export class ColumnToolboxComponent {
  availableColumns = input<{ key: string; label: string }[]>([]);
  scale = input<number>(1);
  settings = input<Settings | undefined>(undefined);
  isPracticeLayoutEditor = input<boolean>(false);
  settingsChanged = output<void>();

  isMinimized = signal<boolean>(false);
  columnEditorPosition = signal<{ x: number; y: number }>({ x: 0, y: 0 });

  constructor() {
    effect(
      () => {
        const settings = this.settings();
        this.isMinimized.set(settings?.columnEditorMinimized ?? false);
        this.columnEditorPosition.set({
          x: settings?.columnEditorPositionX ?? 0,
          y: settings?.columnEditorPositionY ?? 0,
        });
      },
      { allowSignalWrites: true },
    );
  }

  private translationService = inject(TranslationService);

  toggleMinimize(event: Event) {
    event.stopPropagation();
    const settings = this.settings();
    if (settings) {
      settings.columnEditorMinimized = !settings.columnEditorMinimized;
      this.isMinimized.set(settings.columnEditorMinimized);
      this.settingsChanged.emit();
    }
  }

  onDragEnded(event: any) {
    const pos = event.source.getFreeDragPosition();
    const settings = this.settings();
    if (settings) {
      settings.columnEditorPositionX = pos.x;
      settings.columnEditorPositionY = pos.y;
      this.columnEditorPosition.set(pos);
      this.settingsChanged.emit();
    }
  }

  sortedAvailableColumns = computed(() => {
    return [...this.availableColumns()].sort((a, b) => {
      const labelA = this.translationService.translate(a.label).toUpperCase();
      const labelB = this.translationService.translate(b.label).toUpperCase();
      return labelA.localeCompare(labelB);
    });
  });

  onDragStart(event: DragEvent, col: { key: string; label: string }) {
    if (event.dataTransfer) {
      event.dataTransfer.setData(
        "application/json",
        JSON.stringify({
          type: "new-column",
          key: col.key,
          label: col.label,
        }),
      );
      event.dataTransfer.effectAllowed = "copy";
    }
  }
}

import { DragDropModule } from "@angular/cdk/drag-drop";
import { CommonModule } from "@angular/common";
import { Component, computed, inject, input, signal } from "@angular/core";
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
  isMinimized = signal<boolean>(false);
  private translationService = inject(TranslationService);

  toggleMinimize(event: Event) {
    event.stopPropagation();
    this.isMinimized.update((val) => !val);
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

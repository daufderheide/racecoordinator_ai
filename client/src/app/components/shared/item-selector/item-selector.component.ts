import {
  Component,
  computed,
  ElementRef,
  input,
  output,
  signal,
  ViewChild,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Router } from "@angular/router";
import { AssetPreviewComponent } from "@app/components/shared/asset-preview/asset-preview.component";
import { normalizeAssetType } from "@app/models/asset";
import { TranslatePipe } from "@app/pipes/translate.pipe";

@Component({
  standalone: true,
  selector: "app-item-selector",
  templateUrl: "./item-selector.component.html",
  styleUrls: ["./item-selector.component.css"],
  imports: [FormsModule, AssetPreviewComponent, TranslatePipe],
})
export class ItemSelectorComponent {
  @ViewChild("filePicker") filePicker?: ElementRef<HTMLInputElement>;

  visible = input(false);
  title = input<string>();
  items = input<any[]>([]);
  searchTerm = signal("");

  itemType = input<"image" | "image_set" | "audio" | "audio_set" | string>(
    "image",
  );

  isDragging = false;
  dragCounter = 0;

  filteredItems = computed(() => {
    let results = this.items();
    const type = this.itemType();

    // Filter by type if itemType is specified
    if (type) {
      const targetType = normalizeAssetType(type);
      results = results.filter(
        (item) => normalizeAssetType(item.type) === targetType,
      );
    }

    const term = this.searchTerm();
    if (!term) {
      return results;
    }

    const lowerTerm = term.toLowerCase();
    return results.filter(
      (item) => item.name && item.name.toLowerCase().includes(lowerTerm),
    );
  });

  select = output<any>();
  play = output<any>();
  close = output<void>();

  allowBrowse = input(true);
  filePicked = output<File>();

  acceptedTypes = computed(() => {
    const type = this.itemType();
    if (type === "audio" || type === "audio_set" || type === "sound") {
      return "audio/*,.mp3,.wav,.ogg,.m4a,.aac,.flac";
    }
    return "image/*,.png,.jpg,.jpeg,.gif,.webp,.svg";
  });

  constructor(private router: Router) {}

  onSelect(item: any) {
    this.select.emit(item);
  }

  onPlay(event: MouseEvent, item: any) {
    event.stopPropagation();
    event.stopImmediatePropagation();
    this.play.emit(item);
  }

  onDragEnter(event: DragEvent) {
    if (!this.allowBrowse()) return;
    event.preventDefault();
    event.stopPropagation();
    this.dragCounter++;
    this.isDragging = true;
  }

  onDragOver(event: DragEvent) {
    if (!this.allowBrowse()) return;
    event.preventDefault();
    event.stopPropagation();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = "copy";
    }
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent) {
    if (!this.allowBrowse()) return;
    event.preventDefault();
    event.stopPropagation();
    this.dragCounter--;
    if (this.dragCounter <= 0) {
      this.dragCounter = 0;
      this.isDragging = false;
    }
  }

  onDrop(event: DragEvent) {
    if (!this.allowBrowse()) return;
    event.preventDefault();
    event.stopPropagation();
    this.dragCounter = 0;
    this.isDragging = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      const file = files[0];
      this.filePicked.emit(file);
      this.onClose();
    }
  }

  onFileInput(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      input.value = "";
      this.filePicked.emit(file);
      this.onClose();
    }
  }

  triggerFilePicker() {
    this.filePicker?.nativeElement.click();
  }

  onClose() {
    this.close.emit();
  }
}

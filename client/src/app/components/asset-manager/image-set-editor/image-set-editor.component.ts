import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
} from "@angular/core";
import { DataService } from "src/app/data.service";

import { TranslationService } from "src/app/services/translation.service";

import { IAssetMessage, ISaveImageSetEntry } from "src/app/proto/antigravity";
import { NgIf, NgFor } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { ImageSelectorComponent } from "../../shared/image-selector/image-selector.component";
import { RacedayComponent } from "../../raceday/raceday.component";
import { TranslatePipe } from "src/app/pipes/translate.pipe";

@Component({
  standalone: true,
  selector: "app-image-set-editor",
  templateUrl: "./image-set-editor.component.html",
  styleUrls: ["./image-set-editor.component.css"],
  imports: [
    NgIf,
    FormsModule,
    NgFor,
    ImageSelectorComponent,
    RacedayComponent,
    TranslatePipe,
  ],
})
export class ImageSetEditorComponent implements OnInit, OnChanges {
  @Input() visible = false;
  @Input() assetId?: string;
  @Input() initialName = "";
  @Input() initialEntries: ISaveImageSetEntry[] = [];
  @Input() allImages: any[] = [];

  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<IAssetMessage>();

  id = "image-set-editor-" + Math.random().toString(36).substr(2, 9);
  name = "";
  entries: ISaveImageSetEntry[] = [];
  isSaving = false;
  isDragging = false;
  private dragCounter = 0;

  constructor(
    private dataService: DataService,
    private translationService: TranslationService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.resetForm();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes["visible"]) {
      const wasVisible = changes["visible"].previousValue;
      const isVisible = changes["visible"].currentValue;

      if (isVisible && !wasVisible) {
        console.log("ImageSetEditor: Opening modal, resetting form");
        this.resetForm();
        this.dragCounter = 0;
        this.isDragging = false;
        this.cdr.detectChanges();
      }
    }
  }

  resetForm() {
    this.name = this.initialName || "";
    if (this.initialEntries && this.initialEntries.length > 0) {
      this.entries = this.initialEntries.map((e) => ({
        percentage: e.percentage,
        url: e.url,
        name: e.name,
        data: e.data,
      }));
    } else {
      this.entries = [];
    }
  }

  @HostListener("window:dragenter", ["$event"])
  onDragEnter(event: DragEvent) {
    if (!this.visible) return;
    // We don't stop propagation on window level usually, but we want to prevent default
    event.preventDefault();
    this.dragCounter++;
    this.isDragging = true;
    this.cdr.detectChanges();
  }

  @HostListener("window:dragover", ["$event"])
  onDragOver(event: DragEvent) {
    if (!this.visible) return;
    event.preventDefault();
    this.isDragging = true;
  }

  @HostListener("window:dragleave", ["$event"])
  onDragLeave(event: DragEvent) {
    if (!this.visible) return;
    event.preventDefault();
    this.dragCounter--;
    if (this.dragCounter <= 0) {
      this.isDragging = false;
      this.dragCounter = 0;
    }
    this.cdr.detectChanges();
  }

  @HostListener("window:drop", ["$event"])
  onDrop(event: DragEvent) {
    if (!this.visible) return;
    // If it reached window, it means it wasn't caught and stopped by the element handlers
    console.log("ImageSetEditor: window:drop caught (bubbled)");
    this.handleDropEvent(event);
  }

  // Element-level handlers to catch and stop propagation to parent AssetManager
  onElementDragEnter(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.dragCounter++;
    this.isDragging = true;
    this.cdr.detectChanges();
  }

  onElementDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
    this.cdr.detectChanges();
  }

  onElementDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.dragCounter--;
    if (this.dragCounter <= 0) {
      this.isDragging = false;
      this.dragCounter = 0;
    }
    this.cdr.detectChanges();
  }

  onElementDrop(event: DragEvent) {
    console.log("ImageSetEditor: element:drop triggered");
    event.preventDefault();
    event.stopPropagation();
    this.handleDropEvent(event);
  }

  private handleDropEvent(event: DragEvent) {
    this.isDragging = false;
    this.dragCounter = 0;
    this.cdr.detectChanges();

    if (event.dataTransfer) {
      if (event.dataTransfer.files.length > 0) {
        console.log(
          `ImageSetEditor: Processing ${event.dataTransfer.files.length} files`,
        );
        this.handleFiles(event.dataTransfer.files);
      } else {
        // Check for internal drags (e.g. from library)
        const url = event.dataTransfer.getData("text/plain");
        if (url && (url.startsWith("http") || url.startsWith("/assets/"))) {
          console.log(`ImageSetEditor: Processing internal asset URL: ${url}`);
          this.handleInternalDrop(url);
        }
      }
    }
  }

  handleInternalDrop(url: string) {
    // Try to find asset name from URL
    let entryName = url.split("/").pop() || "New Entry";
    if (entryName.includes("_")) {
      entryName = entryName.split("_").slice(1).join("_"); // Strip ID prefix
    }

    this.entries.push({
      percentage: 100,
      url: url,
      name: entryName,
      data: new Uint8Array(),
    });
    this.recalculatePercentages();
    this.cdr.detectChanges();
  }

  handleFiles(files: FileList) {
    const fileArray = Array.from(files).filter((f) =>
      f.type.startsWith("image/"),
    );
    if (fileArray.length === 0) {
      console.warn("ImageSetEditor: No image files found in drop");
      return;
    }

    // Sort files to help with sequence detection
    fileArray.sort((a, b) =>
      a.name.localeCompare(b.name, undefined, {
        numeric: true,
        sensitivity: "base",
      }),
    );

    const newEntries: ISaveImageSetEntry[] = new Array(fileArray.length);
    let processedCount = 0;

    fileArray.forEach((file, index) => {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const bytes = new Uint8Array(e.target.result);

        // Read again for preview URL
        const previewReader = new FileReader();
        previewReader.onload = (pe: any) => {
          newEntries[index] = {
            percentage: 0,
            url: pe.target.result, // Use DataURL for local preview
            name: file.name,
            data: bytes,
          };
          processedCount++;
          if (processedCount === fileArray.length) {
            this.addDroppedEntries(newEntries);
          }
        };
        previewReader.readAsDataURL(file);
      };
      reader.readAsArrayBuffer(file);
    });
  }

  addDroppedEntries(newEntries: ISaveImageSetEntry[]) {
    console.log(`ImageSetEditor: Adding ${newEntries.length} entries to list`);
    // Add new entries to existing list
    this.entries = [...this.entries, ...newEntries];
    this.recalculatePercentages();
    this.cdr.detectChanges();
  }

  recalculatePercentages() {
    if (this.entries.length === 0) return;

    const extractNumber = (name: string): number | null => {
      // Look for the last numeric part in the name (e.g. "fuelgage_10" -> 10)
      // This is more robust as it avoids ID prefixes or timestamps
      const match = name.match(/(\d+)(?!.*\d)/);
      if (match) return parseInt(match[1], 10);
      return null;
    };

    const entriesWithNums = this.entries.map((e) => ({
      entry: e,
      num: extractNumber(e.name || ""),
    }));

    const allHaveNums = entriesWithNums.every((e) => e.num !== null);

    if (allHaveNums && this.entries.length > 1) {
      // Sort entries by their extracted number
      this.entries.sort((a, b) => {
        const numA = extractNumber(a.name || "") ?? -1;
        const numB = extractNumber(b.name || "") ?? -1;
        return numA - numB;
      });

      // TODO(aufderheide): Support two cases here, one where the _# values are sequential
      // and we need to calculate percentage values and one where the _# valeus are the
      // percentage values.
      const currentNums = this.entries.map(
        (e) => extractNumber(e.name || "") as number,
      );
      const min = Math.min(...currentNums);
      const max = Math.max(...currentNums);
      const range = max - min;

      this.entries.forEach((entry) => {
        const num = extractNumber(entry.name || "") as number;
        if (range === 0) {
          entry.percentage = 100;
        } else {
          entry.percentage = Math.round(((num - min) / range) * 100);
        }
      });
    } else {
      // Fallback to even distribution based on array order
      const count = this.entries.length;
      this.entries.forEach((entry, index) => {
        if (count === 1) {
          entry.percentage = 100;
        } else {
          entry.percentage = Math.round((index / (count - 1)) * 100);
        }
      });
    }
    this.cdr.detectChanges();
  }

  addEntry() {
    this.entries.push({
      percentage: 100,
      url: "",
      name: "",
      data: new Uint8Array(),
    });
    this.recalculatePercentages();
    this.cdr.detectChanges();
  }

  removeEntry(index: number) {
    this.entries.splice(index, 1);
    this.recalculatePercentages();
    this.cdr.detectChanges();
  }

  onCancel() {
    this.close.emit();
  }

  onSave() {
    if (!this.name || this.entries.length === 0) {
      alert(this.translationService.translate("AM_SET_EDITOR_ERR_REQUIRED"));
      return;
    }

    this.isSaving = true;
    this.dataService
      .saveImageSet(this.name, this.entries, this.assetId)
      .subscribe({
        next: (asset) => {
          this.isSaving = false;
          this.saved.emit(asset);
          this.close.emit();
        },
        error: (err) => {
          this.isSaving = false;
          console.error("Failed to save image set", err);
          alert("Error: " + err.message);
        },
      });
  }
}

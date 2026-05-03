import {
  ChangeDetectorRef,
  Component,
  effect,
  HostListener,
  input,
  OnDestroy,
  OnInit,
  output,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { AudioSelectorComponent } from "@app/components/shared/audio-selector/audio-selector.component";
import { DataService } from "@app/data.service";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { IAssetMessage, ISaveAudioSetEntry } from "@app/proto/antigravity";
import { LoggerService } from "@app/services/logger.service";
import { TranslationService } from "@app/services/translation.service";

@Component({
  standalone: true,
  selector: "app-audio-set-editor",
  templateUrl: "./audio-set-editor.component.html",
  styleUrls: ["./audio-set-editor.component.css"],
  imports: [FormsModule, AudioSelectorComponent, TranslatePipe],
})
export class AudioSetEditorComponent implements OnInit, OnDestroy {
  visible = input(false);
  assetId = input<string>();
  initialName = input("");
  initialEntries = input<ISaveAudioSetEntry[]>([]);
  allAudio = input<any[]>([]);

  close = output<void>();
  saved = output<IAssetMessage>();

  id = "audio-set-editor-" + Math.random().toString(36).substr(2, 9);
  name = "";
  entries: ISaveAudioSetEntry[] = [];
  isSaving = false;
  isDragging = false;
  private dragCounter = 0;
  private createdBlobUrls: Set<string> = new Set();

  constructor(
    private dataService: DataService,
    private translationService: TranslationService,
    private cdr: ChangeDetectorRef,
    private logger: LoggerService,
  ) {
    effect(() => {
      if (this.visible()) {
        this.logger.debug("AudioSetEditor: Opening modal, resetting form");
        this.resetForm();
        this.dragCounter = 0;
        this.isDragging = false;
        this.cdr.detectChanges();
      } else {
        this.cleanupBlobUrls();
      }
    });
  }

  ngOnInit() {
    this.resetForm();
  }

  ngOnDestroy() {
    this.cleanupBlobUrls();
  }

  cleanupBlobUrls() {
    this.createdBlobUrls.forEach((url) => URL.revokeObjectURL(url));
    this.createdBlobUrls.clear();
  }

  resetForm() {
    this.name = this.initialName() || "";
    const entries = this.initialEntries();
    if (entries && entries.length > 0) {
      this.entries = entries.map((e) => ({
        timeSeconds: e.timeSeconds,
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
    if (!this.visible()) return;
    event.preventDefault();
    this.dragCounter++;
    this.isDragging = true;
    this.cdr.detectChanges();
  }

  @HostListener("window:dragover", ["$event"])
  onDragOver(event: DragEvent) {
    if (!this.visible()) return;
    event.preventDefault();
    this.isDragging = true;
  }

  @HostListener("window:dragleave", ["$event"])
  onDragLeave(event: DragEvent) {
    if (!this.visible()) return;
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
    if (!this.visible()) return;
    this.logger.debug("AudioSetEditor: window:drop caught (bubbled)");
    this.handleDropEvent(event);
  }

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
    this.logger.debug("AudioSetEditor: element:drop triggered");
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
        this.logger.debug(
          `AudioSetEditor: Processing ${event.dataTransfer.files.length} files`,
        );
        this.handleFiles(event.dataTransfer.files);
      } else {
        const url = event.dataTransfer.getData("text/plain");
        if (url && (url.startsWith("http") || url.startsWith("/assets/"))) {
          this.logger.debug(
            `AudioSetEditor: Processing internal asset URL: ${url}`,
          );
          this.handleInternalDrop(url);
        }
      }
    }
  }

  handleInternalDrop(url: string) {
    let entryName = url.split("/").pop() || "New Entry";
    if (entryName.includes("_")) {
      entryName = entryName.split("_").slice(1).join("_");
    }

    this.entries.push({
      timeSeconds: 0,
      url: url,
      name: entryName,
      data: new Uint8Array(),
    });
    this.recalculateTimes();
    this.cdr.detectChanges();
  }

  handleFiles(files: FileList) {
    const fileArray = Array.from(files).filter(
      (f) =>
        f.type.startsWith("audio/") ||
        f.name.endsWith(".mp3") ||
        f.name.endsWith(".wav"),
    );
    if (fileArray.length === 0) {
      this.logger.warn("AudioSetEditor: No audio files found in drop");
      return;
    }

    fileArray.sort((a, b) =>
      a.name.localeCompare(b.name, undefined, {
        numeric: true,
        sensitivity: "base",
      }),
    );

    const newEntries: ISaveAudioSetEntry[] = new Array(fileArray.length);
    let processedCount = 0;

    fileArray.forEach((file, index) => {
      // Try to find a match in existing assets
      const existingAsset = this.allAudio().find((a) => a.name === file.name);

      const reader = new FileReader();
      reader.onload = (e: any) => {
        const bytes = new Uint8Array(e.target.result);

        let previewUrl = "";
        if (!existingAsset) {
          const blob = new Blob([bytes], { type: file.type || "audio/wav" });
          previewUrl = URL.createObjectURL(blob);
          this.createdBlobUrls.add(previewUrl);
        }

        newEntries[index] = {
          timeSeconds: 0,
          url: existingAsset ? existingAsset.url : previewUrl,
          name: file.name,
          data: existingAsset ? new Uint8Array() : bytes,
        };
        processedCount++;
        if (processedCount === fileArray.length) {
          this.addDroppedEntries(newEntries);
        }
      };
      reader.readAsArrayBuffer(file);
    });
  }

  addDroppedEntries(newEntries: ISaveAudioSetEntry[]) {
    this.logger.debug(
      `AudioSetEditor: Adding ${newEntries.length} entries to list`,
    );
    this.entries = [...this.entries, ...newEntries];
    this.recalculateTimes();
    this.cdr.detectChanges();
  }

  recalculateTimes() {
    if (this.entries.length === 0) return;

    const extractNumber = (name: string): number | null => {
      // Strip extension before matching digits to avoid picking up '3' from '.mp3'
      const baseName = name.replace(/\.[^/.]+$/, "");
      const matches = baseName.match(/\d+/g);
      if (matches && matches.length > 0) {
        return parseInt(matches[matches.length - 1], 10);
      }
      return null;
    };

    this.entries.forEach((entry) => {
      const num = extractNumber(entry.name || "");
      if (num !== null) {
        entry.timeSeconds = num;
      }
    });

    // Sort by time descending
    this.entries.sort((a, b) => (b.timeSeconds || 0) - (a.timeSeconds || 0));
    this.cdr.detectChanges();
  }

  addEntry() {
    this.entries.push({
      timeSeconds: 0,
      url: "",
      name: "",
      data: new Uint8Array(),
    });
    this.cdr.detectChanges();
  }

  removeEntry(index: number) {
    this.entries.splice(index, 1);
    this.cdr.detectChanges();
  }

  onCancel() {
    this.close.emit();
  }

  onSave() {
    if (!this.name || this.entries.length === 0) {
      alert(
        this.translationService.translate("AM_AUDIO_SET_EDITOR_ERR_REQUIRED"),
      );
      return;
    }

    this.isSaving = true;

    // Sanitize entries to remove blob URLs before sending to server
    const sanitizedEntries = this.entries.map((e) => ({
      ...e,
      url: e.url?.startsWith("blob:") ? "" : e.url,
    }));

    this.dataService
      .saveAudioSet(this.name, sanitizedEntries, this.assetId())
      .subscribe({
        next: (asset) => {
          this.isSaving = false;
          this.saved.emit(asset);
          this.close.emit();
        },
        error: (err) => {
          this.isSaving = false;
          this.logger.error("Failed to save audio set", err);
          alert("Error: " + err.message);
        },
      });
  }
}

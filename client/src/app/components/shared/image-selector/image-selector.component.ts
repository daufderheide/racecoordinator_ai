import { Component, Input, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { DataService } from 'src/app/data.service';

@Component({
  selector: 'app-image-selector',
  templateUrl: './image-selector.component.html',
  styleUrl: './image-selector.component.css',
  standalone: false
})
export class ImageSelectorComponent {
  @Input() label?: string;
  @Input() imageUrl?: string;
  @Input() assets: any[] = [];
  @Input() size: 'small' | 'medium' | 'large' = 'medium';

  @Output() imageUrlChange = new EventEmitter<string>();
  @Output() uploadStarted = new EventEmitter<void>();
  @Output() uploadFinished = new EventEmitter<void>();

  isDragging = false;
  isUploading = false;
  showSelector = false;
  pendingPreview: string | null = null;

  constructor(
    private dataService: DataService,
    private cdr: ChangeDetectorRef
  ) { }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      const file = files[0];

      // Show preview immediately
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.pendingPreview = e.target.result;
        this.cdr.detectChanges();
      };
      reader.readAsDataURL(file);

      // Upload file
      this.uploadFile(file);
    }
  }

  private uploadFile(file: File) {
    this.isUploading = true;
    this.uploadStarted.emit();

    const reader = new FileReader();
    reader.onload = (e: any) => {
      const bytes = new Uint8Array(e.target.result);
      this.dataService.uploadAsset(file.name, 'image', bytes).subscribe({
        next: (asset) => {
          this.isUploading = false;
          this.pendingPreview = null;
          this.imageUrl = asset.url ?? undefined;
          this.imageUrlChange.emit(this.imageUrl);
          this.uploadFinished.emit();
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Image upload failed', err);
          this.isUploading = false;
          this.pendingPreview = null;
          this.uploadFinished.emit();
          this.cdr.detectChanges();
        }
      });
    };
    reader.readAsArrayBuffer(file);
  }

  openSelector() {
    this.showSelector = true;
  }

  closeSelector() {
    this.showSelector = false;
  }

  onAssetSelected(asset: any) {
    this.imageUrl = asset.url;
    this.imageUrlChange.emit(this.imageUrl);
    this.closeSelector();
  }

  removeImage(event: MouseEvent) {
    event.stopPropagation();
    this.imageUrl = undefined;
    this.imageUrlChange.emit(this.imageUrl);
    this.cdr.detectChanges();
  }
}

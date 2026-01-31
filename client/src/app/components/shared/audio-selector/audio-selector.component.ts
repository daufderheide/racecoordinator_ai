import { Component, Input, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { DataService } from 'src/app/data.service';

@Component({
  selector: 'app-audio-selector',
  templateUrl: './audio-selector.component.html',
  styleUrls: ['./audio-selector.component.css'],
  standalone: false
})
export class AudioSelectorComponent {
  @Input() label: string = 'Audio';
  @Input() type: 'preset' | 'tts' | undefined = 'preset';
  @Output() typeChange = new EventEmitter<'preset' | 'tts'>();

  @Input() url?: string;
  @Output() urlChange = new EventEmitter<string>();

  @Input() text?: string = '';
  @Output() textChange = new EventEmitter<string>();

  @Input() assets: any[] = [];

  constructor(
    private dataService: DataService,
    private cdr: ChangeDetectorRef
  ) { }

  onTypeChange(newType: 'preset' | 'tts' | undefined) {
    if (newType) {
      this.type = newType;
      this.typeChange.emit(this.type);
    }
  }

  onUrlChange(newUrl: string) {
    this.url = newUrl;
    this.urlChange.emit(this.url);
  }

  onTextChange(newText: string) {
    this.text = newText;
    this.textChange.emit(this.text);
  }

  play() {
    if (this.type === 'preset' && this.url) {
      // Ensure absolute URL if it's relative
      let playableUrl = this.url;
      if (this.url.startsWith('/')) {
        playableUrl = `${this.dataService.serverUrl}${this.url}`;
      }
      const audio = new Audio(playableUrl);
      audio.play().catch(err => console.error('Error playing sound', err));
    } else if (this.type === 'tts' && this.text) {
      if ('speechSynthesis' in window) {
        // Cancel any current speech
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(this.text);
        window.speechSynthesis.speak(utterance);
      } else {
        console.warn('Text-to-speech not supported in this browser.');
      }
    }
  }

  // Drag & Drop
  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.uploadAndSetAsset(files[0]);
    }
  }

  private uploadAndSetAsset(file: File) {
    const reader = new FileReader();
    reader.onload = (e: any) => {
      const bytes = new Uint8Array(e.target.result);
      // Ensure we treat it as sound since this is an audio selector
      const assetType = 'sound';

      this.dataService.uploadAsset(file.name, assetType, bytes).subscribe({
        next: (asset) => {
          if (asset.url) {
            this.onUrlChange(asset.url);
            // Switch to preset mode if not already
            if (this.type !== 'preset') {
              this.onTypeChange('preset');
            }
          }
        },
        error: (err) => {
          console.error('Audio upload failed', err);
        }
      });
    };
    reader.readAsArrayBuffer(file);
  }
}

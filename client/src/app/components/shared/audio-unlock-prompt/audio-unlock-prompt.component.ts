import { CommonModule } from "@angular/common";
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
} from "@angular/core";
import { Subscription } from "rxjs";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { AudioService } from "@app/services/audio.service";
import { TranslationService } from "@app/services/translation.service";
import {
  isGlobalAudioUnlocked,
  isMobileDevice,
  unlockGlobalAudio,
} from "@app/utils/audio";

@Component({
  standalone: true,
  selector: "app-audio-unlock-prompt",
  imports: [CommonModule, TranslatePipe],
  template: `
    @if (showPrompt) {
      <div
        class="audio-unlock-banner"
        (pointerup)="onUnlockClick($event)"
        (touchend)="onUnlockClick($event)"
        (click)="onUnlockClick($event)"
        role="button"
        tabindex="0"
      >
        <span class="material-icons audio-unlock-icon">volume_off</span>
        <span class="audio-unlock-text">{{
          "RD_TAP_TO_ENABLE_AUDIO" | translate
        }}</span>
      </div>
    }
  `,
  styleUrls: ["./audio-unlock-prompt.component.css"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AudioUnlockPromptComponent implements OnInit, OnDestroy {
  isMobile: boolean = false;
  isUnlocked: boolean = false;
  private hasTriggeredConfirmation: boolean = false;
  private transSub?: Subscription;

  get showPrompt(): boolean {
    return this.isMobile && !this.isUnlocked;
  }

  constructor(
    private cdr: ChangeDetectorRef,
    private translationService: TranslationService,
    private audioService: AudioService,
  ) {}

  private onAudioUnlocked = () => {
    if (this.isMobile) {
      this.triggerUnlockConfirmation();
    } else {
      this.isUnlocked = true;
      this.cdr.markForCheck();
    }
  };

  ngOnInit(): void {
    this.isMobile = isMobileDevice();
    this.isUnlocked = isGlobalAudioUnlocked();
    if (this.isUnlocked) {
      this.hasTriggeredConfirmation = true;
    }

    if (typeof window !== "undefined") {
      window.addEventListener("rcai-audio-unlocked", this.onAudioUnlocked);
    }

    this.transSub = this.translationService
      .getTranslationsLoaded()
      .subscribe(() => {
        this.cdr.markForCheck();
      });
  }

  ngOnDestroy(): void {
    if (typeof window !== "undefined") {
      window.removeEventListener("rcai-audio-unlocked", this.onAudioUnlocked);
    }
    this.transSub?.unsubscribe();
  }

  onUnlockClick(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.triggerUnlockConfirmation();
  }

  private triggerUnlockConfirmation(): void {
    if (this.hasTriggeredConfirmation) {
      this.isUnlocked = true;
      this.cdr.markForCheck();
      return;
    }
    this.hasTriggeredConfirmation = true;
    this.isUnlocked = true;
    this.cdr.markForCheck();

    // 1. Unlock Web Audio and play confirmation chime synchronously inside the user gesture
    unlockGlobalAudio(true, false);

    // 2. Preload default lap sound into memory so the first lap beep is instant
    this.audioService.preload("default_beep");

    // 3. Synchronously speak localized "Audio enabled" confirmation through AudioService
    const text =
      this.translationService.translate("RD_AUDIO_ENABLED") || "Audio enabled";
    this.audioService.playCallout({ type: "tts", text }, "urgent");
  }
}

import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from "@angular/core/testing";
import { of } from "rxjs";
import { AudioService } from "@app/services/audio.service";
import { TranslationService } from "@app/services/translation.service";
import {
  resetGlobalAudioUnlockerForTesting,
  setMobileDeviceForTesting,
  unlockGlobalAudio,
} from "@app/utils/audio";

import { AudioUnlockPromptComponent } from "./audio-unlock-prompt.component";

describe("AudioUnlockPromptComponent", () => {
  let component: AudioUnlockPromptComponent;
  let fixture: ComponentFixture<AudioUnlockPromptComponent>;
  let mockTranslationService: any;
  let mockAudioService: any;

  beforeEach(async () => {
    resetGlobalAudioUnlockerForTesting();
    mockTranslationService = jasmine.createSpyObj("TranslationService", [
      "translate",
      "getTranslationsLoaded",
    ]);
    mockTranslationService.translate.and.callFake((key: string) => key);
    mockTranslationService.getTranslationsLoaded.and.returnValue(of(true));

    mockAudioService = jasmine.createSpyObj("AudioService", [
      "preload",
      "playCallout",
    ]);

    await TestBed.configureTestingModule({
      imports: [AudioUnlockPromptComponent],
      providers: [
        { provide: TranslationService, useValue: mockTranslationService },
        { provide: AudioService, useValue: mockAudioService },
      ],
    }).compileComponents();
  });

  afterEach(() => {
    resetGlobalAudioUnlockerForTesting();
  });

  it("should create component", () => {
    fixture = TestBed.createComponent(AudioUnlockPromptComponent);
    component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });

  it("should NOT display the banner when on a desktop (non-mobile) device", () => {
    setMobileDeviceForTesting(false);
    fixture = TestBed.createComponent(AudioUnlockPromptComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.isMobile).toBeFalse();
    expect(component.showPrompt).toBeFalse();

    const banner = fixture.nativeElement.querySelector(".audio-unlock-banner");
    expect(banner).toBeFalsy();
  });

  it("should display the banner when on a mobile device and audio is locked", () => {
    setMobileDeviceForTesting(true);
    fixture = TestBed.createComponent(AudioUnlockPromptComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.isMobile).toBeTrue();
    expect(component.isUnlocked).toBeFalse();
    expect(component.showPrompt).toBeTrue();

    const banner = fixture.nativeElement.querySelector(".audio-unlock-banner");
    expect(banner).toBeTruthy();
    expect(banner.textContent).toContain("RD_TAP_TO_ENABLE_AUDIO");
  });

  it("should NOT display the banner on mobile if audio is already unlocked", () => {
    setMobileDeviceForTesting(true);
    unlockGlobalAudio();

    fixture = TestBed.createComponent(AudioUnlockPromptComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.isUnlocked).toBeTrue();
    expect(component.showPrompt).toBeFalse();

    const banner = fixture.nativeElement.querySelector(".audio-unlock-banner");
    expect(banner).toBeFalsy();
  });

  it("should unlock audio and dismiss banner when banner is clicked", fakeAsync(() => {
    setMobileDeviceForTesting(true);
    fixture = TestBed.createComponent(AudioUnlockPromptComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    const banner: HTMLElement = fixture.nativeElement.querySelector(
      ".audio-unlock-banner",
    );
    expect(banner).toBeTruthy();

    const event = new MouseEvent("click", { bubbles: true, cancelable: true });
    spyOn(event, "stopPropagation").and.callThrough();

    banner.dispatchEvent(event);
    fixture.detectChanges();

    expect(event.stopPropagation).toHaveBeenCalled();
    expect(mockAudioService.preload).toHaveBeenCalledWith("default_beep");
    expect(component.isUnlocked).toBeTrue();
    expect(component.showPrompt).toBeFalse();
    expect(
      fixture.nativeElement.querySelector(".audio-unlock-banner"),
    ).toBeFalsy();

    tick(200);
    expect(mockAudioService.playCallout).toHaveBeenCalledWith(
      { type: "tts", text: "RD_AUDIO_ENABLED" },
      "urgent",
    );
  }));

  it("should mark for check when translations loaded observable emits", () => {
    setMobileDeviceForTesting(true);
    fixture = TestBed.createComponent(AudioUnlockPromptComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    const cdrSpy = spyOn((component as any).cdr, "markForCheck");
    (component as any).onAudioUnlocked();
    expect(cdrSpy).toHaveBeenCalled();
  });

  it("should automatically dismiss banner and speak RD_AUDIO_ENABLED when window fires rcai-audio-unlocked event on mobile", () => {
    setMobileDeviceForTesting(true);
    fixture = TestBed.createComponent(AudioUnlockPromptComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.showPrompt).toBeTrue();

    unlockGlobalAudio(false, false);
    fixture.detectChanges();

    expect(component.isUnlocked).toBeTrue();
    expect(component.showPrompt).toBeFalse();
    expect(mockAudioService.preload).toHaveBeenCalledWith("default_beep");
    expect(mockAudioService.playCallout).toHaveBeenCalledTimes(1);
    expect(mockAudioService.playCallout).toHaveBeenCalledWith(
      { type: "tts", text: "RD_AUDIO_ENABLED" },
      "urgent",
    );

    // Subsequent click after pointerup/rcai-audio-unlocked should not duplicate confirmation
    component.onUnlockClick();
    expect(mockAudioService.playCallout).toHaveBeenCalledTimes(1);
  });

  it("should remove window event listener on destroy", () => {
    const removeEventListenerSpy = spyOn(window, "removeEventListener");
    fixture = TestBed.createComponent(AudioUnlockPromptComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    fixture.destroy();

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      "rcai-audio-unlocked",
      jasmine.any(Function),
    );
  });
});

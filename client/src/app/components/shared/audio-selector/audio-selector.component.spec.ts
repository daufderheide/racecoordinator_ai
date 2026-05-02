import { TestbedHarnessEnvironment } from "@angular/cdk/testing/testbed";
import { Component, EventEmitter, Input, Output } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FormsModule } from "@angular/forms";
import { DataService } from "src/app/data.service";
import { TranslationService } from "src/app/services/translation.service";

import { AudioSelectorComponent } from "./audio-selector.component";
import { AudioSelectorHarness } from "./testing/audio-selector.harness";

@Component({
  selector: "app-item-selector",
  template: "",
  imports: [FormsModule],
})
class MockItemSelectorComponent {
  @Input() items: any[] = [];
  @Input() visible: boolean = false;
  @Output() select = new EventEmitter<any>();
  @Output() close = new EventEmitter<void>();
  @Input() itemType: string = "image";
  @Input() backButtonRoute: string | null = null;
  @Input() backButtonQueryParams: any = {};
}

import { Pipe, PipeTransform } from "@angular/core";
@Pipe({ name: "translate" })
class MockTranslatePipe implements PipeTransform {
  transform(value: string): string {
    return value;
  }
}

describe("AudioSelectorComponent", () => {
  let component: AudioSelectorComponent;
  let fixture: ComponentFixture<AudioSelectorComponent>;
  let harness: AudioSelectorHarness;
  let mockDataService: any;
  let mockTranslationService: any;
  let mockAudioInstance: any;
  beforeEach(async () => {
    mockAudioInstance = jasmine.createSpyObj("Audio", ["play", "pause"]);
    mockAudioInstance.play.and.returnValue(Promise.resolve());

    // Check if Audio is already a spy to avoid double-spying
    if (!(window.Audio as any).and) {
      spyOn(window, "Audio").and.callFake(function (this: any) {
        return mockAudioInstance;
      } as any);
    } else {
      (window.Audio as any).and.callFake(function (this: any) {
        return mockAudioInstance;
      } as any);
    }

    mockDataService = jasmine.createSpyObj("DataService", ["uploadAsset"]);
    mockTranslationService = jasmine.createSpyObj("TranslationService", [
      "translate",
    ]);
    mockDataService.serverUrl = "http://localhost:8080";

    await TestBed.configureTestingModule({
      imports: [
        FormsModule,
        AudioSelectorComponent,
        MockItemSelectorComponent,
        MockTranslatePipe,
      ],
      providers: [
        { provide: DataService, useValue: mockDataService },
        { provide: TranslationService, useValue: mockTranslationService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AudioSelectorComponent);
    component = fixture.componentInstance;
    harness = await TestbedHarnessEnvironment.harnessForFixture(
      fixture,
      AudioSelectorHarness,
    );
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should emit type change", () => {
    spyOn(component.typeChange, "emit");
    component.onTypeChange("tts");
    expect(component.type).toBe("tts");
    expect(component.typeChange.emit).toHaveBeenCalledWith("tts");
  });

  it("should emit url change", () => {
    spyOn(component.urlChange, "emit");
    component.onUrlChange("new-url");
    expect(component.url).toBe("new-url");
    expect(component.urlChange.emit).toHaveBeenCalledWith("new-url");
  });

  it("should emit text change", () => {
    spyOn(component.textChange, "emit");
    component.onTextChange("hello");
    expect(component.text).toBe("hello");
    expect(component.textChange.emit).toHaveBeenCalledWith("hello");
  });

  it("should open and close item selector", async () => {
    await harness.clickSelectSound();
    expect(component.showItemSelector).toBeTrue();

    component.closeItemSelector();
    expect(component.showItemSelector).toBeFalse();
  });

  it("should handle asset selection", () => {
    spyOn(component.urlChange, "emit");
    spyOn(component.typeChange, "emit");

    component.type = "tts";
    component.onAssetSelected({ url: "asset-url" });

    expect(component.url).toBe("asset-url");
    expect(component.urlChange.emit).toHaveBeenCalledWith("asset-url");
    expect(component.type).toBe("preset");
    expect(component.typeChange.emit).toHaveBeenCalledWith("preset");
    expect(component.showItemSelector).toBeFalse();
  });

  it("should handle audio_set asset selection", () => {
    spyOn(component.urlChange, "emit");
    spyOn(component.typeChange, "emit");

    component.mode = "set";
    component.onAssetSelected({ id: "set-123", type: "audio_set" });

    expect(component.url).toBe("set-123");
    expect(component.urlChange.emit).toHaveBeenCalledWith("set-123");
    expect(component.type).toBe("audio_set");
    expect(component.typeChange.emit).toHaveBeenCalledWith("audio_set");
  });

  it("should filter assets based on mode", () => {
    const allAssets = [
      { type: "sound", name: "Single" },
      { type: "audio_set", name: "Set" },
    ];
    component.assets = allAssets;

    component.mode = "single";
    expect(component.filteredAssets.length).toBe(1);
    expect(component.filteredAssets[0].type).toBe("sound");

    component.mode = "set";
    expect(component.filteredAssets.length).toBe(1);
    expect(component.filteredAssets[0].type).toBe("audio_set");
  });

  it("should play preset audio", () => {
    component.type = "preset";
    component.url = "test.mp3";

    component.play();

    expect(window.Audio).toHaveBeenCalled();
    expect(mockAudioInstance.play).toHaveBeenCalled();
  });

  // Note: Testing TTS relies on window.speechSynthesis which might need more complex mocking
  // for a robust test environment, but this covers the basic logic paths.

  it("should call playSound when onPlayPreview is called", () => {
    const item = { name: "Test Sound", url: "test.mp3" };
    component.onPlayPreview(item);
    expect(window.Audio).toHaveBeenCalled();
    expect(mockAudioInstance.play).toHaveBeenCalled();
  });

  it("should handle none type", () => {
    spyOn(component.typeChange, "emit");
    component.onTypeChange("none");
    expect(component.type).toBe("none");
    expect(component.typeChange.emit).toHaveBeenCalledWith("none");

    // Test that play() doesn't do anything for none
    component.play();
    expect(window.Audio).not.toHaveBeenCalled();
  });

  it("should return selected asset name for audio set", () => {
    component.type = "audio_set";
    component.url = "set-123";
    component.assets = [
      { entity_id: "set-123", name: "My Cool Audio Set", type: "audio_set" },
    ];

    expect(component.selectedAssetName).toBe("My Cool Audio Set");
  });

  it("should play audio set sequentially and toggle isPlaying", async () => {
    const audioSet = {
      entity_id: "set-1",
      name: "Set 1",
      type: "audio_set",
      audioEntries: [
        { url: "1.mp3", timeSeconds: 1 },
        { url: "2.mp3", timeSeconds: 2 },
      ],
    };
    component.assets = [audioSet];
    component.type = "audio_set";
    component.url = "set-1";

    const audioSpy = (window.Audio as unknown as jasmine.Spy).and.callFake(
      function (_url: string) {
        // Simulate sound ending after a short delay
        setTimeout(() => {
          if (mockAudioInstance.onended) mockAudioInstance.onended();
        }, 0);
        return mockAudioInstance;
      },
    );

    component.play();
    expect(component.isPlaying).toBeTrue();

    // Wait for playback to complete
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(component.isPlaying).toBeFalse();
    expect(audioSpy).toHaveBeenCalledTimes(2);
    expect(audioSpy.calls.argsFor(0)[0]).toContain("1.mp3");
    expect(audioSpy.calls.argsFor(1)[0]).toContain("2.mp3");
  });

  it("should stop playback when stop is called", async () => {
    const audioSet = {
      entity_id: "set-1",
      name: "Set 1",
      type: "audio_set",
      audioEntries: [{ url: "1.mp3", timeSeconds: 1 }],
    };
    component.assets = [audioSet];
    component.type = "audio_set";
    component.url = "set-1";

    mockAudioInstance.play.and.returnValue(new Promise(() => {})); // Never resolves to simulate playing

    component.play();
    expect(component.isPlaying).toBeTrue();

    component.stop();
    expect(component.isPlaying).toBeFalse();
    expect(mockAudioInstance.pause).toHaveBeenCalled();
  });

  it("should toggle playback when clicking play while already playing", () => {
    spyOn(component, "stop");
    component.isPlaying = true;
    component.play();
    expect(component.stop).toHaveBeenCalled();
  });

  it("should handle TTS playback state", () => {
    component.type = "tts";
    component.text = "Hello world";

    const mockUtterance = {
      onend: null as any,
      text: "",
    };
    spyOn(window, "SpeechSynthesisUtterance").and.callFake(function (
      this: any,
      text?: string,
    ) {
      (mockUtterance as any).text = text || "";
      return mockUtterance;
    } as any);

    if (window.speechSynthesis) {
      if (!(window.speechSynthesis.speak as any).and) {
        spyOn(window.speechSynthesis, "speak");
      }
      if (!(window.speechSynthesis.cancel as any).and) {
        spyOn(window.speechSynthesis, "cancel");
      }
    } else {
      (window as any).speechSynthesis = jasmine.createSpyObj(
        "SpeechSynthesis",
        ["speak", "cancel"],
      );
    }

    component.play();
    expect(component.isPlaying).toBeTrue();
    expect(window.speechSynthesis.speak).toHaveBeenCalled();

    // Simulate end
    if (mockUtterance.onend) mockUtterance.onend();
    expect(component.isPlaying).toBeFalse();
  });
});

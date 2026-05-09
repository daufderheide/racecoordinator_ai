import { TestbedHarnessEnvironment } from "@angular/cdk/testing/testbed";
import { Component, input, output } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FormsModule } from "@angular/forms";
import { DataService } from "@app/data.service";
import { TranslationService } from "@app/services/translation.service";

import { AudioSelectorComponent } from "./audio-selector.component";
import { AudioSelectorHarness } from "./testing/audio-selector.harness";

@Component({
  selector: "app-item-selector",
  standalone: true,
  template: "",
  imports: [FormsModule],
})
class MockItemSelectorComponent {
  items = input<any[]>([]);
  visible = input<boolean>(false);
  select = output<any>();
  close = output<void>();
  itemType = input<string>("image");
  backButtonRoute = input<string | null>(null);
  backButtonQueryParams = input<any>({});
}

import { Pipe, PipeTransform } from "@angular/core";
@Pipe({ standalone: true,name: "translate" })
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
    let emittedValue: any;
    (component as any).typeChange.subscribe((val: any) => (emittedValue = val));
    component.onTypeChange("tts");
    expect(emittedValue).toBe("tts");
    // State only updates if input is updated (usually by parent)
    fixture.componentRef.setInput("type", "tts");
    fixture.detectChanges();
    expect(component.type()).toBe("tts");
  });

  it("should emit url change", () => {
    let emittedValue: any;
    (component as any).urlChange.subscribe((val: any) => (emittedValue = val));
    component.onUrlChange("new-url");
    expect(emittedValue).toBe("new-url");
    fixture.componentRef.setInput("url", "new-url");
    fixture.detectChanges();
    expect(component.url()).toBe("new-url");
  });

  it("should emit text change", () => {
    let emittedValue: any;
    (component as any).textChange.subscribe((val: any) => (emittedValue = val));
    component.onTextChange("hello");
    expect(emittedValue).toBe("hello");
    fixture.componentRef.setInput("text", "hello");
    fixture.detectChanges();
    expect(component.text()).toBe("hello");
  });

  it("should open and close item selector", async () => {
    await harness.clickSelectSound();
    expect(component.showItemSelector).toBeTrue();

    component.closeItemSelector();
    expect(component.showItemSelector).toBeFalse();
  });

  it("should handle asset selection", () => {
    let urlEmitted: any;
    let typeEmitted: any;
    (component as any).urlChange.subscribe((val: any) => (urlEmitted = val));
    (component as any).typeChange.subscribe((val: any) => (typeEmitted = val));

    fixture.componentRef.setInput("type", "tts");
    fixture.detectChanges();
    component.onAssetSelected({ url: "asset-url" });

    expect(urlEmitted).toBe("asset-url");
    fixture.componentRef.setInput("url", "asset-url");
    fixture.detectChanges();
    expect(component.url()).toBe("asset-url");

    expect(typeEmitted).toBe("preset");
    fixture.componentRef.setInput("type", "preset");
    fixture.detectChanges();
    expect(component.type()).toBe("preset");
    expect(component.showItemSelector).toBeFalse();
  });

  it("should handle audio_set asset selection", () => {
    let urlEmitted: any;
    let typeEmitted: any;
    (component as any).urlChange.subscribe((val: any) => (urlEmitted = val));
    (component as any).typeChange.subscribe((val: any) => (typeEmitted = val));

    fixture.componentRef.setInput("mode", "set");
    fixture.detectChanges();
    component.onAssetSelected({ id: "set-123", type: "audio_set" });

    expect(urlEmitted).toBe("set-123");
    fixture.componentRef.setInput("url", "set-123");
    fixture.detectChanges();
    expect(component.url()).toBe("set-123");

    expect(typeEmitted).toBe("audio_set");
    fixture.componentRef.setInput("type", "audio_set");
    fixture.detectChanges();
    expect(component.type()).toBe("audio_set");
  });

  it("should filter assets based on mode", () => {
    const allAssets = [
      { type: "sound", name: "Single" },
      { type: "audio_set", name: "Set" },
    ];
    fixture.componentRef.setInput("assets", allAssets);

    fixture.componentRef.setInput("mode", "single");
    fixture.detectChanges();
    expect(component.filteredAssets().length).toBe(1);
    expect(component.filteredAssets()[0].type).toBe("sound");

    fixture.componentRef.setInput("mode", "set");
    fixture.detectChanges();
    expect(component.filteredAssets().length).toBe(1);
    expect(component.filteredAssets()[0].type).toBe("audio_set");
  });

  it("should play preset audio", () => {
    fixture.componentRef.setInput("type", "preset");
    fixture.componentRef.setInput("url", "test.mp3");
    fixture.detectChanges();

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
    let typeEmitted: any;
    (component as any).typeChange.subscribe((val: any) => (typeEmitted = val));
    fixture.componentRef.setInput("type", "preset");
    fixture.detectChanges();
    component.onTypeChange("none");
    expect(typeEmitted).toBe("none");
    fixture.componentRef.setInput("type", "none");
    fixture.detectChanges();
    expect(component.type()).toBe("none");

    // Test that play() doesn't do anything for none
    component.play();
    expect(window.Audio).not.toHaveBeenCalled();
  });

  it("should return selected asset name for audio set", () => {
    fixture.componentRef.setInput("type", "audio_set");
    fixture.componentRef.setInput("url", "set-123");
    fixture.componentRef.setInput("assets", [
      { entity_id: "set-123", name: "My Cool Audio Set", type: "audio_set" },
    ]);
    fixture.detectChanges();

    expect(component.selectedAssetName()).toBe("My Cool Audio Set");
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
    fixture.componentRef.setInput("assets", [audioSet]);
    fixture.componentRef.setInput("type", "audio_set");
    fixture.componentRef.setInput("url", "set-1");
    fixture.detectChanges();

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
    fixture.componentRef.setInput("assets", [audioSet]);
    fixture.componentRef.setInput("type", "audio_set");
    fixture.componentRef.setInput("url", "set-1");
    fixture.detectChanges();

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
    fixture.componentRef.setInput("type", "tts");
    fixture.componentRef.setInput("text", "Hello world");
    fixture.detectChanges();

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

  it("should interpolate TTS text with context", () => {
    fixture.componentRef.setInput("type", "tts");
    fixture.componentRef.setInput("text", "Hello {driver.name}");
    fixture.componentRef.setInput("context", { driver: { name: "Dave" } });
    fixture.detectChanges();

    const mockUtterance: any = {
      onend: null,
      text: "",
    };
    spyOn(window, "SpeechSynthesisUtterance").and.callFake(function (
      this: any,
      text?: string,
    ) {
      mockUtterance.text = text || "";
      return mockUtterance;
    } as any);

    if (!window.speechSynthesis) {
      (window as any).speechSynthesis = jasmine.createSpyObj(
        "SpeechSynthesis",
        ["speak", "cancel"],
      );
    } else {
      if (!(window.speechSynthesis.speak as any).and) {
        spyOn(window.speechSynthesis, "speak");
      }
      if (!(window.speechSynthesis.cancel as any).and) {
        spyOn(window.speechSynthesis, "cancel");
      }
    }

    component.play();
    expect(mockUtterance.text).toBe("Hello Dave");
  });

  it("should show play button in TTS mode when not readonly", async () => {
    fixture.componentRef.setInput("type", "tts");
    fixture.componentRef.setInput("readonly", false);
    fixture.detectChanges();

    const playButton = await harness.clickPlay().then(
      () => true,
      () => false,
    );
    // Since we can't easily check visibility without adding to harness,
    // we check that clickPlay doesn't throw (meaning the button was found).
    expect(playButton).toBeTrue();
  });
});

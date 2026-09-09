import { TestbedHarnessEnvironment } from "@angular/cdk/testing/testbed";
import { Component, input, output } from "@angular/core";
import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from "@angular/core/testing";
import { FormsModule } from "@angular/forms";
import { of } from "rxjs";
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
  title = input<string>("");
  select = output<any>();
  close = output<void>();
  play = output<any>();
  itemType = input<string>("image");
  allowBrowse = input<boolean>(true);
  filePicked = output<File>();
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

    mockDataService = jasmine.createSpyObj("DataService", [
      "uploadAsset",
      "computeFileHash",
      "findAssetByHash",
    ]);
    mockDataService.computeFileHash.and.returnValue(
      Promise.resolve("audio-hash-1234"),
    );
    mockDataService.findAssetByHash.and.returnValue(undefined);
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
      { type: "audio", name: "Single" },
      { type: "audio_set", name: "Set" },
    ];
    fixture.componentRef.setInput("assets", allAssets);

    fixture.componentRef.setInput("mode", "single");
    fixture.detectChanges();
    expect(component.filteredAssets().length).toBe(1);
    expect(component.filteredAssets()[0].type).toBe("audio");

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

  it("should play audio set sequentially with both preset and TTS entries", async () => {
    const audioSet = {
      entity_id: "set-mixed",
      name: "Mixed Set",
      type: "audio_set",
      audioEntries: [
        { url: "1.mp3", timeSeconds: 1, type: "preset" },
        { text: "Hello Dave", timeSeconds: 2, type: "tts" },
      ],
    };
    fixture.componentRef.setInput("assets", [audioSet]);
    fixture.componentRef.setInput("type", "audio_set");
    fixture.componentRef.setInput("url", "set-mixed");
    fixture.detectChanges();

    const audioSpy = (window.Audio as unknown as jasmine.Spy).and.callFake(
      function (_url: string) {
        setTimeout(() => {
          if (mockAudioInstance.onended) mockAudioInstance.onended();
        }, 0);
        return mockAudioInstance;
      },
    );

    const mockUtterance = {
      onend: null as any,
      text: "",
    };
    spyOn(window, "SpeechSynthesisUtterance").and.callFake(function (
      this: any,
      text?: string,
    ) {
      (mockUtterance as any).text = text || "";
      setTimeout(() => {
        if (mockUtterance.onend) mockUtterance.onend();
      }, 0);
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

    // Wait for both preset and TTS playback to complete
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(component.isPlaying).toBeFalse();
    expect(audioSpy).toHaveBeenCalledTimes(1);
    expect(audioSpy.calls.argsFor(0)[0]).toContain("1.mp3");
    expect(window.speechSynthesis.speak).toHaveBeenCalled();
    expect(mockUtterance.text).toBe("Hello Dave");
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

  it("should handle drag over and drag leave", () => {
    const event = new DragEvent("dragover");
    spyOn(event, "preventDefault");
    spyOn(event, "stopPropagation");

    component.onDragOver(event);
    expect(component.isDragging).toBeTrue();
    expect(event.preventDefault).toHaveBeenCalled();
    expect(event.stopPropagation).toHaveBeenCalled();

    const leaveEvent = new DragEvent("dragleave");
    spyOn(leaveEvent, "preventDefault");
    spyOn(leaveEvent, "stopPropagation");
    component.onDragLeave(leaveEvent);
    expect(component.isDragging).toBeFalse();
  });

  it("should deduplicate dropped audio file and reuse existing asset without upload", fakeAsync(() => {
    const existingAsset = {
      model: { entityId: "existing-audio-1" },
      url: "/assets/existing.mp3",
      hash: "hash-audio-duplicate",
      name: "Existing Sound",
      type: "audio",
    };
    mockDataService.computeFileHash.and.returnValue(
      Promise.resolve("hash-audio-duplicate"),
    );
    mockDataService.findAssetByHash.and.returnValue(existingAsset);

    const file = new File(["audio-binary-data"], "duplicate.mp3", {
      type: "audio/mp3",
    });
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    const dropEvent = new DragEvent("drop", { dataTransfer });

    let urlEmitted: string | undefined;
    (component as any).urlChange.subscribe((val: any) => (urlEmitted = val));
    spyOn(component.assetSelected, "emit");

    component.onDrop(dropEvent);
    tick();

    expect(mockDataService.computeFileHash).toHaveBeenCalledWith(file);
    expect(mockDataService.findAssetByHash).toHaveBeenCalledWith(
      "hash-audio-duplicate",
      "audio",
    );
    expect(mockDataService.uploadAsset).not.toHaveBeenCalled();
    expect(urlEmitted).toBe(existingAsset.model.entityId);
    expect(component.assetSelected.emit).toHaveBeenCalledWith(existingAsset);
  }));

  it("should upload new audio file when dropped and not duplicate", fakeAsync(() => {
    const file = new File(["new-audio-data"], "new_sound.wav", {
      type: "audio/wav",
    });
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    const dropEvent = new DragEvent("drop", { dataTransfer });

    const newAsset = {
      model: { entityId: "new-sound-id" },
      name: "new_sound.wav",
      type: "audio",
      url: "/api/assets/download/new-sound-id",
    };
    mockDataService.uploadAsset.and.returnValue(of(newAsset));

    spyOn(window as any, "FileReader").and.callFake(function () {
      return {
        readAsArrayBuffer: jasmine
          .createSpy("readAsArrayBuffer")
          .and.callFake(function (this: any) {
            setTimeout(() => {
              if (this.onload)
                this.onload({ target: { result: new ArrayBuffer(8) } });
            });
          }),
        onload: null,
      };
    });

    let urlEmitted: string | undefined;
    (component as any).urlChange.subscribe((val: any) => (urlEmitted = val));

    component.onDrop(dropEvent);
    tick();

    expect(mockDataService.uploadAsset).toHaveBeenCalled();
    expect(urlEmitted).toBe("new-sound-id");
    expect(component.isUploading).toBeFalse();
  }));

  it("should reject invalid audio file format with transient error and clear after 4 seconds", fakeAsync(() => {
    const file = new File(["some document text"], "report.pdf", {
      type: "application/pdf",
    });
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    const dropEvent = new DragEvent("drop", { dataTransfer });

    component.onDrop(dropEvent);
    tick();

    expect(component.errorMessage).toBe("AS_ERR_INVALID_AUDIO");
    expect(mockDataService.uploadAsset).not.toHaveBeenCalled();

    tick(4000);
    expect(component.errorMessage).toBeNull();
  }));

  it("should handle onFilePicked from open file dialog and immediately update selected sound name", fakeAsync(() => {
    component.showItemSelector = true;
    mockTranslationService.translate.and.callFake((k: string) => k);
    const file = new File(["audio-content"], "picked.wav", {
      type: "audio/wav",
    });
    const mockAsset = {
      model: { entityId: "picked-id" },
      name: "Custom Sound Effect",
      url: "/assets/picked.wav",
      type: "audio",
    };
    mockDataService.uploadAsset.and.returnValue(of(mockAsset));

    spyOn(window as any, "FileReader").and.callFake(function () {
      return {
        readAsArrayBuffer: jasmine
          .createSpy("readAsArrayBuffer")
          .and.callFake(function (this: any) {
            setTimeout(() => {
              if (this.onload)
                this.onload({ target: { result: new ArrayBuffer(0) } });
            });
          }),
        onload: null,
      };
    });

    let emittedUrl: string | undefined;
    let emittedAsset: any;
    component.urlChange.subscribe((u) => (emittedUrl = u));
    component.assetSelected.subscribe((a) => (emittedAsset = a));

    component.onFilePicked(file);
    expect(component.showItemSelector).toBeFalse();
    tick();

    expect(mockDataService.uploadAsset).toHaveBeenCalled();
    expect(emittedUrl).toBe("picked-id");
    expect(emittedAsset).toEqual(mockAsset);
    expect(component.selectedAsset()).toEqual(mockAsset);
    expect(component.selectedAssetName()).toBe("Custom Sound Effect");
  }));

  describe("Drag and Drop with type switching and dragCounter", () => {
    it("should switch type from none to preset and configure audio resource when audio file is dropped", fakeAsync(() => {
      fixture.componentRef.setInput("type", "none");
      fixture.detectChanges();
      expect(component.effectiveType()).toBe("none");

      const existingAsset = {
        model: { entityId: "sound-none-to-preset" },
        name: "Engine Roar.wav",
        type: "audio",
        url: "/assets/engine.wav",
        hash: "hash-engine-123",
      };
      mockDataService.computeFileHash.and.returnValue(
        Promise.resolve("hash-engine-123"),
      );
      mockDataService.findAssetByHash.and.returnValue(existingAsset);

      const file = new File(["audio-raw"], "Engine Roar.wav", {
        type: "audio/wav",
      });
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      const dropEvent = new DragEvent("drop", { dataTransfer });

      let emittedType: string | undefined;
      let emittedUrl: string | undefined;
      let emittedAsset: any;
      component.typeChange.subscribe((t) => (emittedType = t));
      component.urlChange.subscribe((u) => (emittedUrl = u));
      component.assetSelected.subscribe((a) => (emittedAsset = a));

      component.showItemSelector = true;
      component.onDrop(dropEvent);
      tick();

      expect(emittedType).toBe("preset");
      expect(emittedUrl).toBe("sound-none-to-preset");
      expect(emittedAsset).toEqual(existingAsset);
      expect(component.effectiveType()).toBe("preset");
      expect(component.selectedAssetName()).toBe("Engine Roar.wav");
      expect(component.showItemSelector).toBeFalse();
    }));

    it("should close the dialog and assume the dropped file as the selection when dropped while dialog is open", fakeAsync(() => {
      component.openItemSelector();
      expect(component.showItemSelector).toBeTrue();

      const newAsset = {
        model: { entityId: "dialog-drop-sound" },
        name: "Horn Blast.wav",
        type: "audio",
        url: "/assets/horn.wav",
      };
      mockDataService.uploadAsset.and.returnValue(of(newAsset));

      spyOn(window as any, "FileReader").and.callFake(function () {
        return {
          readAsArrayBuffer: jasmine
            .createSpy("readAsArrayBuffer")
            .and.callFake(function (this: any) {
              setTimeout(() => {
                if (this.onload)
                  this.onload({ target: { result: new ArrayBuffer(4) } });
              });
            }),
          onload: null,
        };
      });

      const file = new File(["horn-data"], "Horn Blast.wav", {
        type: "audio/wav",
      });
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      const dropEvent = new DragEvent("drop", { dataTransfer });

      let emittedUrl: string | undefined;
      component.urlChange.subscribe((u) => (emittedUrl = u));

      component.onDrop(dropEvent);
      tick();

      expect(component.showItemSelector).toBeFalse();
      expect(emittedUrl).toBe("dialog-drop-sound");
      expect(component.effectiveType()).toBe("preset");
      expect(component.selectedAssetName()).toBe("Horn Blast.wav");
    }));

    it("should switch type from tts to preset when audio file is dropped in tts mode", fakeAsync(() => {
      fixture.componentRef.setInput("type", "tts");
      fixture.componentRef.setInput("text", "Hello racer");
      fixture.detectChanges();
      expect(component.effectiveType()).toBe("tts");

      const newAsset = {
        model: { entityId: "horn-sound" },
        name: "Horn.mp3",
        type: "audio",
        url: "/assets/horn.mp3",
      };
      mockDataService.uploadAsset.and.returnValue(of(newAsset));

      spyOn(window as any, "FileReader").and.callFake(function () {
        return {
          readAsArrayBuffer: jasmine
            .createSpy("readAsArrayBuffer")
            .and.callFake(function (this: any) {
              setTimeout(() => {
                if (this.onload)
                  this.onload({ target: { result: new ArrayBuffer(4) } });
              });
            }),
          onload: null,
        };
      });

      const file = new File(["horn-data"], "Horn.mp3", {
        type: "audio/mp3",
      });
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      const dropEvent = new DragEvent("drop", { dataTransfer });

      let emittedType: string | undefined;
      let emittedUrl: string | undefined;
      component.typeChange.subscribe((t) => (emittedType = t));
      component.urlChange.subscribe((u) => (emittedUrl = u));

      component.onDrop(dropEvent);
      tick();

      expect(emittedType).toBe("preset");
      expect(emittedUrl).toBe("horn-sound");
      expect(component.effectiveType()).toBe("preset");
    }));

    it("should track dragCounter on dragenter, dragover, and dragleave without child element flickering", () => {
      const enterEvent1 = new DragEvent("dragenter", { cancelable: true });
      spyOn(enterEvent1, "preventDefault");
      spyOn(enterEvent1, "stopPropagation");

      component.onDragEnter(enterEvent1);
      expect(enterEvent1.preventDefault).toHaveBeenCalled();
      expect(enterEvent1.stopPropagation).toHaveBeenCalled();
      expect(component.dragCounter).toBe(1);
      expect(component.isDragging).toBeTrue();

      // Enter child element
      const enterEvent2 = new DragEvent("dragenter", { cancelable: true });
      component.onDragEnter(enterEvent2);
      expect(component.dragCounter).toBe(2);
      expect(component.isDragging).toBeTrue();

      // Drag over
      const overEvent = new DragEvent("dragover", { cancelable: true });
      spyOn(overEvent, "preventDefault");
      spyOn(overEvent, "stopPropagation");
      component.onDragOver(overEvent);
      expect(overEvent.preventDefault).toHaveBeenCalled();
      expect(component.isDragging).toBeTrue();

      // Leave child element
      const leaveEvent1 = new DragEvent("dragleave", { cancelable: true });
      component.onDragLeave(leaveEvent1);
      expect(component.dragCounter).toBe(1);
      expect(component.isDragging).toBeTrue();

      // Leave container
      const leaveEvent2 = new DragEvent("dragleave", { cancelable: true });
      component.onDragLeave(leaveEvent2);
      expect(component.dragCounter).toBe(0);
      expect(component.isDragging).toBeFalse();
    });
  });
});

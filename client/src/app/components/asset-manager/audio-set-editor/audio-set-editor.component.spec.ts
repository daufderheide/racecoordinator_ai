import { ChangeDetectorRef, NO_ERRORS_SCHEMA } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FormsModule } from "@angular/forms";
import { of, throwError } from "rxjs";
import { DataService } from "@app/data.service";
import { TranslationService } from "@app/services/translation.service";

import { AudioSetEditorComponent } from "./audio-set-editor.component";

describe("AudioSetEditorComponent", () => {
  let component: AudioSetEditorComponent;
  let fixture: ComponentFixture<AudioSetEditorComponent>;
  let mockDataService: any;
  let mockTranslationService: any;

  beforeEach(async () => {
    mockDataService = jasmine.createSpyObj("DataService", [
      "saveAudioSet",
      "updateRaceSubscription",
    ]);
    mockDataService.updateRaceSubscription.and.stub();
    mockTranslationService = jasmine.createSpyObj("TranslationService", [
      "translate",
    ]);
    mockTranslationService.translate.and.callFake((key: string) => key);

    await TestBed.configureTestingModule({
      imports: [FormsModule, AudioSetEditorComponent],
      providers: [
        { provide: DataService, useValue: mockDataService },
        { provide: TranslationService, useValue: mockTranslationService },
        ChangeDetectorRef,
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AudioSetEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should reset form when visible turns true", () => {
    fixture.componentRef.setInput("initialName", "Test Set");
    fixture.componentRef.setInput("initialEntries", [
      {
        name: "Entry 1",
        timeSeconds: 10,
        url: "url1",
        data: new Uint8Array(),
      },
    ]);
    fixture.detectChanges();

    fixture.componentRef.setInput("visible", true);
    fixture.detectChanges();

    expect(component.name).toBe("Test Set");
    expect(component.entries.length).toBe(1);
    expect(component.entries[0].name).toBe("Entry 1");
  });

  it("should add entry", () => {
    component.addEntry();
    expect(component.entries.length).toBe(1);
    expect(component.entries[0].timeSeconds).toBe(0);
  });

  it("should remove entry", () => {
    component.entries = [
      { name: "E1", timeSeconds: 0, url: "", data: new Uint8Array() },
    ];
    component.removeEntry(0);
    expect(component.entries.length).toBe(0);
  });

  it("should recalculate times and sort descending", () => {
    component.entries = [
      {
        name: "Sound 10.mp3",
        timeSeconds: 0,
        url: "",
        data: new Uint8Array(),
      },
      {
        name: "Sound 5.mp3",
        timeSeconds: 0,
        url: "",
        data: new Uint8Array(),
      },
      {
        name: "Other.mp3",
        timeSeconds: 2,
        url: "",
        data: new Uint8Array(),
      },
    ];

    component.recalculateTimes();

    expect(component.entries[0].timeSeconds).toBe(10);
    expect(component.entries[1].timeSeconds).toBe(5);
    expect(component.entries[2].timeSeconds).toBe(2);

    // Sort check
    expect(component.entries[0].name).toBe("Sound 10.mp3");
    expect(component.entries[1].name).toBe("Sound 5.mp3");
  });

  it("should sort entries in natural race progression order (elapsed ascending, then remaining descending)", () => {
    component.entries = [
      {
        name: "Rem 5.mp3",
        timeSeconds: 5,
        triggerMode: "remaining",
        url: "",
        data: new Uint8Array(),
      },
      {
        name: "Elap 10.mp3",
        timeSeconds: 10,
        triggerMode: "elapsed",
        url: "",
        data: new Uint8Array(),
      },
      {
        name: "Rem 1.mp3",
        timeSeconds: 1,
        triggerMode: "remaining",
        url: "",
        data: new Uint8Array(),
      },
      {
        name: "Elap 2.mp3",
        timeSeconds: 2,
        triggerMode: "elapsed",
        url: "",
        data: new Uint8Array(),
      },
    ];

    component.recalculateTimes();

    // Natural order: elapsed ascending (2 -> 10), then remaining descending (5 -> 1)
    expect(component.entries[0].name).toBe("Elap 2.mp3");
    expect(component.entries[1].name).toBe("Elap 10.mp3");
    expect(component.entries[2].name).toBe("Rem 5.mp3");
    expect(component.entries[3].name).toBe("Rem 1.mp3");
  });

  it("should preserve triggerMode on save", () => {
    component.name = "Dual Set";
    component.entries = [
      {
        name: "Elapsed 10",
        timeSeconds: 10,
        triggerMode: "elapsed",
        url: "/assets/elap.mp3",
        data: new Uint8Array(),
      },
      {
        name: "Remaining 10",
        timeSeconds: 10,
        triggerMode: "remaining",
        url: "/assets/rem.mp3",
        data: new Uint8Array(),
      },
    ];
    mockDataService.saveAudioSet.and.returnValue(of({}));

    component.onSave();

    const callArgs = mockDataService.saveAudioSet.calls.mostRecent().args;
    expect(callArgs[1].length).toBe(2);
    expect(callArgs[1][0].triggerMode).toBe("elapsed");
    expect(callArgs[1][0].timeSeconds).toBe(10);
    expect(callArgs[1][1].triggerMode).toBe("remaining");
    expect(callArgs[1][1].timeSeconds).toBe(10);
  });

  it("should sanitize blob URLs on save", () => {
    component.name = "Test Set";
    component.entries = [
      {
        name: "Local",
        timeSeconds: 5,
        url: "blob:http://localhost/123",
        data: new Uint8Array([1, 2, 3]),
      },
      {
        name: "Remote",
        timeSeconds: 10,
        url: "/assets/remote.mp3",
        data: new Uint8Array(),
      },
    ];
    mockDataService.saveAudioSet.and.returnValue(of({}));

    component.onSave();

    const callArgs = mockDataService.saveAudioSet.calls.mostRecent().args;
    expect(callArgs[1][0].url).toBe(""); // Sanitized
    expect(callArgs[1][1].url).toBe("/assets/remote.mp3"); // Kept
  });

  it("should emit saved and close on successful save", () => {
    spyOn(component.saved, "emit");
    spyOn(component.close, "emit");
    component.name = "Test";
    component.entries = [
      { name: "E", timeSeconds: 1, url: "u", data: new Uint8Array() },
    ];
    const mockAsset = { entity_id: "new_asset" };
    mockDataService.saveAudioSet.and.returnValue(of(mockAsset));

    component.onSave();

    expect(component.saved.emit).toHaveBeenCalledWith(mockAsset as any);
    expect(component.close.emit).toHaveBeenCalled();
    expect(component.isSaving).toBeFalse();
  });

  it("should handle save error", () => {
    spyOn(window, "alert");
    component.name = "Test";
    component.entries = [
      { name: "E", timeSeconds: 1, url: "u", data: new Uint8Array() },
    ];
    mockDataService.saveAudioSet.and.returnValue(
      throwError(() => ({ message: "Error" })),
    );

    component.onSave();

    expect(window.alert).toHaveBeenCalledWith("Error: Error");
    expect(component.isSaving).toBeFalse();
  });

  describe("Drag and Drop & Internal Asset Handling", () => {
    it("should handle drag enter, over, and leave events", () => {
      fixture.componentRef.setInput("visible", true);
      fixture.detectChanges();

      const event = new DragEvent("dragenter");
      spyOn(event, "preventDefault");
      component.onDragEnter(event);
      expect(component.isDragging).toBeTrue();

      component.onDragOver(event);
      expect(component.isDragging).toBeTrue();

      component.onDragLeave(event);
      expect(component.isDragging).toBeFalse();
    });

    it("should handle element drag enter and leave", () => {
      fixture.componentRef.setInput("visible", true);
      fixture.detectChanges();

      const event = new DragEvent("dragenter");
      spyOn(event, "preventDefault");
      spyOn(event, "stopPropagation");

      component.onElementDragEnter(event);
      expect(component.isDragging).toBeTrue();

      component.onElementDragLeave(event);
      expect(component.isDragging).toBeFalse();
    });

    it("should handle internal asset URL drop", () => {
      fixture.componentRef.setInput("visible", true);
      fixture.detectChanges();

      component.handleInternalDrop("/assets/audio/123_countdown.mp3");
      expect(component.entries.length).toBe(1);
      expect(component.entries[0].name).toBe("countdown.mp3");
      expect(component.entries[0].url).toBe("/assets/audio/123_countdown.mp3");
    });

    it("should cleanup blob URLs on destroy", () => {
      spyOn(URL, "revokeObjectURL");
      (component as any).createdBlobUrls.add("blob:http://localhost/test");
      component.cleanupBlobUrls();
      expect(URL.revokeObjectURL).toHaveBeenCalledWith(
        "blob:http://localhost/test",
      );
      expect((component as any).createdBlobUrls.size).toBe(0);
    });

    it("should emit close on onCancel", () => {
      spyOn(component.close, "emit");
      component.onCancel();
      expect(component.close.emit).toHaveBeenCalled();
    });

    it("should handle onSave validation and successful save", () => {
      spyOn(window, "alert");
      spyOn(component.saved, "emit");
      spyOn(component.close, "emit");

      // Validation failure when name is empty
      component.name = "";
      component.entries = [];
      component.onSave();
      expect(window.alert).toHaveBeenCalled();

      // Successful save
      component.name = "My Audio Set";
      component.entries = [
        {
          name: "sound.wav",
          timeSeconds: 5,
          url: "blob:http://localhost/test",
          data: new Uint8Array([1, 2, 3]),
          type: "preset",
        },
      ];
      mockDataService.saveAudioSet.and.returnValue(
        of({ id: "set1", name: "My Audio Set" }),
      );

      component.onSave();
      expect(mockDataService.saveAudioSet).toHaveBeenCalledWith(
        "My Audio Set",
        jasmine.any(Array),
        undefined,
      );
      expect(component.saved.emit).toHaveBeenCalled();
      expect(component.close.emit).toHaveBeenCalled();
    });

    it("should correctly determine entry type", () => {
      expect(component.getEntryType({ type: "tts" } as any)).toBe("tts");
      expect(component.getEntryType({} as any)).toBe("preset");
    });

    it("should preserve percentage when mapping initialEntries in resetForm", () => {
      fixture.componentRef.setInput("initialEntries", [
        {
          name: "Low Fuel",
          timeSeconds: 10,
          percentage: 10,
          url: "low.wav",
          data: new Uint8Array(),
        } as any,
        {
          name: "Empty Fuel",
          timeSeconds: 0,
          percentage: 0,
          type: "tts",
          text: "{driver.nickname} out of fuel",
          data: new Uint8Array(),
        } as any,
      ]);
      fixture.detectChanges();
      component.resetForm();

      expect((component.entries[0] as any).percentage).toBe(10);
      expect((component.entries[1] as any).percentage).toBe(0);
      expect(component.entries[1].text).toBe("{driver.nickname} out of fuel");
    });

    it("should include synchronized percentage and name for TTS entries in onSave", () => {
      component.name = "Fuel Audio Set";
      component.entries = [
        {
          timeSeconds: 10,
          percentage: 10,
          url: "low.wav",
          data: new Uint8Array(),
          type: "preset",
        } as any,
        {
          timeSeconds: 0,
          percentage: 0,
          type: "tts",
          text: "{driver.nickname} out of fuel",
          data: new Uint8Array(),
        } as any,
      ];
      mockDataService.saveAudioSet.and.returnValue(of({ id: "set1" }));

      component.onSave();

      const savedEntries =
        mockDataService.saveAudioSet.calls.mostRecent().args[1];
      expect(savedEntries[0].percentage).toBe(10);
      expect(savedEntries[0].timeSeconds).toBe(10);
      expect(savedEntries[1].percentage).toBe(0);
      expect(savedEntries[1].timeSeconds).toBe(0);
      expect(savedEntries[1].type).toBe("tts");
      expect(savedEntries[1].text).toBe("{driver.nickname} out of fuel");
      expect(savedEntries[1].name).toBe("{driver.nickname} out of fuel");
    });

    it("should render help banner with title and description", () => {
      fixture.componentRef.setInput("visible", true);
      fixture.detectChanges();

      const helpBanner = fixture.nativeElement.querySelector(
        ".audio-set-help-banner",
      );
      expect(helpBanner).toBeTruthy();
      expect(helpBanner.querySelector(".help-title").textContent).toContain(
        "AM_AUDIO_SET_EDITOR_HELP_TITLE",
      );
      expect(helpBanner.querySelector(".help-desc").textContent).toContain(
        "AM_AUDIO_SET_EDITOR_HELP_DESC",
      );
    });

    it("should display value label and no hardcoded seconds suffix", () => {
      fixture.componentRef.setInput("visible", true);
      fixture.componentRef.setInput("initialEntries", [
        {
          name: "Entry 1",
          timeSeconds: 10,
          url: "url1",
          data: new Uint8Array(),
        },
      ]);
      fixture.detectChanges();

      const entryTime = fixture.nativeElement.querySelector(".entry-time");
      expect(entryTime).toBeTruthy();
      const label = entryTime.querySelector("label");
      expect(label.textContent.trim()).toBe("AM_AUDIO_SET_EDITOR_VALUE");
      expect(entryTime.textContent.trim()).not.toContain("s");
    });

    it("should display updated recalc button title", () => {
      fixture.componentRef.setInput("visible", true);
      fixture.detectChanges();

      const recalcBtn = fixture.nativeElement.querySelector(".btn-recalc");
      expect(recalcBtn).toBeTruthy();
      expect(recalcBtn.getAttribute("title")).toBe(
        "AM_AUDIO_SET_EDITOR_RECALC",
      );
    });
  });
});

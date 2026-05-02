import { ChangeDetectorRef, NO_ERRORS_SCHEMA } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FormsModule } from "@angular/forms";
import { of, throwError } from "rxjs";
import { DataService } from "src/app/data.service";
import { TranslationService } from "src/app/services/translation.service";

import { AudioSetEditorComponent } from "./audio-set-editor.component";

describe("AudioSetEditorComponent", () => {
  let component: AudioSetEditorComponent;
  let fixture: ComponentFixture<AudioSetEditorComponent>;
  let mockDataService: any;
  let mockTranslationService: any;

  beforeEach(async () => {
    mockDataService = jasmine.createSpyObj("DataService", ["saveAudioSet"]);
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
    component.initialName = "Test Set";
    component.initialEntries = [
      {
        name: "Entry 1",
        timeSeconds: 10,
        url: "url1",
        data: new Uint8Array(),
      },
    ];

    component.ngOnChanges({
      visible: {
        currentValue: true,
        previousValue: false,
        firstChange: false,
        isFirstChange: () => false,
      } as any,
    });

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
});

import {
  ChangeDetectorRef,
  Component,
  input,
  output,
  Pipe,
  PipeTransform,
} from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FormsModule } from "@angular/forms";
import { of, throwError } from "rxjs";
import { DataService } from "@app/data.service";
import { TranslationService } from "@app/services/translation.service";

import { ImageSetEditorComponent } from "./image-set-editor.component";

@Component({
  selector: "app-image-selector",
  standalone: true,
  template: "",
  imports: [FormsModule],
})
class MockImageSelectorComponent {
  imageUrl = input<string | undefined>();
  assets = input<any[]>([]);
  size = input<string | undefined>();
  imageUrlChange = output<string>();
}

@Pipe({ standalone: true,name: "translate" })
class MockTranslatePipe implements PipeTransform {
  transform(value: string): string {
    return value;
  }
}

describe("ImageSetEditorComponent", () => {
  let component: ImageSetEditorComponent;
  let fixture: ComponentFixture<ImageSetEditorComponent>;
  let mockDataService: any;
  let mockTranslationService: any;

  beforeEach(async () => {
    mockDataService = jasmine.createSpyObj("DataService", ["saveImageSet"]);
    mockTranslationService = jasmine.createSpyObj("TranslationService", [
      "translate",
    ]);
    mockTranslationService.translate.and.callFake((key: string) => key);

    await TestBed.configureTestingModule({
      imports: [
        FormsModule,
        ImageSetEditorComponent,
        MockImageSelectorComponent,
        MockTranslatePipe,
      ],
      providers: [
        { provide: DataService, useValue: mockDataService },
        { provide: TranslationService, useValue: mockTranslationService },
        ChangeDetectorRef,
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ImageSetEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should reset form only when transitioning to visible", () => {
    component.name = "Dirty Name";
    component.entries = [
      { name: "dirty", percentage: 10, url: "", data: new Uint8Array() },
    ];

    // Simulate property change from hidden to visible
    fixture.componentRef.setInput("visible", true);
    fixture.detectChanges();

    expect(component.name).toBe("");
    expect(component.entries.length).toBe(0);
  });

  it("should NOT reset form if visible changes but was already true", () => {
    fixture.componentRef.setInput("visible", true);
    fixture.detectChanges();

    component.name = "Persisted Name";
    component.entries = [
      {
        name: "img.png",
        percentage: 100,
        url: "data:...",
        data: new Uint8Array(),
      },
    ];

    // Trigger another update that doesn't toggle visible
    fixture.detectChanges();

    expect(component.name).toBe("Persisted Name");
    expect(component.entries.length).toBe(1);
  });

  it("should distribute percentages evenly for dropped files", (done) => {
    const files = [
      new File([""], "alpha.png", { type: "image/png" }),
      new File([""], "gamma.png", { type: "image/png" }),
      new File([""], "beta.png", { type: "image/png" }),
    ];

    spyOn(window as any, "FileReader").and.callFake(function () {
      return {
        readAsDataURL: jasmine
          .createSpy("readAsDataURL")
          .and.callFake(function (this: any) {
            setTimeout(() => {
              if (this.onload) this.onload({ target: { result: "data:img" } });
            });
          }),
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

    // Call handleFiles directly or simulate drop
    const fileList = {
      0: files[0],
      1: files[1],
      2: files[2],
      length: 3,
      item: (i: number) => files[i],
    } as unknown as FileList;

    component.handleFiles(fileList);

    // Wait for async processing
    setTimeout(() => {
      expect(component.entries.length).toBe(3);

      // Expected Sort Order: alpha, beta, gamma
      expect(component.entries[0].name).toBe("alpha.png");
      expect(component.entries[1].name).toBe("beta.png");
      expect(component.entries[2].name).toBe("gamma.png");

      // Percentages: round((0/2)*100)=0, round((1/2)*100)=50, round((2/2)*100)=100
      expect(component.entries[0].percentage).toBe(0);
      expect(component.entries[1].percentage).toBe(50);
      expect(component.entries[2].percentage).toBe(100);
      done();
    }, 100);
  });

  it("should call saveImageSet on save", () => {
    component.name = "Test Set";
    component.entries = [
      {
        name: "img1.png",
        percentage: 100,
        url: "url1",
        data: new Uint8Array(),
      },
    ];
    mockDataService.saveImageSet.and.returnValue(of({}));

    component.onSave();

    expect(mockDataService.saveImageSet).toHaveBeenCalledWith(
      "Test Set",
      component.entries,
      undefined,
    );
  });

  it("should add entry and recalculate percentages", () => {
    component.entries = [
      {
        name: "img1.png",
        percentage: 100,
        url: "url1",
        data: new Uint8Array(),
      },
    ];
    component.addEntry();

    expect(component.entries.length).toBe(2);
    expect(component.entries[0].percentage).toBe(0);
    expect(component.entries[1].percentage).toBe(100);
  });

  it("should remove entry and recalculate percentages", () => {
    component.entries = [
      { name: "img1.png", percentage: 0, url: "url1", data: new Uint8Array() },
      { name: "img2.png", percentage: 50, url: "url2", data: new Uint8Array() },
      {
        name: "img3.png",
        percentage: 100,
        url: "url3",
        data: new Uint8Array(),
      },
    ];

    component.removeEntry(1); // Remove middle one

    expect(component.entries.length).toBe(2);
    expect(component.entries[0].percentage).toBe(0);
    expect(component.entries[1].percentage).toBe(100);
    expect(component.entries[1].name).toBe("img3.png");
  });

  it("should reset form with initialEntries", () => {
    fixture.componentRef.setInput("initialName", "Original Name");
    fixture.componentRef.setInput("initialEntries", [
      {
        name: "orig.png",
        percentage: 100,
        url: "orig_url",
        data: new Uint8Array(),
      },
    ]);
    fixture.detectChanges();

    component.resetForm();

    expect(component.name).toBe("Original Name");
    expect(component.entries.length).toBe(1);
    expect(component.entries[0].name).toBe("orig.png");
  });

  it("should validate name and entries on save", () => {
    spyOn(window, "alert");
    component.name = "";
    component.entries = [];

    component.onSave();

    expect(window.alert).toHaveBeenCalled();
    expect(mockDataService.saveImageSet).not.toHaveBeenCalled();
  });

  it("should handle internal drop logic with ID prefix stripping", () => {
    const url = "/assets/123_library_image.png";
    component.handleInternalDrop(url);

    expect(component.entries.length).toBe(1);
    expect(component.entries[0].name).toBe("library_image.png");
    expect(component.entries[0].url).toBe(url);
  });

  it("should handle save error correctly", () => {
    spyOn(window, "alert");
    spyOn(console, "error");
    component.name = "Valid Name";
    component.entries = [
      {
        name: "img1.png",
        percentage: 100,
        url: "url1",
        data: new Uint8Array(),
      },
    ];
    mockDataService.saveImageSet.and.returnValue(
      throwError(() => new Error("Save Failed")),
    );

    component.onSave();

    expect(component.isSaving).toBeFalse();
    expect(window.alert).toHaveBeenCalledWith("Error: Save Failed");
  });

  describe("recalculatePercentages", () => {
    it("should sort and calculate based on _# prefix", () => {
      component.entries = [
        {
          name: "fuel_100.png",
          percentage: 0,
          url: "u1",
          data: new Uint8Array(),
        },
        {
          name: "fuel_0.png",
          percentage: 0,
          url: "u2",
          data: new Uint8Array(),
        },
        {
          name: "fuel_50.png",
          percentage: 0,
          url: "u3",
          data: new Uint8Array(),
        },
      ];

      component.recalculatePercentages();

      expect(component.entries[0].name).toBe("fuel_0.png");
      expect(component.entries[0].percentage).toBe(0);
      expect(component.entries[1].name).toBe("fuel_50.png");
      expect(component.entries[1].percentage).toBe(50);
      expect(component.entries[2].name).toBe("fuel_100.png");
      expect(component.entries[2].percentage).toBe(100);
    });

    it("should handle _# prefix at the start of filename", () => {
      component.entries = [
        {
          name: "_10_fuel.png",
          percentage: 0,
          url: "u1",
          data: new Uint8Array(),
        },
        {
          name: "_0_fuel.png",
          percentage: 0,
          url: "u2",
          data: new Uint8Array(),
        },
      ];

      component.recalculatePercentages();

      expect(component.entries[0].name).toBe("_0_fuel.png");
      expect(component.entries[0].percentage).toBe(0);
      expect(component.entries[1].name).toBe("_10_fuel.png");
      expect(component.entries[1].percentage).toBe(100);
    });

    it("should handle fuelgage_0 through fuelgage_10 pattern", () => {
      // 11 files: 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10
      component.entries = [];
      for (let i = 0; i <= 10; i++) {
        component.entries.push({
          name: `fuelgage_${i}.png`,
          percentage: 0,
          url: `u${i}`,
          data: new Uint8Array(),
        });
      }
      // Shuffle to test sorting
      component.entries.reverse();

      component.recalculatePercentages();

      expect(component.entries[0].name).toBe("fuelgage_0.png");
      expect(component.entries[0].percentage).toBe(0);
      expect(component.entries[10].name).toBe("fuelgage_10.png");
      expect(component.entries[10].percentage).toBe(100);
    });

    it("should ignore ID prefixes and find trailing numbers", () => {
      component.entries = [
        {
          name: "1711494000000_fuelgage_10.png",
          percentage: 0,
          url: "u1",
          data: new Uint8Array(),
        },
        {
          name: "1711494000000_fuelgage_0.png",
          percentage: 0,
          url: "u2",
          data: new Uint8Array(),
        },
      ];

      component.recalculatePercentages();

      expect(component.entries[0].name).toBe("1711494000000_fuelgage_0.png");
      expect(component.entries[0].percentage).toBe(0);
      expect(component.entries[1].name).toBe("1711494000000_fuelgage_10.png");
      expect(component.entries[1].percentage).toBe(100);
    });

    it("should fallback to even distribution if no numbers found", () => {
      component.entries = [
        { name: "a.png", percentage: 10, url: "u1", data: new Uint8Array() },
        { name: "b.png", percentage: 10, url: "u2", data: new Uint8Array() },
        { name: "c.png", percentage: 10, url: "u3", data: new Uint8Array() },
      ];

      component.recalculatePercentages();

      expect(component.entries[0].percentage).toBe(0);
      expect(component.entries[1].percentage).toBe(50);
      expect(component.entries[2].percentage).toBe(100);
    });
  });
});

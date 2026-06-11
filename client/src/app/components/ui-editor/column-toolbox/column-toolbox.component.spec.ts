import { DragDropModule } from "@angular/cdk/drag-drop";
import { Pipe, PipeTransform } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { TranslationService } from "@app/services/translation.service";

import { ColumnToolboxComponent } from "./column-toolbox.component";

@Pipe({
  name: "translate",
  standalone: true,
})
class MockTranslatePipe implements PipeTransform {
  transform(value: string): string {
    return value;
  }
}

describe("ColumnToolboxComponent", () => {
  let component: ColumnToolboxComponent;
  let fixture: ComponentFixture<ColumnToolboxComponent>;
  let mockTranslationService: jasmine.SpyObj<TranslationService>;

  beforeEach(async () => {
    mockTranslationService = jasmine.createSpyObj("TranslationService", [
      "translate",
    ]);
    // Default mock behavior: return the key itself
    mockTranslationService.translate.and.callFake((key: string) => {
      if (key === "colB_label") return "Beta";
      if (key === "colA_label") return "Alpha";
      return key;
    });

    await TestBed.configureTestingModule({
      imports: [ColumnToolboxComponent, MockTranslatePipe, DragDropModule],
      providers: [
        { provide: TranslationService, useValue: mockTranslationService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ColumnToolboxComponent);
    component = fixture.componentInstance;
  });

  it("should create", () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it("should minimize and expand when toggleMinimize is called", () => {
    fixture.detectChanges();
    expect(component.isMinimized()).toBeFalse();

    const stopPropagationSpy = jasmine.createSpy("stopPropagation");
    const fakeEvent = {
      stopPropagation: stopPropagationSpy,
    } as unknown as Event;

    component.toggleMinimize(fakeEvent);
    expect(stopPropagationSpy).toHaveBeenCalled();
    expect(component.isMinimized()).toBeTrue();

    component.toggleMinimize(fakeEvent);
    expect(component.isMinimized()).toBeFalse();
  });

  it("should sort available columns alphabetically by their translated labels", () => {
    fixture.componentRef.setInput("availableColumns", [
      { key: "colB", label: "colB_label" }, // translates to 'Beta'
      { key: "colA", label: "colA_label" }, // translates to 'Alpha'
    ]);
    fixture.detectChanges();

    const sorted = component.sortedAvailableColumns();
    expect(sorted.length).toBe(2);
    expect(sorted[0].key).toBe("colA");
    expect(sorted[1].key).toBe("colB");
  });

  it("should populate dataTransfer on dragstart event", () => {
    const col = { key: "testCol", label: "Test Column" };
    const mockDataTransfer = {
      setData: jasmine.createSpy("setData"),
      effectAllowed: "",
    };
    const mockEvent = {
      dataTransfer: mockDataTransfer,
    } as unknown as DragEvent;

    component.onDragStart(mockEvent, col);

    expect(mockDataTransfer.setData).toHaveBeenCalledWith(
      "application/json",
      JSON.stringify({
        type: "new-column",
        key: col.key,
        label: col.label,
      }),
    );
    expect(mockDataTransfer.effectAllowed).toBe("copy");
  });

  it("should render correct template details based on minimization state", () => {
    fixture.componentRef.setInput("availableColumns", [
      { key: "col1", label: "col1_label" },
    ]);
    fixture.detectChanges();

    // Verify it lists the column initially
    let items = fixture.debugElement.queryAll(By.css(".toolbox-widget-item"));
    expect(items.length).toBe(1);

    // Minimize
    const button = fixture.debugElement.query(By.css(".minimize-btn"));
    button.nativeElement.click();
    fixture.detectChanges();

    // Verify content is minimized
    items = fixture.debugElement.queryAll(By.css(".toolbox-widget-item"));
    expect(items.length).toBe(0);
  });
});

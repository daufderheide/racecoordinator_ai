import { Component, Pipe, PipeTransform } from "@angular/core";
import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from "@angular/core/testing";

import {
  CustomOptionComponent,
  CustomSelectComponent,
} from "./custom-select.component";

@Pipe({ name: "translate", standalone: true })
class MockTranslatePipe implements PipeTransform {
  transform(value: string): string {
    return value;
  }
}

@Component({
  standalone: true,
  imports: [CustomSelectComponent, CustomOptionComponent],
  template: `
    <app-custom-select
      [value]="val"
      [extendToPageBottom]="extendToBottom"
      [maxDropdownHeight]="maxHeight"
    >
      <app-custom-option value="opt1" separator>Option 1</app-custom-option>
      <app-custom-option value="opt2">Option 2</app-custom-option>
      <app-custom-option value="opt3" divider>Option 3</app-custom-option>
      <app-custom-option value="opt4">Option 4</app-custom-option>
    </app-custom-select>
  `,
})
class TestHostComponent {
  val = "opt1";
  extendToBottom = false;
  maxHeight?: number | string;
}

describe("CustomSelectComponent", () => {
  let component: CustomSelectComponent;
  let fixture: ComponentFixture<CustomSelectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustomSelectComponent, MockTranslatePipe, TestHostComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CustomSelectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should open and close dropdown", () => {
    expect(component.isOpen).toBeFalse();
    component.toggleOpen();
    expect(component.isOpen).toBeTrue();
    component.toggleOpen();
    expect(component.isOpen).toBeFalse();
  });

  it("should update value and attribute when value property is set", () => {
    fixture.componentRef.setInput("value", "test-val");
    fixture.detectChanges();
    expect(component.value()).toBe("test-val");
    expect(fixture.nativeElement.getAttribute("data-value")).toBe("test-val");

    component.value.set(undefined);
    fixture.detectChanges();
    expect(component.value()).toBeUndefined();
    expect(fixture.nativeElement.hasAttribute("data-value")).toBeFalse();
  });

  it("should support writeValue from ControlValueAccessor", () => {
    component.writeValue("cva-val");
    fixture.detectChanges();
    expect(component.value()).toBe("cva-val");
    expect(fixture.nativeElement.getAttribute("data-value")).toBe("cva-val");
  });

  it("should render separators when options have separator or divider inputs", () => {
    const hostFixture = TestBed.createComponent(TestHostComponent);
    hostFixture.detectChanges();

    const select = hostFixture.debugElement.children[0]
      .componentInstance as CustomSelectComponent;
    select.toggleOpen();
    hostFixture.detectChanges();

    const hostElement = hostFixture.nativeElement as HTMLElement;
    const separators = hostElement.querySelectorAll(".custom-select-separator");
    expect(separators.length).toBe(2);

    const options = hostElement.querySelectorAll(".custom-select-option");
    expect(options.length).toBe(4);
  });

  it("should update selectedLabel dynamically when option label text changes", () => {
    const hostFixture = TestBed.createComponent(DynamicLabelTestHostComponent);
    hostFixture.detectChanges();

    const select = hostFixture.debugElement.children[0]
      .componentInstance as CustomSelectComponent;
    const hostElement = hostFixture.nativeElement as HTMLElement;

    expect(select.selectedLabel).toBe("Original Label");
    expect(
      hostElement.querySelector(".selected-text")?.textContent?.trim(),
    ).toBe("Original Label");

    hostFixture.componentInstance.opt1Label = "Renamed Layout";
    hostFixture.detectChanges();

    expect(select.selectedLabel).toBe("Renamed Layout");
    expect(
      hostElement.querySelector(".selected-text")?.textContent?.trim(),
    ).toBe("Renamed Layout");

    select.toggleOpen();
    hostFixture.detectChanges();

    const optionEl = hostElement.querySelector(
      '.custom-select-option[data-value="opt1"]',
    );
    expect(optionEl?.textContent?.trim()).toBe("Renamed Layout");
    expect(
      hostElement.querySelector(".selected-text")?.getAttribute("title"),
    ).toBe("Renamed Layout");
  });

  it("should set title attribute on .selected-text matching selectedLabel", () => {
    const hostFixture = TestBed.createComponent(TestHostComponent);
    hostFixture.detectChanges();

    const hostElement = hostFixture.nativeElement as HTMLElement;
    const selectedTextEl = hostElement.querySelector(".selected-text");
    expect(selectedTextEl?.getAttribute("title")).toBe("Option 1");
  });

  it("should invoke scrollToSelectedOption on toggleOpen", () => {
    const hostFixture = TestBed.createComponent(TestHostComponent);
    hostFixture.componentInstance.val = "opt3";
    hostFixture.detectChanges();

    const select = hostFixture.debugElement.children[0]
      .componentInstance as CustomSelectComponent;
    const scrollSpy = spyOn(select, "scrollToSelectedOption");

    select.toggleOpen();
    expect(scrollSpy).toHaveBeenCalled();
  });

  it("should not set scrollTop when dropdown is not scrollable (scrollHeight <= clientHeight)", fakeAsync(() => {
    const hostFixture = TestBed.createComponent(TestHostComponent);
    hostFixture.componentInstance.val = "opt3";
    hostFixture.detectChanges();

    const select = hostFixture.debugElement.children[0]
      .componentInstance as CustomSelectComponent;

    select.toggleOpen();
    hostFixture.detectChanges();

    const hostElement = hostFixture.nativeElement as HTMLElement;
    const dropdown = hostElement.querySelector(
      ".custom-select-dropdown",
    ) as HTMLElement;

    let assignedScrollTop = 0;
    Object.defineProperty(dropdown, "scrollTop", {
      get: () => assignedScrollTop,
      set: (val: number) => {
        assignedScrollTop = val;
      },
      configurable: true,
    });
    Object.defineProperty(dropdown, "clientHeight", {
      value: 200,
      configurable: true,
    });
    Object.defineProperty(dropdown, "scrollHeight", {
      value: 150,
      configurable: true,
    });

    select.scrollToSelectedOption();
    tick(10);

    expect(assignedScrollTop).toBe(0);
  }));

  it("should center selected option when dropdown is scrollable (scrollHeight > clientHeight)", fakeAsync(() => {
    const hostFixture = TestBed.createComponent(TestHostComponent);
    hostFixture.componentInstance.val = "opt3";
    hostFixture.detectChanges();

    const select = hostFixture.debugElement.children[0]
      .componentInstance as CustomSelectComponent;

    select.toggleOpen();
    hostFixture.detectChanges();

    const hostElement = hostFixture.nativeElement as HTMLElement;
    const dropdown = hostElement.querySelector(
      ".custom-select-dropdown",
    ) as HTMLElement;
    const selectedEl = hostElement.querySelector(
      ".custom-select-option.selected",
    ) as HTMLElement;

    let assignedScrollTop = 0;
    Object.defineProperty(dropdown, "scrollTop", {
      get: () => assignedScrollTop,
      set: (val: number) => {
        assignedScrollTop = val;
      },
      configurable: true,
    });
    Object.defineProperty(dropdown, "clientHeight", {
      value: 200,
      configurable: true,
    });
    Object.defineProperty(dropdown, "scrollHeight", {
      value: 600,
      configurable: true,
    });
    Object.defineProperty(selectedEl, "offsetTop", {
      value: 350,
      configurable: true,
    });
    Object.defineProperty(selectedEl, "offsetHeight", {
      value: 40,
      configurable: true,
    });

    select.scrollToSelectedOption();
    tick(10);

    // targetScroll = 350 - 200/2 + 40/2 = 350 - 100 + 20 = 270
    expect(assignedScrollTop).toBe(270);
  }));

  it("should not scroll if closed before timer executes", fakeAsync(() => {
    const hostFixture = TestBed.createComponent(TestHostComponent);
    hostFixture.componentInstance.val = "opt3";
    hostFixture.detectChanges();

    const select = hostFixture.debugElement.children[0]
      .componentInstance as CustomSelectComponent;

    select.toggleOpen();
    hostFixture.detectChanges();

    const hostElement = hostFixture.nativeElement as HTMLElement;
    const dropdown = hostElement.querySelector(
      ".custom-select-dropdown",
    ) as HTMLElement;
    const selectedEl = hostElement.querySelector(
      ".custom-select-option.selected",
    ) as HTMLElement;

    Object.defineProperty(dropdown, "clientHeight", {
      value: 0,
      configurable: true,
    });
    const scrollIntoViewSpy = spyOn(selectedEl, "scrollIntoView");

    select.isOpen = false;
    tick(10);

    expect(scrollIntoViewSpy).not.toHaveBeenCalled();
  }));

  it("should open upward when space below is tight and space above is larger", () => {
    const hostFixture = TestBed.createComponent(TestHostComponent);
    hostFixture.detectChanges();
    const select = hostFixture.debugElement.children[0]
      .componentInstance as CustomSelectComponent;
    const selectEl = hostFixture.nativeElement.querySelector(
      "app-custom-select",
    ) as HTMLElement;

    spyOn(selectEl, "getBoundingClientRect").and.returnValue({
      top: 500,
      bottom: 540,
      left: 100,
      right: 200,
      width: 100,
      height: 40,
    } as DOMRect);

    // Mock window innerHeight so spaceBelow = 600 - 540 = 60 (< 250) and spaceAbove = 500 (> 60)
    spyOnProperty(window, "innerHeight", "get").and.returnValue(600);

    select.toggleOpen();
    hostFixture.detectChanges();

    expect(select.openUpward).toBeTrue();
    const dropdown = hostFixture.nativeElement.querySelector(
      ".custom-select-dropdown",
    );
    expect(dropdown.classList.contains("open-upward")).toBeTrue();
  });

  it("should align right when element is near right edge of viewport", () => {
    const hostFixture = TestBed.createComponent(TestHostComponent);
    hostFixture.detectChanges();
    const select = hostFixture.debugElement.children[0]
      .componentInstance as CustomSelectComponent;
    const selectEl = hostFixture.nativeElement.querySelector(
      "app-custom-select",
    ) as HTMLElement;

    // rect.left + 350 > window.innerWidth (700 + 350 = 1050 > 1000)
    spyOn(selectEl, "getBoundingClientRect").and.returnValue({
      top: 100,
      bottom: 140,
      left: 700,
      right: 800,
      width: 100,
      height: 40,
    } as DOMRect);
    spyOnProperty(window, "innerWidth", "get").and.returnValue(1000);

    select.toggleOpen();
    hostFixture.detectChanges();

    expect(select.openRightAligned).toBeTrue();
    const dropdown = hostFixture.nativeElement.querySelector(
      ".custom-select-dropdown",
    );
    expect(dropdown.classList.contains("align-right")).toBeTrue();
  });

  it("should close dropdown when Escape key is pressed", () => {
    component.isOpen = true;
    fixture.detectChanges();

    component.onEscape();
    expect(component.isOpen).toBeFalse();
  });

  it("should close dropdown when clicking outside element", () => {
    component.isOpen = true;
    fixture.detectChanges();

    const outsideElement = document.createElement("div");
    document.body.appendChild(outsideElement);

    component.onDocumentClick({
      target: outsideElement,
    } as unknown as MouseEvent);
    expect(component.isOpen).toBeFalse();

    document.body.removeChild(outsideElement);
  });

  it("should select option and close dropdown on option click", () => {
    const hostFixture = TestBed.createComponent(TestHostComponent);
    hostFixture.detectChanges();
    const select = hostFixture.debugElement.children[0]
      .componentInstance as CustomSelectComponent;

    select.toggleOpen();
    hostFixture.detectChanges();

    const option2 = hostFixture.nativeElement.querySelector(
      '.custom-select-option[data-value="opt2"]',
    ) as HTMLElement;
    expect(option2).toBeTruthy();

    option2.click();
    hostFixture.detectChanges();

    expect(select.isOpen).toBeFalse();
    expect(select.value()).toBe("opt2");
    expect(select.selectedLabel).toBe("Option 2");
  });

  it("should calculate available height to page bottom when extendToPageBottom is true", () => {
    const hostFixture = TestBed.createComponent(TestHostComponent);
    hostFixture.componentInstance.extendToBottom = true;
    hostFixture.detectChanges();
    const select = hostFixture.debugElement.children[0]
      .componentInstance as CustomSelectComponent;

    const selectEl = hostFixture.nativeElement.querySelector(
      "app-custom-select",
    ) as HTMLElement;

    spyOn(selectEl, "getBoundingClientRect").and.returnValue({
      top: 20,
      bottom: 60,
      left: 100,
      right: 300,
      width: 200,
      height: 40,
    } as DOMRect);
    spyOnProperty(window, "innerHeight", "get").and.returnValue(900);

    select.toggleOpen();
    hostFixture.detectChanges();

    expect(select.openUpward).toBeFalse();
    // 900 - 60 - 16 = 824px
    expect(select.calculatedMaxHeight).toBe("824px");
    const dropdown = hostFixture.nativeElement.querySelector(
      ".custom-select-dropdown",
    ) as HTMLElement;
    expect(dropdown.style.maxHeight).toBe("824px");
  });

  it("should calculate available height to top when extendToPageBottom is true and opening upward", () => {
    const hostFixture = TestBed.createComponent(TestHostComponent);
    hostFixture.componentInstance.extendToBottom = true;
    hostFixture.detectChanges();
    const select = hostFixture.debugElement.children[0]
      .componentInstance as CustomSelectComponent;

    const selectEl = hostFixture.nativeElement.querySelector(
      "app-custom-select",
    ) as HTMLElement;

    spyOn(selectEl, "getBoundingClientRect").and.returnValue({
      top: 600,
      bottom: 640,
      left: 100,
      right: 300,
      width: 200,
      height: 40,
    } as DOMRect);
    // spaceBelow = 700 - 640 = 60 (< 200 threshold), spaceAbove = 600 (> 60)
    spyOnProperty(window, "innerHeight", "get").and.returnValue(700);

    select.toggleOpen();
    hostFixture.detectChanges();

    expect(select.openUpward).toBeTrue();
    // 600 - 16 = 584px
    expect(select.calculatedMaxHeight).toBe("584px");
    const dropdown = hostFixture.nativeElement.querySelector(
      ".custom-select-dropdown",
    ) as HTMLElement;
    expect(dropdown.style.maxHeight).toBe("584px");
  });

  it("should apply maxDropdownHeight when specified", () => {
    const hostFixture = TestBed.createComponent(TestHostComponent);
    hostFixture.componentInstance.maxHeight = 450;
    hostFixture.detectChanges();
    const select = hostFixture.debugElement.children[0]
      .componentInstance as CustomSelectComponent;

    select.toggleOpen();
    hostFixture.detectChanges();

    expect(select.calculatedMaxHeight).toBe("450px");
    const dropdown = hostFixture.nativeElement.querySelector(
      ".custom-select-dropdown",
    ) as HTMLElement;
    expect(dropdown.style.maxHeight).toBe("450px");
  });

  it("should not set calculatedMaxHeight when extendToPageBottom is false and maxHeight is undefined", () => {
    const hostFixture = TestBed.createComponent(TestHostComponent);
    hostFixture.detectChanges();
    const select = hostFixture.debugElement.children[0]
      .componentInstance as CustomSelectComponent;

    select.toggleOpen();
    hostFixture.detectChanges();

    expect(select.calculatedMaxHeight).toBeNull();
    const dropdown = hostFixture.nativeElement.querySelector(
      ".custom-select-dropdown",
    ) as HTMLElement;
    expect(dropdown.style.maxHeight).toBe("");
  });

  it("should update calculatedMaxHeight on window resize and scroll when open", () => {
    const hostFixture = TestBed.createComponent(TestHostComponent);
    hostFixture.componentInstance.extendToBottom = true;
    hostFixture.detectChanges();
    const select = hostFixture.debugElement.children[0]
      .componentInstance as CustomSelectComponent;

    const selectEl = hostFixture.nativeElement.querySelector(
      "app-custom-select",
    ) as HTMLElement;

    let currentBottom = 60;
    spyOn(selectEl, "getBoundingClientRect").and.callFake(
      () =>
        ({
          top: currentBottom - 40,
          bottom: currentBottom,
          left: 100,
          right: 300,
          width: 200,
          height: 40,
        }) as DOMRect,
    );
    let currentHeight = 900;
    spyOnProperty(window, "innerHeight", "get").and.callFake(
      () => currentHeight,
    );

    select.toggleOpen();
    hostFixture.detectChanges();
    expect(select.calculatedMaxHeight).toBe("824px");

    // Resize window
    currentHeight = 1000;
    window.dispatchEvent(new Event("resize"));
    hostFixture.detectChanges();
    // 1000 - 60 - 16 = 924px
    expect(select.calculatedMaxHeight).toBe("924px");

    // Scroll window
    currentBottom = 80;
    window.dispatchEvent(new Event("scroll"));
    hostFixture.detectChanges();
    // 1000 - 80 - 16 = 904px
    expect(select.calculatedMaxHeight).toBe("904px");
  });

  describe("Multi-select functionality", () => {
    let hostFixture: ComponentFixture<MultiSelectTestHostComponent>;
    let hostComponent: MultiSelectTestHostComponent;
    let select: CustomSelectComponent;
    let element: HTMLElement;

    beforeEach(() => {
      hostFixture = TestBed.createComponent(MultiSelectTestHostComponent);
      hostComponent = hostFixture.componentInstance;
      hostFixture.detectChanges();
      select = hostFixture.debugElement.children[0]
        .componentInstance as CustomSelectComponent;
      element = hostFixture.nativeElement as HTMLElement;
    });

    it("should display placeholder or all option when empty array is selected", () => {
      expect(select.selectedLabel).toBe("All Items");
      expect(element.querySelector(".selected-text")?.textContent?.trim()).toBe(
        "All Items",
      );
      expect(element.querySelector(".custom-select-clear-btn")).toBeNull();
    });

    it("should toggle option selection on click without closing dropdown", () => {
      select.toggleOpen();
      hostFixture.detectChanges();
      expect(select.isOpen).toBeTrue();

      const options = element.querySelectorAll<HTMLElement>(
        ".custom-select-option",
      );
      // Click Option 1
      options[1].click();
      hostFixture.detectChanges();

      expect(select.isOpen).toBeTrue();
      expect(select.value()).toEqual(["opt1"]);
      expect(hostComponent.onChange).toHaveBeenCalledWith(["opt1"]);

      // Click Option 2
      options[2].click();
      hostFixture.detectChanges();

      expect(select.isOpen).toBeTrue();
      expect(select.value()).toEqual(["opt1", "opt2"]);

      // Click Option 1 again to deselect
      options[1].click();
      hostFixture.detectChanges();

      expect(select.isOpen).toBeTrue();
      expect(select.value()).toEqual(["opt2"]);
    });

    it("should render color dot and label name when 1 option is selected", () => {
      select.value.set(["opt1"]);
      select.updateSelectedLabel();
      hostFixture.detectChanges();

      const triggerDot = element.querySelector(
        ".custom-select-trigger .custom-select-color-dot",
      ) as HTMLElement;
      expect(triggerDot).toBeTruthy();
      expect(triggerDot.style.backgroundColor).toBe("rgb(239, 68, 68)");
      expect(
        element
          .querySelector(".custom-select-trigger-text")
          ?.textContent?.trim(),
      ).toBe("Option 1");
      expect(element.querySelector(".custom-select-clear-btn")).toBeTruthy();
    });

    it("should render multiple color dots and multiCountText when multiple options selected", () => {
      select.value.set(["opt1", "opt2"]);
      select.updateSelectedLabel();
      hostFixture.detectChanges();

      const triggerDots = element.querySelectorAll(
        ".custom-select-trigger .custom-select-color-dot",
      );
      expect(triggerDots.length).toBe(2);
      expect(
        element
          .querySelector(".custom-select-trigger-text")
          ?.textContent?.trim(),
      ).toBe("Items (2)");
    });

    it("should clear selections when the All Items option is clicked", () => {
      select.value.set(["opt1", "opt2"]);
      select.updateSelectedLabel();
      select.toggleOpen();
      hostFixture.detectChanges();

      const options = element.querySelectorAll<HTMLElement>(
        ".custom-select-option",
      );
      // Click All Items option (index 0)
      options[0].click();
      hostFixture.detectChanges();

      expect(select.value()).toEqual([]);
      expect(element.querySelector(".selected-text")?.textContent?.trim()).toBe(
        "All Items",
      );
    });

    it("should clear selections when clear button on trigger is clicked", () => {
      select.value.set(["opt1"]);
      select.updateSelectedLabel();
      hostFixture.detectChanges();

      const clearBtn = element.querySelector<HTMLButtonElement>(
        ".custom-select-clear-btn",
      );
      expect(clearBtn).toBeTruthy();

      clearBtn!.click();
      hostFixture.detectChanges();

      expect(select.value()).toEqual([]);
      expect(element.querySelector(".selected-text")?.textContent?.trim()).toBe(
        "All Items",
      );
    });

    it("should show checkbox icons in multi-select dropdown", () => {
      select.value.set(["opt1"]);
      select.toggleOpen();
      hostFixture.detectChanges();

      const checkboxes = element.querySelectorAll(".custom-select-checkbox");
      // Options 1, 2, 3 have checkboxes (All Items does not)
      expect(checkboxes.length).toBe(3);
      expect(checkboxes[0].textContent?.trim()).toBe("check_box");
      expect(checkboxes[1].textContent?.trim()).toBe("check_box_outline_blank");
    });

    it("should handle writeValue with array, empty array, or string", () => {
      select.writeValue(["opt2"]);
      expect(select.value()).toEqual(["opt2"]);

      select.writeValue("");
      expect(select.value()).toEqual([]);

      select.writeValue("opt1");
      expect(select.value()).toEqual(["opt1"]);
    });
  });
});

@Component({
  standalone: true,
  imports: [CustomSelectComponent, CustomOptionComponent],
  template: `
    <app-custom-select [value]="val">
      <app-custom-option value="opt1">{{ opt1Label }}</app-custom-option>
      <app-custom-option value="opt2">Option 2</app-custom-option>
    </app-custom-select>
  `,
})
class DynamicLabelTestHostComponent {
  val = "opt1";
  opt1Label = "Original Label";
}

@Component({
  standalone: true,
  imports: [CustomSelectComponent, CustomOptionComponent],
  template: `
    <app-custom-select
      [multiple]="true"
      [value]="val"
      placeholder="All Items"
      multiCountText="Items ({count})"
      (change)="onChange($event)"
    >
      <app-custom-option value="">All Items</app-custom-option>
      <app-custom-option value="opt1" color="#ef4444"
        >Option 1</app-custom-option
      >
      <app-custom-option value="opt2" color="#22c55e"
        >Option 2</app-custom-option
      >
      <app-custom-option value="opt3">Option 3</app-custom-option>
    </app-custom-select>
  `,
})
class MultiSelectTestHostComponent {
  val: string[] = [];
  onChange = jasmine.createSpy("onChange");
}

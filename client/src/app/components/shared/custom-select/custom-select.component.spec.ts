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
    <app-custom-select [value]="val">
      <app-custom-option value="opt1" separator>Option 1</app-custom-option>
      <app-custom-option value="opt2">Option 2</app-custom-option>
      <app-custom-option value="opt3" divider>Option 3</app-custom-option>
      <app-custom-option value="opt4">Option 4</app-custom-option>
    </app-custom-select>
  `,
})
class TestHostComponent {
  val = "opt1";
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

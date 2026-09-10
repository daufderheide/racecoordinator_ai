import { Pipe, PipeTransform } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";

import { AssetLayoutSwitcherComponent } from "./asset-layout-switcher.component";

@Pipe({ name: "translate", standalone: true })
class MockTranslatePipe implements PipeTransform {
  transform(value: string): string {
    return value;
  }
}

describe("AssetLayoutSwitcherComponent", () => {
  let component: AssetLayoutSwitcherComponent;
  let fixture: ComponentFixture<AssetLayoutSwitcherComponent>;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [AssetLayoutSwitcherComponent, MockTranslatePipe],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AssetLayoutSwitcherComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should have medium as default layout", () => {
    expect(component.layout()).toBe("medium");
    const mediumBtn = fixture.nativeElement.querySelector(
      ".layout-btn-medium.active",
    );
    expect(mediumBtn).toBeTruthy();
  });

  it("should update layout and set active class when clicking buttons", () => {
    const listBtn: HTMLButtonElement =
      fixture.nativeElement.querySelector(".layout-btn-list");
    listBtn.click();
    fixture.detectChanges();

    expect(component.layout()).toBe("list");
    expect(listBtn.classList.contains("active")).toBeTrue();

    const smallBtn: HTMLButtonElement =
      fixture.nativeElement.querySelector(".layout-btn-small");
    smallBtn.click();
    fixture.detectChanges();

    expect(component.layout()).toBe("small");
    expect(smallBtn.classList.contains("active")).toBeTrue();

    const largeBtn: HTMLButtonElement =
      fixture.nativeElement.querySelector(".layout-btn-large");
    largeBtn.click();
    fixture.detectChanges();

    expect(component.layout()).toBe("large");
    expect(largeBtn.classList.contains("active")).toBeTrue();
  });

  it("should read initial layout from localStorage if storageKey is provided", () => {
    localStorage.setItem("test_asset_layout", "small");

    const newFixture = TestBed.createComponent(AssetLayoutSwitcherComponent);
    newFixture.componentRef.setInput("storageKey", "test_asset_layout");
    newFixture.detectChanges();

    expect(newFixture.componentInstance.layout()).toBe("small");
  });

  it("should save layout to localStorage when changed if storageKey is provided", () => {
    fixture.componentRef.setInput("storageKey", "test_asset_layout");
    fixture.detectChanges();

    component.setLayout("large");
    expect(localStorage.getItem("test_asset_layout")).toBe("large");

    component.setLayout("list");
    expect(localStorage.getItem("test_asset_layout")).toBe("list");
  });
});

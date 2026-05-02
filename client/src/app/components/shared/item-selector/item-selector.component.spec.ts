import { TestbedHarnessEnvironment } from "@angular/cdk/testing/testbed";
import { Pipe, PipeTransform } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FormsModule } from "@angular/forms";

import { ItemSelectorComponent } from "./item-selector.component";
import { ItemSelectorHarness } from "./testing/item-selector.harness";

@Pipe({ name: "avatarUrl" })
class MockAvatarUrlPipe implements PipeTransform {
  transform(value: string): string {
    return value;
  }
}

@Pipe({ name: "translate" })
class MockTranslatePipe implements PipeTransform {
  transform(value: string): string {
    return value;
  }
}

import { Component, Input } from "@angular/core";
@Component({
  selector: "app-asset-preview",
  template: "",
  imports: [FormsModule],
})
class MockAssetPreviewComponent {
  @Input() assetId?: string;
  @Input() type: string = "image";
  @Input() imageUrl?: string;
  @Input() name: string = "";
  @Input() images?: any[];
  @Input() animate: boolean = true;
}

describe("ItemSelectorComponent", () => {
  let component: ItemSelectorComponent;
  let fixture: ComponentFixture<ItemSelectorComponent>;
  let harness: ItemSelectorHarness;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        FormsModule,
        ItemSelectorComponent,
        MockAvatarUrlPipe,
        MockTranslatePipe,
        MockAssetPreviewComponent,
      ],
    }).compileComponents();
  });

  beforeEach(async () => {
    fixture = TestBed.createComponent(ItemSelectorComponent);
    component = fixture.componentInstance;
    harness = await TestbedHarnessEnvironment.harnessForFixture(
      fixture,
      ItemSelectorHarness,
    );
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should not be visible by default", async () => {
    expect(component.visible).toBeFalse();
    expect(await harness.isVisible()).toBeFalse();
  });

  it("should display items when visible", async () => {
    component.visible = true;
    component.items = [
      {
        name: "Item 1",
        url: "assets/images/default_avatar.svg",
        type: "image",
      },
      {
        name: "Item 2",
        url: "assets/images/default_avatar.svg",
        type: "image",
      },
    ];
    fixture.detectChanges();

    expect(await harness.getItemsCount()).toBe(2);
    expect(await harness.getItemText(0)).toContain("Item 1");
  });

  it("should filter items by itemType", () => {
    component.items = [
      { name: "Image 1", type: "image" },
      { name: "Set 1", type: "image_set" },
      { name: "Sound 1", type: "sound" },
    ];
    component.itemType = "image";
    expect(component.filteredItems.length).toBe(1);
    expect(component.filteredItems[0].name).toBe("Image 1");

    component.itemType = "image_set";
    expect(component.filteredItems.length).toBe(1);
    expect(component.filteredItems[0].name).toBe("Set 1");
  });

  it("should emit select event when item is clicked", () => {
    spyOn(component.select, "emit");
    const item = { name: "Test Item", url: "test.png", type: "image" };
    component.onSelect(item);
    expect(component.select.emit).toHaveBeenCalledWith(item);
  });

  it("should emit play event when onPlay is called", () => {
    spyOn(component.play, "emit");
    const item = { name: "Test Sound", url: "test.mp3", type: "sound" };
    const event = new MouseEvent("click");
    component.onPlay(event, item);
    expect(component.play.emit).toHaveBeenCalledWith(item);
  });

  it("should stop propagation when onPlay is called", () => {
    const event = new MouseEvent("click");
    spyOn(event, "stopPropagation");
    spyOn(event, "stopImmediatePropagation");
    component.onPlay(event, {});
    expect(event.stopPropagation).toHaveBeenCalled();
    expect(event.stopImmediatePropagation).toHaveBeenCalled();
  });

  it("should emit close event on close button click", async () => {
    spyOn(component.close, "emit");
    component.visible = true;

    await harness.clickClose();

    expect(component.close.emit).toHaveBeenCalled();
  });
});

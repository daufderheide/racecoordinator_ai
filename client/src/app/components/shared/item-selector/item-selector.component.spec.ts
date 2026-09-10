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

import { Component, input } from "@angular/core";
@Component({
  selector: "app-asset-preview",
  standalone: true,
  template: "",
  imports: [FormsModule],
})
class MockAssetPreviewComponent {
  assetId = input<string | undefined>();
  type = input<string>("image");
  imageUrl = input<string | undefined>();
  name = input<string>("");
  images = input<any[] | undefined>();
  animate = input<boolean>(true);
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
    expect(component.visible()).toBeFalse();
    expect(await harness.isVisible()).toBeFalse();
  });

  it("should display items when visible", async () => {
    fixture.componentRef.setInput("visible", true);
    fixture.componentRef.setInput("items", [
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
    ]);
    fixture.detectChanges();

    expect(await harness.getItemsCount()).toBe(2);
    expect(await harness.getItemText(0)).toContain("Item 1");
  });

  it("should filter items by itemType", () => {
    fixture.componentRef.setInput("items", [
      { name: "Image 1", type: "image" },
      { name: "Set 1", type: "image_set" },
      { name: "Sound 1", type: "sound" },
      { name: "Audio 1", type: "audio" },
    ]);
    fixture.componentRef.setInput("itemType", "image");
    expect(component.filteredItems().length).toBe(1);
    expect(component.filteredItems()[0].name).toBe("Image 1");

    fixture.componentRef.setInput("itemType", "image_set");
    expect(component.filteredItems().length).toBe(1);
    expect(component.filteredItems()[0].name).toBe("Set 1");

    fixture.componentRef.setInput("itemType", "audio");
    expect(component.filteredItems().length).toBe(2);
    expect(component.filteredItems().map((i) => i.name)).toEqual([
      "Audio 1",
      "Sound 1",
    ]);
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
    fixture.componentRef.setInput("visible", true);

    await harness.clickClose();

    expect(component.close.emit).toHaveBeenCalled();
  });

  it("should compute correct acceptedTypes for image and audio", () => {
    fixture.componentRef.setInput("itemType", "image");
    expect(component.acceptedTypes()).toContain("image/*");

    fixture.componentRef.setInput("itemType", "audio");
    expect(component.acceptedTypes()).toContain("audio/*");

    fixture.componentRef.setInput("itemType", "audio_set");
    expect(component.acceptedTypes()).toContain("audio/*");

    fixture.componentRef.setInput("itemType", "sound");
    expect(component.acceptedTypes()).toContain("audio/*");
  });

  it("should emit filePicked, close dialog, and reset input value when onFileInput is called", () => {
    spyOn(component.filePicked, "emit");
    spyOn(component.close, "emit");
    const testFile = new File(["sample"], "avatar.png", { type: "image/png" });
    const mockInput = {
      files: [testFile],
      value: "C:\\fakepath\\avatar.png",
    } as any;
    const mockEvent = { target: mockInput } as unknown as Event;

    component.onFileInput(mockEvent);

    expect(component.filePicked.emit).toHaveBeenCalledWith(testFile);
    expect(component.close.emit).toHaveBeenCalled();
    expect(mockInput.value).toBe("");
  });

  it("should handle drag and drop: track dragCounter and emit filePicked and close on drop", () => {
    spyOn(component.filePicked, "emit");
    spyOn(component.close, "emit");

    const enterEvent = new DragEvent("dragenter", { cancelable: true });
    spyOn(enterEvent, "preventDefault");
    spyOn(enterEvent, "stopPropagation");
    component.onDragEnter(enterEvent);
    expect(component.isDragging).toBeTrue();
    expect(component.dragCounter).toBe(1);

    const overEvent = new DragEvent("dragover", { cancelable: true });
    spyOn(overEvent, "preventDefault");
    spyOn(overEvent, "stopPropagation");
    component.onDragOver(overEvent);
    expect(component.isDragging).toBeTrue();

    const leaveEvent = new DragEvent("dragleave", { cancelable: true });
    component.onDragLeave(leaveEvent);
    expect(component.dragCounter).toBe(0);
    expect(component.isDragging).toBeFalse();

    const droppedFile = new File(["sound-data"], "engine.wav", {
      type: "audio/wav",
    });
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(droppedFile);
    const dropEvent = new DragEvent("drop", { dataTransfer });

    component.onDrop(dropEvent);

    expect(component.filePicked.emit).toHaveBeenCalledWith(droppedFile);
    expect(component.close.emit).toHaveBeenCalled();
    expect(component.isDragging).toBeFalse();
    expect(component.dragCounter).toBe(0);
  });

  it("should display browse button and upload card when allowBrowse is true", () => {
    fixture.componentRef.setInput("visible", true);
    fixture.componentRef.setInput("allowBrowse", true);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const browseBtn = compiled.querySelector(".btn-browse");
    const uploadCard = compiled.querySelector(".upload-card");

    expect(browseBtn).toBeTruthy();
    expect(uploadCard).toBeTruthy();
  });

  it("should hide browse button and upload card when allowBrowse is false", () => {
    fixture.componentRef.setInput("visible", true);
    fixture.componentRef.setInput("allowBrowse", false);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const browseBtn = compiled.querySelector(".btn-browse");
    const uploadCard = compiled.querySelector(".upload-card");

    expect(browseBtn).toBeNull();
    expect(uploadCard).toBeNull();
  });

  it("should render layout switcher and update layoutMode signal", () => {
    fixture.componentRef.setInput("visible", true);
    fixture.detectChanges();

    const switcher = fixture.nativeElement.querySelector(
      "app-asset-layout-switcher",
    );
    expect(switcher).toBeTruthy();
    expect(component.layoutMode()).toBe("medium");

    component.layoutMode.set("list");
    fixture.detectChanges();

    const grid = fixture.nativeElement.querySelector(".item-grid");
    expect(grid.classList.contains("layout-list")).toBeTrue();

    component.layoutMode.set("small");
    fixture.detectChanges();
    expect(grid.classList.contains("layout-small")).toBeTrue();

    component.layoutMode.set("large");
    fixture.detectChanges();
    expect(grid.classList.contains("layout-large")).toBeTrue();
  });

  it("should apply layout classes to item-card and upload-card in list mode", () => {
    fixture.componentRef.setInput("visible", true);
    fixture.componentRef.setInput("allowBrowse", true);
    fixture.componentRef.setInput("itemType", "audio");
    fixture.componentRef.setInput("items", [
      { name: "Audio Item", type: "audio" },
    ]);
    component.layoutMode.set("list");
    fixture.detectChanges();

    const uploadCard = fixture.nativeElement.querySelector(".upload-card");
    const itemCard = fixture.nativeElement.querySelector(".item-card");

    expect(uploadCard.classList.contains("layout-list")).toBeTrue();
    expect(itemCard.classList.contains("layout-list")).toBeTrue();

    // Verify selecting still works in list view
    spyOn(component.select, "emit");
    itemCard.click();
    expect(component.select.emit).toHaveBeenCalledWith(
      jasmine.objectContaining({ name: "Audio Item" }),
    );

    // Verify play button still works in list view
    spyOn(component.play, "emit");
    const playBtn = fixture.nativeElement.querySelector(".play-preview");
    expect(playBtn).toBeTruthy();
    playBtn.click();
    expect(component.play.emit).toHaveBeenCalledWith(
      jasmine.objectContaining({ name: "Audio Item" }),
    );
  });

  it("should sort items first by asset type then by asset name", () => {
    fixture.componentRef.setInput("visible", true);
    fixture.componentRef.setInput("itemType", "all");
    fixture.componentRef.setInput("items", [
      { name: "Zebra Image", type: "image" },
      { name: "Banana Audio", type: "audio" },
      { name: "Apple Audio", type: "audio" },
      { name: "Alpha Image Set", type: "image_set" },
      { name: "Beta Image", type: "image" },
    ]);
    fixture.detectChanges();

    const filtered = component.filteredItems();
    expect(filtered.map((item) => `${item.type}:${item.name}`)).toEqual([
      "audio:Apple Audio",
      "audio:Banana Audio",
      "image:Beta Image",
      "image:Zebra Image",
      "image_set:Alpha Image Set",
    ]);
  });
});

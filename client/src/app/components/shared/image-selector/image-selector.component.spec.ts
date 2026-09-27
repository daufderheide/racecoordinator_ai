import { TestbedHarnessEnvironment } from "@angular/cdk/testing/testbed";
import {
  ChangeDetectorRef,
  Component,
  input,
  output,
  Pipe,
  PipeTransform,
} from "@angular/core";
import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from "@angular/core/testing";
import { of, throwError } from "rxjs";
import { DataService } from "@app/data.service";
import { LoggerService } from "@app/services/logger.service";
import { mockLoggerService } from "@app/testing/unit-test-mocks";

import { ImageSelectorComponent } from "./image-selector.component";
import { ImageSelectorHarness } from "./testing/image-selector.harness";

@Component({
  selector: "app-item-selector",
  standalone: true,
  template: "",
})
class MockItemSelectorComponent {
  items = input<any[]>([]);
  visible = input<boolean>(false);
  title = input<string>("");
  itemType = input<string>("image");
  backButtonRoute = input<string | null>(null);
  backButtonQueryParams = input<any>({});
  allowBrowse = input<boolean>(true);
  filePicked = output<File>();
  select = output<any>();
  close = output<void>();
}

@Component({
  selector: "app-asset-preview",
  standalone: true,
  template: "",
})
class MockAssetPreviewComponent {
  assetId = input<string | undefined>();
  type = input<string>("image");
  imageUrl = input<string | undefined>();
  name = input<string>("");
  images = input<any[] | undefined>();
  animate = input<boolean>(true);
}

@Pipe({ name: "translate" })
class MockTranslatePipe implements PipeTransform {
  transform(value: string): string {
    return value;
  }
}

@Pipe({ name: "avatarUrl" })
class MockAvatarUrlPipe implements PipeTransform {
  transform(value: string): string {
    return value;
  }
}

describe("ImageSelectorComponent", () => {
  let component: ImageSelectorComponent;
  let fixture: ComponentFixture<ImageSelectorComponent>;
  let harness: ImageSelectorHarness;
  let mockDataService: any;

  beforeEach(async () => {
    mockDataService = jasmine.createSpyObj("DataService", [
      "uploadAsset",
      "computeFileHash",
      "findAssetByHash",
    ]);
    mockDataService.computeFileHash.and.returnValue(
      Promise.resolve("hash-1234"),
    );
    mockDataService.findAssetByHash.and.returnValue(undefined);

    await TestBed.configureTestingModule({
      imports: [
        ImageSelectorComponent,
        MockItemSelectorComponent,
        MockAssetPreviewComponent,
        MockTranslatePipe,
        MockAvatarUrlPipe,
      ],
      providers: [
        { provide: DataService, useValue: mockDataService },
        { provide: LoggerService, useValue: mockLoggerService },
        ChangeDetectorRef,
      ],
    }).compileComponents();
  });

  beforeEach(async () => {
    fixture = TestBed.createComponent(ImageSelectorComponent);
    component = fixture.componentInstance;
    harness = await TestbedHarnessEnvironment.harnessForFixture(
      fixture,
      ImageSelectorHarness,
    );
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should handle drag over and leave", () => {
    const event = new DragEvent("dragover");
    spyOn(event, "preventDefault");
    spyOn(event, "stopPropagation");

    component.onDragOver(event);
    expect(component.isDragging).toBeTrue();
    expect(event.preventDefault).toHaveBeenCalled();
    expect(event.stopPropagation).toHaveBeenCalled();

    const leaveEvent = new DragEvent("dragleave");
    component.onDragLeave(leaveEvent);
    expect(component.isDragging).toBeFalse();
  });

  it("should handle drop and upload file", fakeAsync(() => {
    const file = new File(["upload-content"], "test.png", {
      type: "image/png",
    });
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    const dropEvent = new DragEvent("drop", { dataTransfer });

    const mockAsset = { url: "/assets/test.png" };
    mockDataService.uploadAsset.and.returnValue(of(mockAsset));

    let urlEmitted: string | undefined;
    (component as any).imageUrlChange.subscribe(
      (val: any) => (urlEmitted = val),
    );
    spyOn(component.uploadStarted, "emit");
    spyOn(component.uploadFinished, "emit");

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

    component.onDrop(dropEvent);
    tick(); // Process both readers

    expect(component.uploadStarted.emit).toHaveBeenCalled();
    expect(mockDataService.uploadAsset).toHaveBeenCalled();
    expect(urlEmitted).toBe(mockAsset.url);
    fixture.componentRef.setInput("imageUrl", mockAsset.url);
    fixture.detectChanges();
    expect(component.imageUrl()).toBe(mockAsset.url);
    expect(component.uploadFinished.emit).toHaveBeenCalled();
    expect(component.isUploading).toBeFalse();
  }));

  it("should handle upload error", fakeAsync(() => {
    const file = new File(["content"], "test.png", { type: "image/png" });
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    const dropEvent = new DragEvent("drop", { dataTransfer });

    mockDataService.uploadAsset.and.returnValue(
      throwError(() => new Error("Upload failed")),
    );
    const logger = TestBed.inject(LoggerService);
    spyOn(component.uploadFinished, "emit");

    spyOn(window as any, "FileReader").and.callFake(function () {
      return {
        readAsDataURL: jasmine
          .createSpy("readAsDataURL")
          .and.callFake(function (this: any) {
            setTimeout(() => {
              if (this.onload) this.onload({ target: { result: "data:" } });
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

    component.onDrop(dropEvent);
    tick();

    expect(component.isUploading).toBeFalse();
    expect(component.uploadFinished.emit).toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalled();
  }));

  it("should open and close selector", async () => {
    await harness.clickPreviewToOpenSelector();
    expect(component.showSelector).toBeTrue();
    component.closeSelector();
    expect(component.showSelector).toBeFalse();
  });

  it("should handle asset selection", () => {
    let urlEmitted: string | undefined;
    (component as any).imageUrlChange.subscribe(
      (val: any) => (urlEmitted = val),
    );
    const asset = { url: "/assets/selected.png" };

    component.onAssetSelected(asset);

    expect(urlEmitted).toBe(asset.url);
    fixture.componentRef.setInput("imageUrl", asset.url);
    fixture.detectChanges();
    expect(component.imageUrl()).toBe(asset.url);
    expect(component.showSelector).toBeFalse();
  });

  it("should deduplicate dropped image and reuse existing asset without network upload", fakeAsync(() => {
    const existingAsset = {
      model: { entityId: "existing-img-1" },
      url: "/assets/existing.png",
      hash: "hash-duplicate",
      name: "Existing Image",
    };
    mockDataService.computeFileHash.and.returnValue(
      Promise.resolve("hash-duplicate"),
    );
    mockDataService.findAssetByHash.and.returnValue(existingAsset);

    const file = new File(["duplicate-content"], "duplicate.png", {
      type: "image/png",
    });
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    const dropEvent = new DragEvent("drop", { dataTransfer });

    let urlEmitted: string | undefined;
    (component as any).imageUrlChange.subscribe(
      (val: any) => (urlEmitted = val),
    );
    spyOn(component.assetSelected, "emit");

    component.onDrop(dropEvent);
    tick();

    expect(mockDataService.computeFileHash).toHaveBeenCalledWith(file);
    expect(mockDataService.findAssetByHash).toHaveBeenCalledWith(
      "hash-duplicate",
      "image",
    );
    expect(mockDataService.uploadAsset).not.toHaveBeenCalled();
    expect(urlEmitted).toBe("/assets/existing.png");
    expect(component.assetSelected.emit).toHaveBeenCalledWith(existingAsset);
  }));

  it("should reject invalid file format with transient error and clear after 4 seconds", fakeAsync(() => {
    const file = new File(["text-content"], "notes.txt", {
      type: "text/plain",
    });
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    const dropEvent = new DragEvent("drop", { dataTransfer });

    component.onDrop(dropEvent);
    tick();

    expect(component.errorMessage).toBe("IS_ERR_INVALID_IMAGE");
    expect(mockDataService.uploadAsset).not.toHaveBeenCalled();

    tick(4000);
    expect(component.errorMessage).toBeNull();
  }));

  it("should handle onFilePicked from file browsing", fakeAsync(() => {
    component.showSelector = true;
    const file = new File(["picked-content"], "picked.jpg", {
      type: "image/jpeg",
    });
    const mockAsset = { url: "/assets/picked.jpg" };
    mockDataService.uploadAsset.and.returnValue(of(mockAsset));

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

    component.onFilePicked(file);
    expect(component.showSelector).toBeFalse();
    tick();

    expect(mockDataService.uploadAsset).toHaveBeenCalled();
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

  it("should close the dialog and assume the dropped file as the selection when dropped while dialog is open", fakeAsync(() => {
    component.openSelector();
    expect(component.showSelector).toBeTrue();

    const newAsset = {
      model: { entityId: "dialog-drop-img" },
      name: "avatar.png",
      type: "image",
      url: "/assets/avatar.png",
    };
    mockDataService.uploadAsset.and.returnValue(of(newAsset));

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
                this.onload({ target: { result: new ArrayBuffer(4) } });
            });
          }),
        onload: null,
      };
    });

    const file = new File(["avatar-data"], "avatar.png", {
      type: "image/png",
    });
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    const dropEvent = new DragEvent("drop", { dataTransfer });

    let emittedUrl: string | undefined;
    component.imageUrlChange.subscribe((u) => (emittedUrl = u));

    component.onDrop(dropEvent);
    tick();

    expect(component.showSelector).toBeFalse();
    expect(emittedUrl).toBe("/assets/avatar.png");
    expect(component.effectiveImageUrl()).toBe("/assets/avatar.png");
  }));
});

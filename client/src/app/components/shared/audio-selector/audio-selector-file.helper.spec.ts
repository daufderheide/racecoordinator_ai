import { of, throwError } from "rxjs";

import {
  AudioSelectorFileHelper,
  AudioSelectorFileHost,
} from "./audio-selector-file.helper";

describe("AudioSelectorFileHelper", () => {
  let mockHost: AudioSelectorFileHost;
  let mockEvent: any;

  beforeEach(() => {
    mockEvent = {
      preventDefault: jasmine.createSpy("preventDefault"),
      stopPropagation: jasmine.createSpy("stopPropagation"),
      dataTransfer: {
        dropEffect: "",
        files: [],
        getData: jasmine.createSpy("getData"),
      },
    };

    mockHost = {
      readonly: jasmine.createSpy("readonly").and.returnValue(false),
      isDragging: false,
      dragCounter: 0,
      isUploading: false,
      assets: jasmine.createSpy("assets").and.returnValue([]),
      closeItemSelector: jasmine.createSpy("closeItemSelector"),
      onAssetSelected: jasmine.createSpy("onAssetSelected"),
      selectResolvedAsset: jasmine.createSpy("selectResolvedAsset"),
      showTransientError: jasmine.createSpy("showTransientError"),
      cdr: {
        detectChanges: jasmine.createSpy("detectChanges"),
      } as any,
      dataService: {
        computeFileHash: jasmine.createSpy("computeFileHash"),
        findAssetByHash: jasmine.createSpy("findAssetByHash"),
        uploadAsset: jasmine.createSpy("uploadAsset"),
      } as any,
      logger: {
        error: jasmine.createSpy("error"),
      } as any,
      effectiveType: jasmine
        .createSpy("effectiveType")
        .and.returnValue("preset"),
      localType: { set: jasmine.createSpy("setLocalType") },
      localSelectedAsset: { set: jasmine.createSpy("setLocalSelectedAsset") },
      localUrl: { set: jasmine.createSpy("setLocalUrl") },
      savedPresetUrl: "",
      savedPresetAsset: null,
      localAssets: { update: jasmine.createSpy("updateLocalAssets") },
      typeChange: { emit: jasmine.createSpy("emitTypeChange") },
      onUrlChange: jasmine.createSpy("onUrlChange"),
      assetSelected: { emit: jasmine.createSpy("emitAssetSelected") },
      stop: jasmine.createSpy("stop"),
      play: jasmine.createSpy("play"),
    };
  });

  describe("Drag and Drop Handlers", () => {
    it("should ignore drag events if host is readonly", () => {
      (mockHost.readonly as jasmine.Spy).and.returnValue(true);

      AudioSelectorFileHelper.handleDragEnter(mockHost, mockEvent);
      expect(mockHost.isDragging).toBeFalse();
      expect(mockEvent.preventDefault).not.toHaveBeenCalled();

      AudioSelectorFileHelper.handleDragOver(mockHost, mockEvent);
      expect(mockEvent.dataTransfer.dropEffect).toBe("");

      AudioSelectorFileHelper.handleDragLeave(mockHost, mockEvent);
      expect(mockHost.dragCounter).toBe(0);

      AudioSelectorFileHelper.handleDrop(mockHost, mockEvent);
      expect(mockHost.closeItemSelector).not.toHaveBeenCalled();
    });

    it("should handle drag enter", () => {
      AudioSelectorFileHelper.handleDragEnter(mockHost, mockEvent);
      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(mockEvent.stopPropagation).toHaveBeenCalled();
      expect(mockHost.dragCounter).toBe(1);
      expect(mockHost.isDragging).toBeTrue();
    });

    it("should handle drag over", () => {
      AudioSelectorFileHelper.handleDragOver(mockHost, mockEvent);
      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(mockEvent.stopPropagation).toHaveBeenCalled();
      expect(mockEvent.dataTransfer.dropEffect).toBe("copy");
      expect(mockHost.isDragging).toBeTrue();
    });

    it("should handle drag leave and decrement counter", () => {
      mockHost.dragCounter = 2;
      mockHost.isDragging = true;

      AudioSelectorFileHelper.handleDragLeave(mockHost, mockEvent);
      expect(mockHost.dragCounter).toBe(1);
      expect(mockHost.isDragging).toBeTrue();

      AudioSelectorFileHelper.handleDragLeave(mockHost, mockEvent);
      expect(mockHost.dragCounter).toBe(0);
      expect(mockHost.isDragging).toBeFalse();
    });

    it("should handle drop with dropped files", () => {
      const file = new File(["dummy"], "sound.mp3", { type: "audio/mp3" });
      mockEvent.dataTransfer.files = [file];
      spyOn(AudioSelectorFileHelper, "processFile");

      AudioSelectorFileHelper.handleDrop(mockHost, mockEvent);
      expect(mockHost.dragCounter).toBe(0);
      expect(mockHost.isDragging).toBeFalse();
      expect(mockHost.closeItemSelector).toHaveBeenCalled();
      expect(AudioSelectorFileHelper.processFile).toHaveBeenCalledWith(
        mockHost,
        file,
      );
    });

    it("should handle drop with json asset data", () => {
      const asset = { entity_id: "a1", name: "Beep" };
      mockEvent.dataTransfer.getData.and.returnValue(JSON.stringify(asset));

      AudioSelectorFileHelper.handleDrop(mockHost, mockEvent);
      expect(mockHost.onAssetSelected).toHaveBeenCalledWith(asset);
    });

    it("should log error when dropped json data is invalid", () => {
      mockEvent.dataTransfer.getData.and.returnValue("invalid json{");

      AudioSelectorFileHelper.handleDrop(mockHost, mockEvent);
      expect(mockHost.logger.error).toHaveBeenCalled();
      expect(mockHost.onAssetSelected).not.toHaveBeenCalled();
    });
  });

  describe("processFile and uploadFile", () => {
    it("should show transient error for invalid file types", async () => {
      const badFile = new File(["data"], "test.txt", { type: "text/plain" });

      await AudioSelectorFileHelper.processFile(mockHost, badFile);
      expect(mockHost.showTransientError).toHaveBeenCalledWith(
        "AS_ERR_INVALID_AUDIO",
      );
      expect(mockHost.dataService.computeFileHash).not.toHaveBeenCalled();
    });

    it("should reuse existing asset if hash matches", async () => {
      const file = new File(["audio"], "engine.wav", { type: "audio/wav" });
      const existing = { id: "e1", hash: "hash123", type: "audio" };
      (mockHost.dataService.computeFileHash as jasmine.Spy).and.returnValue(
        Promise.resolve("hash123"),
      );
      (mockHost.dataService.findAssetByHash as jasmine.Spy).and.returnValue(
        existing,
      );

      await AudioSelectorFileHelper.processFile(mockHost, file);
      expect(mockHost.selectResolvedAsset).toHaveBeenCalledWith(existing);
      expect(mockHost.cdr.detectChanges).toHaveBeenCalled();
    });

    it("should reuse existing asset from assets list if findAssetByHash returns null", async () => {
      const file = new File(["audio"], "engine.wav", { type: "audio/wav" });
      const existing = { id: "e2", hash: "hash456", type: "audio" };
      (mockHost.dataService.computeFileHash as jasmine.Spy).and.returnValue(
        Promise.resolve("hash456"),
      );
      (mockHost.dataService.findAssetByHash as jasmine.Spy).and.returnValue(
        null,
      );
      (mockHost.assets as jasmine.Spy).and.returnValue([existing]);

      await AudioSelectorFileHelper.processFile(mockHost, file);
      expect(mockHost.selectResolvedAsset).toHaveBeenCalledWith(existing);
    });

    it("should upload file if no match found", async () => {
      const file = new File(["audio"], "new.mp3", { type: "audio/mp3" });
      (mockHost.dataService.computeFileHash as jasmine.Spy).and.returnValue(
        Promise.resolve("newhash"),
      );
      (mockHost.dataService.findAssetByHash as jasmine.Spy).and.returnValue(
        null,
      );
      spyOn(AudioSelectorFileHelper, "uploadFile");

      await AudioSelectorFileHelper.processFile(mockHost, file);
      expect(AudioSelectorFileHelper.uploadFile).toHaveBeenCalledWith(
        mockHost,
        file,
      );
    });

    it("should proceed to upload if computing hash throws", async () => {
      const file = new File(["audio"], "error.mp3", { type: "audio/mp3" });
      (mockHost.dataService.computeFileHash as jasmine.Spy).and.returnValue(
        Promise.reject(new Error("hash error")),
      );
      spyOn(AudioSelectorFileHelper, "uploadFile");

      await AudioSelectorFileHelper.processFile(mockHost, file);
      expect(mockHost.logger.error).toHaveBeenCalled();
      expect(AudioSelectorFileHelper.uploadFile).toHaveBeenCalledWith(
        mockHost,
        file,
      );
    });

    it("should successfully upload file and select asset", (done) => {
      const file = new File(["audio"], "uploaded.mp3", { type: "audio/mp3" });
      const uploadedAsset = { id: "u1", name: "uploaded" };
      (mockHost.dataService.uploadAsset as jasmine.Spy).and.returnValue(
        of(uploadedAsset),
      );

      AudioSelectorFileHelper.uploadFile(mockHost, file);

      setTimeout(() => {
        expect(mockHost.dataService.uploadAsset).toHaveBeenCalled();
        expect(mockHost.selectResolvedAsset).toHaveBeenCalledWith(
          uploadedAsset,
        );
        expect(mockHost.isUploading).toBeFalse();
        done();
      }, 50);
    });

    it("should handle upload failure gracefully", (done) => {
      const file = new File(["audio"], "fail.mp3", { type: "audio/mp3" });
      (mockHost.dataService.uploadAsset as jasmine.Spy).and.returnValue(
        throwError(() => new Error("Network error")),
      );

      AudioSelectorFileHelper.uploadFile(mockHost, file);

      setTimeout(() => {
        expect(mockHost.logger.error).toHaveBeenCalled();
        expect(mockHost.isUploading).toBeFalse();
        done();
      }, 50);
    });
  });

  describe("selectResolvedAsset", () => {
    it("should do nothing if asset is null or host is readonly", () => {
      AudioSelectorFileHelper.selectResolvedAsset(mockHost, null);
      expect(mockHost.closeItemSelector).not.toHaveBeenCalled();

      (mockHost.readonly as jasmine.Spy).and.returnValue(true);
      AudioSelectorFileHelper.selectResolvedAsset(mockHost, { id: "1" });
      expect(mockHost.closeItemSelector).not.toHaveBeenCalled();
    });

    it("should set properties and emit changes for asset", () => {
      const asset = { entity_id: "a1", type: "preset", name: "Test" };
      (mockHost.effectiveType as jasmine.Spy).and.returnValue("custom");

      AudioSelectorFileHelper.selectResolvedAsset(mockHost, asset);

      expect(mockHost.closeItemSelector).toHaveBeenCalled();
      expect(mockHost.localType.set).toHaveBeenCalledWith("preset");
      expect(mockHost.localSelectedAsset.set).toHaveBeenCalledWith(asset);
      expect(mockHost.localUrl.set).toHaveBeenCalledWith("a1");
      expect(mockHost.savedPresetUrl).toBe("a1");
      expect(mockHost.savedPresetAsset).toBe(asset);
      expect(mockHost.typeChange.emit).toHaveBeenCalledWith("preset");
      expect(mockHost.onUrlChange).toHaveBeenCalledWith("a1");
      expect(mockHost.assetSelected.emit).toHaveBeenCalledWith(asset);
      expect(mockHost.stop).toHaveBeenCalled();
      expect(mockHost.play).toHaveBeenCalled();
    });

    it("should handle audio_set asset type", () => {
      const asset = { entity_id: "s1", type: "audio_set" };
      (mockHost.effectiveType as jasmine.Spy).and.returnValue("audio_set");

      AudioSelectorFileHelper.selectResolvedAsset(mockHost, asset);

      expect(mockHost.localType.set).toHaveBeenCalledWith("audio_set");
      expect(mockHost.typeChange.emit).not.toHaveBeenCalled(); // type didn't change
    });

    it("should deduplicate asset in localAssets update", () => {
      const asset = { entity_id: "existing_id" };
      AudioSelectorFileHelper.selectResolvedAsset(mockHost, asset);

      const updateFn = (
        mockHost.localAssets.update as jasmine.Spy
      ).calls.mostRecent().args[0];
      const prevWithItem = [{ entity_id: "existing_id" }];
      expect(updateFn(prevWithItem)).toEqual(prevWithItem);

      const prevWithoutItem = [{ entity_id: "other_id" }];
      expect(updateFn(prevWithoutItem)).toEqual([...prevWithoutItem, asset]);
    });
  });
});

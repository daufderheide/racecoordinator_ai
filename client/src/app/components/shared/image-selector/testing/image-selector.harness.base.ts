export abstract class ImageSelectorHarnessBase {
  static readonly hostSelector = "app-image-selector";

  static readonly selectors = {
    label: ".image-label",
    previewImage: ".image-preview img",
    previewContainer: ".image-preview",
    removeButton: ".remove-button",
    uploadOverlay: ".upload-overlay",
    dragHint: ".drop-hint",
  };

  /** Gets the label text, if present */
  abstract getLabel(): Promise<string | null>;

  /** Checks if the image preview has an image loaded (or pending) */
  abstract hasImage(): Promise<boolean>;

  /** Clicks the image preview area to open the selector */
  abstract clickPreviewToOpenSelector(): Promise<void>;

  /** Clicks the remove button */
  abstract clickRemoveButton(): Promise<void>;

  /** Checks if the upload overlay is currently visible */
  abstract isUploading(): Promise<boolean>;

  /** Checks if the drag hint is currently visible */
  abstract hasDragHint(): Promise<boolean>;

  /** Simulates a dragover event to test drag state */
  abstract simulateDragOver(): Promise<void>;

  /** Checks if the component is in a dragging state */
  abstract hasDraggingState(): Promise<boolean>;

  /** Checks if the component is disabled */
  abstract isDisabled(): Promise<boolean>;

  /** Gets the text content of the drag/drop hint */
  abstract getDragHintText(): Promise<string | null>;

  /** Checks if the drag hint has the disabled-hint class */
  abstract isDragHintDisabled(): Promise<boolean>;
}

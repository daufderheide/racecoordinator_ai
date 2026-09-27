import { saveFileAs } from "./file-download.utils";

describe("file-download.utils", () => {
  let originalShowSaveFilePicker: any;

  beforeEach(() => {
    originalShowSaveFilePicker = (window as any).showSaveFilePicker;
  });

  afterEach(() => {
    (window as any).showSaveFilePicker = originalShowSaveFilePicker;
  });

  it("should write data via showSaveFilePicker when available and return true", async () => {
    const mockWritable = {
      write: jasmine.createSpy("write").and.returnValue(Promise.resolve()),
      close: jasmine.createSpy("close").and.returnValue(Promise.resolve()),
    };
    const mockHandle = {
      createWritable: jasmine
        .createSpy("createWritable")
        .and.returnValue(Promise.resolve(mockWritable)),
    };
    (window as any).showSaveFilePicker = jasmine
      .createSpy("showSaveFilePicker")
      .and.returnValue(Promise.resolve(mockHandle));

    const result = await saveFileAs({
      suggestedName: "test.json",
      data: '{"hello":"world"}',
      mimeType: "application/json",
      description: "JSON Files",
      extension: ".json",
    });

    expect(result).toBeTrue();
    expect((window as any).showSaveFilePicker).toHaveBeenCalledWith({
      suggestedName: "test.json",
      types: [
        {
          description: "JSON Files",
          accept: { "application/json": [".json"] },
        },
      ],
    });
    expect(mockWritable.write).toHaveBeenCalledWith('{"hello":"world"}');
    expect(mockWritable.close).toHaveBeenCalled();
  });

  it("should return false when user cancels showSaveFilePicker with AbortError", async () => {
    const abortErr = new Error("User cancelled");
    abortErr.name = "AbortError";
    (window as any).showSaveFilePicker = jasmine
      .createSpy("showSaveFilePicker")
      .and.returnValue(Promise.reject(abortErr));

    const result = await saveFileAs({
      suggestedName: "test.json",
      data: '{"hello":"world"}',
      mimeType: "application/json",
    });

    expect(result).toBeFalse();
  });

  it("should fall back to blob download if showSaveFilePicker throws non-abort error", async () => {
    (window as any).showSaveFilePicker = jasmine
      .createSpy("showSaveFilePicker")
      .and.returnValue(Promise.reject(new Error("Picker error")));

    const mockAnchor = jasmine.createSpyObj("HTMLAnchorElement", ["click"]);
    spyOn(document, "createElement").and.returnValue(mockAnchor as any);
    spyOn(document.body, "appendChild");
    spyOn(document.body, "removeChild");
    spyOn(window.URL, "createObjectURL").and.returnValue("blob:mock-url");
    spyOn(window.URL, "revokeObjectURL");

    const result = await saveFileAs({
      suggestedName: "fallback.json",
      data: '{"a":1}',
      mimeType: "application/json",
    });

    expect(result).toBeTrue();
    expect(mockAnchor.download).toBe("fallback.json");
    expect(mockAnchor.click).toHaveBeenCalled();
  });

  it("should use fallback blob download when showSaveFilePicker is not available", async () => {
    delete (window as any).showSaveFilePicker;

    const mockAnchor = jasmine.createSpyObj("HTMLAnchorElement", ["click"]);
    spyOn(document, "createElement").and.returnValue(mockAnchor as any);
    spyOn(document.body, "appendChild");
    spyOn(document.body, "removeChild");
    spyOn(window.URL, "createObjectURL").and.returnValue("blob:mock-url");
    spyOn(window.URL, "revokeObjectURL");

    const result = await saveFileAs({
      suggestedName: "blob-data.csv",
      data: "col1,col2\nval1,val2",
      mimeType: "text/csv",
      extension: ".csv",
    });

    expect(result).toBeTrue();
    expect(mockAnchor.download).toBe("blob-data.csv");
    expect(mockAnchor.click).toHaveBeenCalled();
  });
});

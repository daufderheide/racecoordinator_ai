import { LaneColumnCustomWidgetHelper } from "./raceday-lane-column-custom-widget.helper";

describe("raceday-lane-column-custom-widget.helper", () => {
  let mockCustomWidgetService: any;
  let helper: LaneColumnCustomWidgetHelper;

  beforeEach(() => {
    mockCustomWidgetService = {
      getWidgetComponent: jasmine
        .createSpy("getWidgetComponent")
        .and.returnValue({ name: "CustomComp" }),
    };
    helper = new LaneColumnCustomWidgetHelper(mockCustomWidgetService);
  });

  describe("getCustomWidgetComponent", () => {
    it("should return null if key is not provided", () => {
      expect(helper.getCustomWidgetComponent(undefined)).toBeNull();
    });

    it("should delegate to customWidgetService", () => {
      const result = helper.getCustomWidgetComponent("my-widget");
      expect(mockCustomWidgetService.getWidgetComponent).toHaveBeenCalledWith(
        "my-widget",
      );
      expect(result).toEqual({ name: "CustomComp" });
    });

    it("should return null if customWidgetService is missing", () => {
      const emptyHelper = new LaneColumnCustomWidgetHelper(undefined);
      expect(emptyHelper.getCustomWidgetComponent("my-widget")).toBeNull();
    });
  });

  describe("getCustomWidgetInputsForInset and Main", () => {
    it("should resolve synthetic inputs for inset", () => {
      const inputs = helper.getCustomWidgetInputsForInset(
        "top-left",
        "custom-key",
        null,
        "lane",
        0,
        14,
        null,
        false,
        undefined,
        "#ffffff",
        "#000000",
      );
      expect(inputs).toBeDefined();
    });

    it("should resolve synthetic inputs for main", () => {
      const inputs = helper.getCustomWidgetInputsForMain(
        "custom-key",
        null,
        "lane",
        0,
        null,
        false,
        undefined,
        "#ffffff",
        "#000000",
      );
      expect(inputs).toBeDefined();
    });
  });
});

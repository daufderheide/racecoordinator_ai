import { of } from "rxjs";

import { DataHistoryStatsHelper } from "./data-history-stats.helper";

describe("DataHistoryStatsHelper", () => {
  let http: jasmine.SpyObj<any>;
  let helper: DataHistoryStatsHelper;

  beforeEach(() => {
    http = jasmine.createSpyObj("HttpClient", ["get", "post", "put"]);
    http.get.and.returnValue(of([]));
    helper = new DataHistoryStatsHelper(http, () => "http://host:7070");
  });

  describe("getCarStatistics (#1210)", () => {
    it("sends the group and the filters that are set", () => {
      helper.getCarStatistics({
        groupBy: "class",
        carId: "c1",
        carClass: "",
        trackId: undefined,
        isDemo: true,
      });
      expect(http.get).toHaveBeenCalledWith(
        "http://host:7070/api/history/cars/stats?groupBy=class&carId=c1&demo=true",
      );
    });

    it("asks without a query string when nothing is set", () => {
      helper.getCarStatistics({});
      expect(http.get).toHaveBeenCalledWith(
        "http://host:7070/api/history/cars/stats",
      );
    });
  });
});

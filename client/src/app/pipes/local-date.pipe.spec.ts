import { TestBed } from "@angular/core/testing";
import { DateTimeFormatService } from "@app/services/date-time-format.service";

import { LocalDatePipe } from "./local-date.pipe";

describe("LocalDatePipe", () => {
  let pipe: LocalDatePipe;
  let mockDateTimeFormatService: jasmine.SpyObj<DateTimeFormatService>;

  beforeEach(() => {
    mockDateTimeFormatService = jasmine.createSpyObj<DateTimeFormatService>(
      "DateTimeFormatService",
      ["format"],
    );

    TestBed.configureTestingModule({
      providers: [
        LocalDatePipe,
        { provide: DateTimeFormatService, useValue: mockDateTimeFormatService },
      ],
    });

    pipe = TestBed.inject(LocalDatePipe);
  });

  it("should create an instance", () => {
    expect(pipe).toBeTruthy();
  });

  it("should delegate transform to dateTimeFormatService.format with default preset and fallback", () => {
    mockDateTimeFormatService.format.and.returnValue("09/07/2026, 2:30 PM");
    const testDate = new Date(2026, 8, 7);

    const result = pipe.transform(testDate);

    expect(mockDateTimeFormatService.format).toHaveBeenCalledWith(
      testDate,
      "short",
      "",
      undefined,
    );
    expect(result).toBe("09/07/2026, 2:30 PM");
  });

  it("should pass custom preset, fallback, and locale override", () => {
    mockDateTimeFormatService.format.and.returnValue("07/09/2026");
    const ts = 1788784800000;

    const result = pipe.transform(ts, "shortDate", "—", "en-AU");

    expect(mockDateTimeFormatService.format).toHaveBeenCalledWith(
      ts,
      "shortDate",
      "—",
      "en-AU",
    );
    expect(result).toBe("07/09/2026");
  });
});

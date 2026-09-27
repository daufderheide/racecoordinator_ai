import { Pipe, PipeTransform } from "@angular/core";
import {
  DateFormatPreset,
  DateInput,
  DateTimeFormatService,
} from "@app/services/date-time-format.service";

@Pipe({
  standalone: true,
  name: "localDate",
  pure: false, // Impure so date formats update dynamically when application language changes
})
export class LocalDatePipe implements PipeTransform {
  constructor(private dateTimeFormatService: DateTimeFormatService) {}

  transform(
    value: DateInput,
    presetOrOptions: DateFormatPreset | Intl.DateTimeFormatOptions = "short",
    fallback: string = "",
    localeOverride?: string,
  ): string {
    return this.dateTimeFormatService.format(
      value,
      presetOrOptions,
      fallback,
      localeOverride,
    );
  }
}

import { Injectable } from "@angular/core";

@Injectable({
  providedIn: "root",
})
export class PrintService {
  constructor() {}

  /**
   * Triggers the native browser print dialog.
   * @param pageName Optional name to use in the exported file title (<pageName> -- yyyy-mm-dd)
   * @param fullScroll If true, adds a class to the body to unroll scrollable regions before printing.
   * @param timestamp Optional fixed date to use for the filename. Defaults to the current time.
   */
  public formatExportTimestamp(timestamp?: Date): string {
    const now = timestamp || new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");

    let hours = now.getHours();
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours ? hours : 12; // Handle 0 as 12
    const hh = String(hours).padStart(2, "0");

    const min = String(now.getMinutes()).padStart(2, "0");
    const ss = String(now.getSeconds()).padStart(2, "0");
    return `--${yyyy}-${mm}-${dd}--${hh}-${min}-${ss}_${ampm}`;
  }

  /**
   * Triggers the native browser print dialog.
   * @param pageName Optional name to use in the exported file title (<pageName> -- yyyy-mm-dd)
   * @param fullScroll If true, adds a class to the body to unroll scrollable regions before printing.
   * @param timestamp Optional fixed date to use for the filename. Defaults to the current time.
   * @param includeBackground If false, adds print-no-background class to save ink. Defaults to true.
   */
  public print(
    pageName?: string,
    fullScroll: boolean = false,
    timestamp?: Date,
    includeBackground: boolean = true,
  ): void {
    if (fullScroll) {
      document.body.classList.add("print-full-scroll");
      document.documentElement.classList.add("print-full-scroll");
    }
    if (!includeBackground) {
      document.body.classList.add("print-no-background");
      document.documentElement.classList.add("print-no-background");
    }

    let originalTitle = "";
    if (pageName) {
      originalTitle = document.title;
      document.title = `${pageName}${this.formatExportTimestamp(timestamp)}`;
    }

    // Use a slight timeout to allow the browser to reflow the DOM if a class was added
    setTimeout(() => {
      window.print();

      if (fullScroll) {
        document.body.classList.remove("print-full-scroll");
        document.documentElement.classList.remove("print-full-scroll");
      }
      if (!includeBackground) {
        document.body.classList.remove("print-no-background");
        document.documentElement.classList.remove("print-no-background");
      }

      if (pageName) {
        document.title = originalTitle;
      }
    }, 100);
  }
}

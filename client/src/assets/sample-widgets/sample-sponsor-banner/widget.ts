import { Component } from "@angular/core";
import { CustomWidgetBaseComponent } from "@app/components/shared/custom-widget-base/custom-widget-base.component";

@Component({
  standalone: true,
  templateUrl: "./widget.html",
  styleUrls: ["./widget.css"],
})
export class SponsorBannerComponent extends CustomWidgetBaseComponent {}

import { CommonModule } from "@angular/common";
import { Component, ViewEncapsulation } from "@angular/core";
import { TranslatePipe } from "@app/pipes/translate.pipe";

@Component({
  standalone: true,
  selector: "app-raceday-branding",
  templateUrl: "./raceday-branding.component.html",
  styleUrls: ["./raceday-branding.component.css"],
  encapsulation: ViewEncapsulation.None,
  imports: [CommonModule, TranslatePipe],
})
export class RacedayBrandingComponent {}

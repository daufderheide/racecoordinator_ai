import { CommonModule } from "@angular/common";
import { Component, input, ViewEncapsulation } from "@angular/core";

@Component({
  standalone: true,
  selector: "app-raceday-qr",
  templateUrl: "./raceday-qr.component.html",
  styleUrls: ["./raceday-qr.component.css"],
  encapsulation: ViewEncapsulation.None,
  imports: [CommonModule],
})
export class RacedayQrComponent {
  qrCodeUrl = input<string | undefined>(undefined);
}

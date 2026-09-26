import { CommonModule } from "@angular/common";
import { Component, input, signal, ViewEncapsulation } from "@angular/core";
import { TranslatePipe } from "@app/pipes/translate.pipe";

@Component({
  standalone: true,
  selector: "app-raceday-camera-qr",
  templateUrl: "./raceday-camera-qr.component.html",
  styleUrls: ["./raceday-camera-qr.component.css"],
  encapsulation: ViewEncapsulation.None,
  imports: [CommonModule, TranslatePipe],
})
export class RacedayCameraQrComponent {
  qrCodeUrl = input<string | undefined>(undefined);
  pairingUrl = input<string | undefined>(undefined);

  showModal = signal<boolean>(false);
  copied = signal<boolean>(false);
  private copyTimeout?: ReturnType<typeof setTimeout>;

  openModal(): void {
    if (this.pairingUrl()) {
      this.showModal.set(true);
    }
  }

  closeModal(): void {
    this.showModal.set(false);
  }

  async copyLink(): Promise<void> {
    const url = this.pairingUrl();
    if (url && typeof navigator !== "undefined" && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(url);
        this.copied.set(true);
        if (this.copyTimeout) {
          clearTimeout(this.copyTimeout);
        }
        this.copyTimeout = setTimeout(() => {
          this.copied.set(false);
        }, 2000);
      } catch {
        // clipboard write failed
      }
    }
  }

  openTest(): void {
    const url = this.pairingUrl();
    if (url && typeof window !== "undefined") {
      window.open(url, "_blank");
    }
  }
}

import { ChangeDetectorRef, Component, input, output } from "@angular/core";
import { Router } from "@angular/router";
import { ConfirmationModalComponent } from "@app/components/shared/confirmation-modal/confirmation-modal.component";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { ConnectionMonitorService } from "@app/services/connection-monitor.service";

@Component({
  standalone: true,
  selector: "app-back-button",
  templateUrl: "./back-button.component.html",
  styleUrls: ["./back-button.component.css"],
  imports: [ConfirmationModalComponent, TranslatePipe],
})
export class BackButtonComponent {
  label = input("GEN_BTN_BACK");
  route = input("/raceday-setup");
  queryParams = input<any>({});
  confirm = input(false);
  confirmTitle = input("CD_CONFIRM_EXIT_TITLE");
  confirmMessage = input("CD_CONFIRM_EXIT_MESSAGE");

  back = output<void>();

  showModal = false;

  constructor(
    private router: Router,
    private connectionMonitor: ConnectionMonitorService,
    private cdr: ChangeDetectorRef,
  ) {}

  onBack() {
    if (this.confirm()) {
      this.showModal = true;
    } else {
      this.proceed();
    }
  }

  onModalConfirm() {
    this.showModal = false;
    this.proceed();
  }

  onModalCancel() {
    this.showModal = false;
  }

  private proceed() {
    sessionStorage.setItem("skipIntro", "true");
    this.back.emit();

    const route = this.route();
    if (route && route !== "") {
      if (route.includes("?")) {
        // If the route already has query params, use navigateByUrl
        this.router.navigateByUrl(route);
      } else {
        // Otherwise use navigate with the provided queryParams
        this.router.navigate([route], { queryParams: this.queryParams() });
      }
    }
  }
}

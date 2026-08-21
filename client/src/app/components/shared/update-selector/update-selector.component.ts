import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostListener,
  input,
  OnInit,
  output,
  ViewEncapsulation,
} from "@angular/core";
import { Role } from "@app/models/role";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { AuthService } from "@app/services/auth.service";
import { LoggerService } from "@app/services/logger.service";
import { UpdateChannel, UpdateService } from "@app/services/update.service";

export interface ChannelOption {
  id: UpdateChannel;
  labelKey: string;
}

@Component({
  selector: "app-update-selector",
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: "./update-selector.component.html",
  styleUrl: "./update-selector.component.css",
  encapsulation: ViewEncapsulation.None,
})
export class UpdateSelectorComponent implements OnInit {
  wrapperClass = input<string>("menu-item");
  itemClass = input<string>("menu-item");
  checkForUpdatesRequested = output<void>();
  channelSelected = output<UpdateChannel>();

  currentChannel: UpdateChannel = "ALPHA";
  isUpdateDropdownOpen = false;
  readonly isChannelSelectionEnabled = true;

  readonly channels: ChannelOption[] = [
    { id: "PRODUCTION", labelKey: "RDS_UPDATE_CHANNEL_PRODUCTION" },
    { id: "BETA", labelKey: "RDS_UPDATE_CHANNEL_BETA" },
    { id: "ALPHA", labelKey: "RDS_UPDATE_CHANNEL_ALPHA" },
    { id: "DISABLED", labelKey: "RDS_UPDATE_CHANNEL_DISABLED" },
  ];

  constructor(
    private updateService: UpdateService,
    private authService: AuthService,
    private elementRef: ElementRef,
    private cdr: ChangeDetectorRef,
    private logger: LoggerService,
  ) {}

  get isAdmin(): boolean {
    return this.authService.currentRole === Role.ADMIN;
  }

  ngOnInit() {
    this.updateService.getUpdateConfig().subscribe({
      next: (config) => {
        if (config && config.channel) {
          this.currentChannel = config.channel;
          this.cdr.markForCheck();
        }
      },
      error: (err) => {
        this.logger.warn("Failed to load update configuration", err);
      },
    });
  }

  toggleDropdown(event: Event) {
    event.stopPropagation();
    this.isUpdateDropdownOpen = !this.isUpdateDropdownOpen;
    this.cdr.markForCheck();
  }

  closeDropdown() {
    this.isUpdateDropdownOpen = false;
    this.cdr.markForCheck();
  }

  onCheckForUpdatesClick(event: Event) {
    event.stopPropagation();
    this.closeDropdown();
    this.checkForUpdatesRequested.emit();
  }

  selectChannel(channel: UpdateChannel, event: Event) {
    event.stopPropagation();
    if (!this.isChannelSelectionEnabled || !this.isAdmin) {
      return;
    }
    this.currentChannel = channel;
    this.closeDropdown();
    this.channelSelected.emit(channel);
    this.updateService.setUpdateChannel(channel).subscribe({
      next: () => {
        this.logger.info(`Update channel changed to ${channel}`);
      },
      error: (err) => {
        this.logger.error("Failed to update channel", err);
      },
    });
    this.cdr.markForCheck();
  }

  @HostListener("document:click", ["$event"])
  onDocumentClick(event: MouseEvent) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.closeDropdown();
    }
  }
}

import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostListener,
  input,
  OnDestroy,
  OnInit,
  output,
  ViewEncapsulation,
} from "@angular/core";
import { Role } from "@app/models/role";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { AuthService } from "@app/services/auth.service";
import { HelpLinkService } from "@app/services/help-link.service";
import { LoggerService } from "@app/services/logger.service";
import { UpdateChannel, UpdateService } from "@app/services/update.service";

export interface ChannelOption {
  id: UpdateChannel;
  labelKey: string;
  tooltipKey: string;
}

@Component({
  selector: "app-update-selector",
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: "./update-selector.component.html",
  styleUrl: "./update-selector.component.css",
  encapsulation: ViewEncapsulation.None,
})
export class UpdateSelectorComponent implements OnInit, OnDestroy {
  wrapperClass = input<string>("menu-item");
  itemClass = input<string>("menu-item");
  checkForUpdatesRequested = output<void>();
  channelSelected = output<UpdateChannel>();

  currentChannel: UpdateChannel = "BETA";
  isUpdateDropdownOpen = false;
  readonly isChannelSelectionEnabled = true;

  activeTooltipChannel: UpdateChannel | null = null;
  private tooltipTimeoutId: any = null;

  readonly channels: ChannelOption[] = [
    {
      id: "PRODUCTION",
      labelKey: "RDS_UPDATE_CHANNEL_PRODUCTION",
      tooltipKey: "RDS_UPDATE_TOOLTIP_PRODUCTION",
    },
    {
      id: "BETA",
      labelKey: "RDS_UPDATE_CHANNEL_BETA",
      tooltipKey: "RDS_UPDATE_TOOLTIP_BETA",
    },
    {
      id: "ALPHA",
      labelKey: "RDS_UPDATE_CHANNEL_ALPHA",
      tooltipKey: "RDS_UPDATE_TOOLTIP_ALPHA",
    },
    {
      id: "DISABLED",
      labelKey: "RDS_UPDATE_CHANNEL_DISABLED",
      tooltipKey: "RDS_UPDATE_TOOLTIP_DISABLED",
    },
  ];

  constructor(
    private updateService: UpdateService,
    private authService: AuthService,
    private helpLinkService: HelpLinkService,
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

  ngOnDestroy() {
    this.clearTooltip();
  }

  toggleDropdown(event: Event) {
    event.stopPropagation();
    this.isUpdateDropdownOpen = !this.isUpdateDropdownOpen;
    if (this.isUpdateDropdownOpen) {
      window.dispatchEvent(
        new CustomEvent("rc-submenu-opened", { detail: this }),
      );
    } else {
      this.clearTooltip();
    }
    this.cdr.markForCheck();
  }

  closeDropdown() {
    this.clearTooltip();
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

  onChannelHover(channel: UpdateChannel) {
    if (this.tooltipTimeoutId) {
      clearTimeout(this.tooltipTimeoutId);
      this.tooltipTimeoutId = null;
    }
    this.activeTooltipChannel = channel;
    this.cdr.markForCheck();
  }

  onChannelLeave(channel: UpdateChannel) {
    if (this.tooltipTimeoutId) {
      clearTimeout(this.tooltipTimeoutId);
    }
    this.tooltipTimeoutId = setTimeout(() => {
      if (this.activeTooltipChannel === channel) {
        this.activeTooltipChannel = null;
        this.cdr.markForCheck();
      }
    }, 150);
  }

  onTooltipEnter(channel: UpdateChannel) {
    if (this.tooltipTimeoutId) {
      clearTimeout(this.tooltipTimeoutId);
      this.tooltipTimeoutId = null;
    }
    this.activeTooltipChannel = channel;
  }

  onTooltipLeave(channel: UpdateChannel) {
    this.onChannelLeave(channel);
  }

  private clearTooltip() {
    if (this.tooltipTimeoutId) {
      clearTimeout(this.tooltipTimeoutId);
      this.tooltipTimeoutId = null;
    }
    this.activeTooltipChannel = null;
  }

  openLearnMore(event: Event) {
    event.stopPropagation();
    event.preventDefault();
    this.helpLinkService.openHelp("downloads", "release-channels");
  }

  @HostListener("window:rc-submenu-opened", ["$event"])
  onOtherSubmenuOpened(event: Event) {
    const customEvent = event as CustomEvent;
    if (customEvent.detail !== this) {
      this.closeDropdown();
    }
  }

  @HostListener("document:click", ["$event"])
  onDocumentClick(event: MouseEvent) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.closeDropdown();
    }
  }
}

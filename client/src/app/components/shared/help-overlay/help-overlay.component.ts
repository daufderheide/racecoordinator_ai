import { Component, OnInit, OnDestroy, ChangeDetectorRef, HostListener, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { HelpService, GuideStep } from '../../../services/help.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-help-overlay',
  templateUrl: './help-overlay.component.html',
  styleUrls: ['./help-overlay.component.css'],
  standalone: false
})
export class HelpOverlayComponent implements OnInit, OnDestroy, AfterViewInit {
  isVisible = false;
  currentStep: GuideStep | null = null;
  hasNext = false;
  hasPrevious = false;

  highlightStyle: any = null;
  popoverStyle: any = {};
  popoverClass: string = '';

  private subscriptions: Subscription = new Subscription();

  constructor(
    public helpService: HelpService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.subscriptions.add(this.helpService.isVisible$.subscribe(visible => {
      this.isVisible = visible;
      this.updatePosition();
    }));

    this.subscriptions.add(this.helpService.currentStep$.subscribe(step => {
      this.currentStep = step;
      // Wait for view update before positioning
      setTimeout(() => this.updatePosition(), 0);
    }));

    this.subscriptions.add(this.helpService.hasNext$.subscribe(hasNext => {
      this.hasNext = hasNext;
    }));

    this.subscriptions.add(this.helpService.hasPrevious$.subscribe(hasPrev => {
      this.hasPrevious = hasPrev;
    }));
  }

  ngAfterViewInit() {
    this.updatePosition();
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  @HostListener('window:resize')
  onResize() {
    if (this.isVisible) {
      this.updatePosition();
    }
  }

  next() {
    this.helpService.nextStep();
  }

  previous() {
    this.helpService.previousStep();
  }

  end() {
    this.helpService.endGuide();
  }

  @ViewChild('popoverRef') popoverRef!: ElementRef;

  private updatePosition() {
    if (!this.isVisible || !this.currentStep) {
      this.highlightStyle = null;
      return;
    }

    // Ensure view is updated so we can measure height
    this.cdr.detectChanges();

    let el: HTMLElement | null = null;
    if (this.currentStep.selector) {
      el = document.querySelector(this.currentStep.selector) as HTMLElement;
    } else if (this.currentStep.targetId) {
      el = document.getElementById(this.currentStep.targetId);
    }

    if (el) {
      const rect = el.getBoundingClientRect();

      this.highlightStyle = {
        top: rect.top + 'px',
        left: rect.left + 'px',
        width: rect.width + 'px',
        height: rect.height + 'px',
        position: 'fixed',
        zIndex: 10001, // Above overlay
        boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)', // The 'hole' effect
        pointerEvents: 'none' // Allow clicks through if needed
      };

      // Get actual popover dimensions
      let popoverHeight = 200; // Default fallback
      let popoverWidth = 300; // Default width

      if (this.popoverRef && this.popoverRef.nativeElement) {
        popoverHeight = this.popoverRef.nativeElement.offsetHeight;
        popoverWidth = this.popoverRef.nativeElement.offsetWidth;
      }

      // Position popover relative to target
      let top = 0;
      let left = 0;
      const margin = 15;

      // Default to bottom if not specified
      const position = this.currentStep.position || "bottom";

      switch (position) {
        case "right":
          top = rect.top + (rect.height / 2) - (popoverHeight / 2);
          left = rect.right + margin;
          break;
        case "left":
          top = rect.top + (rect.height / 2) - (popoverHeight / 2);
          left = rect.left - popoverWidth - margin;
          break;
        case "top":
          top = rect.top - popoverHeight - margin;
          left = rect.left + (rect.width / 2) - (popoverWidth / 2);
          break;
        case "bottom":
        default:
          top = rect.bottom + margin;
          left = rect.left + (rect.width / 2) - (popoverWidth / 2);
          break;
      }

      // Basic boundary checks
      if (left < 10) left = 10;
      if (top < 10) top = 10;

      // If positioned right, ensure it doesn't overlap
      if (position === "right" && left < rect.right + margin) {
        left = rect.right + margin;
      }

      // --- Boundary Check & Flip Logic ---
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;
      const estimatedHeight = popoverHeight;

      // Check Bottom edge
      if (top + estimatedHeight > windowHeight) {
        // If it was bottom or default, try top
        if (position === 'bottom' || position === 'right' || position === 'left') {
          // Flip to top if there is space
          if (rect.top - estimatedHeight - margin > 0) {
            top = rect.top - estimatedHeight - margin;
            // Re-adjust left for top position if we flipped from bottom
            if (position === 'bottom') {
              // Left stays same
            }
          } else {
            // Clamp to bottom edge
            top = windowHeight - estimatedHeight - 10;
          }
        } else {
          // Just clamp
          top = windowHeight - estimatedHeight - 10;
        }
      }

      // Check Top edge
      if (top < 10) top = 10;

      // Check Right edge
      if (left + popoverWidth > windowWidth) {
        // If it was right, try left
        if (position === 'right') {
          if (rect.left - popoverWidth - margin > 0) {
            left = rect.left - popoverWidth - margin;
          } else {
            left = windowWidth - popoverWidth - 10;
          }
        } else {
          left = windowWidth - popoverWidth - 10;
        }
      }

      // Check Left edge
      if (left < 10) left = 10;


      let arrowClass = ""; if (left >= rect.right) arrowClass = "arrow-left"; else if (left + popoverWidth <= rect.left) arrowClass = "arrow-right"; else if (top >= rect.bottom) arrowClass = "arrow-top"; else if (top + estimatedHeight <= rect.top) arrowClass = "arrow-bottom"; this.popoverClass = arrowClass; this.popoverStyle = {
        top: top + "px",
        left: left + "px",
        position: "fixed"
      };
    } else {
      // Target not found, fallback to center
      this.centerPopover();
    }


    this.cdr.detectChanges();
  }

  private centerPopover() {
    this.highlightStyle = null; // Full overlay
    this.popoverClass = '';
    this.popoverStyle = {
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      position: 'fixed'
    };
  }
}

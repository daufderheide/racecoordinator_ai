import { NgClass, NgStyle } from "@angular/common";
import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
  ViewChild,
} from "@angular/core";
import { Subscription } from "rxjs";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { GuideStep, HelpService } from "@app/services/help.service";
import { HelpLinkService } from "@app/services/help-link.service";

@Component({
  standalone: true,
  selector: "app-help-overlay",
  templateUrl: "./help-overlay.component.html",
  styleUrls: ["./help-overlay.component.css"],
  imports: [NgStyle, NgClass, TranslatePipe],
})
export class HelpOverlayComponent implements OnInit, OnDestroy, AfterViewInit {
  isVisible = false;
  isInitialized = false;
  currentStep: GuideStep | null = null;
  hasNext = false;
  hasPrevious = false;

  highlightStyle: any = null;
  popoverStyle: any = {};
  popoverClass: string = "";

  private subscriptions: Subscription = new Subscription();

  private scrollListener = () => {
    if (this.isVisible) {
      this.updatePosition(0, false);
    }
  };

  constructor(
    public helpService: HelpService,
    private cdr: ChangeDetectorRef,
    private helpLinkService: HelpLinkService,
  ) {}

  ngOnInit() {
    document.addEventListener("scroll", this.scrollListener, true);

    this.subscriptions.add(
      this.helpService.isVisible$.subscribe((visible) => {
        this.isVisible = visible;
        if (!visible) {
          this.isInitialized = false;
        }
        this.updatePosition();
      }),
    );

    this.subscriptions.add(
      this.helpService.currentStep$.subscribe((step) => {
        this.currentStep = step;
        this.updatePosition();
      }),
    );

    this.subscriptions.add(
      this.helpService.hasNext$.subscribe((hasNext) => {
        this.hasNext = hasNext;
      }),
    );

    this.subscriptions.add(
      this.helpService.hasPrevious$.subscribe((hasPrev) => {
        this.hasPrevious = hasPrev;
      }),
    );
  }

  ngAfterViewInit() {
    // Defer to avoid ExpressionChangedAfterItHasBeenCheckedError
    setTimeout(() => this.updatePosition(), 0);
  }

  ngOnDestroy() {
    document.removeEventListener("scroll", this.scrollListener, true);
    this.subscriptions.unsubscribe();
  }

  @HostListener("window:resize")
  @HostListener("window:scroll")
  onResize() {
    if (this.isVisible) {
      this.updatePosition(0, false);
    }
  }

  @HostListener("window:keydown", ["$event"])
  handleKeyDown(event: KeyboardEvent) {
    if (!this.isVisible) return;

    switch (event.key) {
      case "Escape":
        event.preventDefault();
        event.stopPropagation();
        if (typeof event.stopImmediatePropagation === "function") {
          event.stopImmediatePropagation();
        }
        this.end();
        break;
      case "ArrowRight":
        event.preventDefault();
        event.stopPropagation();
        if (typeof event.stopImmediatePropagation === "function") {
          event.stopImmediatePropagation();
        }
        if (this.hasNext) {
          this.next();
        }
        break;
      case "ArrowLeft":
        event.preventDefault();
        event.stopPropagation();
        if (typeof event.stopImmediatePropagation === "function") {
          event.stopImmediatePropagation();
        }
        if (this.hasPrevious) {
          this.previous();
        }
        break;
    }
  }

  @HostListener("click", ["$event"])
  onClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    const anchor = target.closest("a");
    if (anchor && anchor.classList.contains("help-link")) {
      event.preventDefault();
      let article = "";
      let section: string | undefined = undefined;

      const articleClass = Array.from(anchor.classList).find((c) =>
        c.startsWith("help-article-"),
      );
      if (articleClass) {
        article = articleClass.replace("help-article-", "");
      }

      const sectionClass = Array.from(anchor.classList).find((c) =>
        c.startsWith("help-section-"),
      );
      if (sectionClass) {
        section = sectionClass.replace("help-section-", "");
      }

      this.helpLinkService.openHelp(article, section);
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

  @ViewChild("popoverRef") popoverRef!: ElementRef;

  private finalizeInitialization() {
    if (this.isInitialized) return;
    // Wait for the browser to paint the current styles without transitions
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        this.isInitialized = true;
        this.cdr.detectChanges();
        this.focusNextButton();
      });
    });
  }

  private focusNextButton() {
    setTimeout(() => {
      if (this.popoverRef && this.popoverRef.nativeElement) {
        const nextBtn = this.popoverRef.nativeElement.querySelector(
          ".btn-next",
        ) as HTMLElement;
        if (nextBtn) {
          nextBtn.focus();
        } else {
          const finishBtn = this.popoverRef.nativeElement.querySelector(
            ".btn-finish",
          ) as HTMLElement;
          if (finishBtn) {
            finishBtn.focus();
          }
        }
      }
    }, 10);
  }

  private getScrollParent(node: HTMLElement | null): HTMLElement | null {
    if (!node) return null;
    let parent = node.parentElement;
    while (
      parent &&
      parent !== document.body &&
      parent !== document.documentElement
    ) {
      const style = window.getComputedStyle(parent);
      const overflowY = style.overflowY;
      if (overflowY === "auto" || overflowY === "scroll") {
        return parent;
      }
      parent = parent.parentElement;
    }
    return null;
  }

  private scrollElementIntoView(el: HTMLElement) {
    const margin = 12;
    const container = this.getScrollParent(el);

    if (container) {
      const containerRect = container.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();
      const elTopRelativeToContainer =
        elRect.top - containerRect.top + container.scrollTop;

      // Scroll so that the top of the element is near the top of the container (with margin).
      // This brings as much of the expander/element onto the screen as possible,
      // and guarantees the element's top is never scrolled off the top of the container.
      const maxScroll = Math.max(
        0,
        container.scrollHeight - container.clientHeight,
      );
      const targetScrollTop = Math.max(
        0,
        Math.min(maxScroll, elTopRelativeToContainer - margin),
      );

      container.scrollTo({
        top: targetScrollTop,
        behavior: "auto",
      });
    } else {
      const elRect = el.getBoundingClientRect();
      const currentScrollY = window.scrollY || window.pageYOffset;
      if (elRect.top < margin || elRect.bottom > window.innerHeight - margin) {
        const maxWindowScroll = Math.max(
          0,
          document.documentElement.scrollHeight - window.innerHeight,
        );
        const targetScrollY = Math.max(
          0,
          Math.min(maxWindowScroll, currentScrollY + elRect.top - margin),
        );
        window.scrollTo({
          top: targetScrollY,
          behavior: "auto",
        });
      }
    }
  }

  private updatePosition(retries = 3, scroll = true) {
    if (!this.isVisible || !this.currentStep) {
      this.highlightStyle = null;
      this.isInitialized = false;
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

    let highlightEl: HTMLElement | null = null;
    if (this.currentStep.highlightSelector) {
      highlightEl = document.querySelector(
        this.currentStep.highlightSelector,
      ) as HTMLElement;
    } else if (this.currentStep.highlightTargetId) {
      highlightEl = document.getElementById(this.currentStep.highlightTargetId);
    }

    if (el) {
      // Ensure element is visible
      if (scroll) {
        this.scrollElementIntoView(el);
      }

      // Immediate preliminary position
      const rect = el.getBoundingClientRect();
      this.applyPosition(el, rect, highlightEl);
      this.cdr.detectChanges();

      // Refine position after layout settles (e.g. accordion expansion)
      requestAnimationFrame(() => {
        if (!el) return;
        if (scroll) {
          this.scrollElementIntoView(el);
        }
        const rectRefined = el.getBoundingClientRect();
        this.applyPosition(el, rectRefined, highlightEl);
        this.cdr.detectChanges();

        if (!this.isInitialized) {
          this.finalizeInitialization();
        } else {
          this.focusNextButton();
        }
      });
    } else if (retries > 0) {
      // Target not found, wait for DOM updates and retry
      setTimeout(() => this.updatePosition(retries - 1, scroll), 50);
      return;
    } else {
      // Target not found after retries, fallback to center
      this.centerPopover();
      this.cdr.detectChanges();

      if (!this.isInitialized) {
        this.finalizeInitialization();
      } else {
        this.focusNextButton();
      }
    }

    this.cdr.detectChanges();
  }

  private applyPosition(
    el: HTMLElement,
    rect: DOMRect,
    highlightEl: HTMLElement | null = null,
  ) {
    if (!this.isVisible || !this.currentStep || !el) return;

    this.highlightStyle = this.computeHighlightStyle(highlightEl || el);

    let popoverHeight = 200;
    let popoverWidth = 300;
    if (this.popoverRef && this.popoverRef.nativeElement) {
      popoverHeight = this.popoverRef.nativeElement.offsetHeight;
      popoverWidth = this.popoverRef.nativeElement.offsetWidth;
    }

    const position = this.currentStep.position || "bottom";
    const coords = this.computePopoverCoordinates(
      rect,
      position,
      popoverWidth,
      popoverHeight,
    );

    this.popoverClass = this.computeArrowClass(
      coords.left,
      coords.top,
      rect,
      popoverWidth,
      popoverHeight,
      position,
    );

    const arrowOffsets = this.computeArrowOffsets(
      coords.left,
      coords.top,
      rect,
      popoverWidth,
      popoverHeight,
      position,
    );

    this.popoverStyle = {
      top: coords.top + "px",
      left: coords.left + "px",
      position: "fixed",
      "--arrow-top": `${arrowOffsets.arrowTop}px`,
      "--arrow-left": `${arrowOffsets.arrowLeft}px`,
    };

    this.cdr.detectChanges();
  }

  private computeHighlightStyle(maskTarget: HTMLElement): any {
    const maskRect = maskTarget.getBoundingClientRect();
    return {
      top: Math.round(maskRect.top) + "px",
      left: Math.round(maskRect.left) + "px",
      width: Math.round(maskRect.width) + "px",
      height: Math.round(maskRect.height) + "px",
      position: "fixed",
      zIndex: 10001,
      boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.5)",
      pointerEvents: "none",
    };
  }

  private computePopoverCoordinates(
    rect: DOMRect,
    position: string,
    popoverWidth: number,
    popoverHeight: number,
  ): { top: number; left: number } {
    const margin = 15;
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    let top = 0;
    let left = 0;

    switch (position) {
      case "right":
      case "left": {
        const visibleTop = Math.max(rect.top, 10);
        const visibleBottom = Math.min(rect.bottom, windowHeight - 10);
        const effectiveCenterY =
          visibleBottom > visibleTop
            ? visibleTop + (visibleBottom - visibleTop) / 2
            : rect.top + rect.height / 2;

        top = effectiveCenterY - popoverHeight / 2;
        left =
          position === "right"
            ? rect.right + margin
            : rect.left - popoverWidth - margin;
        break;
      }
      case "top":
        top = rect.top - popoverHeight - margin;
        left = rect.left + rect.width / 2 - popoverWidth / 2;
        break;
      case "bottom":
      default:
        top = rect.bottom + margin;
        left = rect.left + rect.width / 2 - popoverWidth / 2;
        break;
    }

    return this.constrainCoordinates(
      top,
      left,
      rect,
      position,
      popoverWidth,
      popoverHeight,
      windowWidth,
      windowHeight,
      margin,
    );
  }

  private constrainCoordinates(
    top: number,
    left: number,
    rect: DOMRect,
    position: string,
    popoverWidth: number,
    popoverHeight: number,
    windowWidth: number,
    windowHeight: number,
    margin: number,
  ): { top: number; left: number } {
    let constrainedTop = top;
    let constrainedLeft = left;

    if (position === "bottom") {
      if (constrainedTop + popoverHeight > windowHeight - 10) {
        if (rect.top - popoverHeight - margin > 10) {
          constrainedTop = rect.top - popoverHeight - margin;
        } else {
          constrainedTop = Math.max(10, windowHeight - popoverHeight - 10);
        }
      }
      constrainedLeft = Math.max(
        10,
        Math.min(windowWidth - popoverWidth - 10, constrainedLeft),
      );
    } else if (position === "top") {
      if (constrainedTop < 10) {
        if (rect.bottom + popoverHeight + margin < windowHeight - 10) {
          constrainedTop = rect.bottom + margin;
        } else {
          constrainedTop = 10;
        }
      }
      constrainedLeft = Math.max(
        10,
        Math.min(windowWidth - popoverWidth - 10, constrainedLeft),
      );
    } else if (position === "right") {
      if (constrainedLeft + popoverWidth > windowWidth - 10) {
        if (rect.left - popoverWidth - margin > 10) {
          constrainedLeft = rect.left - popoverWidth - margin;
        } else {
          constrainedLeft = Math.max(10, windowWidth - popoverWidth - 10);
        }
      } else if (constrainedLeft < 10) {
        constrainedLeft = 10;
      }
      constrainedTop = Math.max(
        10,
        Math.min(windowHeight - popoverHeight - 10, constrainedTop),
      );
    } else if (position === "left") {
      if (constrainedLeft < 10) {
        if (rect.right + popoverWidth + margin < windowWidth - 10) {
          constrainedLeft = rect.right + margin;
        } else {
          constrainedLeft = 10;
        }
      } else if (constrainedLeft + popoverWidth > windowWidth - 10) {
        constrainedLeft = Math.max(10, windowWidth - popoverWidth - 10);
      }
      constrainedTop = Math.max(
        10,
        Math.min(windowHeight - popoverHeight - 10, constrainedTop),
      );
    }

    return { top: constrainedTop, left: constrainedLeft };
  }

  private computeArrowClass(
    left: number,
    top: number,
    rect: DOMRect,
    popoverWidth: number,
    popoverHeight: number,
    position: string,
  ): string {
    if (left >= rect.right) {
      return "arrow-left";
    }
    if (left + popoverWidth <= rect.left) {
      return "arrow-right";
    }
    if (top >= rect.bottom) {
      return "arrow-top";
    }
    if (top + popoverHeight <= rect.top) {
      return "arrow-bottom";
    }
    if (position === "right") return "arrow-left";
    if (position === "left") return "arrow-right";
    if (position === "top") return "arrow-bottom";
    return "arrow-top";
  }

  private computeArrowOffsets(
    left: number,
    top: number,
    rect: DOMRect,
    popoverWidth: number,
    popoverHeight: number,
    position: string,
  ): { arrowTop: number; arrowLeft: number } {
    const targetCenterY =
      position === "left" || position === "right"
        ? Math.max(rect.top, Math.min(rect.bottom, top + popoverHeight / 2))
        : rect.top + rect.height / 2;

    const arrowTop = Math.max(
      20,
      Math.min(popoverHeight - 20, targetCenterY - top),
    );

    const targetCenterX = rect.left + rect.width / 2;
    const arrowLeft = Math.max(
      20,
      Math.min(popoverWidth - 20, targetCenterX - left),
    );

    return { arrowTop, arrowLeft };
  }

  private centerPopover() {
    this.highlightStyle = null; // Full overlay
    this.popoverClass = "";
    this.popoverStyle = {
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      position: "fixed",
    };
  }
}

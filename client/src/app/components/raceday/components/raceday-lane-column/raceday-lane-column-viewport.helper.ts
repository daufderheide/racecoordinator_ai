/**
 * Helper to manage IntersectionObserver for LaneColumn cards.
 * Defers fitContent() when cards are far off-screen in large scrollable grids,
 * preventing wasted canvas measurement and layout recalculations.
 */
export class LaneColumnViewportHelper {
  private observer?: IntersectionObserver;
  private cardElement?: HTMLElement;
  private isIntersecting = true;
  private pendingFit = false;

  constructor(private readonly onBecameVisible: () => void) {}

  public setup(cardEl: HTMLElement): void {
    this.cardElement = cardEl;
    if (typeof IntersectionObserver === "undefined") {
      this.isIntersecting = true;
      return;
    }

    try {
      this.disconnect();
      this.observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.target === this.cardElement) {
              const wasIntersecting = this.isIntersecting;
              this.isIntersecting = entry.isIntersecting;
              if (!wasIntersecting && this.isIntersecting && this.pendingFit) {
                this.pendingFit = false;
                this.onBecameVisible();
              }
            }
          }
        },
        {
          rootMargin: "200px 0px", // Pre-render 200px ahead of scroll viewport
        },
      );
      this.observer.observe(cardEl);
    } catch {
      this.isIntersecting = true;
    }
  }

  public get isVisible(): boolean {
    return this.isIntersecting;
  }

  public get hasPendingFit(): boolean {
    return this.pendingFit;
  }

  public markPendingFit(): void {
    this.pendingFit = true;
  }

  public clearPendingFit(): void {
    this.pendingFit = false;
  }

  public disconnect(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = undefined;
    }
  }

  public destroy(): void {
    this.disconnect();
    this.cardElement = undefined;
  }
}

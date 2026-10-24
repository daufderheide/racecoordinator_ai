import { Component, signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { DriverLabel } from "@app/models/driver-label";

import {
  DriverLabelsOverflowDirective,
  estimateChipsContainerWidth,
  measureChipWidth,
} from "./driver-labels-overflow.directive";

@Component({
  standalone: true,
  imports: [DriverLabelsOverflowDirective],
  template: `
    <div
      class="driver-item"
      id="test-card"
      style="display: flex; width: 200px; box-sizing: border-box;"
    >
      <div class="driver-details" style="flex: 1; min-width: 0;">
        <div
          class="driver-name"
          style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;"
        >
          {{ driverName() }}
        </div>
        <div
          class="driver-meta"
          style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;"
        >
          {{ driverNickname() }}
        </div>
      </div>
      <div
        class="driver-labels-chips"
        [appDriverLabelsOverflow]="labels()"
        #overflow="appDriverLabelsOverflow"
        [class.dots-mode]="overflow.isDotsMode()"
      >
        @for (label of labels(); track label.entity_id) {
          @if (!overflow.isDotsMode()) {
            <span class="driver-label-chip">{{ label.name }}</span>
          } @else {
            <span class="driver-label-chip driver-label-dot"></span>
          }
        }
      </div>
    </div>
  `,
})
class TestHostComponent {
  driverName = signal<string>("Driver 1");
  driverNickname = signal<string>("Driver 1");
  labels = signal<DriverLabel[]>([]);
}

describe("DriverLabelsOverflowDirective", () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let host: TestHostComponent;
  let directive: DriverLabelsOverflowDirective;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent, DriverLabelsOverflowDirective],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();

    const dirDebug = fixture.debugElement.query(
      By.directive(DriverLabelsOverflowDirective),
    );
    directive = dirDebug.injector.get(DriverLabelsOverflowDirective);
  });

  afterEach(() => {
    fixture.destroy();
  });

  it("should have dotsMode false when labels list is empty", () => {
    host.labels.set([]);
    directive.checkOverflow();
    expect(directive.isDotsMode()).toBeFalse();
  });

  it("should have dotsMode true when labels count is greater than 2", () => {
    host.labels.set([
      { entity_id: "l1", name: "Label 1", color: "#f00" },
      { entity_id: "l2", name: "Label 2", color: "#0f0" },
      { entity_id: "l3", name: "Label 3", color: "#00f" },
    ]);
    fixture.detectChanges();
    directive.checkOverflow();
    expect(directive.isDotsMode()).toBeTrue();
  });

  it("should switch to dotsMode when name is truncated with chips", () => {
    host.labels.set([
      { entity_id: "l1", name: "Competition 1", color: "#f00" },
    ]);
    host.driverName.set(
      "A Very Very Long Driver Name That Exceeds Width Completely",
    );
    fixture.detectChanges();

    const nameEl = fixture.nativeElement.querySelector(".driver-name");
    // Mock overflow
    Object.defineProperty(nameEl, "clientWidth", {
      value: 50,
      configurable: true,
    });
    Object.defineProperty(nameEl, "scrollWidth", {
      value: 150,
      configurable: true,
    });

    directive.checkOverflow();
    expect(directive.isDotsMode()).toBeTrue();
  });

  it("should switch to dotsMode when meta is truncated with chips", () => {
    host.labels.set([
      { entity_id: "l1", name: "Competition 1", color: "#f00" },
    ]);
    host.driverName.set("Short");
    host.driverNickname.set("Very Long Nickname That Will Surely Truncate");
    fixture.detectChanges();

    const nameEl = fixture.nativeElement.querySelector(".driver-name");
    const metaEl = fixture.nativeElement.querySelector(".driver-meta");
    Object.defineProperty(nameEl, "clientWidth", {
      value: 100,
      configurable: true,
    });
    Object.defineProperty(nameEl, "scrollWidth", {
      value: 40,
      configurable: true,
    });
    Object.defineProperty(metaEl, "clientWidth", {
      value: 50,
      configurable: true,
    });
    Object.defineProperty(metaEl, "scrollWidth", {
      value: 120,
      configurable: true,
    });

    directive.checkOverflow();
    expect(directive.isDotsMode()).toBeTrue();
  });

  it("should switch back from dotsMode to chips mode when space becomes sufficient", () => {
    host.labels.set([{ entity_id: "l1", name: "Club", color: "#f00" }]);
    host.driverName.set("Short");
    host.driverNickname.set("Short");
    fixture.detectChanges();

    // Start in dots mode
    directive.isDotsMode.set(true);

    const detailsEl = fixture.nativeElement.querySelector(".driver-details");
    const chipsEl = fixture.nativeElement.querySelector(".driver-labels-chips");
    const nameEl = fixture.nativeElement.querySelector(".driver-name");
    const metaEl = fixture.nativeElement.querySelector(".driver-meta");

    Object.defineProperty(detailsEl, "clientWidth", {
      value: 150,
      configurable: true,
    });
    Object.defineProperty(chipsEl, "offsetWidth", {
      value: 8,
      configurable: true,
    });
    Object.defineProperty(nameEl, "clientWidth", {
      value: 150,
      configurable: true,
    });
    Object.defineProperty(nameEl, "scrollWidth", {
      value: 30,
      configurable: true,
    });
    Object.defineProperty(metaEl, "clientWidth", {
      value: 150,
      configurable: true,
    });
    Object.defineProperty(metaEl, "scrollWidth", {
      value: 30,
      configurable: true,
    });

    directive.checkOverflow();
    expect(directive.isDotsMode()).toBeFalse();
  });

  it("should stay in dotsMode if space is still insufficient when in dots mode", () => {
    host.labels.set([
      { entity_id: "l1", name: "Competition 1", color: "#f00" },
    ]);
    host.driverName.set("Driver 6");
    host.driverNickname.set("Driver 6");
    fixture.detectChanges();

    // Start in dots mode
    directive.isDotsMode.set(true);

    const detailsEl = fixture.nativeElement.querySelector(".driver-details");
    const chipsEl = fixture.nativeElement.querySelector(".driver-labels-chips");
    const nameEl = fixture.nativeElement.querySelector(".driver-name");
    const metaEl = fixture.nativeElement.querySelector(".driver-meta");

    // Mock tight racing space (total available space 60px, while Competition 1 chip needs ~75px + name 50px)
    Object.defineProperty(detailsEl, "clientWidth", {
      value: 50,
      configurable: true,
    });
    Object.defineProperty(chipsEl, "offsetWidth", {
      value: 8,
      configurable: true,
    });
    Object.defineProperty(nameEl, "clientWidth", {
      value: 50,
      configurable: true,
    });
    Object.defineProperty(nameEl, "scrollWidth", {
      value: 50,
      configurable: true,
    });
    Object.defineProperty(metaEl, "clientWidth", {
      value: 50,
      configurable: true,
    });
    Object.defineProperty(metaEl, "scrollWidth", {
      value: 40,
      configurable: true,
    });

    // Mock Range width
    spyOn(document, "createRange").and.returnValue({
      selectNodeContents: () => {},
      getBoundingClientRect: () => ({ width: 50 }) as DOMRect,
    } as unknown as Range);

    directive.checkOverflow();
    expect(directive.isDotsMode()).toBeTrue();
  });

  it("should trigger scheduleCheck on window resize", () => {
    spyOn(directive, "scheduleCheck");
    window.dispatchEvent(new Event("resize"));
    expect(directive.scheduleCheck).toHaveBeenCalled();
  });

  it("should clean up ResizeObserver on destroy", () => {
    const disconnectSpy = jasmine.createSpy("disconnect");
    (directive as any).resizeObserver = { disconnect: disconnectSpy };
    directive.ngOnDestroy();
    expect(disconnectSpy).toHaveBeenCalled();
  });

  it("should switch isDotsMode to false when labels become empty", () => {
    directive.isDotsMode.set(true);
    host.labels.set([]);
    fixture.detectChanges();
    directive.checkOverflow();
    expect(directive.isDotsMode()).toBeFalse();
  });

  it("should do nothing if parent or name element does not exist", () => {
    directive.isDotsMode.set(false);
    host.labels.set([{ entity_id: "l1", name: "Label 1", color: "#f00" }]);
    fixture.detectChanges();

    const nameEl = fixture.nativeElement.querySelector(".driver-name");
    nameEl.remove();

    directive.checkOverflow();
    expect(directive.isDotsMode()).toBeFalse();
  });

  it("should measure chip and container width accurately", () => {
    const chipW = measureChipWidth("Club");
    expect(chipW).toBeGreaterThan(15);
    expect(chipW).toBeLessThanOrEqual(85);

    const containerW = estimateChipsContainerWidth([
      { name: "Club" },
      { name: "Very Long Championship Label" },
    ]);
    expect(containerW).toBeGreaterThan(chipW);
    expect(containerW).toBeLessThanOrEqual(85);

    expect(estimateChipsContainerWidth([])).toBe(0);
  });
});

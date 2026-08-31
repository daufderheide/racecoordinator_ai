import { TestbedHarnessEnvironment } from "@angular/cdk/testing/testbed";
import { Component, signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { Driver } from "@app/models/driver";
import { Team } from "@app/models/team";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { TranslationService } from "@app/services/translation.service";

import { RacingRosterDialogComponent } from "./racing-roster-dialog.component";
import { RacingRosterDialogHarness } from "./testing/racing-roster-dialog.harness";

@Component({
  standalone: true,
  imports: [RacingRosterDialogComponent],
  template: `
    <app-racing-roster-dialog
      [visible]="visible()"
      [participants]="participants()"
      (close)="onClose()"
    ></app-racing-roster-dialog>
  `,
})
class TestHostComponent {
  visible = signal(false);
  participants = signal<any[]>([]);
  closed = false;

  onClose(): void {
    this.closed = true;
    this.visible.set(false);
  }
}

describe("RacingRosterDialogComponent", () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let hostComponent: TestHostComponent;
  let harness: RacingRosterDialogHarness;
  let mockTranslationService: jasmine.SpyObj<TranslationService>;

  beforeEach(async () => {
    mockTranslationService = jasmine.createSpyObj("TranslationService", [
      "translate",
    ]);
    mockTranslationService.translate.and.callFake(
      (key: string, params?: Record<string, any>) => {
        if (key === "RDS_ROSTER_DIALOG_TITLE") return "Racing Roster";
        if (key === "RDS_ROSTER_TOTAL_DRIVERS")
          return `Total Drivers: ${params?.["count"] ?? 0}`;
        if (key === "RDS_ROSTER_EMPTY")
          return "No drivers currently added to the racing list.";
        if (key === "RDS_ROSTER_SORT_BY") return "Sort By";
        if (key === "RDS_ROSTER_SORT_SEED") return "Seed";
        if (key === "RDS_ROSTER_SORT_NAME") return "A-Z";
        if (key === "RDS_ROSTER_CLOSE") return "Close";
        if (key === "RD_EMPTY_LANE") return "Empty";
        if (key === "RDS_TEAM_DRIVERS") return "Drivers";
        return key;
      },
    );

    await TestBed.configureTestingModule({
      imports: [TestHostComponent, RacingRosterDialogComponent, TranslatePipe],
      providers: [
        { provide: TranslationService, useValue: mockTranslationService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    hostComponent = fixture.componentInstance;
    const loader = TestbedHarnessEnvironment.loader(fixture);
    harness = await loader.getHarness(RacingRosterDialogHarness);
  });

  it("should not be visible when visible is false", async () => {
    hostComponent.visible.set(false);
    fixture.detectChanges();

    expect(await harness.isVisible()).toBeFalse();
  });

  it("should display title, empty message, and 0 count when visible with empty participants", async () => {
    hostComponent.visible.set(true);
    hostComponent.participants.set([]);
    fixture.detectChanges();

    expect(await harness.isVisible()).toBeTrue();
    expect(await harness.getTitleText()).toBe("Racing Roster");
    expect(await harness.getCountBadgeText()).toBe("Total Drivers: 0");
    expect(await harness.isEmptyMessageVisible()).toBeTrue();
    expect(await harness.getItemCount()).toBe(0);
  });

  it("should render drivers with seed, name, and nickname", async () => {
    const drivers = [
      new Driver("d1", "Mario Andretti", "Speedy"),
      new Driver("d2", "Ayrton Senna", "Magic"),
      new Driver("d3", "Lewis Hamilton", "Hammer"),
    ];

    hostComponent.visible.set(true);
    hostComponent.participants.set(drivers);
    fixture.detectChanges();

    expect(await harness.isVisible()).toBeTrue();
    expect(await harness.getItemCount()).toBe(3);
    expect(await harness.getCountBadgeText()).toBe("Total Drivers: 3");
    expect(await harness.isEmptyMessageVisible()).toBeFalse();

    expect(await harness.getItemSeed(0)).toBe("1");
    expect(await harness.getItemName(0)).toBe("Mario Andretti");
    expect(await harness.getItemNickname(0)).toBe('"Speedy"');

    expect(await harness.getItemSeed(1)).toBe("2");
    expect(await harness.getItemName(1)).toBe("Ayrton Senna");
    expect(await harness.getItemNickname(1)).toBe('"Magic"');

    expect(await harness.getItemSeed(2)).toBe("3");
    expect(await harness.getItemName(2)).toBe("Lewis Hamilton");
    expect(await harness.getItemNickname(2)).toBe('"Hammer"');
  });

  it("should handle team participants and driver without nickname", async () => {
    const participants = [
      new Driver("d1", "Nigel Mansell", ""),
      new Team("t1", "Ferrari Red", undefined, ["d1", "d2"]),
    ];

    hostComponent.visible.set(true);
    hostComponent.participants.set(participants);
    fixture.detectChanges();

    expect(await harness.getItemCount()).toBe(2);
    expect(await harness.getItemName(0)).toBe("Nigel Mansell");
    expect(await harness.getItemNickname(0)).toBe("");

    expect(await harness.getItemName(1)).toBe("Ferrari Red");
    expect(await harness.getItemNickname(1)).toBe("2 Drivers");
  });

  it("should emit close event on header close button click", async () => {
    hostComponent.visible.set(true);
    hostComponent.participants.set([new Driver("d1", "Test", "Tester")]);
    fixture.detectChanges();

    expect(hostComponent.closed).toBeFalse();
    await harness.clickCloseButton();
    expect(hostComponent.closed).toBeTrue();
  });

  it("should emit close event on footer close button click", async () => {
    hostComponent.visible.set(true);
    fixture.detectChanges();

    expect(hostComponent.closed).toBeFalse();
    await harness.clickFooterCloseButton();
    expect(hostComponent.closed).toBeTrue();
  });

  it("should emit close event on backdrop click", async () => {
    hostComponent.visible.set(true);
    fixture.detectChanges();

    expect(hostComponent.closed).toBeFalse();
    await harness.clickBackdrop();
    expect(hostComponent.closed).toBeTrue();
  });

  it("should close on Escape key press", () => {
    hostComponent.visible.set(true);
    fixture.detectChanges();

    const event = new KeyboardEvent("keydown", { key: "Escape" });
    document.dispatchEvent(event);
    fixture.detectChanges();

    expect(hostComponent.closed).toBeTrue();
  });

  it("should calculate appropriate columns, rows, and density classes for various counts", () => {
    const dialogComponent = fixture.debugElement.children[0]
      .componentInstance as RacingRosterDialogComponent;

    // Helper to generate N drivers
    const makeDrivers = (n: number) =>
      Array.from(
        { length: n },
        (_, i) => new Driver(`d${i}`, `Driver ${i + 1}`, `Nick ${i + 1}`),
      );

    // 0 items
    hostComponent.participants.set(makeDrivers(0));
    fixture.detectChanges();
    expect(dialogComponent.gridColumns()).toBe(1);
    expect(dialogComponent.gridRows()).toBe(1);
    expect(dialogComponent.densityClass()).toBe("density-spacious");

    // 4 items
    hostComponent.participants.set(makeDrivers(4));
    fixture.detectChanges();
    expect(dialogComponent.gridColumns()).toBe(1);
    expect(dialogComponent.gridRows()).toBe(4);
    expect(dialogComponent.densityClass()).toBe("density-spacious");

    // 10 items
    hostComponent.participants.set(makeDrivers(10));
    fixture.detectChanges();
    expect(dialogComponent.gridColumns()).toBe(2);
    expect(dialogComponent.gridRows()).toBe(5);
    expect(dialogComponent.densityClass()).toBe("density-regular");

    // 20 items
    hostComponent.participants.set(makeDrivers(20));
    fixture.detectChanges();
    expect(dialogComponent.gridColumns()).toBe(3);
    expect(dialogComponent.gridRows()).toBe(7);
    expect(dialogComponent.densityClass()).toBe("density-regular");

    // 36 items
    hostComponent.participants.set(makeDrivers(36));
    fixture.detectChanges();
    expect(dialogComponent.gridColumns()).toBe(4);
    expect(dialogComponent.gridRows()).toBe(9);
    expect(dialogComponent.densityClass()).toBe("density-compact");

    // 55 items
    hostComponent.participants.set(makeDrivers(55));
    fixture.detectChanges();
    expect(dialogComponent.gridColumns()).toBe(5);
    expect(dialogComponent.gridRows()).toBe(11);
    expect(dialogComponent.densityClass()).toBe("density-dense");

    // 78 items
    hostComponent.participants.set(makeDrivers(78));
    fixture.detectChanges();
    expect(dialogComponent.gridColumns()).toBe(6);
    expect(dialogComponent.gridRows()).toBe(13);
    expect(dialogComponent.densityClass()).toBe("density-ultra");

    // 105 items
    hostComponent.participants.set(makeDrivers(105));
    fixture.detectChanges();
    expect(dialogComponent.gridColumns()).toBe(7);
    expect(dialogComponent.gridRows()).toBe(15);
    expect(dialogComponent.densityClass()).toBe("density-ultra");

    // 120 items
    hostComponent.participants.set(makeDrivers(120));
    fixture.detectChanges();
    expect(dialogComponent.gridColumns()).toBe(8);
    expect(dialogComponent.gridRows()).toBe(15);
    expect(dialogComponent.densityClass()).toBe("density-ultra");
  });

  it("should format tooltips correctly with and without nickname", () => {
    const dialogComponent = fixture.debugElement.children[0]
      .componentInstance as RacingRosterDialogComponent;

    const itemWithNick = {
      seed: 1,
      name: "Driver One",
      nickname: "The Flash",
    };
    const itemWithoutNick = {
      seed: 2,
      name: "Driver Two",
      nickname: "",
    };
    const itemSameNick = {
      seed: 3,
      name: "Driver Three",
      nickname: "Driver Three",
    };

    expect(dialogComponent.getItemTooltip(itemWithNick)).toBe(
      '(#1) Driver One "The Flash"',
    );
    expect(dialogComponent.getItemTooltip(itemWithoutNick)).toBe(
      "(#2) Driver Two",
    );
    expect(dialogComponent.getItemTooltip(itemSameNick)).toBe(
      "(#3) Driver Three",
    );
  });

  it("should sort by seed by default, and allow toggling to alphabetical sort", async () => {
    const participants = [
      new Driver("d1", "Zack", "Zero"),
      new Driver("d2", "Alice", "The Rocket"),
      new Driver("d3", "Bob", "Drift King"),
    ];

    hostComponent.visible.set(true);
    hostComponent.participants.set(participants);
    fixture.detectChanges();

    // Default: Sort by seed
    expect(await harness.isSortBySeedActive()).toBeTrue();
    expect(await harness.isSortByNameActive()).toBeFalse();

    expect(await harness.getItemCount()).toBe(3);
    expect(await harness.getItemSeed(0)).toBe("1");
    expect(await harness.getItemName(0)).toBe("Zack");
    expect(await harness.getItemNickname(0)).toBe('"Zero"');

    expect(await harness.getItemSeed(1)).toBe("2");
    expect(await harness.getItemName(1)).toBe("Alice");

    expect(await harness.getItemSeed(2)).toBe("3");
    expect(await harness.getItemName(2)).toBe("Bob");

    // Toggle: Sort by name (A-Z)
    await harness.clickSortByName();
    fixture.detectChanges();

    expect(await harness.isSortBySeedActive()).toBeFalse();
    expect(await harness.isSortByNameActive()).toBeTrue();

    // Alice is first, but retains original seed #2
    expect(await harness.getItemSeed(0)).toBe("2");
    expect(await harness.getItemName(0)).toBe("Alice");
    expect(await harness.getItemNickname(0)).toBe('"The Rocket"');

    // Bob is second, retains original seed #3
    expect(await harness.getItemSeed(1)).toBe("3");
    expect(await harness.getItemName(1)).toBe("Bob");
    expect(await harness.getItemNickname(1)).toBe('"Drift King"');

    // Zack is third, retains original seed #1
    expect(await harness.getItemSeed(2)).toBe("1");
    expect(await harness.getItemName(2)).toBe("Zack");
    expect(await harness.getItemNickname(2)).toBe('"Zero"');

    // Toggle back to sort by seed
    await harness.clickSortBySeed();
    fixture.detectChanges();

    expect(await harness.isSortBySeedActive()).toBeTrue();
    expect(await harness.isSortByNameActive()).toBeFalse();
    expect(await harness.getItemName(0)).toBe("Zack");
    expect(await harness.getItemSeed(0)).toBe("1");
  });
});

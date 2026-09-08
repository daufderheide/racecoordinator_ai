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
      [teams]="teams()"
      [allDrivers]="allDrivers()"
      (close)="onClose()"
    ></app-racing-roster-dialog>
  `,
})
class TestHostComponent {
  visible = signal(false);
  participants = signal<any[]>([]);
  teams = signal<Team[]>([]);
  allDrivers = signal<Driver[]>([]);
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
        if (key === "RDS_ROSTER_SORT_NICKNAME") return "Nickname";
        if (key === "RDS_ROSTER_SORT_DRIVER_NAME") return "Driver Name";
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

  it("should render drivers with seed, nickname as primary, and name underneath", async () => {
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

    // Default alphabetical sort:
    // Hammer (seed 3, Lewis Hamilton) -> Magic (seed 2, Ayrton Senna) -> Speedy (seed 1, Mario Andretti)
    expect(await harness.getItemSeed(0)).toBe("3");
    expect(await harness.getItemName(0)).toBe("Hammer");
    expect(await harness.getItemNickname(0)).toBe("Lewis Hamilton");

    expect(await harness.getItemSeed(1)).toBe("2");
    expect(await harness.getItemName(1)).toBe("Magic");
    expect(await harness.getItemNickname(1)).toBe("Ayrton Senna");

    expect(await harness.getItemSeed(2)).toBe("1");
    expect(await harness.getItemName(2)).toBe("Speedy");
    expect(await harness.getItemNickname(2)).toBe("Mario Andretti");
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
    // Alphabetical sort: "Ferrari Red" comes before "Nigel Mansell"
    expect(await harness.getItemName(0)).toBe("Ferrari Red");
    expect(await harness.getItemNickname(0)).toBe("2 Drivers");

    expect(await harness.getItemName(1)).toBe("Nigel Mansell");
    expect(await harness.getItemNickname(1)).toBe("");
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
      primaryName: "The Flash",
      secondaryName: "Driver One",
    };
    const itemWithoutNick = {
      seed: 2,
      name: "Driver Two",
      nickname: "",
      primaryName: "Driver Two",
      secondaryName: "",
    };
    const itemSameNick = {
      seed: 3,
      name: "Driver Three",
      nickname: "Driver Three",
      primaryName: "Driver Three",
      secondaryName: "",
    };

    expect(dialogComponent.getItemTooltip(itemWithNick)).toBe(
      "(#1) The Flash (Driver One)",
    );
    expect(dialogComponent.getItemTooltip(itemWithoutNick)).toBe(
      "(#2) Driver Two",
    );
    expect(dialogComponent.getItemTooltip(itemSameNick)).toBe(
      "(#3) Driver Three",
    );
  });

  it("should sort alphabetically by default (by team name or driver nickname), and allow toggling to seed sort", async () => {
    const participants = [
      new Driver("d1", "Zack", "Zero"),
      new Driver("d2", "Alice", "The Rocket"),
      new Driver("d3", "Bob", "Drift King"),
    ];

    hostComponent.visible.set(true);
    hostComponent.participants.set(participants);
    fixture.detectChanges();

    // Default: Sort by name (A-Z by nickname)
    expect(await harness.isSortByNameActive()).toBeTrue();
    expect(await harness.isSortBySeedActive()).toBeFalse();

    expect(await harness.getItemCount()).toBe(3);

    // "Drift King" (Bob) is first, retains original seed #3
    expect(await harness.getItemSeed(0)).toBe("3");
    expect(await harness.getItemName(0)).toBe("Drift King");
    expect(await harness.getItemNickname(0)).toBe("Bob");

    // "The Rocket" (Alice) is second, retains original seed #2
    expect(await harness.getItemSeed(1)).toBe("2");
    expect(await harness.getItemName(1)).toBe("The Rocket");
    expect(await harness.getItemNickname(1)).toBe("Alice");

    // "Zero" (Zack) is third, retains original seed #1
    expect(await harness.getItemSeed(2)).toBe("1");
    expect(await harness.getItemName(2)).toBe("Zero");
    expect(await harness.getItemNickname(2)).toBe("Zack");

    // Toggle: Sort by seed
    await harness.clickSortBySeed();
    fixture.detectChanges();

    expect(await harness.isSortBySeedActive()).toBeTrue();
    expect(await harness.isSortByNameActive()).toBeFalse();

    expect(await harness.getItemSeed(0)).toBe("1");
    expect(await harness.getItemName(0)).toBe("Zero");
    expect(await harness.getItemNickname(0)).toBe("Zack");

    expect(await harness.getItemSeed(1)).toBe("2");
    expect(await harness.getItemName(1)).toBe("The Rocket");
    expect(await harness.getItemNickname(1)).toBe("Alice");

    expect(await harness.getItemSeed(2)).toBe("3");
    expect(await harness.getItemName(2)).toBe("Drift King");
    expect(await harness.getItemNickname(2)).toBe("Bob");

    // Toggle back to sort by name
    await harness.clickSortByName();
    fixture.detectChanges();

    expect(await harness.isSortByNameActive()).toBeTrue();
    expect(await harness.isSortBySeedActive()).toBeFalse();
    expect(await harness.getItemName(0)).toBe("Drift King");
    expect(await harness.getItemSeed(0)).toBe("3");
  });

  it("should reset sort to alphabetical when dialog is closed and reopened", async () => {
    const participants = [
      new Driver("d1", "Zack", "Zero"),
      new Driver("d2", "Alice", "The Rocket"),
    ];

    hostComponent.visible.set(true);
    hostComponent.participants.set(participants);
    fixture.detectChanges();

    // Default: Sort by nickname
    expect(await harness.isSortByNicknameActive()).toBeTrue();

    // Switch to seed sort
    await harness.clickSortBySeed();
    fixture.detectChanges();
    expect(await harness.isSortBySeedActive()).toBeTrue();

    // Close dialog
    await harness.clickCloseButton();
    fixture.detectChanges();
    expect(await harness.isVisible()).toBeFalse();

    // Reopen dialog
    hostComponent.visible.set(true);
    fixture.detectChanges();
    expect(await harness.isVisible()).toBeTrue();

    // Must reset to alphabetical sort by default
    expect(await harness.isSortByNicknameActive()).toBeTrue();
    expect(await harness.isSortBySeedActive()).toBeFalse();
  });

  it("should allow sorting by driver name (not nickname) and use team name for teams", async () => {
    const d1 = new Driver("d1", "Zack", "Alpha"); // Seed 1
    const d2 = new Driver("d2", "Bob", "Beta"); // Seed 2
    const t1 = new Team("t1", "Charlie Team", undefined, ["d1", "d2"]); // Seed 3
    const d3 = new Driver("d3", "Alice", "Zero"); // Seed 4

    hostComponent.participants.set([d1, d2, t1, d3]);
    hostComponent.teams.set([t1]);
    hostComponent.allDrivers.set([d1, d2, d3]);
    hostComponent.visible.set(true);
    fixture.detectChanges();

    // Default: Sorted by nickname (Alpha -> Beta -> Charlie Team -> Zero)
    expect(await harness.isSortByNicknameActive()).toBeTrue();
    expect(await harness.isSortByDriverActive()).toBeFalse();
    expect(await harness.isSortBySeedActive()).toBeFalse();

    expect(await harness.getItemSeed(0)).toBe("1");
    expect(await harness.getItemName(0)).toBe("Alpha");
    expect(await harness.getItemNickname(0)).toBe("Zack");

    expect(await harness.getItemSeed(1)).toBe("2");
    expect(await harness.getItemName(1)).toBe("Beta");
    expect(await harness.getItemNickname(1)).toBe("Bob");

    expect(await harness.getItemSeed(2)).toBe("3");
    expect(await harness.getItemName(2)).toBe("Charlie Team");

    expect(await harness.getItemSeed(3)).toBe("4");
    expect(await harness.getItemName(3)).toBe("Zero");
    expect(await harness.getItemNickname(3)).toBe("Alice");

    // Click: Sort by Driver Name (Alice -> Bob -> Charlie Team -> Zack)
    await harness.clickSortByDriver();
    fixture.detectChanges();

    expect(await harness.isSortByDriverActive()).toBeTrue();
    expect(await harness.isSortByNicknameActive()).toBeFalse();
    expect(await harness.isSortBySeedActive()).toBeFalse();

    // 1st: Alice (Seed 4, Name is "Zero" on line 1, "Alice" on line 2)
    expect(await harness.getItemSeed(0)).toBe("4");
    expect(await harness.getItemName(0)).toBe("Zero");
    expect(await harness.getItemNickname(0)).toBe("Alice");

    // 2nd: Bob (Seed 2, Name is "Beta" on line 1, "Bob" on line 2)
    expect(await harness.getItemSeed(1)).toBe("2");
    expect(await harness.getItemName(1)).toBe("Beta");
    expect(await harness.getItemNickname(1)).toBe("Bob");

    // 3rd: Charlie Team (Seed 3, Team Name is "Charlie Team" on line 1)
    expect(await harness.getItemSeed(2)).toBe("3");
    expect(await harness.getItemName(2)).toBe("Charlie Team");

    // 4th: Zack (Seed 1, Name is "Alpha" on line 1, "Zack" on line 2)
    expect(await harness.getItemSeed(3)).toBe("1");
    expect(await harness.getItemName(3)).toBe("Alpha");
    expect(await harness.getItemNickname(3)).toBe("Zack");

    // Switch to Seed Sort (Seed 1 -> 2 -> 3 -> 4)
    await harness.clickSortBySeed();
    fixture.detectChanges();

    expect(await harness.isSortBySeedActive()).toBeTrue();
    expect(await harness.getItemSeed(0)).toBe("1");
    expect(await harness.getItemSeed(1)).toBe("2");
    expect(await harness.getItemSeed(2)).toBe("3");
    expect(await harness.getItemSeed(3)).toBe("4");
  });

  it("should sort by driver name using natural alphanumeric ordering and tie-break by seed", async () => {
    // Participants where driver names and nicknames are in contrasting alphabetical orders:
    // d1: Name = "Driver 10", Nickname = "Echo" (Seed 1)
    // d2: Name = "Driver 2", Nickname = "Delta" (Seed 2)
    // d3: Name = "Driver 1", Nickname = "Charlie" (Seed 3)
    // t1: Team Name = "Driver 1.5 Team", Member Nicknames = "Bravo" (Seed 4)
    // d4: Name = "Driver 2", Nickname = "Alpha" (Seed 5) - duplicate name to test tie-breaking by seed
    const d1 = new Driver("d1", "Driver 10", "Echo");
    const d2 = new Driver("d2", "Driver 2", "Delta");
    const d3 = new Driver("d3", "Driver 1", "Charlie");
    const t1 = new Team("t1", "Driver 1.5 Team", undefined, ["dt1"]);
    const d4 = new Driver("d4", "Driver 2", "Alpha");

    hostComponent.participants.set([d1, d2, d3, t1, d4]);
    hostComponent.teams.set([t1]);
    hostComponent.visible.set(true);
    fixture.detectChanges();

    // Default: Sorted by Nickname (Alpha -> Charlie -> Delta -> Driver 1.5 Team -> Echo)
    expect(await harness.isSortByNicknameActive()).toBeTrue();
    expect(await harness.getItemPrimaryName(0)).toBe("Alpha");
    expect(await harness.getItemSeed(0)).toBe("5");

    // Click: Sort by Driver Name
    await harness.clickSortByDriver();
    fixture.detectChanges();
    expect(await harness.isSortByDriverActive()).toBeTrue();

    // Natural alphanumeric sort by name (Driver Name / Team Name):
    // 1st: "Driver 1" (d3, seed 3)
    // 2nd: "Driver 1.5 Team" (t1, seed 4)
    // 3rd: "Driver 2" (d2, seed 2) - tie-break seed 2 before seed 5
    // 4th: "Driver 2" (d4, seed 5) - tie-break seed 5 after seed 2
    // 5th: "Driver 10" (d1, seed 1) - natural sort places "10" after "2"
    expect(await harness.getItemCount()).toBe(5);

    // 1st item: d3 ("Driver 1")
    expect(await harness.getItemSeed(0)).toBe("3");
    expect(await harness.getItemPrimaryName(0)).toBe("Charlie");
    expect(await harness.getItemSecondaryName(0)).toBe("Driver 1");

    // 2nd item: t1 ("Driver 1.5 Team")
    expect(await harness.getItemSeed(1)).toBe("4");
    expect(await harness.getItemPrimaryName(1)).toBe("Driver 1.5 Team");

    // 3rd item: d2 ("Driver 2", seed 2)
    expect(await harness.getItemSeed(2)).toBe("2");
    expect(await harness.getItemPrimaryName(2)).toBe("Delta");
    expect(await harness.getItemSecondaryName(2)).toBe("Driver 2");

    // 4th item: d4 ("Driver 2", seed 5, tie-broken after seed 2)
    expect(await harness.getItemSeed(3)).toBe("5");
    expect(await harness.getItemPrimaryName(3)).toBe("Alpha");
    expect(await harness.getItemSecondaryName(3)).toBe("Driver 2");

    // 5th item: d1 ("Driver 10", seed 1)
    expect(await harness.getItemSeed(4)).toBe("1");
    expect(await harness.getItemPrimaryName(4)).toBe("Echo");
    expect(await harness.getItemSecondaryName(4)).toBe("Driver 10");
  });

  it("should refresh roster items when reopened after participants array is mutated in place", async () => {
    const p1 = new Driver("d1", "Mario Andretti", "Speedy");
    const p2 = new Driver("d2", "Ayrton Senna", "Magic");
    const p3 = new Driver("d3", "Lewis Hamilton", "Hammer");
    const participantList = [p1, p2];

    hostComponent.participants.set(participantList);
    hostComponent.visible.set(true);
    fixture.detectChanges();

    expect(await harness.isVisible()).toBeTrue();
    expect(await harness.getItemCount()).toBe(2);

    // Close the dialog
    await harness.clickCloseButton();
    fixture.detectChanges();
    expect(await harness.isVisible()).toBeFalse();

    // Mutate the array in place without changing array reference
    participantList.push(p3);

    // Reopen dialog
    hostComponent.visible.set(true);
    fixture.detectChanges();

    // New driver should immediately appear without changing sort (Hammer comes first alphabetically)
    expect(await harness.isVisible()).toBeTrue();
    expect(await harness.getItemCount()).toBe(3);
    expect(await harness.getItemName(0)).toBe("Hammer");
    expect(await harness.getItemNickname(0)).toBe("Lewis Hamilton");
  });

  it("should not display team name when the team is not added to the racing list", async () => {
    const d1 = new Driver("d1", "Charles Leclerc", "Lord Perceval");
    const d2 = new Driver("d2", "Max Verstappen", "Mad Max");
    const t1 = new Team("t1", "Scuderia Ferrari", undefined, ["d1"]);

    // Team t1 is in the teams pool but NOT added to the racing list (participants)
    hostComponent.participants.set([d1, d2]);
    hostComponent.teams.set([t1]);
    hostComponent.visible.set(true);
    fixture.detectChanges();

    expect(await harness.getItemCount()).toBe(2);
    // Alphabetical by nickname: "Lord Perceval" (Charles Leclerc), then "Mad Max" (Max Verstappen)
    expect(await harness.getItemName(0)).toBe("Lord Perceval");
    expect(await harness.getItemNickname(0)).toBe("Charles Leclerc");
    // Team name must NOT be shown because the team is not in the racing list
    expect(await harness.getItemTeam(0)).toBe("");

    expect(await harness.getItemName(1)).toBe("Mad Max");
    expect(await harness.getItemNickname(1)).toBe("Max Verstappen");
    expect(await harness.getItemTeam(1)).toBe("");
  });

  it("should display driver nickname as primary and team name side-by-side on line 2 when the team is added to the racing list", async () => {
    const d1 = new Driver("d1", "Charles Leclerc", "Lord Perceval");
    const d2 = new Driver("d2", "Max Verstappen", "Mad Max");
    const t1 = new Team("t1", "Scuderia Ferrari", undefined, ["d1"]);

    // Team t1 IS added to the racing list (participants)
    hostComponent.participants.set([d1, t1, d2]);
    hostComponent.teams.set([t1]);
    hostComponent.visible.set(true);
    fixture.detectChanges();

    expect(await harness.getItemCount()).toBe(3);
    // Alphabetical by primary name:
    // 1. "Lord Perceval" (Charles Leclerc)
    // 2. "Mad Max" (Max Verstappen)
    // 3. "Scuderia Ferrari" (t1)
    expect(await harness.getItemName(0)).toBe("Lord Perceval");
    expect(await harness.getItemNickname(0)).toBe("Charles Leclerc");
    expect(await harness.getItemTeam(0)).toBe("Scuderia Ferrari");

    expect(await harness.getItemName(1)).toBe("Mad Max");
    expect(await harness.getItemNickname(1)).toBe("Max Verstappen");
    expect(await harness.getItemTeam(1)).toBe("");

    // t1 team card has team name on line 1 and member nicknames on line 2
    expect(await harness.getItemName(2)).toBe("Scuderia Ferrari");
    expect(await harness.getItemNickname(2)).toBe("1 Drivers");
    expect(await harness.getItemTeam(2)).toBe("");
  });

  it("should resolve member driver nicknames for a team participant when allDrivers is provided", async () => {
    const d1 = new Driver("d1", "Lando Norris", "Lando");
    const d2 = new Driver("d2", "Oscar Piastri", "Pastry");
    const t1 = new Team("t1", "McLaren F1", undefined, ["d1", "d2"]);

    hostComponent.participants.set([t1]);
    hostComponent.teams.set([t1]);
    hostComponent.allDrivers.set([d1, d2]);
    hostComponent.visible.set(true);
    fixture.detectChanges();

    expect(await harness.getItemCount()).toBe(1);
    expect(await harness.getItemName(0)).toBe("McLaren F1");
    expect(await harness.getItemNickname(0)).toBe("Lando, Pastry");
    // Team name is already the card name on line 1, so line 2 teamName span is not duplicated
    expect(await harness.getItemTeam(0)).toBe("");
  });

  it("should include team name in tooltip when driver belongs to a team", () => {
    const dialogComponent = fixture.debugElement.children[0]
      .componentInstance as RacingRosterDialogComponent;

    const itemWithTeam = {
      seed: 1,
      name: "Carlos Sainz",
      nickname: "Smooth Operator",
      primaryName: "Smooth Operator",
      secondaryName: "Carlos Sainz",
      teamName: "Williams Racing",
      isTeam: false,
    };
    expect(dialogComponent.getItemTooltip(itemWithTeam)).toBe(
      "(#1) Smooth Operator (Carlos Sainz) [Williams Racing]",
    );

    const itemWithoutTeam = {
      seed: 2,
      name: "Fernando Alonso",
      nickname: "El Nano",
      primaryName: "El Nano",
      secondaryName: "Fernando Alonso",
      isTeam: false,
    };
    expect(dialogComponent.getItemTooltip(itemWithoutTeam)).toBe(
      "(#2) El Nano (Fernando Alonso)",
    );

    const teamItem = {
      seed: 3,
      name: "Red Bull Racing",
      nickname: "Max, Checo",
      primaryName: "Red Bull Racing",
      secondaryName: "Max, Checo",
      teamName: "Red Bull Racing",
      isTeam: true,
    };
    expect(dialogComponent.getItemTooltip(teamItem)).toBe(
      "(#3) Red Bull Racing (Max, Checo)",
    );
  });

  it("should apply scaleText to calculate dynamic font sizes without crashing", () => {
    const dialogComponent = fixture.debugElement.children[0]
      .componentInstance as RacingRosterDialogComponent;

    const d1 = new Driver(
      "d1",
      "Maximilian Alexander von Montgomery-Smith",
      "The Unstoppable Intergalactic Speed Bullet",
    );
    const t1 = new Team(
      "t1",
      "Aston Martin Aramco Cognizant Formula One Team",
      undefined,
      ["d1"],
    );

    hostComponent.participants.set([d1, t1]);
    hostComponent.teams.set([t1]);
    hostComponent.visible.set(true);
    fixture.detectChanges();

    // Trigger scaleText
    expect(() => dialogComponent.scaleText()).not.toThrow();

    // Trigger window resize event
    expect(() => dialogComponent.onWindowResize()).not.toThrow();
  });

  it("should calculate and apply --card-name-font-size and --card-meta-font-size to driver-info, scaling up when space allows", () => {
    const dialogComponent = fixture.debugElement.children[0]
      .componentInstance as RacingRosterDialogComponent;

    const d1 = new Driver("d1", "Austin", "Sports Mode");

    hostComponent.participants.set([d1]);
    hostComponent.visible.set(true);
    fixture.detectChanges();

    const cardEl = fixture.nativeElement.querySelector(
      ".roster-card",
    ) as HTMLElement;
    const infoEl = fixture.nativeElement.querySelector(
      ".driver-info",
    ) as HTMLElement;
    expect(cardEl).toBeTruthy();
    expect(infoEl).toBeTruthy();

    // Emulate spacious card dimensions (e.g. 300px wide, 90px tall)
    Object.defineProperty(cardEl, "clientHeight", {
      value: 90,
      configurable: true,
    });
    Object.defineProperty(infoEl, "clientWidth", {
      value: 280,
      configurable: true,
    });

    dialogComponent.scaleText();

    const nameFontSize = infoEl.style.getPropertyValue("--card-name-font-size");
    const metaFontSize = infoEl.style.getPropertyValue("--card-meta-font-size");
    expect(nameFontSize).toBeTruthy();
    expect(metaFontSize).toBeTruthy();
    // In a 90px tall card with ample width, text scales up to fill vertical space (> 25px)
    expect(parseFloat(nameFontSize)).toBeGreaterThanOrEqual(28);
    expect(parseFloat(metaFontSize)).toBeGreaterThanOrEqual(20);
  });
});

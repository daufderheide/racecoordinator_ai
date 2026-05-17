import { CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from "@angular/core/testing";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { ChildrenOutletContexts, NavigationEnd, Router } from "@angular/router";
import { of, Subject } from "rxjs";
import { RaceFlag } from "@app/proto/antigravity";

import { AnalyticsService } from "./analytics.service";
import { AppComponent } from "./app.component";
import { DataService } from "./data.service";
import { NavigationService } from "./services/navigation.service";
import { SettingsService } from "./services/settings.service";
import { ThemeService } from "./services/theme.service";

describe("AppComponent", () => {
  let fixture: ComponentFixture<AppComponent>;
  let component: AppComponent;
  let mockRouter: any;
  let mockDataService: any;
  let mockAnalyticsService: any;
  let mockNavigationService: any;
  let mockSettingsService: any;
  let routerEvents: Subject<any>;

  beforeEach(async () => {
    routerEvents = new Subject<any>();
    mockRouter = {
      navigate: jasmine.createSpy("navigate"),
      events: routerEvents.asObservable(),
      url: "/test-page",
    };

    mockDataService = jasmine.createSpyObj("DataService", [
      "getServerVersion",
      "connectToRaceDataSocket",
      "getRaceUpdate",
      "getRaceFlag",
      "getThemes",
      "updateRaceSubscription",
      "connectToInterfaceDataSocket",
      "disconnectFromInterfaceDataSocket",
      "getHeats",
    ]);
    mockDataService.getThemes.and.returnValue(of([]));
    mockDataService.getServerVersion.and.returnValue(of("TEST-SERVER-VERSION"));
    mockDataService.connectToRaceDataSocket.and.stub();
    mockDataService.getRaceUpdate.and.returnValue(new Subject().asObservable());
    mockDataService.getRaceFlag.and.returnValue(of(RaceFlag.RED));
    mockDataService.updateRaceSubscription.and.stub();
    mockDataService.connectToInterfaceDataSocket.and.stub();
    mockDataService.disconnectFromInterfaceDataSocket.and.stub();
    mockDataService.getHeats.and.returnValue(new Subject().asObservable());

    mockAnalyticsService = jasmine.createSpyObj("AnalyticsService", [
      "initTracking",
      "updateOptOutStatus",
      "trackClick",
    ]);

    const mockContexts = jasmine.createSpyObj("ChildrenOutletContexts", [
      "getContext",
      "onChildOutletCreated",
      "onChildOutletDestroyed",
    ]);

    mockNavigationService = jasmine.createSpyObj("NavigationService", [
      "getDirection",
    ]);
    mockNavigationService.getDirection.and.returnValue("forward");

    const mockThemeService = jasmine.createSpyObj("ThemeService", [
      "initialize",
    ]);
    mockThemeService.initialize.and.returnValue(Promise.resolve());

    mockSettingsService = jasmine.createSpyObj("SettingsService", [
      "getSettings",
    ]);
    mockSettingsService.getSettings.and.returnValue({
      pageTransition: "slide",
    });

    await TestBed.configureTestingModule({
      imports: [NoopAnimationsModule, AppComponent],
      providers: [
        { provide: Router, useValue: mockRouter },
        { provide: DataService, useValue: mockDataService },
        { provide: AnalyticsService, useValue: mockAnalyticsService },
        { provide: NavigationService, useValue: mockNavigationService },
        { provide: SettingsService, useValue: mockSettingsService },
        { provide: ChildrenOutletContexts, useValue: mockContexts },
        { provide: ThemeService, useValue: mockThemeService },
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
    fixture.detectChanges(); // Trigger ngOnInit
  });

  it("should create the app", () => {
    console.log("TEST: AppComponent should create");
    expect(component).toBeTruthy();
  });

  it("should return correct animation data for slide transition", () => {
    mockSettingsService.getSettings.and.returnValue({
      pageTransition: "slide",
    });
    const data = component.calculateRouteAnimationData();

    // Format: {type}:{direction}:{path}:{counter}
    expect(data).toMatch(/^slide:forward:test-page:\d+$/);
  });

  it("should return null when transition is none", () => {
    mockSettingsService.getSettings.and.returnValue({ pageTransition: "none" });
    const data = component.calculateRouteAnimationData();
    expect(data).toBeNull();
  });

  it("should increment counter on NavigationEnd", fakeAsync(() => {
    mockSettingsService.getSettings.and.returnValue({
      pageTransition: "slide",
    });
    const firstData = component.calculateRouteAnimationData();
    const firstCounter = parseInt(firstData!.split(":")[3]);

    routerEvents.next(new NavigationEnd(1, "/new-page", "/new-page"));
    tick(); // Wait for setTimeout in ngOnInit

    const secondData = component.calculateRouteAnimationData();
    const secondCounter = parseInt(secondData!.split(":")[3]);

    expect(secondCounter).toBe(firstCounter + 1);
  }));

  it("should handle random transition stably between navigations", fakeAsync(() => {
    mockSettingsService.getSettings.and.returnValue({
      pageTransition: "random",
    });

    const firstCall = component.calculateRouteAnimationData();
    const secondCall = component.calculateRouteAnimationData();

    // Should be identical since it only changes on NavigationEnd
    expect(firstCall).toBe(secondCall);

    // Trigger navigation
    routerEvents.next(new NavigationEnd(1, "/next", "/next"));
    tick(); // Wait for setTimeout in ngOnInit

    const thirdCall = component.calculateRouteAnimationData();

    // Counter changes, and possibly type (though random could hit same type)
    expect(thirdCall).not.toBe(firstCall);
  }));

  it("should include direction from NavigationService", () => {
    mockNavigationService.getDirection.and.returnValue("backward");
    const data = component.calculateRouteAnimationData();
    expect(data).toContain(":backward:");
  });
});

import { CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { ChildrenOutletContexts, NavigationEnd, Router } from "@angular/router";
import { of, Subject } from "rxjs";
import { RaceFlag } from "@app/proto/antigravity";

import { TheDataService } from "./analytics.service";
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
  let mockTheDataService: any;
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
    ]);
    mockDataService.getThemes.and.returnValue(of([]));
    mockDataService.getServerVersion.and.returnValue(of("TEST-SERVER-VERSION"));
    mockDataService.connectToRaceDataSocket.and.stub();
    mockDataService.getRaceUpdate.and.returnValue(of({}));
    mockDataService.getRaceFlag.and.returnValue(of(RaceFlag.RED));

    mockTheDataService = jasmine.createSpyObj("TheDataService", [
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
        { provide: TheDataService, useValue: mockTheDataService },
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
    const data = component.getRouteAnimationData();

    // Format: {type}:{direction}:{path}:{counter}
    expect(data).toMatch(/^slide:forward:test-page:\d+$/);
  });

  it("should return null when transition is none", () => {
    mockSettingsService.getSettings.and.returnValue({ pageTransition: "none" });
    const data = component.getRouteAnimationData();
    expect(data).toBeNull();
  });

  it("should increment counter on NavigationEnd", () => {
    mockSettingsService.getSettings.and.returnValue({
      pageTransition: "slide",
    });
    const firstData = component.getRouteAnimationData();
    const firstCounter = parseInt(firstData!.split(":")[3]);

    routerEvents.next(new NavigationEnd(1, "/new-page", "/new-page"));
    const secondData = component.getRouteAnimationData();
    const secondCounter = parseInt(secondData!.split(":")[3]);

    expect(secondCounter).toBe(firstCounter + 1);
  });

  it("should handle random transition stably between navigations", () => {
    mockSettingsService.getSettings.and.returnValue({
      pageTransition: "random",
    });

    const firstCall = component.getRouteAnimationData();
    const secondCall = component.getRouteAnimationData();

    // Should be identical since it only changes on NavigationEnd
    expect(firstCall).toBe(secondCall);

    // Trigger navigation
    routerEvents.next(new NavigationEnd(1, "/next", "/next"));
    const thirdCall = component.getRouteAnimationData();

    // Counter changes, and possibly type (though random could hit same type)
    expect(thirdCall).not.toBe(firstCall);
  });

  it("should include direction from NavigationService", () => {
    mockNavigationService.getDirection.and.returnValue("backward");
    const data = component.getRouteAnimationData();
    expect(data).toContain(":backward:");
  });
});

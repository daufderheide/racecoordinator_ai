import { DOCUMENT } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { Router, NavigationEnd } from '@angular/router';
import { Subject, of } from 'rxjs';

import { Settings } from 'src/app/models/settings';
import { SettingsService } from 'src/app/services/settings.service';

import { AnalyticsService } from './analytics.service';
import { DataService } from './data.service';

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let mockRouter: any;
  let mockSettingsService: any;
  let mockDocument: any;
  let routerEventsSubject: Subject<any>;
  let mockSettings: Settings;
  let mockDataService: any;

  beforeEach(() => {
    // Reset the global gtag spy
    (window as any).gtag = jasmine.createSpy('gtag');

    routerEventsSubject = new Subject<any>();
    mockRouter = {
      events: routerEventsSubject.asObservable()
    };

    mockSettings = new Settings();
    mockSettings.shareAnalytics = true; // Default to true

    mockSettingsService = {
      getSettings: jasmine.createSpy('getSettings').and.callFake(() => mockSettings)
    };

    mockDataService = {
      getServerAnalyticsConfig: jasmine.createSpy('getServerAnalyticsConfig').and.returnValue(of({
        clientId: 'test-client-id-123',
        measurementId: 'G-TEST12345'
      }))
    };

    // Create a robust mock for Document that catches createElement and appendChild
    const mockHead = {
      appendChild: jasmine.createSpy('appendChild')
    };
    
    // Maintain a list of created elements to verify their attributes
    const createdElements: any[] = [];
    
    mockDocument = {
      head: mockHead,
      createElement: jasmine.createSpy('createElement').and.callFake((tagName: string) => {
        const el = { tagName, src: '', async: false, innerHTML: '' };
        createdElements.push(el);
        return el;
      }),
      _createdElements: createdElements // Expose for testing assertions
    };
    TestBed.configureTestingModule({
      providers: [
        AnalyticsService,
        { provide: Router, useValue: mockRouter },
        { provide: SettingsService, useValue: mockSettingsService },
        { provide: DataService, useValue: mockDataService },
        { provide: DOCUMENT, useValue: mockDocument }
      ]
    });
    
    service = TestBed.inject(AnalyticsService);
  });

  afterEach(() => {
    delete (window as any).gtag;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('initTracking', () => {
    it('should inject Google Analytics scripts into DOM when shareAnalytics is true', () => {
      mockSettings.shareAnalytics = true;
      service.initTracking();

      // Should have checked settings
      expect(mockSettingsService.getSettings).toHaveBeenCalled();

      // Should have injected two scripts into the document head
      expect(mockDocument.createElement).toHaveBeenCalledWith('script');
      expect(mockDocument.head.appendChild).toHaveBeenCalledTimes(2);
      
      const elements = mockDocument._createdElements;
      expect(elements.length).toBe(2);
      expect(elements[0].src).toContain('https://www.googletagmanager.com/gtag/js?id=G-TEST12345');
      expect(elements[1].innerHTML).toContain('window.dataLayer = window.dataLayer || [];');
      expect(elements[1].innerHTML).toContain('client_id: \'test-client-id-123\'');
      expect(elements[1].innerHTML).toContain('gtag(\'config\', \'G-TEST12345\'');
    });

    it('should NOT inject Google Analytics scripts if measurementId is completely missing/empty', () => {
      mockSettings.shareAnalytics = true;
      mockDataService.getServerAnalyticsConfig.and.returnValue(of({
        clientId: 'test-client-id-123',
        measurementId: '' // Explicitly empty
      }));
      service.initTracking();

      // No script should be appended
      expect(mockDocument.head.appendChild).not.toHaveBeenCalled();
    });

    it('should NOT inject Google Analytics scripts into DOM when shareAnalytics is false', () => {
      mockSettings.shareAnalytics = false;
      service.initTracking();

      expect(mockDocument.createElement).not.toHaveBeenCalled();
      expect(mockDocument.head.appendChild).not.toHaveBeenCalled();
    });

    it('should only inject scripts once even if called multiple times', () => {
      mockSettings.shareAnalytics = true;
      service.initTracking();
      service.updateOptOutStatus();
      service.updateOptOutStatus();

      // Even after 3 updates, it should only create/append 2 scripts total
      expect(mockDocument.head.appendChild).toHaveBeenCalledTimes(2);
    });
  });

  describe('trackPageView', () => {
    it('should automatically dispatch page_view events when navigating router if enabled', () => {
      mockSettings.shareAnalytics = true;
      service.initTracking();

      // Simulate a router navigation event
      routerEventsSubject.next(new NavigationEnd(1, '/fake-url', '/fake-redirect-url'));

      expect((window as any).gtag).toHaveBeenCalledWith('event', 'page_view', {
        'page_path': '/fake-redirect-url'
      });
    });

    it('should completely suppress page_view events if tracking is disabled', () => {
      mockSettings.shareAnalytics = false;
      service.initTracking();

      routerEventsSubject.next(new NavigationEnd(1, '/fake-url', '/fake-redirect-url'));

      expect((window as any).gtag).not.toHaveBeenCalled();
    });
  });

  describe('trackClick', () => {
    it('should dispatch custom GA events when tracking is enabled', () => {
      mockSettings.shareAnalytics = true;
      service.initTracking(); // Init to pull settings

      service.trackClick('btn_demo', { is_demo: true });

      expect((window as any).gtag).toHaveBeenCalledWith('event', 'btn_demo', {
        is_demo: true,
        event_category: 'engagement',
        event_label: 'button_click'
      });
    });

    it('should suppress custom GA events when tracking is disabled', () => {
      mockSettings.shareAnalytics = false;
      service.initTracking(); // Init to pull settings

      service.trackClick('btn_demo', { is_demo: true });

      expect((window as any).gtag).not.toHaveBeenCalled();
    });
  });
});
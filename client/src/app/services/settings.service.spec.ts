import { TestBed } from '@angular/core/testing';
import { SettingsService } from './settings.service';
import { Settings } from '../models/settings';

describe('SettingsService', () => {
  let service: SettingsService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [SettingsService]
    });
    service = TestBed.inject(SettingsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return default settings when nothing is stored', () => {
    const settings = service.getSettings();
    expect(settings.language).toBe('');
    expect(settings.serverIp).toBe('localhost');
  });

  it('should save and retrieve language setting', () => {
    const settings = new Settings(['r1'], ['d1'], '1.2.3.4', 8080, 'es');
    service.saveSettings(settings);

    const retrieved = service.getSettings();
    expect(retrieved.language).toBe('es');
    expect(retrieved.serverIp).toBe('1.2.3.4');
  });

  it('should handle corrupt JSON in localStorage', () => {
    spyOn(console, 'error');
    localStorage.setItem('racecoordinator_settings', 'invalid-json');
    const settings = service.getSettings();
    expect(settings).toBeDefined();
    expect(settings.language).toBe('');
    expect(console.error).toHaveBeenCalled();
  });
});

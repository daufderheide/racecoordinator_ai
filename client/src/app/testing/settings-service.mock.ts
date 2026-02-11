import { Settings } from '../models/settings';

export class SettingsServiceMock {
  getSettings = jasmine.createSpy('getSettings').and.returnValue(new Settings(['r1'], ['d1'], 'localhost', 7070, ''));
  saveSettings = jasmine.createSpy('saveSettings');
}

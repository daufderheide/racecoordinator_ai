import { Settings } from '../models/settings';

export class SettingsServiceMock {
  getSettings = jasmine.createSpy('getSettings').and.returnValue(new Settings(['r1'], ['d1']));
  saveSettings = jasmine.createSpy('saveSettings');
}

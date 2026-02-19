import { Settings } from '../models/settings';

export class SettingsServiceMock {
  getSettings = jasmine.createSpy('getSettings').and.returnValue(new Settings(['r1'], ['d1'], 'localhost', 7070, '', false, undefined, undefined, undefined, undefined, undefined, undefined, true));
  saveSettings = jasmine.createSpy('saveSettings');
}

import { Settings } from '../models/settings';

export class SettingsServiceMock {
  getSettings = jasmine.createSpy('getSettings').and.returnValue(Object.assign(new Settings(), {
    recentRaceIds: ['r1'],
    selectedDriverIds: ['d1'],
    serverIp: 'localhost',
    serverPort: 7070,
    language: '',
    racedaySetupWalkthroughSeen: false,
    sortByStandings: true
  }));
  saveSettings = jasmine.createSpy('saveSettings');
}

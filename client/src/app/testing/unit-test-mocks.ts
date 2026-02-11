
import { of } from 'rxjs';

export const mockDataService = {
  listAssets: jasmine.createSpy('listAssets').and.returnValue(of([])),
  deleteAsset: jasmine.createSpy('deleteAsset').and.returnValue(of(true)),
  renameAsset: jasmine.createSpy('renameAsset').and.returnValue(of(true)),
  getDrivers: jasmine.createSpy('getDrivers').and.returnValue(of([])),
  uploadAsset: jasmine.createSpy('uploadAsset').and.returnValue(of(true)),
  getCurrentDatabase: jasmine.createSpy('getCurrentDatabase').and.returnValue(of({ name: 'test_db' }))
};

export const mockTranslationService = {
  translate: jasmine.createSpy('translate').and.callFake((key: string) => key)
};

export const mockRouter = {
  navigate: jasmine.createSpy('navigate')
};

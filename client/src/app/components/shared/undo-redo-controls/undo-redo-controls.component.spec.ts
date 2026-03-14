import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { UndoRedoControlsComponent } from './undo-redo-controls.component';
import { UndoManager } from './undo-manager';
import { Pipe, PipeTransform } from '@angular/core';
import { UndoRedoControlsHarness } from './undo-redo-controls.harness';

@Pipe({
  name: 'translate',
  standalone: false
})
class MockTranslatePipe implements PipeTransform {
  transform(value: string): string {
    return value;
  }
}

describe('UndoRedoControlsComponent', () => {
  let component: UndoRedoControlsComponent;
  let fixture: ComponentFixture<UndoRedoControlsComponent>;
  let harness: UndoRedoControlsHarness;
  let mockManager: jasmine.SpyObj<UndoManager<any>>;

  beforeEach(async () => {
    mockManager = jasmine.createSpyObj('UndoManager', ['undo', 'redo', 'canUndo', 'canRedo']);
    // Setup default returns
    mockManager.canUndo.and.returnValue(false);
    mockManager.canRedo.and.returnValue(false);

    await TestBed.configureTestingModule({
      declarations: [UndoRedoControlsComponent, MockTranslatePipe]
    })
      .compileComponents();
  });

  beforeEach(async () => {
    fixture = TestBed.createComponent(UndoRedoControlsComponent);
    component = fixture.componentInstance;
    component.manager = mockManager;
    harness = await TestbedHarnessEnvironment.harnessForFixture(fixture, UndoRedoControlsHarness);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should delegate undo to manager', async () => {
    Object.defineProperty(mockManager, 'undoStackCount', { get: () => 1, configurable: true });
    fixture.detectChanges();

    await harness.clickUndo();
    expect(mockManager.undo).toHaveBeenCalled();
  });

  it('should delegate redo to manager', async () => {
    Object.defineProperty(mockManager, 'redoStackCount', { get: () => 1, configurable: true });
    fixture.detectChanges();

    await harness.clickRedo();
    expect(mockManager.redo).toHaveBeenCalled();
  });

  it('should expose canUndo state', async () => {
    Object.defineProperty(mockManager, 'undoStackCount', { get: () => 1, configurable: true });
    fixture.detectChanges();
    expect(await harness.isUndoDisabled()).toBeFalse();
  });

  it('should expose canRedo state', async () => {
    Object.defineProperty(mockManager, 'redoStackCount', { get: () => 1, configurable: true });
    fixture.detectChanges();
    expect(await harness.isRedoDisabled()).toBeFalse();
  });

  it('should fail gracefully if manager is undefined', () => {
    component.manager = undefined;
    expect(() => component.undo()).not.toThrow();
    expect(() => component.redo()).not.toThrow();
    expect(component.canUndo).toBeFalse();
    expect(component.canRedo).toBeFalse();
  });
});

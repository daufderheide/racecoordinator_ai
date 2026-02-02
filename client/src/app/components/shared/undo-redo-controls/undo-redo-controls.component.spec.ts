import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UndoRedoControlsComponent } from './undo-redo-controls.component';
import { UndoManager } from './undo-manager';
import { Pipe, PipeTransform } from '@angular/core';

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

  beforeEach(() => {
    fixture = TestBed.createComponent(UndoRedoControlsComponent);
    component = fixture.componentInstance;
    component.manager = mockManager;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should delegate undo to manager', () => {
    component.undo();
    expect(mockManager.undo).toHaveBeenCalled();
  });

  it('should delegate redo to manager', () => {
    component.redo();
    expect(mockManager.redo).toHaveBeenCalled();
  });

  it('should expose canUndo state', () => {
    mockManager.canUndo.and.returnValue(true);
    expect(component.canUndo).toBeTrue();
  });

  it('should expose canRedo state', () => {
    mockManager.canRedo.and.returnValue(true);
    expect(component.canRedo).toBeTrue();
  });

  it('should fail gracefully if manager is undefined', () => {
    component.manager = undefined;
    expect(() => component.undo()).not.toThrow();
    expect(() => component.redo()).not.toThrow();
    expect(component.canUndo).toBeFalse();
    expect(component.canRedo).toBeFalse();
  });
});

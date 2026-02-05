import { fakeAsync, tick } from '@angular/core/testing';
import { UndoManager, UndoConfig } from './undo-manager';

interface TestItem {
  id: string;
  name: string;
}

describe('UndoManager', () => {
  let manager: UndoManager<TestItem>;
  let currentItem: TestItem;
  let applierSpy: jasmine.Spy;

  const config: UndoConfig<TestItem> = {
    clonner: (item) => ({ ...item }),
    equalizer: (a, b) => a.id === b.id && a.name === b.name,
    applier: (item) => {
      currentItem = item;
      if (applierSpy) applierSpy(item);
    }
  };

  beforeEach(() => {
    applierSpy = jasmine.createSpy('applier');
    currentItem = { id: '1', name: 'Start' };

    manager = new UndoManager<TestItem>(
      config,
      () => currentItem, // snapshotGetter
      500 // debounceMs
    );
    manager.initialize(currentItem);
  });

  afterEach(() => {
    manager.destroy();
  });

  it('should initialize correctly', () => {
    expect(manager.undoStackCount).toBe(0);
    expect(manager.redoStackCount).toBe(0);
    expect(manager.hasChanges()).toBeFalse();
    expect(manager.canUndo()).toBeFalse();
    expect(manager.canRedo()).toBeFalse();
  });

  it('should track changes via captureState', () => {
    // Make a change
    currentItem.name = 'Change 1';

    // Capture AFTER change
    manager.captureState();

    expect(manager.undoStackCount).toBe(1);
    const history = manager.undoStackItems;
    expect(history[0].name).toBe('Start'); // Stack holds PREVIOUS state

    expect(manager.hasChanges()).toBeTrue();
    expect(manager.canUndo()).toBeTrue();
  });

  it('should undo and redo', () => {
    // 1. Change to 1 and capture
    currentItem.name = 'Change 1';
    manager.captureState();

    // 2. Change to 2 and capture
    currentItem.name = 'Change 2';
    manager.captureState();

    expect(manager.undoStackCount).toBe(2);

    // Undo to Change 1
    manager.undo();
    expect(currentItem.name).toBe('Change 1');
    expect(manager.undoStackCount).toBe(1);
    expect(manager.redoStackCount).toBe(1);
    expect(manager.redoStackItems[0].name).toBe('Change 2'); // Popped state is pushed to redo

    // Undo to Start
    manager.undo();
    expect(currentItem.name).toBe('Start');
    expect(manager.undoStackCount).toBe(0);
    expect(manager.redoStackCount).toBe(2);

    // Redo to Change 1
    manager.redo();
    expect(currentItem.name).toBe('Change 1');
    expect(manager.undoStackCount).toBe(1);

    // Redo to Change 2
    manager.redo();
    expect(currentItem.name).toBe('Change 2');
    expect(manager.redoStackCount).toBe(0);
  });

  it('should debounce text inputs', fakeAsync(() => {
    // Type 'A'
    currentItem.name = 'A';
    manager.onInputChange();
    tick(200);
    expect(manager.undoStackCount).toBe(0);

    // Type 'AB'
    currentItem.name = 'AB';
    manager.onInputChange(); // Reset timer
    tick(200);
    expect(manager.undoStackCount).toBe(0);

    // Wait full debounce
    tick(500);
    expect(manager.undoStackCount).toBe(1);
    expect(manager.undoStackItems[0].name).toBe('Start');
    expect(currentItem.name).toBe('AB');
  }));

  it('should not push to stack if state matches snapshot on commit', fakeAsync(() => {
    // Simulate user typing same value 'Start' -> 'Start' (e.g. paste same)
    manager.onInputChange();
    tick(500);

    expect(manager.undoStackCount).toBe(0); // No change
  }));

  it('should clear redo stack on new change', () => {
    currentItem.name = 'A';
    manager.captureState(); // Commit A

    manager.undo(); // Back to Start
    expect(manager.redoStackCount).toBe(1);

    // New change 'B'
    currentItem.name = 'B';
    manager.captureState(); // Commit B

    expect(manager.redoStackCount).toBe(0); // Cleared
  });

  it('should reset tracking but keep history', () => {
    currentItem.name = 'A';
    manager.captureState(); // Commit A

    // Save happens -> A is new baseline
    manager.resetTracking(currentItem);

    expect(manager.hasChanges()).toBeFalse(); // Matches new initial
    expect(manager.undoStackCount).toBe(1); // History preserved

    // Undo
    manager.undo();
    expect(currentItem.name).toBe('Start');
    expect(manager.hasChanges()).toBeTrue(); // Different from 'A'
  });
});

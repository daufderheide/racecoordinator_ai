import { Subject, Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

export interface UndoConfig<T> {
  clonner: (item: T) => T; // Returns a deep copy of the item
  equalizer: (a: T, b: T) => boolean; // Returns true if items are equal
  applier: (item: T) => void; // Applies the state to the consumer
}

export class UndoManager<T> {
  private undoStack: T[] = [];
  private redoStack: T[] = [];
  private initialState?: T;
  private _snapshot: T | null = null;
  private snapshotGetter: () => T | undefined;

  // Debounce
  private textChange$ = new Subject<void>();
  private subscriptions: Subscription[] = [];

  constructor(
    private config: UndoConfig<T>,
    snapshotGetter: () => T | undefined, // Function to get current state from consumer
    debounceMs: number = 500
  ) {
    this.snapshotGetter = snapshotGetter;

    // Setup debounce
    this.subscriptions.push(
      this.textChange$.pipe(
        debounceTime(debounceMs)
      ).subscribe(() => {
        this.commitChange();
      })
    );
  }

  public initialize(initialState: T) {
    this.initialState = this.config.clonner(initialState);
    this.undoStack = [];
    this.redoStack = [];
    this._snapshot = this.config.clonner(initialState);
  }

  // Reset tracking (e.g. after save) but KEEP history
  public resetTracking(newState: T) {
    this.initialState = this.config.clonner(newState);
    this._snapshot = this.config.clonner(newState);
    // Stacks are preserved
  }

  public destroy() {
    this.subscriptions.forEach(s => s.unsubscribe());
  }

  // --- Actions ---

  public undo() {
    if (this.undoStack.length === 0) return;

    const currentState = this.snapshotGetter();
    if (!currentState) return;

    // Push current state to redo stack
    this.redoStack.push(this.config.clonner(currentState));

    const previousState = this.undoStack.pop();
    if (previousState) {
      this.config.applier(this.config.clonner(previousState));
      this._snapshot = this.config.clonner(previousState);
    }
  }

  public redo() {
    if (this.redoStack.length === 0) return;

    const currentState = this.snapshotGetter();
    if (!currentState) return;

    // Push current state to undo stack
    this.undoStack.push(this.config.clonner(currentState));

    const nextState = this.redoStack.pop();
    if (nextState) {
      this.config.applier(this.config.clonner(nextState));
      this._snapshot = this.config.clonner(nextState);
    }
  }

  // --- Change Tracking ---

  public hasChanges(): boolean {
    const currentState = this.snapshotGetter();
    if (!currentState || !this.initialState) return false;
    // Dirty if different from initial state OR if there are undo steps (meaning we moved away and maybe came back, but we usually consider 'dirty' if != initial)
    // Actually, standard behavior: 'Dirty' means != Initial.
    // Undo stack presence doesn't strictly mean dirty (e.g. type 'a', undo 'a' -> stack empty, clean. Type 'a', save -> Clean, stack has 'a'. Undo -> Dirty, stack empty).
    // So just comparing current vs initial is robust.
    return !this.config.equalizer(currentState, this.initialState);
  }

  public canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  public canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  // --- Capture Logic ---

  // Call when an input receives focus
  public onInputFocus() {
    const currentState = this.snapshotGetter();
    if (currentState) {
      this._snapshot = this.config.clonner(currentState);
    }
  }

  // Call on discrete changes (drag drop, select, or AFTER a manual model change)
  // This compares current state with last snapshot and pushes snapshot if different.
  public captureState() {
    const currentState = this.snapshotGetter();
    if (currentState && this._snapshot) {
      if (!this.config.equalizer(currentState, this._snapshot)) {
        this.pushToUndo(this.config.clonner(this._snapshot));
        this._snapshot = this.config.clonner(currentState);
      }
    } else if (currentState && !this._snapshot) {
      // First time catching a state
      this._snapshot = this.config.clonner(currentState);
    }
  }

  // Forces a comparison and commit if changed
  public commitState() {
    this.captureState();
  }

  // Call on text input change (debounced)
  public onInputChange() {
    this.textChange$.next();
  }

  // Call on blur to flush debounce
  public onInputBlur() {
    this.commitState();
  }

  private commitChange() {
    this.commitState();
  }

  private pushToUndo(state: T) {
    // Avoid identical consecutive entries in the stack
    const lastIndex = this.undoStack.length - 1;
    if (lastIndex >= 0 && this.config.equalizer(state, this.undoStack[lastIndex])) {
      return;
    }

    this.undoStack.push(state);
    this.redoStack = [];
  }

  // Expose stacks for debugging/testing if needed, or stick to public API
  public get undoStackCount() { return this.undoStack.length; }
  public get redoStackCount() { return this.redoStack.length; }

  // Snapshot for testing
  public get undoStackItems() { return [...this.undoStack]; }
  public get redoStackItems() { return [...this.redoStack]; }
}

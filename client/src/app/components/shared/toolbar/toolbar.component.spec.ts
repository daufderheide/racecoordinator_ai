import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ToolbarComponent } from './toolbar.component';
import { TranslationService } from '../../../services/translation.service';
import { TranslatePipe } from '../../../pipes/translate.pipe';
import { UndoManager } from '../undo-redo-controls/undo-manager';
import { By } from '@angular/platform-browser';

describe('ToolbarComponent', () => {
  let component: ToolbarComponent;
  let fixture: ComponentFixture<ToolbarComponent>;
  let translationServiceSpy: jasmine.SpyObj<TranslationService>;

  beforeEach(async () => {
    translationServiceSpy = jasmine.createSpyObj('TranslationService', ['translate']);
    translationServiceSpy.translate.and.callFake((key: string) => key);

    await TestBed.configureTestingModule({
      declarations: [ToolbarComponent, TranslatePipe],
      providers: [
        { provide: TranslationService, useValue: translationServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ToolbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show edit button when showEdit is true', () => {
    component.showEdit = true;
    fixture.detectChanges();
    const btn = fixture.debugElement.query(By.css('#edit-track-btn'));
    expect(btn).toBeTruthy();
  });

  it('should emit edit event when edit button is clicked', () => {
    spyOn(component.edit, 'emit');
    component.showEdit = true;
    fixture.detectChanges();
    const btn = fixture.debugElement.query(By.css('#edit-track-btn'));
    btn.nativeElement.click();
    expect(component.edit.emit).toHaveBeenCalled();
  });

  it('should show help button when showHelp is true', () => {
    component.showHelp = true;
    fixture.detectChanges();
    const btn = fixture.debugElement.query(By.css('#help-track-btn'));
    expect(btn).toBeTruthy();
  });

  it('should emit help event when help button is clicked', () => {
    spyOn(component.help, 'emit');
    component.showHelp = true;
    fixture.detectChanges();
    const btn = fixture.debugElement.query(By.css('#help-track-btn'));
    btn.nativeElement.click();
    expect(component.help.emit).toHaveBeenCalled();
  });

  it('should show delete button when showDelete is true', () => {
    component.showDelete = true;
    fixture.detectChanges();
    const btn = fixture.debugElement.query(By.css('#delete-track-btn'));
    expect(btn).toBeTruthy();
  });

  it('should emit delete event when delete button is clicked', () => {
    spyOn(component.delete, 'emit');
    component.showDelete = true;
    fixture.detectChanges();
    const btn = fixture.debugElement.query(By.css('#delete-track-btn'));
    btn.nativeElement.click();
    expect(component.delete.emit).toHaveBeenCalled();
  });

  it('should show undo/redo when showUndo/showRedo are true', () => {
    component.showUndo = true;
    component.showRedo = true;
    fixture.detectChanges();
    const undoBtn = fixture.debugElement.query(By.css('.undo'));
    const redoBtn = fixture.debugElement.query(By.css('.redo'));
    expect(undoBtn).toBeTruthy();
    expect(redoBtn).toBeTruthy();
  });

  it('should call undoManager.undo() when undo button is clicked', () => {
    const config = {
      clonner: (item: any) => ({ ...item }),
      equalizer: (a: any, b: any) => JSON.stringify(a) === JSON.stringify(b),
      applier: () => { }
    };
    let state = { foo: 'bar' };
    const manager = new UndoManager<any>(config, () => state);
    spyOn(manager, 'undo');

    component.showUndo = true;
    component.undoManager = manager;

    // First commit captures initial snapshot
    manager.commitState();
    
    // Second commit after change pushes to undo stack
    state = { foo: 'baz' }; 
    manager.commitState(); 
    
    fixture.detectChanges();

    const undoBtn = fixture.debugElement.query(By.css('.undo'));
    expect(undoBtn.nativeElement.disabled).toBeFalsy();
    undoBtn.nativeElement.click();
    expect(manager.undo).toHaveBeenCalled();
  });

  it('should call undoManager.redo() when redo button is clicked', () => {
    const config = {
      clonner: (item: any) => ({ ...item }),
      equalizer: (a: any, b: any) => JSON.stringify(a) === JSON.stringify(b),
      applier: () => { }
    };
    let state = { foo: 'bar' };
    const manager = new UndoManager<any>(config, () => state);
    spyOn(manager, 'redo');

    component.showRedo = true;
    component.undoManager = manager;

    manager.commitState();
    state = { foo: 'baz' };
    manager.commitState();
    manager.undo(); // Now redoStackCount is 1
    fixture.detectChanges();

    const redoBtn = fixture.debugElement.query(By.css('.redo'));
    expect(redoBtn.nativeElement.disabled).toBeFalsy();
    redoBtn.nativeElement.click();
    expect(manager.redo).toHaveBeenCalled();
  });

  it('should disable buttons when isSaving is true', () => {
    component.showEdit = true;
    component.showDelete = true;
    component.isSaving = true;
    fixture.detectChanges();

    const editBtn = fixture.debugElement.query(By.css('#edit-track-btn'));
    const deleteBtn = fixture.debugElement.query(By.css('#delete-track-btn'));
    
    expect(editBtn.nativeElement.disabled).toBeTruthy();
    expect(deleteBtn.nativeElement.disabled).toBeTruthy();
  });
});

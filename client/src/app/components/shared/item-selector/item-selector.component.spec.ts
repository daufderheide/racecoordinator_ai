import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { ItemSelectorComponent } from './item-selector.component';
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'avatarUrl',
  standalone: false
})
class MockAvatarUrlPipe implements PipeTransform {
  transform(value: string): string {
    return value;
  }
}

@Pipe({
  name: 'translate',
  standalone: false
})
class MockTranslatePipe implements PipeTransform {
  transform(value: string): string {
    return value;
  }
}

describe('ItemSelectorComponent', () => {
  let component: ItemSelectorComponent;
  let fixture: ComponentFixture<ItemSelectorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ItemSelectorComponent, MockAvatarUrlPipe, MockTranslatePipe],
      imports: [FormsModule]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ItemSelectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should not be visible by default', () => {
    expect(component.visible).toBeFalse();
    const modalContent = fixture.nativeElement.querySelector('.modal-content');
    expect(modalContent).toBeNull();
  });

  it('should display items when visible', () => {
    component.visible = true;
    component.items = [
      { name: 'Item 1', url: 'assets/images/default_avatar.svg' },
      { name: 'Item 2', url: 'assets/images/default_avatar.svg' }
    ];
    fixture.detectChanges();

    const items = fixture.nativeElement.querySelectorAll('.item-card');
    expect(items.length).toBe(2);
    expect(items[0].textContent).toContain('Item 1');
  });

  it('should emit select event on item click', () => {
    spyOn(component.select, 'emit');
    component.visible = true;
    component.items = [{ name: 'Item 1', url: 'assets/images/default_avatar.svg' }];
    fixture.detectChanges();

    const item = fixture.nativeElement.querySelector('.item-card');
    item.click();

    expect(component.select.emit).toHaveBeenCalledWith(component.items[0]);
  });

  it('should emit close event on close button click', () => {
    spyOn(component.close, 'emit');
    component.visible = true;
    fixture.detectChanges();

    const backdrop = fixture.nativeElement.querySelector('.modal-backdrop');
    backdrop.click();

    expect(component.close.emit).toHaveBeenCalled();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TrackManagerComponent } from './track-manager.component';
import { DataService } from '../../data.service';
import { TranslationService } from '../../services/translation.service';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { BackButtonComponent } from '../shared/back-button/back-button.component'; // Assuming shared component

// Mock DataService
class MockDataService {
  getTracks() {
    return of([]);
  }
}

// Mock TranslationService
class MockTranslationService {
  translate(key: string) {
    return key;
  }
}

// Mock Router
class MockRouter {
  navigate() { }
}

import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-back-button',
  template: '',
  standalone: false
})
class MockBackButtonComponent {
  @Input() targetUrl?: string;
}

describe('TrackManagerComponent', () => {
  let component: TrackManagerComponent;
  let fixture: ComponentFixture<TrackManagerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TrackManagerComponent, TranslatePipe, MockBackButtonComponent],
      providers: [
        { provide: DataService, useClass: MockDataService },
        { provide: TranslationService, useClass: MockTranslationService },
        { provide: Router, useClass: MockRouter }
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(TrackManagerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

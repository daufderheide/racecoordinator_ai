import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TrackEditorComponent } from './track-editor.component';
import { DataService } from '../../data.service';
import { TranslationService } from '../../services/translation.service';
import { Router, ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { FormsModule } from '@angular/forms';
import { Component, Input } from '@angular/core';

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

// Mock ActivatedRoute
class MockActivatedRoute {
  snapshot = {
    queryParamMap: {
      get: (key: string) => 'new'
    }
  };
}

@Component({
  selector: 'app-back-button',
  template: '',
  standalone: false
})
class MockBackButtonComponent {
  @Input() targetUrl?: string;
}

describe('TrackEditorComponent', () => {
  let component: TrackEditorComponent;
  let fixture: ComponentFixture<TrackEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TrackEditorComponent, TranslatePipe, MockBackButtonComponent],
      imports: [FormsModule],
      providers: [
        { provide: DataService, useClass: MockDataService },
        { provide: TranslationService, useClass: MockTranslationService },
        { provide: Router, useClass: MockRouter },
        { provide: ActivatedRoute, useClass: MockActivatedRoute }
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(TrackEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScoutsDisplayComponent } from './scouts-display.component';

describe('ScoutsDisplayComponent', () => {
  let component: ScoutsDisplayComponent;
  let fixture: ComponentFixture<ScoutsDisplayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ScoutsDisplayComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ScoutsDisplayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

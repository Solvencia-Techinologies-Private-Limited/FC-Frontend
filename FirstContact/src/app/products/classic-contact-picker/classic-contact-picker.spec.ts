import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClassicContactPicker } from './classic-contact-picker';

describe('ClassicContactPicker', () => {
  let component: ClassicContactPicker;
  let fixture: ComponentFixture<ClassicContactPicker>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClassicContactPicker],
    }).compileComponents();

    fixture = TestBed.createComponent(ClassicContactPicker);
    component = fixture.componentInstance;

    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});


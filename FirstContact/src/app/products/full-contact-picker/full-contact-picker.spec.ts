import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FullContactPicker } from './full-contact-picker';

describe('FullContactPicker', () => {
  let component: FullContactPicker;
  let fixture: ComponentFixture<FullContactPicker>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FullContactPicker],
    }).compileComponents();

    fixture = TestBed.createComponent(FullContactPicker);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

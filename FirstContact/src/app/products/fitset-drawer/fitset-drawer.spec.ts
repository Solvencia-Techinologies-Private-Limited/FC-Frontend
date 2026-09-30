import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FitsetDrawerComponent } from './fitset-drawer';

describe('FitsetDrawer', () => {
  let component: FitsetDrawerComponent;
  let fixture: ComponentFixture<FitsetDrawerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FitsetDrawerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FitsetDrawerComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

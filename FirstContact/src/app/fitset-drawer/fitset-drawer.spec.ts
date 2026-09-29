import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FitsetDrawer } from './fitset-drawer';

describe('FitsetDrawer', () => {
  let component: FitsetDrawer;
  let fixture: ComponentFixture<FitsetDrawer>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FitsetDrawer],
    }).compileComponents();

    fixture = TestBed.createComponent(FitsetDrawer);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DirectsPage } from './directs.page';

describe('DirectsPage', () => {
  let component: DirectsPage;
  let fixture: ComponentFixture<DirectsPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DirectsPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DirectsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

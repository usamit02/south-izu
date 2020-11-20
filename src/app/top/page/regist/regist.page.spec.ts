import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RegistPage } from './regist.page';

describe('RegistPage', () => {
  let component: RegistPage;
  let fixture: ComponentFixture<RegistPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RegistPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RegistPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

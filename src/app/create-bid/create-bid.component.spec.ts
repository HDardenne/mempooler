import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateBidComponent } from './create-bid.component';

describe('CreateBidComponent', () => {
  let component: CreateBidComponent;
  let fixture: ComponentFixture<CreateBidComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CreateBidComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateBidComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

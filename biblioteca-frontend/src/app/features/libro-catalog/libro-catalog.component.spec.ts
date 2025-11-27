import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LibroCatalogComponent } from './libro-catalog.component';

describe('LibroCatalogComponent', () => {
  let component: LibroCatalogComponent;
  let fixture: ComponentFixture<LibroCatalogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LibroCatalogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LibroCatalogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ChangeDetectorRef, Component, Inject, OnInit } from '@angular/core';
import { ProductService } from '../product-services';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-full-contact-picker',
  imports: [],
  templateUrl: './full-contact-picker.html',
  styleUrl: './full-contact-picker.css',
})
export class FullContactPicker implements OnInit {
  

  constructor(@Inject(MAT_DIALOG_DATA)
  public data: { brandId: string },
    private readonly dialogRef: MatDialogRef<FullContactPicker>,
    private readonly changeDetectorRef: ChangeDetectorRef,
    public readonly productService: ProductService
  ) { }

  ngOnInit(): void {
  }

  close(): void {
    this.dialogRef.close();
  }
}

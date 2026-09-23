import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ObserversModule } from '@angular/cdk/observers';

@NgModule({
  imports: [
    CommonModule,
    
    ObserversModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    
  ],
  declarations: [],
  exports: [
    FormsModule,
    ReactiveFormsModule
  ],
  providers: [
    DecimalPipe,
  ],
  schemas: [
    CUSTOM_ELEMENTS_SCHEMA
  ],
})
export class SharedModule { }

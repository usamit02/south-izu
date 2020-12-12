import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BillComponent } from './bill.component';
@NgModule({
  imports: [CommonModule, IonicModule, FormsModule, ReactiveFormsModule,],
  declarations: [BillComponent],
  exports: [BillComponent]
})
export class BillSharedModule { }
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { PayComponent } from './pay.component';
@NgModule({
  imports: [CommonModule, IonicModule, FormsModule, ReactiveFormsModule,],
  declarations: [PayComponent],
  exports: [PayComponent]
})
export class PaySharedModule { }
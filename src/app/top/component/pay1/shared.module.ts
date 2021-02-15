import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Pay1Component } from './pay1.component';
import { HttpClientModule, HttpClientJsonpModule } from '@angular/common/http';
@NgModule({
  imports: [CommonModule, IonicModule, FormsModule, ReactiveFormsModule,HttpClientModule,HttpClientJsonpModule],
  declarations: [Pay1Component],
  exports: [Pay1Component]
})
export class PaySharedModule { }
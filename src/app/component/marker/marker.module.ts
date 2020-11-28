import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule,ReactiveFormsModule } from '@angular/forms';

import { MarkerComponent } from './marker.component';
import { SafePipe } from './pipe/safe.pipe';
@NgModule({
  imports: [CommonModule, IonicModule, FormsModule,ReactiveFormsModule],
  declarations: [MarkerComponent,SafePipe, ],
  exports: [MarkerComponent,]
})
export class MarkerModule { }
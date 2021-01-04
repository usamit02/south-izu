import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule,ReactiveFormsModule } from '@angular/forms';
import { AgmCoreModule } from '@agm/core';
import { MarkerComponent } from './marker.component';
@NgModule({
  imports: [CommonModule, IonicModule,FormsModule,ReactiveFormsModule,AgmCoreModule,],
  declarations: [MarkerComponent],
  exports: [MarkerComponent]
})
export class MarkerModule { }
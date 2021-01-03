import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

import { AgmCoreModule } from '@agm/core';
import { MarkerComponent } from './marker.component';
@NgModule({
  imports: [CommonModule, IonicModule,AgmCoreModule,],
  declarations: [MarkerComponent],
  exports: [MarkerComponent]
})
export class MarkerModule { }
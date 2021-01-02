import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

import { AgmCoreModule } from '@agm/core';
import { MapComponent } from './map.component';
@NgModule({
  imports: [CommonModule, IonicModule,AgmCoreModule,],
  declarations: [MapComponent],
  exports: [MapComponent]
})
export class MapModule { }
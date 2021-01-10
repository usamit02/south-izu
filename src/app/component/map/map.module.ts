import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { AgmCoreModule } from '@agm/core';
import { AgmDirectionModule } from 'agm-direction';
import { MapComponent } from './map.component';
@NgModule({
  imports: [CommonModule, IonicModule,AgmCoreModule//.forRoot({apiKey: 'AIzaSyB4D969VIv64a6rMFtrtX2wpHUhuosD9h0',})
  ,AgmDirectionModule,],
  declarations: [MapComponent],
  exports: [MapComponent]
})
export class MapModule { }
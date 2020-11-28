import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, } from '@angular/forms';
import { Tab3Page } from './tab3.page';
import { AgmCoreModule } from '@agm/core';
import { MarkerModule } from '../../component/marker/marker.module'
@NgModule({
  imports: [
    IonicModule, CommonModule, FormsModule,
    RouterModule.forChild([{ path: '', component: Tab3Page }]),
    AgmCoreModule.forRoot({apiKey: 'AIzaSyB4D969VIv64a6rMFtrtX2wpHUhuosD9h0'}),//'AIzaSyDTHLyzh5B37YJPU8esWD0fV0ntvE9QOwI'})*/
    MarkerModule
  ],
  declarations: [Tab3Page]
})
export class Tab3PageModule { }

import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, } from '@angular/forms';
import { Tab3Page } from './tab3.page';
import { MarkerModule } from '../../component/marker/marker.module'
import { AgmCoreModule } from '@agm/core';
import { ChatSharedModule } from './../component/chat/shared.module';
@NgModule({
  imports: [
    IonicModule, CommonModule, FormsModule,MarkerModule,AgmCoreModule,//.forRoot({apiKey: 'AIzaSyB4D969VIv64a6rMFtrtX2wpHUhuosD9h0'}),//'AIzaSyDTHLyzh5B37YJPU8esWD0fV0ntvE9QOwI'})
    RouterModule.forChild([{ path: '', component: Tab3Page }]),ChatSharedModule,
  ],
  declarations: [Tab3Page]
})
export class Tab3PageModule { }

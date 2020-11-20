import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule,ReactiveFormsModule } from '@angular/forms';
import { Tab3Page } from './tab3.page';
import { AgmCoreModule } from '@agm/core';
@NgModule({
  imports: [
    IonicModule,
    CommonModule,
    FormsModule, ReactiveFormsModule,
    RouterModule.forChild([{ path: '', component: Tab3Page }]),
    AgmCoreModule.forRoot({apiKey: 'AIzaSyB4D969VIv64a6rMFtrtX2wpHUhuosD9h0'})//'AIzaSyDTHLyzh5B37YJPU8esWD0fV0ntvE9QOwI'})*/

  ],
  declarations: [Tab3Page]
})
export class Tab3PageModule { }

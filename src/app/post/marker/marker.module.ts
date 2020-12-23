import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Routes, RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { AgmCoreModule } from '@agm/core';
import { MarkerPage } from './marker.page';
import { SharedModule } from '../component/shared.module';
const routes: Routes = [
  { path: ':id', component: MarkerPage },
];
@NgModule({
  imports: [
    CommonModule, IonicModule, RouterModule.forChild(routes), FormsModule, ReactiveFormsModule,
    AgmCoreModule,SharedModule,// SharedModule//.forRoot({apiKey: 'AIzaSyB4D969VIv64a6rMFtrtX2wpHUhuosD9h0'}),//'AIzaSyDTHLyzh5B37YJPU8esWD0fV0ntvE9QOwI'})*/ 
  ],
  declarations: [MarkerPage,],
})
export class MarkerModule { }

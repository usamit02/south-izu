import { IonicModule } from '@ionic/angular';
import { Routes,RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, } from '@angular/forms';
import { Tab3Page } from './tab3.page';
import { MarkerModule } from '../../component/marker/marker.module'
import { AgmCoreModule } from '@agm/core';
import { ChatSharedModule } from './../component/chat/shared.module';
import { UserComponent } from './../component/user/user.component';
const routes: Routes = [
  { path: ':id', component: Tab3Page },
  { path: '', component: Tab3Page }
];
@NgModule({
  imports: [
    IonicModule, CommonModule, FormsModule,MarkerModule,AgmCoreModule,//.forRoot({apiKey: 'AIzaSyB4D969VIv64a6rMFtrtX2wpHUhuosD9h0'}),//'AIzaSyDTHLyzh5B37YJPU8esWD0fV0ntvE9QOwI'})
    RouterModule.forChild(routes),ChatSharedModule,
  ],
  declarations: [Tab3Page,UserComponent,]
})
export class Tab3PageModule { }

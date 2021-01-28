import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Routes, RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { CalendarModule } from "ion2-calendar";
import { MeetPage } from './meet.page';
import { ChatSharedModule } from '../../component/chat/shared.module';
import { DatePipe } from './date.pipe';
//import { ThreadPage } from '../../page/thread/thread.page';
const routes: Routes = [
  { path: ':home/:date', component: MeetPage },
  { path: ':home/:date/:cursor', component: MeetPage },
  { path: ':home/:date/:cursor/:thread', component: MeetPage },
];
@NgModule({
  imports: [
    CommonModule, IonicModule, RouterModule.forChild(routes),CalendarModule,ChatSharedModule, 
  ],
  declarations: [MeetPage,DatePipe],
})
export class MeetPageModule { }

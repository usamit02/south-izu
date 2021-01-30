import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Routes, RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { VehiclePage } from './vehicle.page';
import { EvalSharedModule } from '../../component/eval/shared.module';
import { StorySharedModule } from '../../component/story/shared.module';
import { ChatSharedModule } from '../../component/chat/shared.module';
import { PipeSharedModule } from '../../../pipe/shared.module';
//import { ThreadPage } from '../../page/thread/thread.page';
const routes: Routes = [
  { path: ':id', component: VehiclePage },
  { path: ':id/:cursor', component: VehiclePage },
  //{ path: 'report/thread/:id/:thread', component: ReportPage },
  //{ path: 'report/thread/:id/:thread/:cursor', component: ReportPage },
];
@NgModule({
  imports: [
    CommonModule, IonicModule, RouterModule.forChild(routes),EvalSharedModule,StorySharedModule, ChatSharedModule, PipeSharedModule,
  ],
  declarations: [VehiclePage],
})
export class VehiclePageModule { }

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Routes, RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { ReportPage } from './report.page';
import { EvalSharedModule } from '../../component/eval/shared.module';
import { StorySharedModule } from '../../component/story/shared.module';
import { ChatSharedModule } from '../../component/chat/shared.module';
import { PipeSharedModule } from '../../../pipe/shared.module';
//import { ThreadPage } from '../../page/thread/thread.page';
const routes: Routes = [
  { path: ':id', component: ReportPage },
  { path: ':id/:cursor', component: ReportPage },
  //{ path: 'report/thread/:id/:thread', component: ReportPage },
  //{ path: 'report/thread/:id/:thread/:cursor', component: ReportPage },
];
@NgModule({
  imports: [
    CommonModule, IonicModule, RouterModule.forChild(routes),EvalSharedModule,StorySharedModule, ChatSharedModule, PipeSharedModule,
  ],
  declarations: [ReportPage,],
  entryComponents: [],
})
export class ReportPageModule { }

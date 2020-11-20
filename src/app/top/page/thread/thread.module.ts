
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Routes, RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { ThreadPage } from './thread.page';
import { ChatSharedModule } from '../../component/chat/shared.module';
//import { ThreadPage } from '../../page/thread/thread.page';
const routes: Routes = [
  { path: ':id', component: ThreadPage },
  { path: ':id/:cursor', component: ThreadPage },
  { path: '', component: ThreadPage },
];
@NgModule({
  imports: [
    CommonModule, IonicModule, RouterModule.forChild(routes), ChatSharedModule,
  ],
  declarations: [ThreadPage,],
  entryComponents: [],
})
export class ThreadPageModule { }

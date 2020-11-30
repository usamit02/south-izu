import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Routes, RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TopPage } from './top.page';
import { MenuComponent } from './component/menu/menu.component';
import { UserComponent } from './component/user/user.component';
import { TalkComponent } from './component/talk/talk.component';
import { MarkerComponent } from './component/marker/marker.component';
import { PipeSharedModule } from '../pipe/shared.module';
const routes: Routes = [
  {
    path: '', component: TopPage,
    children: [
      { path: '', loadChildren: () => import('./tabs/tabs.module').then(m => m.TabsPageModule) },
      { path: 'tabs', loadChildren: () => import('./tabs/tabs.module').then(m => m.TabsPageModule) },
      { path: 'result', loadChildren: () => import('./page/result/result.module').then(m => m.ResultPageModule) },
      { path: 'report', loadChildren: () => import('./page/report/report.module').then(m => m.ReportPageModule) },
      { path: 'column', loadChildren: () => import('./page/column/column.module').then(m => m.ColumnPageModule) },
      { path: 'direct', loadChildren: () => import('./page/direct/direct.module').then(m => m.DirectPageModule) },
      { path: 'support', loadChildren: () => import('./page/support/support.module').then(m => m.SupportPageModule) },
      { path: 'login', loadChildren: () => import('./page/login/login.module').then(m => m.LoginPageModule) },
      { path: 'regist', loadChildren: () => import('./page/regist/regist.module').then(m => m.RegistPageModule) },
      { path: 'notify', loadChildren: () => import('./page/notify/notify.module').then(m => m.NotifyPageModule) },
      { path: 'design', loadChildren: () => import('./page/design/design.module').then(m => m.DesignPageModule) },
      { path: 'directs', loadChildren: () => import('./page/directs/directs.module').then(m => m.DirectsPageModule) },
      { path: 'user', loadChildren: () => import('./page/user/user.module').then(m => m.UserPageModule) },
      { path: 'users', loadChildren: () => import('./page/users/users.module').then(m => m.UsersPageModule) },
      { path: 'columns', loadChildren: () => import('./page/columns/columns.module').then(m => m.ColumnsPageModule) },
      { path: 'thread', loadChildren: () => import('./page/thread/thread.module').then(m => m.ThreadPageModule) },
    ]
  }
];
@NgModule({
  declarations: [TopPage, MenuComponent,UserComponent,TalkComponent,MarkerComponent,],
  imports: [
    CommonModule, IonicModule, RouterModule.forChild(routes), FormsModule, ReactiveFormsModule, PipeSharedModule,
  ],
})
export class TopPageModule { }

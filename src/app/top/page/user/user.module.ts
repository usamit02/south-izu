import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Routes, RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { UserPage } from './user.page';
import { DatePipe } from './date.pipe';
import { SafePipe } from './safe.pipe';
import { ReportPage } from './report/report.page';
import { ColumnPage } from './column/column.page';
import { BlogPage } from './blog/blog.page';
import { ChatPage } from './chat/chat.page';
import { VehiclePage } from './vehicle/vehicle.page';
import { FriendPage } from './friend/friend.page';
const routes: Routes = [
  {
    path: ':id', component: UserPage,
    children: [
      { path: 'vehicle', component: VehiclePage },
      { path: 'report', component: ReportPage },
      { path: 'blog', component: BlogPage },
      { path: 'column', component: ColumnPage },
      { path: 'chat', component: ChatPage },       
      { path: 'friend/:typ', component: FriendPage },
      { path: '', component: VehiclePage },
    ]
  }
];

@NgModule({
  imports: [
    CommonModule,
    IonicModule,
    RouterModule.forChild(routes)
  ],
  declarations: [UserPage, DatePipe, SafePipe, ReportPage,BlogPage, ColumnPage, ChatPage, VehiclePage,FriendPage,]
})
export class UserPageModule { }

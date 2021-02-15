import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Routes, RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { BookPage } from './book.page';
import { DatePipe } from './date.pipe';
import { CalendarModule } from "ion2-calendar";
import { PaySharedModule } from '../../component/pay1/shared.module';
import { StorySharedModule } from '../../component/story/shared.module';
import { ChatSharedModule } from '../../component/chat/shared.module';
const routes: Routes = [
  { path: ':id/:from/:to', component: BookPage },
];
@NgModule({
  imports: [
    CommonModule, IonicModule, RouterModule.forChild(routes), CalendarModule,
    PaySharedModule,StorySharedModule,ChatSharedModule
  ],
  declarations: [BookPage,DatePipe,],
})
export class BookPageModule { }

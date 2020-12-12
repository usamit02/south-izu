import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Routes, RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { BookPage } from './book.page';
import { CalendarModule } from "ion2-calendar";
import { BillSharedModule } from '../../component/bill/shared.module';
const routes: Routes = [
  { path: ':id/:na/:from/:to', component: BookPage },
];
@NgModule({
  imports: [
    CommonModule, IonicModule, RouterModule.forChild(routes), CalendarModule,BillSharedModule,
  ],
  declarations: [BookPage,],
})
export class BookPageModule { }

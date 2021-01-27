import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Routes, RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { CalendarModule } from "ion2-calendar";
import { BookPage } from './book.page';
import { DatePipe } from './date.pipe';
const routes: Routes = [  
  { path: ':home/:from/:to', component: BookPage },
  { path: ':home', component: BookPage },
  { path: '', component: BookPage },
];

@NgModule({
  imports: [
    CommonModule, IonicModule, FormsModule,CalendarModule,
    RouterModule.forChild(routes)
  ],
  declarations: [BookPage,DatePipe]
})
export class BookModule { }

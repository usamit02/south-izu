import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Routes, RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { FormsModule,ReactiveFormsModule } from '@angular/forms';
import { BookPage } from './book.page';
import { DatePipe } from './date.pipe';
const routes: Routes = [  
  { path: ':id/:from/:to', component: BookPage },
  { path: ':id', component: BookPage },
  { path: '', component: BookPage },
];

@NgModule({
  imports: [
    CommonModule, IonicModule, FormsModule,ReactiveFormsModule,
    RouterModule.forChild(routes)
  ],
  declarations: [BookPage,DatePipe]
})
export class BookModule { }

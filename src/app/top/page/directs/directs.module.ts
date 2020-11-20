import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Routes, RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { DirectsPage } from './directs.page';
import { DatePipe } from './date.pipe';
const routes: Routes = [
  {
    path: '',
    component: DirectsPage
  }
];
@NgModule({
  imports: [
    CommonModule,
    IonicModule,
    RouterModule.forChild(routes)
  ],
  declarations: [DirectsPage, DatePipe,]
})
export class DirectsPageModule { }

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Routes, RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { ColumnsPage } from './columns.page';
import { PipeSharedModule } from '../../../pipe/shared.module';
const routes: Routes = [
  {
    path: ':parent',
    component: ColumnsPage
  }
];

@NgModule({
  imports: [
    CommonModule,
    IonicModule,
    RouterModule.forChild(routes),
    PipeSharedModule,
  ],
  declarations: [ColumnsPage,]
})
export class ColumnsPageModule { }

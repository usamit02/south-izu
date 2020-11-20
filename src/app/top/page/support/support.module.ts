import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Routes, RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { SupportPage } from './support.page';
import { PaySharedModule } from '../../component/pay/shared.module';
const routes: Routes = [
  { path: ':id', component: SupportPage },
];
@NgModule({
  imports: [
    CommonModule, IonicModule, RouterModule.forChild(routes), PaySharedModule,
  ],
  declarations: [SupportPage,],
})
export class SupportPageModule { }

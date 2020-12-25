import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Routes, RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { StayPage } from './stay.page';
import { SafePipe } from './safe.pipe';
import { PlanModule } from '../component/plan/plan.module';
import { SharedModule } from '../component/shared.module';
const routes: Routes = [
  { path: ':id', component: StayPage },
];

@NgModule({
  imports: [
    CommonModule, IonicModule, FormsModule, ReactiveFormsModule,
    RouterModule.forChild(routes), PlanModule,SharedModule,
  ],
  declarations: [StayPage,SafePipe,]
})
export class StayModule { }

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Routes, RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { VehiclePage } from './vehicle.page';
import { SafePipe } from './safe.pipe';
import { SharedModule } from '../component/shared.module';
const routes: Routes = [
  { path: ':id', component: VehiclePage }, { path: '', component: VehiclePage },
];

@NgModule({
  imports: [
    CommonModule, IonicModule, FormsModule, ReactiveFormsModule,
    RouterModule.forChild(routes), SharedModule,
  ],
  declarations: [VehiclePage,SafePipe,]
})
export class VehicleModule { }

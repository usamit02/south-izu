import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';
import { VehiclePage } from './vehicle.page';
import { ImageCropperModule } from 'ngx-image-cropper';
import { CropComponent } from '../../component/crop/crop.component';
const routes: Routes = [
  {
    path: '',
    component: VehiclePage
  }
];

@NgModule({
  imports: [
    CommonModule, IonicModule, FormsModule, ReactiveFormsModule,
    RouterModule.forChild(routes),
    ImageCropperModule,
  ],
  declarations: [VehiclePage, CropComponent,],
})
export class VehiclePageModule { }

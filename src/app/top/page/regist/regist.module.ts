import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';
import { RegistPage } from './regist.page';
import { ImageCropperModule } from 'ngx-image-cropper';
import { CropComponent } from './crop/crop.component';
const routes: Routes = [
  {
    path: '',
    component: RegistPage
  }
];

@NgModule({
  imports: [
    CommonModule, IonicModule, FormsModule, ReactiveFormsModule,
    RouterModule.forChild(routes),
    ImageCropperModule,
  ],
  declarations: [RegistPage, CropComponent,],
  entryComponents: [CropComponent,]
})
export class RegistPageModule { }

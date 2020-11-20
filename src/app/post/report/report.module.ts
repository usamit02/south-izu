import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Routes, RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { EditorModule } from '@tinymce/tinymce-angular';
import { ImageCropperModule } from 'ngx-image-cropper';
import { ReportPage } from './report.page';
import { ShopComponent } from '../component/shop/shop.component';
import { CastComponent } from '../component/cast/cast.component';
import { PipeSharedModule } from '../../pipe/shared.module';
import { SharedModule } from '../component/shared.module';
const routes: Routes = [
  { path: '', component: ReportPage },
  { path: ':id', component: ReportPage },
];
@NgModule({
  imports: [
    CommonModule, IonicModule, RouterModule.forChild(routes), FormsModule, ReactiveFormsModule,
    EditorModule, ImageCropperModule, PipeSharedModule, SharedModule
  ],
  declarations: [ReportPage, ShopComponent, CastComponent],
  entryComponents: [ShopComponent, CastComponent,]
})
export class ReportModule { }

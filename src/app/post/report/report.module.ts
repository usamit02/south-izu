import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Routes, RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { EditorModule } from '@tinymce/tinymce-angular';
import { ImageCropperModule } from 'ngx-image-cropper';
import { ReportPage } from './report.page';
import { PipeSharedModule } from '../../pipe/shared.module';
import { SharedModule } from '../component/shared.module';
import { MapModule } from '../../component/map/map.module';
import { MarkerModule } from '../component/marker/marker.module';
const routes: Routes = [ 
  { path: ':id', component: ReportPage }, { path: '', component: ReportPage },
];
@NgModule({
  imports: [
    CommonModule, IonicModule, RouterModule.forChild(routes), FormsModule, ReactiveFormsModule,
    EditorModule, ImageCropperModule, PipeSharedModule, SharedModule,MapModule,MarkerModule,
  ],
  declarations: [ReportPage],
})
export class ReportModule { }

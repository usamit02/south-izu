import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Routes, RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { EditorModule } from '@tinymce/tinymce-angular';
import { ImageCropperModule } from 'ngx-image-cropper';
import { TreeModule } from '@circlon/angular-tree-component';
import { TreeComponent } from '../component/tree/tree.component';
import { ColumnPage } from './column.page';
import { PipeSharedModule } from '../../pipe/shared.module';
import { SharedModule } from '../component/shared.module';
const routes: Routes = [
  { path: ':parent', component: ColumnPage },
  { path: ':parent/:id', component: ColumnPage }
];
@NgModule({
  imports: [
    CommonModule, IonicModule, RouterModule.forChild(routes), FormsModule, ReactiveFormsModule,
    EditorModule, ImageCropperModule, PipeSharedModule, SharedModule, TreeModule,
  ],
  declarations: [ColumnPage, TreeComponent],
  entryComponents: [TreeComponent,]
})
export class ColumnModule { }

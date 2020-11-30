import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Routes, RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { EditorModule } from '@tinymce/tinymce-angular';
import { MarkerPage } from './marker.page';
import { ListComponent } from '../component/list/list.component';
import { PipeSharedModule } from '../../pipe/shared.module';
import { SharedModule } from '../component/shared.module';
const routes: Routes = [
  { path: ':id', component: MarkerPage },
];
@NgModule({
  imports: [
    CommonModule, IonicModule, RouterModule.forChild(routes), FormsModule, ReactiveFormsModule,
    EditorModule,PipeSharedModule, SharedModule
  ],
  declarations: [MarkerPage,ListComponent,],
})
export class MarkerModule { }

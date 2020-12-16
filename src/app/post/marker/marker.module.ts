import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Routes, RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { AgmCoreModule } from '@agm/core';
import { EditorModule } from '@tinymce/tinymce-angular';
import { MarkerPage } from './marker.page';
import { ListComponent } from '../component/list/list.component';
import { PipeSharedModule } from '../../pipe/shared.module';
import { StoryComponent } from '../component/story/story.component';
//import { SharedModule } from '../component/shared.module';
const routes: Routes = [
  { path: ':id', component: MarkerPage },
];
@NgModule({
  imports: [
    CommonModule, IonicModule, RouterModule.forChild(routes), FormsModule, ReactiveFormsModule,
    AgmCoreModule,EditorModule,PipeSharedModule,// SharedModule//.forRoot({apiKey: 'AIzaSyB4D969VIv64a6rMFtrtX2wpHUhuosD9h0'}),//'AIzaSyDTHLyzh5B37YJPU8esWD0fV0ntvE9QOwI'})*/
    
  ],
  declarations: [MarkerPage,ListComponent,StoryComponent],
})
export class MarkerModule { }

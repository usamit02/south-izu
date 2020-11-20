import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';

import { EditorModule } from '@tinymce/tinymce-angular';
import { ImageCropperModule } from 'ngx-image-cropper';

import { StoryComponent } from './story/story.component';
import { ListComponent } from './list/list.component';
import { CropComponent } from './crop/crop.component';
import { PipeSharedModule } from '../../pipe/shared.module';
@NgModule({
  imports: [CommonModule, IonicModule, FormsModule, EditorModule, ImageCropperModule, PipeSharedModule],
  declarations: [StoryComponent, ListComponent, CropComponent],
  entryComponents: [ListComponent, CropComponent,],
  exports: [StoryComponent, ListComponent, CropComponent,]
})
export class SharedModule { }
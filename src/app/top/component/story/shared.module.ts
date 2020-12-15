import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { StoryComponent } from './story.component';
import { SafePipe } from './safe.pipe';
@NgModule({
  imports: [CommonModule, IonicModule,],
  declarations: [StoryComponent, SafePipe,],
  exports: [StoryComponent,SafePipe,]
})
export class StorySharedModule { }
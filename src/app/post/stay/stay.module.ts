import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Routes, RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { StayPage } from './stay.page';
import { PlanModule } from '../component/plan/plan.module';
import { EditorModule } from '@tinymce/tinymce-angular';
import { StoryComponent } from '../component/story/story.component';
import { SafePipe } from './safe.pipe';
const routes: Routes = [
  { path: ':id', component: StayPage },
];

@NgModule({
  imports: [
    CommonModule, IonicModule, FormsModule, ReactiveFormsModule,
    RouterModule.forChild(routes), PlanModule,EditorModule,
  ],
  declarations: [StayPage, StoryComponent,SafePipe]
})
export class StayModule { }

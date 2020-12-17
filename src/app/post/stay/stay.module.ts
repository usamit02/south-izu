import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Routes, RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { FormsModule, ReactiveFormsModule} from '@angular/forms';
import { StayPage } from './stay.page';
import { CalendarModule } from "ion2-calendar";
import { EditorModule } from '@tinymce/tinymce-angular';
import { StoryComponent } from '../component/story/story.component';
import { DatePipe } from './date.pipe';
const routes: Routes = [  
  { path: ':id', component: StayPage},
];

@NgModule({
  imports: [
    CommonModule, IonicModule, FormsModule, ReactiveFormsModule,
    RouterModule.forChild(routes),CalendarModule, EditorModule,
  ],
  declarations: [StayPage,StoryComponent,DatePipe,]
})
export class StayModule { }

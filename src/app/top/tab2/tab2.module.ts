import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Tab2Page } from './tab2.page';
import { CalendarModule } from "ion2-calendar";
import { CancelModule } from './cancel/cancel.module'
import { DatePipe } from './date.pipe';
@NgModule({
  imports: [
    IonicModule,
    CommonModule,
    FormsModule, ReactiveFormsModule,
    RouterModule.forChild([{ path: '', component: Tab2Page }]),
    CalendarModule,CancelModule, 
  ],
  declarations: [Tab2Page,DatePipe]
})
export class Tab2PageModule { }

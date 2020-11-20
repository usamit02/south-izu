import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Tab2Page } from './tab2.page';

import { CalendarModule } from "ion2-calendar";
import { DatePipe } from './date.pipe';
@NgModule({
  imports: [
    IonicModule,
    CommonModule,
    FormsModule, ReactiveFormsModule,
    RouterModule.forChild([{ path: '', component: Tab2Page }]),
    CalendarModule, 
  ],
  declarations: [Tab2Page,DatePipe]
})
export class Tab2PageModule { }

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule,ReactiveFormsModule } from '@angular/forms';
import { CalendarModule } from "ion2-calendar";
import { PlanComponent } from './plan.component';
import { DatePipe } from './date.pipe';
@NgModule({
  imports: [CommonModule, IonicModule, FormsModule,ReactiveFormsModule,CalendarModule,],
  declarations: [PlanComponent,DatePipe,],
  exports: [PlanComponent]
})
export class PlanModule { }
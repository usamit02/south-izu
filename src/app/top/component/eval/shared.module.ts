import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { EvalComponent } from './eval.component';
@NgModule({
  imports: [CommonModule, IonicModule,],
  declarations: [EvalComponent],
  exports: [EvalComponent]
})
export class EvalSharedModule { }
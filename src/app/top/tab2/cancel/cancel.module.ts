import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { CancelComponent } from './cancel.component';
import { DatePipe} from './pipe/date.pipe';
@NgModule({
  imports: [CommonModule, IonicModule,FormsModule,],
  declarations: [CancelComponent,DatePipe,],
  exports: [CancelComponent]
})
export class CancelModule { }
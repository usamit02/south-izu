import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Routes, RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { TreeModule } from '@circlon/angular-tree-component';
import { TreeComponent } from '../component/tree/tree.component';
import { ColumnPage } from './column.page';
import { SharedModule } from '../component/shared.module';
const routes: Routes = [
  { path: ':parent', component: ColumnPage },
  { path: ':parent/:id', component: ColumnPage }
];
@NgModule({
  imports: [
    CommonModule, IonicModule, RouterModule.forChild(routes), FormsModule, ReactiveFormsModule,
    SharedModule, TreeModule,
  ],
  declarations: [ColumnPage, TreeComponent],
  entryComponents: [TreeComponent,]
})
export class ColumnModule { }

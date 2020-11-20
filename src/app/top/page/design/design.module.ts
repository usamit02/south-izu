import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Routes, RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { DesignPage } from './design.page';

const routes: Routes = [
  {
    path: '',
    component: DesignPage
  }
];

@NgModule({
  imports: [
    CommonModule, IonicModule, FormsModule,
    RouterModule.forChild(routes)
  ],
  declarations: [DesignPage]
})
export class DesignPageModule { }

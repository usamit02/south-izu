import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Routes, RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { UsersPage } from './users.page';
import { CardPage } from './card/card.page';
const routes: Routes = [
  {
    path: '',
    component: UsersPage
    , children: [
      { path: ':order', component: CardPage },
    ]
  }
];

@NgModule({
  imports: [
    CommonModule,
    IonicModule,
    RouterModule.forChild(routes)
  ],
  declarations: [UsersPage, CardPage,]
})
export class UsersPageModule { }

import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  { path: 'post/report', loadChildren: () => import('./post/report/report.module').then(m => m.ReportModule) },
  { path: 'post/column', loadChildren: () => import('./post/column/column.module').then(m => m.ColumnModule) },
  { path: '',loadChildren: () => import('./top/top.module').then(m => m.TopPageModule)}
];
@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }

import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  { path: 'post/report', loadChildren: () => import('./post/report/report.module').then(m => m.ReportModule) },
  { path: 'post/column', loadChildren: () => import('./post/column/column.module').then(m => m.ColumnModule) },
  { path: 'post/marker', loadChildren: () => import('./post/marker/marker.module').then(m => m.MarkerModule) },
  { path: '',loadChildren: () => import('./top/top.module').then(m => m.TopPageModule)}
];
@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }

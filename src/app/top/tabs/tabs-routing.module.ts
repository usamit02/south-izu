import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TabsPage } from './tabs.page';

const routes: Routes = [
  {
    path: 'southizu-riderhouse',
    component: TabsPage,
    children: [
      { path: 'home',
        children: [{ path: '',loadChildren: () => import('../tab1/tab1.module').then(m => m.Tab1PageModule)}]
      },
      { path: 'book',
        children: [{path: '',loadChildren: () =>import('../tab2/tab2.module').then(m => m.Tab2PageModule)}]
      },
      { path: 'marker',
        children: [
          { path: '',loadChildren: () => import('../tab3/tab3.module').then(m => m.Tab3PageModule)}
        ]
      },
      { path: '', redirectTo: '/southizu-riderhouse/home', pathMatch: 'full' }
    ]
  },
  {
    path: 'bbload',
    component: TabsPage,
    children: [
      { path: 'home',
        children: [{ path: '',loadChildren: () => import('../tab1/tab1.module').then(m => m.Tab1PageModule)}]
      },
      { path: 'book',
        children: [{path: '',loadChildren: () =>import('../tab2/tab2.module').then(m => m.Tab2PageModule)}]
      },
      { path: 'marker',
        children: [
          { path: '',loadChildren: () => import('../tab3/tab3.module').then(m => m.Tab3PageModule)}
        ]
      },
      { path: '', redirectTo: '/bbload/home', pathMatch: 'full' }
    ]
  },
  {path: '', redirectTo: '/southizu-riderhouse/home', pathMatch: 'full'}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TabsPageRoutingModule {}

import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AngularFireDatabase } from '@angular/fire/database';
import { ApiService } from '../../../../service/api.service';
import { TabsService } from '../tabs.service';

@Component({
  selector: 'app-vehicle',
  templateUrl: './vehicle.page.html',
  styleUrls: ['./vehicle.page.scss'],
})
export class VehiclePage implements OnInit, OnDestroy {
  user: any = { id: "", na: "" };
  vehicles = [];
  private onDestroy$ = new Subject();
  constructor(private api: ApiService, private db: AngularFireDatabase, private tabs: TabsService, ) {
  }
  ngOnInit() {
    this.tabs.user.asObservable().pipe(takeUntil(this.onDestroy$)).subscribe(user => {
      this.user = user;
      this.api.get('query', { table: 'vehicle', select: ['*'], where: { user: this.user.id}}).then(res => {
        res.vehicles.map(vehicle => {
          vehicle.detail$ = this.db.object(`vehicle/${vehicle.id}`).valueChanges();
        });
        this.vehicles = res.vehicles;
      });
    });
  }
  ngOnDestroy() {
    this.onDestroy$.next();
  }
}

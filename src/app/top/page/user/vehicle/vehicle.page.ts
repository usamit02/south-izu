import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { IonInfiniteScroll } from '@ionic/angular';
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
  @ViewChild('infinite', { static: false }) infinite: IonInfiniteScroll;
  user: any = { id: "", na: "" };
  columns = [];
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
        this.columns = res.colums;
      });
    });
  }
  ngOnDestroy() {
    this.onDestroy$.next();
  }
}

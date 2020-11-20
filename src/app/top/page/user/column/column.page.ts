import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { IonInfiniteScroll } from '@ionic/angular';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AngularFireDatabase } from '@angular/fire/database';
import { ApiService } from './../../../../service/api.service';
import { TabsService } from '../tabs.service';

@Component({
  selector: 'app-column',
  templateUrl: './column.page.html',
  styleUrls: ['./column.page.scss'],
})
export class ColumnPage implements OnInit, OnDestroy {
  @ViewChild('infinite', { static: false }) infinite: IonInfiniteScroll;
  user: any = { id: "", na: "" };
  columns = [];
  private onDestroy$ = new Subject();
  constructor(private api: ApiService, private db: AngularFireDatabase, private tabs: TabsService, ) {
  }
  ngOnInit() {
    this.tabs.user.asObservable().pipe(takeUntil(this.onDestroy$)).subscribe(user => {
      this.user = user;
      this.api.get('query', { table: 'colum', select: ['*'], where: { user: this.user.id, acked: { lower: '2000-1-1' } }, order: { acked: 'DESC' } }).then(res => {
        res.colums.map(column => {
          column.detail$ = this.db.object(`column/${column.id}`).valueChanges();
        });
        this.columns = res.colums;
      });
    });
  }
  ngOnDestroy() {
    this.onDestroy$.next();
  }
}

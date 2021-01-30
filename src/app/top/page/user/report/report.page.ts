import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { IonInfiniteScroll } from '@ionic/angular';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AngularFireDatabase } from '@angular/fire/database';
import { ApiService } from './../../../../service/api.service';
import { TabsService } from '../tabs.service';
@Component({
  selector: 'app-report',
  templateUrl: './report.page.html',
  styleUrls: ['./report.page.scss'],
})
export class ReportPage implements OnInit, OnDestroy {
  @ViewChild('infinite', { static: false }) infinite: IonInfiniteScroll;
  user: any = { id: "", na: "" };
  reports = [];
  shop = "";
  private onDestroy$ = new Subject();
  constructor(private api: ApiService, private db: AngularFireDatabase, private tabs: TabsService, private router: Router, ) {
  }
  ngOnInit() {
    this.tabs.user.asObservable().pipe(takeUntil(this.onDestroy$)).subscribe(user => {
      this.user = user;
      this.load(new Date());
    });
  }
  load(acked: Date | string) {
    const LIMIT = 15;
    let cursor = new Date(acked);
    cursor.setSeconds(cursor.getSeconds() - 1);//upper 以上ではなく超にするため -1秒
    let where: any = { user: this.user.id, ack: 1, created: { upper: this.dateFormat(cursor) } };
    if (this.shop) where.shop = this.shop;
    this.api.get('query', { table: 'reporting', select: ['*'], where: where, order: { created: 'DESC' }, limit: LIMIT }).then(res => {
      res.reports.map(report => {
        report.detail$ = this.db.object(`report/${report.id}`).valueChanges();
        this.reports.push(report);
      });
      if (res.reporteds.length < LIMIT) {
        this.infinite.disabled = true;
      }
    }).finally(() => {
      this.infinite.complete();
    }
    );
  }
  filter(typ, id) {
    this[typ] = this[typ] ? "" : id;
    this.reports = [];
    this.infinite.disabled = false;
    this.load(new Date());
  }
  dateFormat(date = new Date()) {//MySQL用日付文字列作成'yyyy-M-d H:m:s'    
    var y = date.getFullYear();
    var m = date.getMonth() + 1;
    var d = date.getDate();
    var h = date.getHours();
    var min = date.getMinutes();
    var sec = date.getSeconds();
    return y + "-" + m + "-" + d + " " + h + ":" + min + ":" + sec;
  }
  ngOnDestroy() {
    this.onDestroy$.next();
  }
}

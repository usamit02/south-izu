import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ModalController } from '@ionic/angular';
import { Title } from '@angular/platform-browser';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CalendarModal, CalendarModalOptions, DayConfig } from 'ion2-calendar';
import { ApiService } from '../../../service/api.service';
import { UserService } from '../../../service/user.service';
import { Store } from '../../../service/store.service';
import { HOME, HOLIDAYS } from '../../../config';
import { User } from '../../../class';
@Component({
  selector: 'app-meet',
  templateUrl: './meet.page.html',
  styleUrls: ['./meet.page.scss'],
})
export class MeetPage implements OnInit, OnDestroy {
  @ViewChild('content', { read: ElementRef, static: false }) content: ElementRef;
  params;
  home: string = "";
  date: string = "2020-1-1";
  user: User;
  users = [];
  param: any = { id: null };//chat component の初期値  
  days: Array<DayConfig> = [];
  private onDestroy$ = new Subject();
  constructor(private route: ActivatedRoute, private api: ApiService, private userService: UserService, private title: Title,
    private store: Store, private modal: ModalController) { }
  ngOnInit() {
    this.route.params.pipe(takeUntil(this.onDestroy$)).subscribe(params => {
      this.params = params;
      this.userService.$.pipe(takeUntil(this.onDestroy$)).subscribe(async user => {
        this.user = user;
        if (user.id) {
          this.home = HOME[this.params.home].na;
          this.date = this.params.date;
          this.undo();
        } else {
          this.param = { id: null };
          this.store.update(state => ({ ...state, users: [] }));
        }
      });
    });
  }
  async undo(date?: number) {
    if (date) {
      let d = new Date(this.date);
      d.setDate(d.getDate() + date);
      this.date = this.dateFormat(d);
    }
    const res = await this.api.get('query', { table: "bookmanaging", select: ['user', 'na', 'avatar', 'stay'], where: { home: this.params.home, dated: this.date } });
    if (res.bookmanags.filter(book => { return book.user === this.user.id; }).length ||
      HOME[this.params.home].users.filter(user => { return user === this.user.id; }).length || this.user.admin) {
      this.users = res.bookmanags.map(user => {
        return { ...user, id: user.user };
      });
      this.param = { id: this.params.home + this.date.replace(/\-/g, ""), topInfinite: true };
      if (this.params.cursor) this.param.cursor = this.params.cursor;
      if (this.params.thread) this.param.thread = this.params.thread;
      this.store.update(state => ({ ...state, users: this.users }));
    } else {
      this.param = { id: null };
      this.store.update(state => ({ ...state, users: [] }));
    }
  }
  async openCalendar() {
    const now = new Date();
    const upper = new Date();
    upper.setMonth(upper.getMonth() + 1);
    if (!this.days.length) {
      let css: any = {};
      for (let holiday of HOLIDAYS) {
        let d = new Date(holiday);
        if (now.getTime() <= d.getTime() && d.getTime() <= upper.getTime()) {
          css[this.dateFormat(d)] = "sunday";
        }
      }
      const where = { home: this.params.home, user: this.user.id, dated: { lower: this.dateFormat(now), upper: this.dateFormat(upper) } };
      const res = await this.api.get('query', { table: 'book', select: ['dated'], where: where });
      let able: any = {};
      for (let book of res.books) {
        able[book.dated] = true;
      }
      for (let d = new Date(now); d < upper; d.setDate(d.getDate() + 1)) {
        const key = this.dateFormat(d);
        const w = d.getDay();
        if (w === 0) {
          css[key] = "sunday";
        } else if (w === 6) {
          if (!css[key]) css[key] = "satday";
        }
        let daysConfig: any = { date: new Date(d) };
        if (css[key]) daysConfig.cssClass = css[key];
        if (!able[key]) daysConfig.disable = true;
        this.days.push(daysConfig);
      }
    }
    const options: CalendarModalOptions = {
      pickMode: 'single',
      title: `予約日を選択`,
      from: now, to: upper,
      weekdays: ['日', '月', '火', '水', '木', '金', '土'],
      closeIcon: true, doneIcon: true, cssClass: 'calendar',
      monthFormat: 'YYYY年M月', defaultScrollTo: new Date(), daysConfig: this.days,
    };
    let myCalendar = await this.modal.create({
      component: CalendarModal,
      componentProps: { options }
    });
    myCalendar.present();
    myCalendar.onDidDismiss().then(event => {
      if (event.data) {
        this.date = event.data.string;
        this.undo();
      }
    });
  }
  dateFormat(date = new Date()) {//MySQL用日付文字列作成'yyyy-M-d H:m:s'    
    var y = date.getFullYear();
    var m = ("0" + (date.getMonth() + 1)).slice(-2);
    var d = ("0" + date.getDate()).slice(-2);
    return y + "-" + m + "-" + d;//+ " " + h + ":" + min + ":" + sec;
  }
  ngOnDestroy() {
    this.onDestroy$.next();
  }
}

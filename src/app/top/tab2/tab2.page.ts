import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { ModalController, LoadingController } from '@ionic/angular';
import { Location } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';
import { AngularFireDatabase } from '@angular/fire/database';
import { UserService } from '../../service/user.service';
import { ApiService } from '../../service/api.service';
import { UiService } from '../../service/ui.service';
import { CalendarModal, CalendarModalOptions, DayConfig } from 'ion2-calendar';
import { CancelComponent } from './cancel/cancel.component';
import { STAYTYP, HOME, HOLIDAYS } from '../../config';
import { User } from '../../class';
@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss']
})
export class Tab2Page implements OnInit, OnDestroy {
  from: Date = new Date();
  to: Date = new Date();
  home = 1;
  homes = [];//calendarテーブルのレコードセット
  days: DayConfig[] = [];
  state = { close: "休止中", full: "満員御礼" };
  stayTyps: Array<StayTyp>;
  books = [];
  user: User;
  loading1; loading2;
  editable = false;
  private onDestroy$ = new Subject();
  constructor(public modal: ModalController, private db: AngularFireDatabase, private userService: UserService, private api: ApiService, private ui: UiService,
    private router: Router, private location: Location, private loader: LoadingController,) { }
  async ngOnInit() {
    this.loading1 = await this.loader.create({ message: '計算中です...', duration: 30000 });//this.ui.loading();    
    await this.loading1.present();
    let paths = this.location.path().split('/');
    Object.keys(HOME).forEach(key => {
      if (HOME[key].path === paths[1]) {
        this.home = Number(key);
      }
    })
    const stayTyps = HOME[this.home].stayTyps;
    this.api.get('query', { select: ['*'], table: 'stay', where: { home: this.home } }).then(async stay => {
      this.stayTyps = stayTyps.map(typ => {
        return { na: STAYTYP[typ].na, stays: stay.stays.filter(stay => { return stay.typ === typ; }) };
      });
      const now = new Date();
      const upper = new Date();
      upper.setMonth(upper.getMonth() + 1);
      const where = { dated: { lower: this.dateFormat(now), upper: upper }, home: this.home };
      const home = await this.api.get('query', { select: ['*'], table: 'calendar', where: where });
      this.homes = home.calendars;
      for (let calendar of home.calendars) {
        if (calendar.close) this.days.push({ date: new Date(calendar.dated), disable: true, subTitle: "お休み" });
      }
      for (let d = new Date(now); d < upper; d.setDate(d.getDate() + 1)) {
        let w = d.getDay();
        if (w === 0) {
          this.days.push({ date: new Date(d), cssClass: "sunday" });
        } else if (w === 6) {
          this.days.push({ date: new Date(d), cssClass: "satday" });
        }
      }
      for (let holiday of HOLIDAYS) {
        let d = new Date(holiday);
        if (now.getTime() <= d.getTime() && d.getTime() <= upper.getTime()) {
          this.days.push({ date: new Date(d), cssClass: "sunday" });
        }
      }
      this.loading1.dismiss(); //this.ui.loadend();
      this.load();
      this.openCalendar();//setTimeout(()=>{this.openCalendar();},2000);
    }).catch(err => {
      this.ui.alert(`施設情報の読み込みに失敗しました。\r\n${err.message}`);
    }).finally(() => {
      this.loading1.dismiss();//this.ui.loadend();
    });
    this.userService.$.pipe(takeUntil(this.onDestroy$)).subscribe(user => {
      this.user = user;
      if (user.id) {
        this.loadBook();
        this.editable = (HOME[this.home].users.filter(uid => { return uid === user.id; }).length) ? true : false;//||user.admin
      } else {
        this.books = []; this.editable = false;
      }
    });
    this.router.events.pipe(filter(event => event instanceof NavigationEnd)
    ).pipe(takeUntil(this.onDestroy$)).subscribe((event: NavigationEnd) => {
      if (this.user.id && event.url === `/${HOME[this.home].path}/reserve`) {
        this.loadBook();
      }
    });
  }
  async load() {
    try {
      const homes = this.homes.filter(home => {
        const d = new Date(home.dated).getTime();
        return this.from.getTime() <= d && d <= this.to.getTime();
      });
      if (homes.filter(home => { return home.close === 1; }).length) {
        this.stayTyps.map(typ => {
          typ.stays.map(stay => { stay.state = "close"; return stay; });
        });
      } else {
        //this.ui.loading("計算中です...");
        this.loading2 = await this.loader.create({ message: '計算中です...', duration: 30000 });
        await this.loading2.present();
        const where = { dated: { lower: this.dateFormat(this.from), upper: this.dateFormat(this.to) }, home: this.home };
        const stayCalendar = await this.api.get('query', { select: ['*'], table: 'stay_calendar', where: where });
        const book = await this.api.get('query', { select: ['*'], table: 'book', where: where });
        let dated: any = {};
        let count: number;
        this.stayTyps.map(typ => {
          typ.stays.map(stay => {
            stay.calendars = stayCalendar.stay_calendars.filter(calendar => { return calendar.stay === stay.id; });
            stay.books = book.books.filter(book => { return book.stay === stay.id; });
            stay.state = "";
            dated = {};
            for (let home of homes) {
              if (home.rate) {
                dated[home.dated] = stay.price * home.rate;
              }
            }
            for (let calendar of stay.calendars) {
              if (calendar.close) {
                stay.state = "close";// stay.total = null;
                break;
              }
              if (calendar.price) {
                dated[calendar.dated] = calendar.price;//stay.total += calendar.price; count++;
              } else if (calendar.rate) {
                dated[calendar.dated] = stay.price * calendar.rate;//stay.total += stay.price * calendar.rate; count++
              }
            }
            if (!stay.state) {
              count = 0; stay.total = 0;
              Object.keys(dated).forEach(date => {
                stay.total += dated[date];
                count++;
              });
              stay.total += ((this.to.getTime() - this.from.getTime()) / 86400000 - count + 1) * stay.price;
              dated = {};
              for (let book of stay.books) {
                if (!dated[book.dated]) { dated[book.dated] = 0; }
                dated[book.dated] += book.num;
              }
              Object.keys(dated).forEach(date => {
                if (dated[date] >= stay.num) {
                  stay.state = "full";
                }
              });
            }
            return stay;
          });
        });
        this.loading2.dismiss();//this.ui.loadend();
      }
    } catch (err) {
      this.ui.alert(`施設カレンダーの読み込みに失敗しました。\r\n${err.message}`);
    }
  }
  loadBook() {
    this.api.get('query', { select: ['*'], table: 'booking', where: { user: this.user.id }, order: { from: "DESC" } }).then(res => {
      this.books = res.books.map(book => {
        book.HOME = HOME[book.home].na;
        book.amount = Number(book.amount);
        return book;
      });
    });
  }
  async openCalendar(stay?: Stay) {
    let d = new Date();
    const options: CalendarModalOptions = {
      pickMode: 'range',
      title: stay ? `「${stay.na}」の予約` : `予約日を選択`,
      from: new Date(), to: d.setMonth(d.getMonth() + 1),
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
        this.from = new Date(event.data.from.string);
        this.to = new Date(event.data.to.string);
        this.load();
      }
    });
  }
  bill(stay) {
    if (stay.state) {
      this.ui.pop(`${this.state[stay.state]}のため予約できません。`);
    } else {
      this.router.navigate(['book', stay.id, this.dateFormat(this.from), this.dateFormat(this.to)]);
    }
  }
  async cancel(book) {
    let cancel = await this.modal.create({
      component: CancelComponent,
      componentProps: { user: this.user, book: book, cancels: HOME[this.home].cancels }
    });
    cancel.present();
    cancel.onDidDismiss().then(event => {
      if (event.data) {
        this.loadBook();
      }
    });

  }
  clickBook(book){
    this.router.navigate(['meet',book.home + book.from.replace(/\-/g, "")]);
  }
  dateFormat(date = new Date()) {//MySQL用日付文字列作成'yyyy-M-d H:m:s'    
    var y = date.getFullYear();
    var m = date.getMonth() + 1;
    var d = date.getDate();
    //var h = date.getHours();
    //var min = date.getMinutes();
    //var sec = date.getSeconds();
    return y + "-" + m + "-" + d;//+ " " + h + ":" + min + ":" + sec;
  }
  ngOnDestroy() {
    this.onDestroy$.next();
  }
}
interface Stay {
  id: number;
  na: string;
  txt: string;
  img: string;
  num: number;
  price: number;
  total?: number;
  books: Array<any>;
  calendars: Array<any>;
  users?: Array<any>;
  state?: string;
}
interface StayTyp {
  na: string;
  icon?: string;
  stays: Array<Stay>;
}

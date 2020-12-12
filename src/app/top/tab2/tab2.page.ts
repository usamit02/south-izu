import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ModalController } from '@ionic/angular';
import { AngularFireDatabase } from '@angular/fire/database';
import { ApiService } from '../../service/api.service';
import { UiService } from '../../service/ui.service';
import { CalendarModal, CalendarModalOptions, DayConfig } from 'ion2-calendar';

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss']
})
export class Tab2Page implements OnInit, OnDestroy {
  dateRange: { from: string; to: string; };
  type: 'string'; // 'string' | 'js-date' | 'moment' | 'time' | 'object'
  from: Date = new Date();
  to: Date = new Date();
  state = { close: "休止中", full: "満員御礼" };
  stayTyps: Array<StayTyp>;//=[{na:"キャンプ",stays:[]},{na:"車中泊",stays:[]},{na:"民泊",stays:[]},{na:"バンガロー",stays:[]}];
  private onDestroy$ = new Subject();
  constructor(public modalCtrl: ModalController, private db: AngularFireDatabase, private api: ApiService, private ui: UiService,) { }
  ngOnInit() {
    this.api.get('query', { select: ['*'], table: 'stay_typ' }).then(res => {
      this.stayTyps = res.stay_typs.map(typ => {
        return { na: typ.na, stays: [] };
      });
    });
    this.load();
    this.openCalendar();
  }
  load() {
    this.api.get('query', { select: ['*'], table: 'stay' }).then(async res => {
      const where = { dated: { lower: this.dateFormat(this.from), upper: this.dateFormat(this.to) } };
      let calendar = await this.api.get('query', { select: ['*'], table: 'calendar', where: where });
      if (calendar.calendars.filter(calendar => { return calendar.close == 1; }).length) {
        res.stays.map(stay => { stay.state = "close"; return stay; });
      } else {
        const stayCalendar = await this.api.get('query', { select: ['*'], table: 'stay_calendar', where: where });
        const book = await this.api.get('query', { select: ['*'], table: 'book', where: where });
        res.stays.map(stay => {
          stay.calendars = stayCalendar.stay_calendars.filter(calendar => { return calendar.id === stay.id; });
          stay.books = book.books.filter(book => { return book.stay_id === stay.id; });
          let users = [];
          for (let book of stay.books) {
            if (book.na) {
              users.push({ id: book.user, na: book.na, avatar: book.avatar });
            }
          }
          stay.users = [...new Set(users)];
          stay.total = 0;
          let count = 0;
          for (let calendar of stay.calendars) {
            if (calendar.close) {
              stay.state = "close";// stay.total = null;
              break;
            }
            if (calendar.price) {
              stay.total += calendar.price;count++;
            } else if (calendar.rate) {
              stay.total += stay.price * calendar.rate;count++
            }
          }
          //if (stay.total != null) {
            stay.total += ((this.to.getTime() - this.from.getTime()) / 86400000 - count + 1) * stay.price;
          //}
          if (!stay.state) {
            let dateds = [];
            for (let book of stay.books) {
              if (!dateds[book.dated]) { dateds[book.dated] = []; }
              dateds[book.dated].push(book);
            }
            for (let dated of dateds) {
              if (dated.length >= stay.num) {
                stay.state = "full";
              }
            }
          }
          return stay;
        });
      }
      this.stayTyps.map(stayTyp => {
        stayTyp.stays = [];
        return stayTyp;
      });
      res.stays.map(stay => {
        this.stayTyps[stay.typ - 1].stays.push(stay);
      });
      let a = 1;
    }).catch(err => {
      this.ui.alert(`施設カレンダーの読み込みに失敗しました。\r\n${err.message}`);
    })
  }
  async openCalendar(stay?: Stay) {
    let d = new Date();
    let days: DayConfig[] = [];

    const options: CalendarModalOptions = {
      pickMode: 'range',
      title: stay ? `「${stay.na}」の予約` : `予約日を選択`,
      from: new Date(), to: d.setFullYear(d.getFullYear() + 1),
      weekdays: ['日', '月', '火', '水', '木', '金', '土'],
      closeIcon: true, doneIcon: true, cssClass: 'calendar',
      monthFormat: 'YYYY年M月', defaultScrollTo: new Date(), weekStart: 1, daysConfig: days,
    };
    let myCalendar = await this.modalCtrl.create({
      component: CalendarModal,
      componentProps: { options }
    });
    myCalendar.present();
    myCalendar.onDidDismiss().then(event => {
      if (event.data) {
        this.from = new Date(event.data.from.dateObj);
        this.to = new Date(event.data.to.dateObj);
        this.load();
      }
    });
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
  na: string;
  txt: string;
  img: string;
  num: number;
  price: number;
  total?: number;
  books: Array<Object>;
  calendars: Array<Object>;

}
interface StayTyp {
  na: string;
  icon?: string;
  stays: Array<Stay>;
}

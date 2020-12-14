import { Component, OnInit, OnDestroy } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AngularFireDatabase } from '@angular/fire/database';
import { ApiService } from '../../../service/api.service';
import { UiService } from '../../../service/ui.service';
import { CalendarModal, CalendarModalOptions, DayConfig } from 'ion2-calendar';
import { UserService } from '../../../service/user.service';
import { User, USER } from '../../../class';
@Component({
  selector: 'app-book',
  templateUrl: './book.page.html',
  styleUrls: ['./book.page.scss'],
})
export class BookPage implements OnInit, OnDestroy {
  user: User = USER;
  book: Book = { stay: null, home: null, user: null, na: "", avatar: null, amount: 0, from: null, to: null };
  day: any = {};
  days: Array<DayConfig> = [];
  title = "";
  private onDestroy$ = new Subject();
  constructor(private route: ActivatedRoute, private location: Location, private modal: ModalController, private ui: UiService,
    private userService: UserService, private api: ApiService,private db:AngularFireDatabase,) { }
  ngOnInit() {
    this.route.params.pipe(takeUntil(this.onDestroy$)).subscribe(params => {
      this.ui.loading("予約確認中...", 60000)
      this.api.get('query', { select: ['*'], table: 'stay', where: { id: params.id } }).then(async res => {
        if (res.stays.length === 1) {
          const stay = res.stays[0];
          this.title = stay.na;
          const now = new Date();
          const upper = new Date();
          upper.setMonth(upper.getMonth() + 1);
          const where = { dated: { lower: this.dateFormat(now), upper: this.dateFormat(upper) } };
          for (let d = now; d <= upper; d.setDate(d.getDate() + 1)) {
            this.day[this.dateFormat(d)] = { price: stay.price, num: stay.num, book: 0, state: "" }
          }
          const home = await this.api.get('query', { select: ['*'], table: 'calendar', where: { ...where, home: stay.home } });
          for (let calendar of home.calendars) {
            if (calendar.close) {
              this.day[calendar.dated].state = 'close';
            } else if (calendar.rate) {
              this.day[calendar.dated].price = Math.floor(stay.price * calendar.rate);
            }
          }
          const calendar = await this.api.get('query', { select: ['*'], table: 'stay_calendar', where: { ...where, id: stay.id } });
          for (let cal of calendar.stay_calendars) {
            if (cal.close) {
              this.day[cal.dated].state = 'close';
            }
            if (cal.num) {
              this.day[cal.dated].num = cal.num;
            }
            if (cal.price) {
              this.day[cal.dated].price = cal.price;
            } else if (cal.rate) {
              this.day[cal.dated].price = Math.floor(stay.price * cal.rate);
            }
          }
          const book = await this.api.get('query', { select: ['*'], table: 'book', where: { ...where, stay: stay.id } });
          for (let b of book.books) {
            this.day[b.dated].book++;// = this.day[b.dated].book ? this.day[b.dated].book + 1 : 1;            
            if (this.day[b.dated].book >= this.day[b.dated].num) { this.day[b.dated].state = 'full'; }
          }
          //const amount=await this.calculate(stay.from,stay.to,params.id,stay.home,stay.price,stay.num);
          this.userService.$.pipe(takeUntil(this.onDestroy$)).subscribe(user => {
            this.user = user;
            const from = new Date(new Date(params.from).setHours(0)); const to = new Date(new Date(params.to).setHours(0));
            let amount = 0;
            for (let d = new Date(from); d <= to; d.setDate(d.getDate() + 1)) {
              amount += this.day[this.dateFormat(d)].price;
            }
            this.book = { stay: params.id, home: stay.home, user: user.id, na: user.na, avatar: user.avatar, amount: amount, from: from, to: to };
          });
        } else {
          this.ui.alert('宿泊データがありません。');
        }
      }).catch(err => {
        this.ui.alert(`宿泊データの読み込みに失敗しました。\r\n${err.message}`);
      }).finally(() => {
        this.ui.loadend();Math.ceil
      })
    });
  }
  
  async changeFromto() {
    let d = new Date();
    const title = { close: "休止", full: "満員" };
    if (!this.days.length) {
      Object.keys(this.day).forEach(d => {
        const subTitle = this.day[d].state ? title[this.day[d].state] : this.day[d].price;
        this.days.push({ date: new Date(d), subTitle: subTitle, disable: this.day[d].state ? true : false })
      })
    }
    const options: CalendarModalOptions = {
      pickMode: 'range',
      title: `予約日を選択`,
      from: new Date(), to: d.setFullYear(d.getFullYear() + 1),
      weekdays: ['日', '月', '火', '水', '木', '金', '土'],
      closeIcon: true, doneIcon: true, cssClass: 'calendar',
      monthFormat: 'YYYY年M月', defaultScrollTo: new Date(), weekStart: 1, daysConfig: this.days,
    };
    let myCalendar = await this.modal.create({
      component: CalendarModal,
      componentProps: { options }
    });
    myCalendar.present();
    myCalendar.onDidDismiss().then(event => {
      if (event.data) {
        const from = new Date(event.data.from.string);
        const to = new Date(event.data.to.string);
        let amount = 0; let date: string;
        for (let d = new Date(from); d <= to; d.setDate(d.getDate() + 1)) {
          date = this.dateFormat(d);
          if (this.day[date].state) { amount = null; break; }
          amount += this.day[date].price;
        }
        if (amount == null) {
          this.ui.pop(`${date}は「${title[this.day[date].state]}」のため選択できません。`);
        } else {
          this.book.from = from; this.book.to = to; this.book.amount = amount;
        }
      }
    });
  }
  pay(token) {
    const dateFormat=(date:Date)=>{
      return `${date.getMonth()+1}/${date.getDate()}`;
    }
    this.api.post('bill', { uid: this.user.id, na: this.user.na, avatar:this.user.avatar,home:this.book.home,stay: this.book.stay, token: token, amount: this.book.amount,
      from:this.dateFormat(this.book.from),to:this.dateFormat(this.book.to) }, '決済中').then(res => {
      let txt=this.book.from.getTime()===this.book.to.getTime()?dateFormat(this.book.from):`${dateFormat(this.book.from)}～${dateFormat(this.book.from)}`;
      txt = `${txt}\r\n${this.title}`;
      const book={ uid: this.user.id, na: this.user.na, avatar:this.user.avatar,url:this.location.path(),upd:res.booked,txt:txt};
      this.db.database.ref(`book/${this.book.home}`).push(book);
      this.ui.alert(`予約しました。`);
      this.location.back();
    }).catch(() => {
      this.ui.alert(`決済手続きに失敗しました。`);
    });   
  }
  night(from:Date,to:Date):number{//宿泊数の計算
    return Math.ceil((to.getTime()-from.getTime())/86400000)+1;
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
export interface Book {
  stay: number;
  home: number;
  user: string; na: string; avatar: string;
  amount: number;
  from: Date; to: Date;
  options?: Array<Option>
}
interface Option {
  id: number;
  na: string;
  price: number;
}
interface Day {
  price: number;
  num: number;
  book: number;
  state: string;
}
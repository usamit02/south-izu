import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { ModalController,LoadingController} from '@ionic/angular';
import { Location } from '@angular/common';
import { Subject } from 'rxjs';
import { AngularFireDatabase } from '@angular/fire/database';
import { ApiService } from '../../service/api.service';
import { UiService } from '../../service/ui.service';
import { CalendarModal, CalendarModalOptions, DayConfig } from 'ion2-calendar';
import { STAYTYP,HOME,HOLIDAYS } from '../../config';
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
  loading1;loading2;
  private onDestroy$ = new Subject();
  constructor(public modal: ModalController, private db: AngularFireDatabase, private api: ApiService, private ui: UiService, 
    private router: Router,private location:Location,private loader:LoadingController,) { }
  async ngOnInit() {    
    this.loading1= await this.loader.create({ message: '計算中です...', duration: 30000 });//this.ui.loading();    
    await this.loading1.present();        
    let paths=this.location.path().split('/');
    Object.keys(HOME).forEach(key=>{
      if(HOME[key].path===paths[1]){ 
        this.home=Number(key);
      }
    })
    const stayTyps=HOME[this.home].stayTyps;
    this.api.get('query', { select: ['*'], table: 'stay', where: { home: this.home } }).then(async stay => {
      this.stayTyps = stayTyps.map(typ => {
        return { na: STAYTYP[typ].na, stays: stay.stays.filter(stay => { return stay.typ === typ; }) };
      });
      const now = new Date();
      const upper = new Date();
      upper.setMonth(upper.getMonth() + 1);
      const where = { dated: { lower: this.dateFormat(now), upper:upper }, home: this.home };
      const home = await this.api.get('query', { select: ['*'], table: 'calendar', where: where });
      this.homes = home.calendars;
      for (let calendar of home.calendars) {
        if (calendar.close) this.days.push({ date: new Date(calendar.dated), disable: true,subTitle:"お休み" });
      }
      for (let d = new Date(now); d < upper; d.setDate(d.getDate() + 1)) {
        let w = d.getDay();
        if (w === 0) {
          this.days.push({date:new Date(d),cssClass:"sunday"});
        } else if (w === 6) {
          this.days.push({date:new Date(d),cssClass:"satday"});
        }
      }
      for (let holiday of HOLIDAYS) {
        let d = new Date(holiday);
        if (now.getTime() <= d.getTime() && d.getTime() <= upper.getTime()) {
          this.days.push({date:new Date(d),cssClass:"sunday"});
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
        this.loading2= await this.loader.create({ message: '計算中です...', duration: 30000 });
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
            stay.state="";
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

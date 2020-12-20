import { Component, OnDestroy, OnInit, ViewChild, ElementRef } from '@angular/core';
import { ModalController, } from '@ionic/angular';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { FormControl, FormBuilder, Validators } from '@angular/forms';
import { User } from '../../class';
import { STAYTYP, HOME, HOLIDAYS } from '../../config';
import { UserService } from '../../service/user.service';
import { ApiService } from '../../service/api.service';
import { UiService } from '../../service/ui.service';
import { UserPage } from 'src/app/top/page/user/user.page';
import { APIURL } from '../../../environments/environment';
import { CalendarComponentOptions, DayConfig } from 'ion2-calendar';
@Component({
  selector: 'app-stay',
  templateUrl: './stay.page.html',
  styleUrls: ['./stay.page.scss'],
})
export class StayPage implements OnInit, OnDestroy {
  @ViewChild('content', { read: ElementRef, static: false }) content: ElementRef;
  @ViewChild('schedule', { read: ElementRef, static: false }) schedule: ElementRef;
  @ViewChild('basic', { read: ElementRef, static: false }) basic: ElementRef;
  @ViewChild('essay', { read: ElementRef, static: false }) essay: ElementRef;
  @ViewChild('canvas', { read: ElementRef, static: false }) canvas: ElementRef;
  user: User;
  params = { id: null, home: null };
  stay = {
    typ: new FormControl(0, [Validators.required]), na: new FormControl("", [Validators.minLength(2), Validators.maxLength(20), Validators.required]),
    txt: new FormControl("", [Validators.minLength(2), Validators.maxLength(600), Validators.required]),
    img: new FormControl(""), simg: new FormControl(""), price: new FormControl(0, [Validators.required]),
    num: new FormControl(0, [Validators.required]), icon: new FormControl(0, [Validators.required]),
    close: new FormControl(0), chat: new FormControl(1)
  }
  stayForm = this.builder.group({
    typ: this.stay.typ, na: this.stay.na, txt: this.stay.txt, img: this.stay.img, simg: this.stay.simg, price: this.stay.price,
    num: this.stay.num, icon: this.stay.icon, close: this.stay.close, chat: this.stay.chat
  });
  stayTyps = [];
  imgBlob;
  noimgUrl = APIURL + 'img/noimg.jpg';
  calendar = {
    close: new FormControl(0),//weeks:new FormControl(['0']),
    price: new FormControl(null, [Validators.min(0), Validators.max(100000), Validators.pattern('^[0-9]+$')]),
    rate: new FormControl(null, [Validators.min(0), Validators.max(10), Validators.pattern('^[0-9.]+$')]),
  }
  calendarForm = this.builder.group({
    close: this.calendar.close, price: this.calendar.price, rate: this.calendar.rate,//weeks:this.calendar.weeks,
  });
  day: any = {}; days: DayConfig[] = [];
  calendarOption: CalendarComponentOptions = {
    pickMode: 'range', weekdays: ['日', '月', '火', '水', '木', '金', '土'], monthFormat: 'YYYY年M月',color:"success",
    monthPickerFormat: ['１月', '２月', '３月', '４月', '５月', '６月', '７月', '８月', '９月', '１０月', '１１月', '１２月'],
  };
  range = { from: new Date(), to: new Date() };
  weeks = ['-1'];//１週間以上range選択時のみ現れる曜日選択セレクトボックスの値　-1は全日　7は祝前日 1-6はgetDay()の値
  month = new Date(new Date().getFullYear(), new Date().getMonth(), 1);//現在のカレンダー表示月の初日
  plan: any = {}; plans = []; monthPlans = [];
  currentY: number; scrollH: number; contentH: number; basicY: number; essayY: number;
  private onDestroy$ = new Subject();
  constructor(private route: ActivatedRoute, private router: Router, private userService: UserService, private api: ApiService,
    private ui: UiService, private builder: FormBuilder, private modal: ModalController,) { }
  ngOnInit() {
    Object.keys(STAYTYP).forEach(key => {
      this.stayTyps.push({ id: Number(key), ...STAYTYP[key] });
    });
    this.route.params.pipe(takeUntil(this.onDestroy$)).subscribe(params => {
      this.params.id = params.id;
      if (params.id) {
        this.userService.$.pipe(takeUntil(this.onDestroy$)).subscribe(async user => {
          this.user = user;
          if (!user.id) {
            //this.router.navigate(['login']);
          } else {
            this.load(true);
          }
        });
      }
    });
  }
  load(stayCalendarLoad?: boolean) {
    this.api.get('query', { select: ['*'], table: 'stay', where: { id: this.params.id } }).then(async res => {
      if (res.stays.length !== 1) {
        throw { message: '無効なparam.idです。' };
      };
      const controls = this.stayForm.controls
      for (let key of Object.keys(controls)) {
        if (res.stays[0][key] == null) {
          controls[key].reset();
        } else {
          controls[key].reset(res.stays[0][key].toString());
        }
      }
      this.params.home = res.stays[0].home;
      const calendar = await this.api.get('query', { select: ['*'], table: 'calendar', where: { home: res.stays[0].home } });
      this.day = {}; let w; let d; let date;
      let from = new Date(); let to = new Date(new Date().setMonth(new Date().getMonth() + 12));
      for (let d = from; d <= to; d.setDate(d.getDate() + 1)) {
        w = d.getDay();
        date = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
        if (w === 0) {
          this.day[date] = { cssClass: "sunday", disable: false };
        } else if (w === 6) {
          this.day[date] = { cssClass: "satday", disable: false };
        }
      }
      for (let holiday of HOLIDAYS) {
        d = new Date(holiday);
        this.day[`${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`] = { cssClass: "sunday", disable: false };//this.days.push({ date: new Date(day), cssClass: "sunday" });
      }
      for (let stay of calendar.calendars) {
        d = new Date(stay.dated);
        date = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
        if (stay.close) {
          this.day[date] = { subTitle: "お休み", disable: true, ...this.day[date] };
        } else if (stay.rate) {
          this.day[date] = { subTitle: `×${stay.rate}`, disable: false, ...this.day[date] };
        }
      }
      this.plan = {};
      if (stayCalendarLoad) {
        const stay_calendar = await this.api.get('query', { select: ['*'], table: 'stay_calendar', where: { stay: this.params.id } });
        for (let stay of stay_calendar.stay_calendars) {
          this.setStayCalendar(new Date(stay.dated), stay);
        }
      }
      this.setDays();
    }).catch(err => {
      this.ui.alert(`施設情報の読み込みに失敗しました。\r\n${err.message}`);
    })
  }
  setStayCalendar(d: Date, stay: any) {
    const date = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
    if (stay.close) {
      this.day[date] = { ...this.day[date], subTitle: "閉鎖", marked: true };
      this.plan[date] = 'close';
    } else if (!(this.day[date] && this.day[date].disable)) {
      if (stay.price) {
        this.day[date] = { ...this.day[date], subTitle: stay.price.toString(), marked: true };
        this.plan[date] = stay.price;
      } else if (stay.rate) {
        this.day[date] = { ...this.day[date], subTitle: `×${stay.rate}`, marked: true };
        this.plan[date] = `×${stay.rate}`;
      }
    }
  }
  setDays() {
    this.days = [];
    Object.keys(this.day).forEach(date => {
      this.days.push({ date: new Date(date), ...this.day[date] });
    });
    let plans = [];
    Object.keys(this.plan).forEach(date => {
      let d = new Date(date);
      plans.push({ date: new Date(d), day: date, time: d.getTime(), value: this.plan[date] });
    });
    plans.sort((a, b) => a.time - b.time);
    let sumPlans = []; let sums = [];
    for (let i = 0; i < plans.length; i++) {
      sums.push(plans[i]);
      if (i === plans.length - 1 || !(plans[i + 1].time - plans[i].time === 86400000 && plans[i + 1].value === plans[i].value)) {
        sumPlans.push(sums);
        sums = [];
      }
    }
    this.plans = [];
    for (let plans of sumPlans) {
      this.plans.push({ from: plans[0].date, to: plans[plans.length - 1].date, fromTime: plans[0].time, toTime: plans[plans.length - 1].time, value: plans[0].value, range: plans.length === 1 ? false : true });
    }
    this.onMonthChange({ newMonth: { dateObj: this.month, time: this.month.getTime() } });
    this.calendarOption = { ...this.calendarOption, daysConfig: this.days };
  }
  onMonthChange(e) {
    this.month = new Date(e.newMonth.dateObj);
    const nextMonthTime: Date = e.newMonth.dateObj.setMonth(e.newMonth.dateObj.getMonth() + 1);
    this.monthPlans = this.plans.filter(plan => {
      const a = e.newMonth.time <= plan.fromTime && plan.fromTime < nextMonthTime;
      const b = e.newMonth.time <= plan.toTime && plan.toTime < nextMonthTime;
      const c = plan.fromTime <= e.newMonth.time && e.newMonth.time < plan.toTime;
      const d = plan.fromTime < nextMonthTime && nextMonthTime < plan.toTime;
      return a || b || c || d;
    });
  }
  scheduleAdd() {
    for (let d = new Date(this.range.from); d <= this.range.to; d.setDate(d.getDate() + 1)) {
      const nextDay = new Date(d);
      nextDay.setDate(nextDay.getDate() + 1);      
      const isHoliday = HOLIDAYS.indexOf(`${nextDay.getFullYear()}-${nextDay.getMonth() + 1}-${nextDay.getDate()}`) !== -1;
      if (this.isWeek && (this.weeks[0] === "-1" || this.weeks.indexOf(d.getDay().toString()) !== -1 || this.weeks.indexOf("7") !== -1 && isHoliday)) {
        this.setStayCalendar(d, this.calendarForm.value);
      }
    }
    this.setDays();
  }
  isWeek(): boolean {
    return (this.range.to.getTime() - this.range.from.getTime()) / 86400000 > 7;
  }
  imgChange(e) {
    if (e.target.files[0].type.match(/image.*/)) {
      this.imgBlob = window.URL.createObjectURL(e.target.files[0]);
    } else {
      this.ui.pop("画像ファイルjpgまたはpngを選択してください。");
    }
  }
  save() {
    if (!this.params.id || !this.params.home) return;
    let inserts = []; let idx = 1;
    for (let d = new Date(this.range.from); d <= this.range.to; d.setDate(d.getDate() + 1)) {
      inserts.push({ dated: this.dateFormat(d), stay: Number(this.params.id), home: Number(this.params.home), idx: idx, ...this.calendarForm.value });
      idx++;
    }
    this.api.post('querys', { table: "stay_calendar", inserts: inserts }, '保存中...').then(res => {
      let value: string = "";
      if (this.calendar.close.value) {
        value = "close";
      } else if (this.calendar.price.value) {
        value = this.calendar.price.value;
      } else if (this.calendar.rate) {
        value = `×${this.calendar.rate}`;
      }
      let plan = { from: this.range.from, to: this.range.to, fromTime: this.range.from.getTime(), toTime: this.range.to.getTime(), value: value, range: inserts.length > 1 ? true : false }
      this.plans.push(plan);
      this.monthPlans.push(plan);
    })
  }
  async onScrollEnd() {
    const content = await this.content.nativeElement.getScrollElement();
    this.currentY = content.scrollTop;
    this.contentH = content.offsetHeight;
    this.scrollH = content.scrollHeight;
    this.basicY = this.basic.nativeElement.offsetTop;
    this.essayY = this.essay.nativeElement.offsetTop;
  }
  scroll(target) {
    this.content.nativeElement.scrollToPoint(0, target, 500);
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

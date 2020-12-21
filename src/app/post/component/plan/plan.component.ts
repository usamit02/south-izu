import { Component, OnChanges, OnInit, Input, Output, EventEmitter, SimpleChanges } from '@angular/core';
import { FormControl, FormBuilder, Validators } from '@angular/forms';
import { HOLIDAYS } from '../../../config';
import { ApiService } from '../../../service/api.service';
import { UiService } from '../../../service/ui.service';
import { CalendarComponentOptions, DayConfig } from 'ion2-calendar';
@Component({
  selector: 'app-plan',
  templateUrl: './plan.component.html',
  styleUrls: ['./plan.component.scss'],
})
export class PlanComponent implements OnInit, OnChanges {
  @Input() stay: number;
  @Input() home: number;
  @Input() isStayCalendarLoad: boolean;
  @Input() undo: boolean;
  @Input() save: boolean;
  @Output() saved = new EventEmitter();
  @Output() dirty = new EventEmitter();
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
    pickMode: 'range', weekdays: ['日', '月', '火', '水', '木', '金', '土'], monthFormat: 'YYYY年M月', color: "secondary",
    monthPickerFormat: ['１月', '２月', '３月', '４月', '５月', '６月', '７月', '８月', '９月', '１０月', '１１月', '１２月'],
  };
  range = { from: new Date(), to: new Date() };
  weeks = ['-1'];//１週間以上range選択時のみ現れる曜日選択セレクトボックスの値　-1は全日　7は祝前日 1-6はgetDay()の値
  month = new Date(new Date().getFullYear(), new Date().getMonth(), 1);//現在のカレンダー表示月の初日
  plan: any = {}; plans: Plan[] = []; monthPlans: Plan[] = [];
  data: any = {};
  constructor(private api: ApiService, private ui: UiService, private builder: FormBuilder,) { }
  ngOnInit() {

  }
  ngOnChanges(changes: SimpleChanges) {
    if (this.stay && this.home) {
      if (changes.save) {
        let inserts = []; let idx = 1;
        Object.keys(this.data).forEach(date=>{
          let d=new Date(date);
          inserts.push({ dated: `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`, stay: this.stay, home: this.home, idx: idx, ...this.data[date] });
          idx++;
        });
        this.api.post('querys', { table: "stay_calendar", delete:{stay:this.stay},inserts: inserts }, '予定保存中...').then(res => {          
          this.saved.emit(true);
        }).catch(() => {
          this.saved.emit(false);
        });
      } else {
        this.load(this.isStayCalendarLoad);
      }
    }
  }
  load(isStayCalendarLoad?: boolean) {
    this.ui.loading(`予定読込中...`);
    this.api.get('query', { select: ['*'], table: 'calendar', where: { home: this.home } }).then(async calendar => {
      this.day = {}; let d; let date: string;
      let from = new Date(); let to = new Date(new Date().setMonth(new Date().getMonth() + 12));
      for (let d = from; d <= to; d.setDate(d.getDate() + 1)) {
        let w = d.getDay();
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
      this.plan = {};this.data={};
      if (isStayCalendarLoad) {
        const stay_calendar = await this.api.get('query', { select: ['*'], table: 'stay_calendar', where: { stay: this.stay } });
        for (let stay of stay_calendar.stay_calendars) {
          this.setStayCalendar(new Date(stay.dated), stay);
        }
      }
      this.setDays();
      this.dirty.emit(false);
    }).catch(err => {
      this.ui.alert(`施設情報の読み込みに失敗しました。\r\n${err.message}`);
    }).finally(()=>{
      this.ui.loadend();
    });
  }
  setStayCalendar(d: Date, stay: any) {
    const date = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
    if (stay.close) {
      this.day[date] = { ...this.day[date], subTitle: "閉鎖", marked: true };
      this.plan[date] = '閉鎖';this.data[date]={close:true};
    } else if (!(this.day[date] && this.day[date].disable)) {
      if (stay.price) {
        this.day[date] = { ...this.day[date], subTitle: stay.price.toString(), marked: true };
        this.plan[date] = stay.price;this.data[date]={price:stay.price};
      } else if (stay.rate) {
        this.day[date] = { ...this.day[date], subTitle: `×${stay.rate}`, marked: true };
        this.plan[date] = `×${stay.rate}`;this.data[date]={rate:stay.rate};
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
    e.newMonth.dateObj.setMonth(e.newMonth.dateObj.getMonth() + 1);
    const nextMonthTime = e.newMonth.dateObj.getTime();
    this.monthPlans = this.plans.filter(plan => {
      const a = e.newMonth.time <= plan.fromTime && plan.fromTime < nextMonthTime;
      const b = e.newMonth.time <= plan.toTime && plan.toTime < nextMonthTime;
      const c = plan.fromTime <= e.newMonth.time && e.newMonth.time < plan.toTime;
      const d = plan.fromTime < nextMonthTime && nextMonthTime < plan.toTime;
      return a || b || c || d;
    });
  }
  addPlan() {
    for (let d = new Date(this.range.from); d <= this.range.to; d.setDate(d.getDate() + 1)) {
      const nextDay = new Date(d);
      nextDay.setDate(nextDay.getDate() + 1);
      const isHoliday = HOLIDAYS.indexOf(`${nextDay.getFullYear()}-${nextDay.getMonth() + 1}-${nextDay.getDate()}`) !== -1;
      if (this.isWeek && (this.weeks[0] === "-1" || this.weeks.indexOf(d.getDay().toString()) !== -1 || this.weeks.indexOf("7") !== -1 && isHoliday)) {
        this.setStayCalendar(d, this.calendarForm.value);
      }
    }
    this.setDays();
    this.dirty.emit(true);
  }
  delPlan(plan) {
    for (let d = new Date(plan.from); d <= plan.to; d.setDate(d.getDate() + 1)) {
      const date = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
      delete this.day[date];
      delete this.plan[date];
      delete this.data[date];
    }
    this.setDays();
    this.dirty.emit(true);
  }
  isWeek(): boolean {
    return (this.range.to.getTime() - this.range.from.getTime()) / 86400000 > 7;
  }
}
interface Plan {
  from: Date;
  to: Date;
  fromTime?: number;
  toTime?: number;
  value: string;
  range: boolean;
}

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
  params = { id: null };
  stay = {
    id: new FormControl(0, [Validators.required]), typ: new FormControl(0, [Validators.required]),
    na: new FormControl("", [Validators.minLength(2), Validators.maxLength(20), Validators.required]),
    txt: new FormControl("", [Validators.minLength(2), Validators.maxLength(600), Validators.required]),
    img: new FormControl(""), simg: new FormControl(""), price: new FormControl(0, [Validators.required]),
    num: new FormControl(0, [Validators.required]), icon: new FormControl(0, [Validators.required]),
    close: new FormControl(0), chat: new FormControl(1)
  }
  stayForm = this.builder.group({
    id: this.stay.id, typ: this.stay.typ, na: this.stay.na, txt: this.stay.txt, img: this.stay.img, simg: this.stay.simg, price: this.stay.price,
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
  days: DayConfig[] = [];
  calendarOption: CalendarComponentOptions;
  range = { from: new Date(), to: new Date() };
  weeks = ['0'];
  plans=[];
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
            this.load();
          }
        });
      }
    });
  }
  load() {
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
      const calendar = await this.api.get('query', { select: ['*'], table: 'calendar', where: { home: res.stays[0].home } });
      const stay_calendar = await this.api.get('query', { select: ['*'], table: 'stay_calendar', where: { id: this.params.id } });
      this.days = [];this.plans=[];
      let day: any = {}; let w; let d; let date;let plan:any={};let plans=[];
      let from = new Date(); let to = new Date(new Date().setMonth(new Date().getMonth() + 12));
      for (let d = from; d <= to; d.setDate(d.getDate() + 1)) {
        w = d.getDay();
        date = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
        if (w === 0) {
          day[date] = { cssClass: "sunday", disable: false };
        } else if (w === 6) {
          day[date] = { cssClass: "satday", disable: false };
        }
      }
      for (let holiday of HOLIDAYS) {
        d = new Date(holiday);
        day[`${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`] = { cssClass: "sunday", disable: false };//this.days.push({ date: new Date(day), cssClass: "sunday" });
      }
      for (let stay of calendar.calendars) {
        d = new Date(stay.dated);
        date = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
        if (stay.close) {
          day[date] = { subTitle: "お休み", disable: true, ...day[date] };
        } else if (stay.rate) {
          day[date] = { subTitle: `×${stay.rate}`, disable:true,...day[date] };
        }
      }
      for (let stay of stay_calendar.stay_calendars) {
        d = new Date(stay.dated);
        date = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
        if (stay.close) {
          day[date] = { subTitle: "閉鎖", marked: true,...day[date] };
          plan[date]='close';
        } else if (!(day[date]&&day[date].disable)) {
          if (stay.price) {
            day[date] = { subTitle: stay.price.toString(),marked:true, ...day[date] };
            plan[date] = stay.price;
          } else if (stay.rate) {
            day[date] = { subTitle: `×${stay.rate}`,marked:true, ...day[date] };
            plan[date]=`×${stay.rate}`;
          }
        }
      }
      Object.keys(day).forEach(date => {
        this.days.push({ date: new Date(date), ...day[date] });
      });
      Object.keys(plan).forEach(date => {
        let d=new Date(date);
        plans.push({ date: new Date(d),day:date, time:d.getTime(),plan:plan[date] });
      });
      plans.sort((a,b)=>a.time-b.time);
      let sumPlans=[];let sums=[];
      for(let i=0;i<plans.length ;i++){
        sums.push(plans[i]);
        if(i===plans.length -1||!(plans[i+1].time-plans[i].time===86400000&&plans[i+1].plan===plans[i].plan)){
          sumPlans.push(sums);
          sums=[];                 
        }        
      }
      for(let plans of sumPlans){       
        this.plans.push({from:plans[0].date,to:plans[plans.length-1].date,time:plans[0].time,plan:plans[0].plan,range:plans.length===1?false:true});
      }
      this.calendarOption = {
        pickMode: 'range', weekdays: ['日', '月', '火', '水', '木', '金', '土'],
        monthPickerFormat: ['１月', '２月', '３月', '４月', '５月', '６月', '７月', '８月', '９月', '１０月', '１１月', '１２月'],
        monthFormat: 'YYYY年M月', weekStart: 1, daysConfig: this.days,
      }
    }).catch(err => {
      this.ui.alert(`施設情報の読み込みに失敗しました。\r\n${err.message}`);
    })
  }
  imgChange(e) {
    if (e.target.files[0].type.match(/image.*/)) {
      this.imgBlob = window.URL.createObjectURL(e.target.files[0]);
    } else {
      this.ui.pop("画像ファイルjpgまたはpngを選択してください。");
    }
  }

  rangeSave() {

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

import { Component, OnDestroy, OnInit,ViewChild,ElementRef } from '@angular/core';
import { ModalController, } from '@ionic/angular';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { FormControl, FormBuilder, Validators } from '@angular/forms';
import { User } from '../../class';
import { STAYTYP, HOME } from '../../config';
import { UserService } from '../../service/user.service';
import { ApiService } from '../../service/api.service';
import { UiService } from '../../service/ui.service';
import { UserPage } from 'src/app/top/page/user/user.page';
import { APIURL } from '../../../environments/environment';
import { CalendarComponentOptions,DayConfig } from 'ion2-calendar';
@Component({
  selector: 'app-stay',
  templateUrl: './stay.page.html',
  styleUrls: ['./stay.page.scss'],
})
export class StayPage implements OnInit, OnDestroy {
  @ViewChild('content', { read: ElementRef, static: false }) content: ElementRef;
  @ViewChild('basic', { read: ElementRef, static: false }) basic: ElementRef;
  @ViewChild('essay', { read: ElementRef, static: false }) essay: ElementRef;
  @ViewChild('canvas', { read: ElementRef, static: false }) canvas: ElementRef;
  user: User;
  params = { id: null };
  from: Date = new Date();
  to: Date = new Date();
  calendar = { id: new FormControl(0, [Validators.required]), price: new FormControl(0), rate: new FormControl(0), close: new FormControl(0) }
  calendarForm = this.builder.group({
    id: this.calendar.id, price: this.calendar.price, rate: this.calendar.rate, close: this.calendar.close,
  });
  stay = {
    id: new FormControl(0, [Validators.required]), typ: new FormControl(0, [Validators.required]),
    na: new FormControl("", [Validators.minLength(2), Validators.maxLength(20), Validators.required]),
    txt: new FormControl("", [Validators.minLength(2), Validators.maxLength(600), Validators.required]),
    img: new FormControl(""), simg: new FormControl(""), price: new FormControl(0, [Validators.required]),
    num: new FormControl(0, [Validators.required]), icon: new FormControl(0, [Validators.required]),
    close: new FormControl(0), chat: new FormControl(1)
  }
  stayForm = this.builder.group({
    id: this.stay.id, typ:this.stay.typ,na: this.stay.na, txt: this.stay.txt, img: this.stay.img, simg: this.stay.simg, price: this.stay.price,
    num: this.stay.num, icon: this.stay.icon, close: this.stay.close, chat: this.stay.chat
  });
  stayTyps = [];
  imgBlob;
  noimgUrl = APIURL + 'img/noimg.jpg';
  days:DayConfig[]=[];
  dateRange:{from:Date,to:Date};
  calendarOption:CalendarComponentOptions={pickMode:'range', weekdays: ['日', '月', '火', '水', '木', '金', '土'],
  monthPickerFormat:['１月','２月','３月','４月','５月','６月','７月','８月','９月','１０月','１１月','１２月'],
  monthFormat: 'YYYY年M月', weekStart: 1, daysConfig: this.days,}
  currentY: number; scrollH: number; contentH: number; basicY: number; essayY: number;
  private onDestroy$ = new Subject();
  constructor(private route: ActivatedRoute, private router: Router, private userService: UserService, private api: ApiService,
    private ui: UiService, private builder: FormBuilder, private modal: ModalController,) { }

  ngOnInit() {
    Object.keys(STAYTYP).forEach(key => {
      this.stayTyps.push({ id: Number(key), ...STAYTYP[key] });
    });
    const d=new Date();
    this.dateRange={from:new Date(),to:new Date(d.setMonth(d.getMonth()+3))};
    this.route.params.pipe(takeUntil(this.onDestroy$)).subscribe(params => {
      this.params.id = params.id;
      if (params.id) {
        this.userService.$.pipe(takeUntil(this.onDestroy$)).subscribe(async user => {
          this.user = user;
          if (!user.id) {
            this.router.navigate(['login']);
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

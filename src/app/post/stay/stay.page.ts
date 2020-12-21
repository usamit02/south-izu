import { Component, OnDestroy, OnInit, ViewChild, ElementRef } from '@angular/core';
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
@Component({
  selector: 'app-stay',
  templateUrl: './stay.page.html',
  styleUrls: ['./stay.page.scss'],
})
export class StayPage implements OnInit, OnDestroy {
  @ViewChild('content', { read: ElementRef, static: false }) content: ElementRef;
  @ViewChild('plan', { read: ElementRef, static: false }) plan: ElementRef;
  @ViewChild('basic', { read: ElementRef, static: false }) basic: ElementRef;
  @ViewChild('essay', { read: ElementRef, static: false }) essay: ElementRef;
  @ViewChild('canvas', { read: ElementRef, static: false }) canvas: ElementRef;
  user: User;
  id:number=null;
  home:number=null;
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
  undoPlan =false;//undoするたび交互にONOFF
  savePlan = false;//saveするたび口語にONOFF
  saving={stay:false,plan:false};
  currentY: number; scrollH: number; contentH: number; planY: number; basicY: number; essayY: number;
  private onDestroy$ = new Subject();
  constructor(private route: ActivatedRoute, private router: Router, private userService: UserService, private api: ApiService,
    private ui: UiService, private builder: FormBuilder,) { }
  ngOnInit() {
    Object.keys(STAYTYP).forEach(key => {
      this.stayTyps.push({ id: Number(key), ...STAYTYP[key] });
    });
    this.route.params.pipe(takeUntil(this.onDestroy$)).subscribe(params => {
      this.id = Number(params.id);
      if (params.id) {
        this.userService.$.pipe(takeUntil(this.onDestroy$)).subscribe(async user => {
          this.user = user;
          if (!user.id) {
            //this.router.navigate(['login']);
          } else {
            this.undo();
          }
        });
      }
    });
  }
  undo() {
    this.api.get('query', { select: ['*'], table: 'stay', where: { id: this.id } }).then(async res => {
      if (res.stays.length !== 1) {
        throw { message: '無効なparam.idです。' };
      };
      this.home= res.stays[0].home;
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
  save() {
    this.saving={stay:true,plan:true};
    this.api.post('query',{insert:{stay:this.stay,home:this.home,...this.stayForm.value}}).then(res=>{

    }).finally(()=>{
      this.saving.stay=false;
    });    
  }
  planSaved(){
    this.saving.plan=false;
  }
  async onScrollEnd() {
    const content = await this.content.nativeElement.getScrollElement();
    this.currentY = content.scrollTop;
    this.contentH = content.offsetHeight;
    this.scrollH = content.scrollHeight;
    this.basicY = this.basic.nativeElement.offsetTop;
    this.planY = this.plan.nativeElement.offsetTop;
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

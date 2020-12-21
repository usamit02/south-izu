import { Component, OnDestroy, OnInit, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { FormControl, FormBuilder, Validators } from '@angular/forms';
import { AngularFireStorage } from '@angular/fire/storage';
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
  id: number = null;
  home: number = null;
  STAY={typ:0,na:"",txt:"",img:"",simg:"",price:0,num:0,close:0,chat:1};
  stay = {
    typ: new FormControl(this.STAY.typ, [Validators.required]),
    na: new FormControl(this.STAY.na, [Validators.minLength(2), Validators.maxLength(20), Validators.required]),
    txt: new FormControl(this.STAY.txt, [Validators.minLength(2), Validators.maxLength(600), Validators.required]),
    img: new FormControl(this.STAY.img), simg: new FormControl(this.STAY.simg),
    price: new FormControl(this.STAY.price, [Validators.min(0), Validators.max(100000), Validators.pattern('^[0-9]+$'), Validators.required]),
    num: new FormControl(this.STAY.num, [Validators.min(0), Validators.max(100), Validators.pattern('^[0-9]+$'), Validators.required]),
    close: new FormControl(this.STAY.close), chat: new FormControl(this.STAY.chat)
  }
  stayForm = this.builder.group({
    typ: this.stay.typ, na: this.stay.na, txt: this.stay.txt, img: this.stay.img, simg: this.stay.simg, price: this.stay.price,
    num: this.stay.num, close: this.stay.close, chat: this.stay.chat
  });
  stayTyps = [];
  imgBlob;
  noimgUrl = APIURL + 'img/noimg.jpg';
  undoPlan = false;//undoするたび交互にONOFF
  savePlan = false;//saveするたび口語にONOFF
  saving = { stay: false, plan: false };
  dirty: boolean = false;//planFormが変更されたか
  currentY: number; scrollH: number; contentH: number; planY: number; basicY: number; essayY: number;
  private onDestroy$ = new Subject();
  constructor(private route: ActivatedRoute, private router: Router, private userService: UserService, private api: ApiService,
    private ui: UiService, private builder: FormBuilder, private storage: AngularFireStorage,) { }
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
      this.home = res.stays[0].home;
      const controls = this.stayForm.controls
      for (let key of Object.keys(controls)) {
        if (res.stays[0][key] == null) {
          controls[key].reset(this.STAY[key]);
        } else {
          controls[key].reset(res.stays[0][key]);
        }
      }
      this.stayForm.markAsPristine();
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
  async save() {
    if (this.stayForm.dirty) {
      this.saving.stay = true;
      this.ui.loading('保存中...');
      let update: any = { home: this.home, ...this.stayForm.value };
      if (this.imgBlob) {
        if (!HTMLCanvasElement.prototype.toBlob) {//edge対策
          Object.defineProperty(HTMLCanvasElement.prototype, 'toBlob', {
            value: function (callback, type, quality) {
              let canvas = this;
              setTimeout(function () {
                var binStr = atob(canvas.toDataURL(type, quality).split(',')[1]),
                  len = binStr.length,
                  arr = new Uint8Array(len);
                for (let i = 0; i < len; i++) {
                  arr[i] = binStr.charCodeAt(i);
                }
                callback(new Blob([arr], { type: type || 'image/jpeg' }));
              });
            }
          });
        }
        const imagePut = (id: number, typ: string) => {
          return new Promise<string>(resolve => {
            if (!this.imgBlob) return resolve("");
            let canvas: HTMLCanvasElement = this.canvas.nativeElement;
            let ctx = canvas.getContext('2d');
            let image = new Image();
            image.onload = () => {
              ctx.clearRect(0, 0, canvas.width, canvas.height);
              const px = typ == 'small' ? 160 : 640;
              let w, h;
              if (image.width > image.height) {
                w = image.width > px ? px : image.width;//横長
                h = image.height * (w / image.width);
              } else {
                h = image.height > px * 0.75 ? px * 0.75 : image.height;//縦長
                w = image.width * (h / image.height);
              }
              canvas.width = w; canvas.height = h;
              ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
              canvas.toBlob(async blob => {
                const ref = this.storage.ref(`stay/${id}/${typ}.jpg`);
                await ref.put(blob);
                const url = await ref.getDownloadURL().toPromise();
                return resolve(url);
              }, "image/jpeg")
            }
            image.src = this.imgBlob;
          });
        }
        update.img = await imagePut(this.id, "medium");
        update.simg = await imagePut(this.id, "small");
      }
      await this.api.post('query', { table: "stay", update: update, where: { id: this.id } });
      this.saving.stay = false;
      this.stayForm.markAsPristine();
      this.ui.loadend();
    }
    if(this.dirty){
      this.savePlan = !this.savePlan;
      this.saving.plan = true;
    }
  }
  planDirty(e) {
    this.dirty = e;
  }
  planSaved() {
    this.saving.plan = false;
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

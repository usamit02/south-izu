import { Component, OnDestroy, OnInit, ViewChild, ElementRef } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { FormControl, FormBuilder, Validators } from '@angular/forms';
import { AngularFireStorage } from '@angular/fire/storage';
import { AngularFireDatabase } from '@angular/fire/database';
import { AngularFirestore } from '@angular/fire/firestore';
import { User } from '../../class';
import { VEHICLETYP } from '../../config';
import { UserService } from '../../service/user.service';
import { ApiService } from '../../service/api.service';
import { UiService } from '../../service/ui.service';
import { APIURL } from '../../../environments/environment';
@Component({
  selector: 'app-vehicle',
  templateUrl: './vehicle.page.html',
  styleUrls: ['./vehicle.page.scss'],
})
export class VehiclePage implements OnInit, OnDestroy {
  @ViewChild('content', { read: ElementRef, static: false }) content: ElementRef;
  @ViewChild('basic', { read: ElementRef, static: false }) basic: ElementRef;
  @ViewChild('essay', { read: ElementRef, static: false }) essay: ElementRef;
  @ViewChild('canvas', { read: ElementRef, static: false }) canvas: ElementRef;
  user: User;
  id: number = null;
  VEHICLE = { typ: 0, na: "", maker: "", txt: "", img: "", simg: "", year: null, user: null, close: 0, chat: 1 };
  vehicle = {
    typ: new FormControl(this.VEHICLE.typ, [Validators.required]),
    na: new FormControl(this.VEHICLE.na, [Validators.minLength(2), Validators.maxLength(20), Validators.required]),
    maker: new FormControl(this.VEHICLE.maker, [Validators.minLength(2), Validators.maxLength(20)]),
    txt: new FormControl(this.VEHICLE.txt, [Validators.minLength(2), Validators.maxLength(600)]),
    img: new FormControl(this.VEHICLE.img), simg: new FormControl(this.VEHICLE.simg),
    year: new FormControl(this.VEHICLE.year, [Validators.min(1900), Validators.max(2100), Validators.pattern('^[0-9]+$')]),
    user: new FormControl(this.VEHICLE.user),
    close: new FormControl(this.VEHICLE.close), chat: new FormControl(this.VEHICLE.chat)
  }
  vehicleForm = this.builder.group({
    typ: this.vehicle.typ, na: this.vehicle.na, maker: this.vehicle.maker, txt: this.vehicle.txt, img: this.vehicle.img, simg: this.vehicle.simg,
    year: this.vehicle.year, user: this.vehicle.user, close: this.vehicle.close, chat: this.vehicle.chat
  });
  vehicleTyps = [];
  imgBlob;
  noimgUrl = APIURL + 'img/noimg.jpg';
  saving = false;
  dirty: boolean = false;//planFormが変更されたか
  currentY: number; scrollH: number; contentH: number; planY: number; basicY: number; essayY: number;
  private onDestroy$ = new Subject();
  constructor(private route: ActivatedRoute, private router: Router, private userService: UserService, private api: ApiService,
    private ui: UiService, private builder: FormBuilder, private storage: AngularFireStorage, private alert: AlertController,
    private db: AngularFireDatabase, private storedb: AngularFirestore,) { }
  ngOnInit() {
    Object.keys(VEHICLETYP).forEach(key => {
      this.vehicleTyps.push({ id: Number(key), ...VEHICLETYP[key] });
    });
    this.vehicleTyps.shift();
    this.route.params.pipe(takeUntil(this.onDestroy$)).subscribe(params => {
      this.userService.$.pipe(takeUntil(this.onDestroy$)).subscribe(async user => {
        this.user = user;
        if (params.id) {
          this.id = Number(params.id);
          this.undo();
        }
      });
    });
  }
  undo() {
    this.api.get('query', { select: ['*'], table: 'vehicle', where: { id: this.id } }).then(async res => {
      if (res.vehicles.length !== 1) {
        this.id = null;
        throw { message: '無効なparam.idです。' };
      };
      const controls = this.vehicleForm.controls
      for (let key of Object.keys(controls)) {
        if (res.vehicles[0][key] == null) {
          controls[key].reset(this.VEHICLE[key]);
        } else {
          controls[key].reset(res.vehicles[0][key]);
        }
      }
      this.vehicleForm.markAsPristine();
    }).catch(err => {
      this.ui.alert(`愛車情報の読み込みに失敗しました。\r\n${err.message}`);
    })
  }
  naBlur() {
    if (this.id || this.vehicleForm.invalid) return;
    this.create(this.vehicleForm.value);
  }
  imgChange(e) {
    if (e.target.files[0].type.match(/image.*/)) {
      this.imgBlob = window.URL.createObjectURL(e.target.files[0]);
      this.vehicleForm.markAsDirty();
    } else {
      this.ui.pop("画像ファイルjpgまたはpngを選択してください。");
    }
  }
  async preview() {
    if (this.user.id === this.vehicle.user.value || this.user.admin) {
      await this.api.post('query', { table: 'vehicle', update: this.vehicleForm.value, where: { id: this.id } });
    }
    this.router.navigate(['/vehicle', this.id]);
  }
  async save() {
    if (this.user.id === this.vehicle.user.value || this.user.admin) {
      this.saving = true;
      this.ui.loading('保存中...');
      let update: any = { ...this.vehicleForm.value };
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
                const ref = this.storage.ref(`vehicle/${id}/${typ}.jpg`);
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
      await this.api.post('query', { table: "vehicle", update: update, where: { id: this.id } });
      this.saving = false;
      this.vehicleForm.markAsPristine();
      this.ui.loadend();
    } else {
      this.ui.popm("保存するにはログインしてください。");
      this.router.navigate(['login']);
    }
  }
  async new() {
    const alert = await this.alert.create({
      header: '新しい愛車を作成',
      message: '現在の内容を元にして新しい愛車を作成しますか。<br>「いいえ」で現在の編集内容を破棄します。',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          cssClass: 'secondary',
        }, {
          text: 'いいえ',
          handler: () => {
            this.create({});
          }
        }, {
          text: 'はい',
          handler: () => {
            this.create(this.vehicleForm.value, true);
          }
        }
      ]
    });
    await alert.present();
  }
  async create(insert, copy?: boolean) {
    if (this.user.id) {
      this.api.post("query", { table: "vehicle", insert: { ...insert, user: this.user.id } }).then(async res => {
        if (copy && res.vehicle) {
          let doc = await this.api.get('query', { table: "story", select: ["*"], where: { typ: "vehicle", parent: this.id } });
          if (doc.storys.length) {
            doc.storys.map(story => {
              story.parent = res.vehicle.id;
              return story;
            });
            await this.api.post('querys', { table: "story", inserts: doc.storys });
          }
        }
        this.id = res.vehicle.id;
        this.undo();
      }).catch(err => {
        this.ui.alert(`新規愛車の作成に失敗しました。\r\n${err.message}`);
      });
    } else {
      this.ui.popm("愛車を登録するにはログインしてください。");
      this.router.navigate(['/login']);
    }
  }
  async erase() {
    const confirm = await this.ui.confirm("削除確認", `愛車「${this.vehicle.na.value}」を削除します。`);
    if (!confirm || !this.id) return;
    this.ui.loading('削除中...');
    this.api.get('query', { table: 'story', select: ['file'], where: { typ: 'vehicle', parent: this.id } }).then(async res => {
      for (let story of res.storys) {
        if (story.file) this.storage.ref(`vehicle/${this.id}/${story.file}`).delete();
      }
      await this.api.post('querys', { deletes: [{ parent: this.id, typ: 'vehicle', table: "story" }, { id: this.id, table: 'vehicle' }] });
      await this.db.list(`vehicle/${this.id}`).remove();
      await this.db.database.ref(`post/vehicle${this.id}`).remove();
      await this.storedb.collection('vehicle').doc(this.id.toString()).delete();
      if (this.vehicle.img.value) {
        await this.storage.ref(`vehicle/${this.id}/medium.jpg`).delete();
        await this.storage.ref(`vehicle/${this.id}/small.jpg`).delete();
      }
      this.id = null; this.vehicleForm.reset(this.VEHICLE);
      this.ui.pop("愛車を削除しました。");
    }).catch(err => {
      this.ui.alert(`愛車を削除できませんでした。\r\n${err.message}`);
    }).finally(() => { this.ui.loadend(); });
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

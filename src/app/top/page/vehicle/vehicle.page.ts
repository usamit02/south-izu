import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { PopoverController } from '@ionic/angular';
import { FormControl, FormBuilder, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AngularFireDatabase } from '@angular/fire/database';
import { AngularFireStorage } from '@angular/fire/storage';
import { User, USER } from '../../../class';
import { UserService } from '../../../service/user.service';
import { UiService } from '../../../service/ui.service';
import { ApiService } from '../../../service/api.service';
import { CropComponent } from '../../component/crop/crop.component';
@Component({
  selector: 'app-vehicle',
  templateUrl: './vehicle.page.html',
  styleUrls: ['./vehicle.page.scss'],
})
export class VehiclePage implements OnInit, OnDestroy {
  @ViewChild('canvas', { read: ElementRef, static: false }) canvas: ElementRef;
  na = new FormControl("", [Validators.minLength(2), Validators.maxLength(20)]);
  plan = new FormControl(50, [Validators.required]);
  trial = new FormControl("trial");
  bank = new FormControl("", [Validators.minLength(10), Validators.maxLength(50)]);
  direct = new FormControl("support");
  youth = new FormControl("");
  userForm = this.builder.group({
    na: this.na, plan: this.plan, trial: this.trial, bank: this.bank, direct: this.direct,
  });
  castForm = this.builder.group({
    youth: [{ lower: 15, upper: 50 }],
  });
  user: User = { ...USER, plan: "50", trial: "trial", p: 0, bank: "" };
  orgUser: string;
  PLAN = { sexual50: { plan: "50", trial: "" }, sexual50trial: { plan: "50", trial: "trial" }, sexual100: { plan: "100", trial: "" }, sexual100trial: { plan: "100", trial: "trial" } };
  private onDestroy$ = new Subject();
  constructor(private pop: PopoverController, private ui: UiService, private builder: FormBuilder, private userService: UserService,
    private db: AngularFireDatabase, private storage: AngularFireStorage, private api: ApiService, ) { }
  ngOnInit() {
    this.userService.$.pipe(takeUntil(this.onDestroy$)).subscribe(user => {
      if (user.id) {
        this.user = user;
        this.api.get('query', { table: "user", select: ['p', 'supportplan', 'bank'], where: { id: user.id } }).then(res => {
          if (res.users.length === 1) {
            this.user.plan = this.PLAN[res.users[0].supportplan].plan;
            this.user.trial = this.PLAN[res.users[0].supportplan].trial;
            this.user.p = res.users[0].p;
            this.user.bank = res.users[0].bank;
            this.orgUser = JSON.stringify(this.user);
          } else {
            this.orgUser = JSON.stringify({ ...this.user, plan: "50", trial: "trial", p: 0, bank: "" });
          }
          this.undo();
        });
      } else {
        this.orgUser = JSON.stringify({ ...USER, plan: "50", trial: "trial", p: 0, bank: "" });
        this.undo();
      }
    });
  }
  async popCrop() {
    const popover = await this.pop.create({
      component: CropComponent,
      componentProps: { prop: { typ: 'avatar' } },
      translucent: true,
      cssClass: 'cropper'
    });
    return await popover.present().then(() => {
      popover.onDidDismiss().then(event => {
        if (event.data) this.user.avatar = event.data; this.userForm.markAsDirty();
      });
    });;
  }
  undoAvatar() {
    this.user.avatar = this.user.photoURL; this.user.image = this.user.photoURL;
    this.userForm.markAsDirty();
  }
  undo() {
    this.user = JSON.parse(this.orgUser);
    this.userForm.reset({ na: this.user.na, plan: this.user.plan, trial: this.user.trial, bank: this.user.bank, direct: this.user.direct });
    this.castForm.reset();
  }
  async save() {
    this.user.na = this.na.value;
    if (this.user.avatar.length > 10000) {
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
      const avatarPut = () => {
        return new Promise<string>(resolve => {
          let canvas: HTMLCanvasElement = this.canvas.nativeElement;
          let ctx = canvas.getContext('2d');
          let image = new Image();
          image.onload = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            canvas.width = 50; canvas.height = 50;
            ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
            canvas.toBlob(async blob => {
              const ref = this.storage.ref(`user/${this.user.id}/avatar.jpg`);
              await ref.put(blob);
              const url = await ref.getDownloadURL().toPromise();
              return resolve(url);
            }, "image/jpeg")
          }
          image.src = this.user.avatar;
        });
      }
      const imagePut = () => {
        return new Promise<string>(async (resolve, reject) => {
          let bin = atob(this.user.avatar.replace(/^.*,/, ''));
          let buffer = new Uint8Array(bin.length);
          let blob: Blob;
          for (var i = 0; i < bin.length; i++) {
            buffer[i] = bin.charCodeAt(i);
          }
          try {
            blob = new Blob([buffer.buffer], { type: 'image/jpeg' });
          } catch (e) {
            this.ui.alert("ブロッブデータの作成に失敗しました。");
            return reject();
          }
          const ref = this.storage.ref(`user/${this.user.id}/image.jpg`);
          await ref.put(blob);
          const url = await ref.getDownloadURL().toPromise();
          return resolve(url);
        });
      }
      this.user.image = await imagePut();
      this.user.avatar = await avatarPut();
    }
    this.user.direct = this.direct.value;
    try {
      const ref = this.db.database.ref(`user/${this.user.id}`);
      ref.child("na").set(this.user.na);
      ref.child("avatar").set(this.user.avatar);
      ref.child("image").set(this.user.image);
      ref.child("direct").set(this.user.direct);
    } catch (e) {
      this.ui.alert("realtimeデーターベースエラーにより保存できませんでした。");
      return;
    }
    this.user.plan = this.plan.value; this.user.trial = this.trial.value; this.user.bank = this.bank.value;
    const insert = { id: this.user.id, na: this.user.na, supportplan: `sexual${this.user.plan}${this.user.trial}`, bank: this.user.bank };
    this.api.post("query", { table: 'user', insert: insert, duplicate: ['na', 'supportplan', 'bank'] }).then(() => {
      this.userService.update(this.user);
      this.ui.pop("保存しました。");
    });
  }
  ngOnDestroy() {
    this.onDestroy$.next();
  }
}

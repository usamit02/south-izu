import { Component, OnInit, OnDestroy } from '@angular/core';
import { Platform } from '@ionic/angular';
import { FormControl, FormBuilder, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AngularFireDatabase } from '@angular/fire/database';
import { UserService } from '../../../service/user.service';
import { UiService } from '../../../service/ui.service';
import { MessagingService } from '../../../service/messaging.service';
@Component({
  selector: 'app-notify',
  templateUrl: './notify.page.html',
  styleUrls: ['./notify.page.scss'],
})
export class NotifyPage implements OnInit, OnDestroy {
  user;
  ios: boolean;
  typ = new FormControl("mail");
  mail = {
    direct: new FormControl(), mention: new FormControl(), friend: new FormControl(), chat: new FormControl(), thread: new FormControl(),
    supportpost: new FormControl(), supportchat: new FormControl(), email: new FormControl("", Validators.email), tip: new FormControl(),
  };
  push = {
    direct: new FormControl(), mention: new FormControl(), friend: new FormControl(), chat: new FormControl(), thread: new FormControl(),
    supportpost: new FormControl(), supportchat: new FormControl(), tip: new FormControl(),
  };
  pushForm = this.builder.group({
    direct: this.push.direct, mention: this.push.mention, friend: this.push.friend, chat: this.push.chat, thread: this.push.thread,
    supportpost: this.push.supportpost, supportchat: this.push.supportchat, tip: this.push.tip,
  });
  mailForm = this.builder.group({
    email: this.mail.email, direct: this.mail.direct, mention: this.mail.mention, friend: this.mail.friend, chat: this.mail.chat,
    thread: this.mail.thread, supportpost: this.mail.supportpost, supportchat: this.mail.supportchat, tip: this.mail.tip,
  });
  private onDestroy$ = new Subject();
  constructor(private builder: FormBuilder, private db: AngularFireDatabase, private userService: UserService, private ui: UiService,
    private platform: Platform, private messaging: MessagingService, ) { }
  ngOnInit() {
    this.userService.$.pipe(takeUntil(this.onDestroy$)).subscribe(user => {
      this.user = user;
      this.undo();
    });
    this.ios = this.platform.is("ios") ? true : false;
  }
  undo() {
    const load = typ => {
      this.db.database.ref(`notify/${typ}/${this.user.id}`).once('value', doc => {
        const val = doc.val();
        let reset = {};
        if (val) {
          const controls = this[`${typ}Form`].controls
          for (let key of Object.keys(controls)) {
            if (val[key]) {
              reset[key] = val[key];//controls[key].reset(val[key]);
            } else {
              reset[key] = null;//controls[key].reset();
            }
          }
          this[`${typ}Form`].reset(reset);
        } else {
          this[`${typ}Form`].reset();
          if (typ === "mail" && !this.mail.email.value) {
            this.mail.email.reset(this.user.email);
          }
        }
      });
    }
    load('push');
    load('mail');
  }
  save() {
    const exist = (typ: string) => {
      let controls = this[`${typ}Form`].controls;
      for (let key of Object.keys(controls)) {
        if (controls[key].value) {
          return true;
        }
      }
      return false;
    }
    const push = new Promise((resolve, reject) => {
      if (!this.pushForm.dirty) return resolve(true);
      let ref = this.db.database.ref(`notify/push/${this.user.id}`);
      if (exist('push')) {
        this.messaging.getPermission().then(() => {
          ref.update(this.pushForm.value).then(() => { return resolve(true); });
        }).catch(err => {
          return reject(`プッシュ通知の設定保存に失敗しました。\r\n${err}`);
        });
      } else {
        ref.remove().finally(() => { return resolve(true); });
      }
    });
    const mail = new Promise((resolve, reject) => {
      if (!this.mailForm.dirty) return resolve(true);
      const ref = this.db.database.ref(`notify/mail/${this.user.id}`);
      ref.set(this.mailForm.value).then(() => {
        return resolve(true);
      }).catch(err => {
        return reject(`メール通知の設定保存に失敗しました。\r\n${err.message}`);
      });
    });
    Promise.all([push, mail]).then(() => {
      this.ui.pop("保存しました。");
      this.mailForm.reset(this.mailForm.value); this.pushForm.reset(this.pushForm.value);
    }).catch(err => {
      this.ui.alert(err);
    });
  }
  ngOnDestroy() {
    this.onDestroy$.next();
  }
}
  /*
const exist = (typ: string) => {
let controls = this[`${typ}Form`].controls;
for (let key of Object.keys(controls)) {
if (controls[key].value) {
return true;
}
}
return false;
}





this.db.database.ref(`notify/${this.user.id}`).set(this.pushForm.value).then(() => {
this.ui.pop("保存しました。");
}).catch(err => {
this.ui.alert(`保存に失敗しました。\r\n${err.message}`);
});



ref.once('value').then(snapshot => {
const set = (token: string) => {
ref.set({ token: token, ...this.pushForm.value }).then(() => {
  return resolve();
}).catch(err => {
  return reject(`プッシュ通知の設定保存に失敗しました。\r\n${err.message}`);
});
}
const config = snapshot.val();
if (config) {
set(config.token);
} else {
const messaging = firebase.messaging();
messaging.usePublicVapidKey('BJ1mTbdu3wUjcNb_itFbupqqnmezzn5u407BSAH5koV7urFTkZ-ggf3FTmhRMYyPdoeiE85MNu4NsaTEbHKbS-A');
messaging.requestPermission().then(() => {
  messaging.getToken().then(token => {
    set(token);
  });
}).catch(reason => {
  return reject(`プッシュ通知の認可取得に失敗しました。\r\n${reason}`);
});
}
}).catch(err => {
return reject(`プッシュ通知の設定取得に失敗しました。\r\n${err.message}`)
});







*/
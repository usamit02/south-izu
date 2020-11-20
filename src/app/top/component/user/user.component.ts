import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import { PopoverController } from '@ionic/angular';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AngularFireDatabase } from '@angular/fire/database'
import { SendService } from '../send/send.service';
import { ApiService } from '../../../service/api.service';
import { UiService } from '../../../service/ui.service';
@Component({
  selector: 'app-user',
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.scss'],
})
export class UserComponent implements OnInit, OnDestroy {
  @Input() id;
  @Input() self;
  user;
  friend: string = "";//ファン、フォロー、ブロックしているか
  friended: string = "";//ファン、フォロー、ブロックされているか
  friendVal = {
    support: { icon: 'heart-empty', color: 'danger', txt: "サポート" },
    follow: { icon: 'star-outline', color: 'warning', txt: "フォロー" },
    block: { icon: 'hand', color: 'dark', txt: "ブロック" }
  };
  ban: boolean = true;
  show: boolean = false;
  private onDestroy$ = new Subject();
  constructor(private db: AngularFireDatabase, private ui: UiService, public pop: PopoverController, private send: SendService,
    private router: Router, private api: ApiService, ) { }
  ngOnInit() {
    this.db.object(`user/${this.id}`).valueChanges().pipe(takeUntil(this.onDestroy$)).subscribe(user => {
      this.user = user;
    });
    this.init();
  }
  async init() {
    let doc: firebase.default.database.DataSnapshot;
    if (this.self.id) {
      doc = await this.db.database.ref(`friend/${this.id}/${this.self.id}`).once('value');
      this.friended = doc.val() ? doc.val() : "";
      doc = await this.db.database.ref(`friend/${this.self.id}/${this.id}`).once('value');
      this.friend = doc.val() ? doc.val() : "";
    }
    doc = await this.db.database.ref(`ban/${this.id}`).once('value');
    this.ban = doc.val() ? true : false;
    this.show = true;
  }
  async friending(friend) {
    const ref = this.db.database.ref(`friend/${this.self.id}/${this.id}`);
    if (this.friend === friend) {
      const confirm = await this.ui.confirm('取消の確認', `本当に${this.friendVal[friend].txt}をやめてよろしいですか。`);
      if (confirm) {
        try {
          if (friend === 'support') {
            await this.api.post('unpay', { uid: this.self.id, support: this.id });
          }
          await ref.remove();
          this.ui.pop(`${this.user.na}の${this.friendVal[friend].txt}を取消しました。`);
          this.friend = "";
        } catch (err) {
          this.ui.alert(`${this.friendVal[friend].txt}の取消に失敗しました。`);
        };
      }
    } else if (friend === 'support') {
      this.router.navigate(['/support', this.id]);
      this.pop.dismiss();
    } else {
      if (this.friend) {
        const confirm = await this.ui.confirm('変更の確認', `本当に${this.friendVal[this.friend].txt}をやめて${this.friendVal[friend].txt}しますか。`);
        if (confirm) {
          if (this.friend === 'support') {
            await this.api.post('unpay', { uid: this.self.id, support: this.id }).catch(() => { return; });
          }
        }
      }
      ref.set(friend).then(() => {
        this.friend = friend;
        this.ui.pop(`${this.user.na}を${this.friendVal[friend].txt}しました。`);
      }).catch(err => {
        this.ui.alert(`${this.friendVal[friend].txt}に失敗しました。\r\n${err.message}`);
      });
    }
  }
  mention() {
    this.send.mentionWrite.next({ id: this.id, ...this.user });
    this.pop.dismiss();
  }
  async baning(baned: boolean) {
    const ref = this.db.database.ref(`ban/${this.id}`)
    if (baned) {
      ref.remove().then(() => {
        this.ban = false;
        this.ui.pop("アカウント復活しました。");
      }).catch(err => {
        this.ui.alert(`復活に失敗しました。\r\n${err.message}`);
      });
    } else {
      const confirm = await this.ui.confirm('BANの確認', `本当に${this.user.na}を追放しますか。`);
      if (confirm) {
        await this.api.post('unpay', { uid: this.self.id, ban: this.id }).catch(() => { return; });
        ref.set(this.self.id).then(() => {
          this.ban = true;
          this.ui.pop("BANしました。");
        }).catch(err => {
          this.ui.alert(`BAN失敗しました。\r\n${err.message}`);
        });
      }
    }
  }
  goUser() {
    this.router.navigate(['/user', this.id]);
    this.pop.dismiss();
  }
  ngOnDestroy() {
    this.onDestroy$.next();
  }
}

import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AngularFireDatabase } from '@angular/fire/database';
import { UiService } from '../../../service/ui.service';
import { UserService } from '../../../service/user.service';
@Component({
  selector: 'app-support',
  templateUrl: './support.page.html',
  styleUrls: ['./support.page.scss'],
})
export class SupportPage implements OnInit, OnDestroy {
  user: any = { id: "", na: "" };
  support: any = { id: "", na: "" };
  private onDestroy$ = new Subject();
  constructor(private route: ActivatedRoute, private location: Location, private db: AngularFireDatabase, private ui: UiService,
    private userService: UserService, ) { }

  ngOnInit() {
    this.route.params.pipe(takeUntil(this.onDestroy$)).subscribe(params => {
      this.db.database.ref(`user/${params.id}`).on('value', snap => {
        const user = snap.val();
        this.support = user ? { id: params.id, ...snap.val() } : { id: "", na: "" };
      });
      this.userService.$.pipe(takeUntil(this.onDestroy$)).subscribe(user => {
        this.user = user;
      });
    });
  }
  pay(e) {
    this.db.database.ref(`friend/${this.user.id}/${this.support.id}`).set('support').then(() => {
      this.ui.pop(`${this.support.na}のサポーターになりました。`);
      this.location.back();
    }).catch(err => {
      this.ui.alert(`決済手続きは完了しましたがrealtimeDatabaseへの書込みに失敗しました。\r\n${err.message}`);
    });
  }
  ngOnDestroy() {
    this.onDestroy$.next();
  }
}


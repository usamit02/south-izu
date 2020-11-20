import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AngularFirestore } from '@angular/fire/firestore';
import { AngularFireDatabase } from '@angular/fire/database';
import { User, USER } from '../../../class';
import { UserService } from '../../../service/user.service';
@Component({
  selector: 'app-direct',
  templateUrl: './direct.page.html',
  styleUrls: ['./direct.page.scss'],
})
export class DirectPage implements OnInit, OnDestroy {
  @ViewChild('dummy', { static: false }) dummy: ElementRef;
  params = { id: null };
  self: User = USER;
  title: string = "";
  private onDestroy$ = new Subject();
  constructor(private store: AngularFirestore, private db: AngularFireDatabase, private userService: UserService, private route: ActivatedRoute, private router: Router, ) { }
  ngOnInit() {
    this.route.params.pipe(takeUntil(this.onDestroy$)).subscribe(params => {
      this.params.id = params.id;
      if (params.id) {
        this.userService.$.pipe(takeUntil(this.onDestroy$)).subscribe(async self => {
          this.self = self;
          if (this.self.id) {
            const doc = (await this.store.doc(`direct/${this.params.id}`).get().toPromise()).data();
            if (doc) {
              if (this.self.id === doc.id1) {
                this.title = `${doc.na2}さんへダイレクト`;
              } else {
                this.title = `${doc.na1}さんへダイレクト`;
              }
            } else {
              alert(`このダイレクトは存在しません`);
            }
          }
        });
      }
    });
    this.route.queryParams.pipe(takeUntil(this.onDestroy$)).subscribe(async params => {
      if (params.self && params.user) {
        const self = this.userService.get();
        if (self.id) {
          const query = await this.store.collection(`user/${params.self}/direct`, ref => ref.where('id', '==', params.user)).get().toPromise();
          let id = query.docs.length ? query.docs[0].id : null;
          if (!id) {
            const doc = (await this.db.database.ref(`user/${params.user}`).once('value')).val();
            if (doc) {
              const payload = { id1: self.id, na1: self.na, avatar1: self.avatar, id2: params.user, na2: doc.na, avatar2: doc.avatar, upd: new Date() };
              id = (await this.store.collection('direct').add(payload)).id;
            } else {
              throw new Error(`ユーザー「${params.user}」は存在しません。`);
            }
          }
          this.router.navigate(['/direct', id]);
        }
        //}).catch(err => {
        //  alert(`データベース読込に失敗しました\r\n${err.message}`);
        //});
      }
    });
  }
  ngOnDestroy() {
    this.onDestroy$.next();
  }
  dummyClick() { }
}

import { Component, OnInit, ViewChild, OnDestroy, ElementRef } from '@angular/core';
import { IonInfiniteScroll } from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AngularFireDatabase } from '@angular/fire/database';
import firebase from 'firebase/app'; //import * as firebase from 'firebase';
import { TabsService } from '../tabs.service';
import { UserService } from './../../../../service/user.service';
@Component({
  selector: 'app-friend',
  templateUrl: './friend.page.html',
  styleUrls: ['./friend.page.scss'],
})
export class FriendPage implements OnInit, OnDestroy {
  @ViewChild('infinite', { static: false }) infinite: IonInfiniteScroll;
  @ViewChild('dummy', { static: false }) dummy: ElementRef;
  typ: string;//follow,follower,support,supporter
  typVal = { follow: { na: "がフォロー" }, follower: { na: "のフォロワー" }, support: { na: "がサポート" }, supporter: { na: "のサポーター" } }
  user: any = { id: "", na: "" };
  self;
  friends = [];
  cards = [];
  cursor: number = 0;
  dbcon: firebase.database.Query;
  private onDestroy$ = new Subject();
  constructor(private db: AngularFireDatabase, private userService: UserService, private route: ActivatedRoute, private tabs: TabsService, ) {
  }
  ngOnInit() {
    this.userService.$.pipe(takeUntil(this.onDestroy$)).subscribe(user => {
      this.self = user;
    });
    this.tabs.user.asObservable().pipe(takeUntil(this.onDestroy$)).subscribe(user => {
      this.user = user;
      this.route.params.pipe(takeUntil(this.onDestroy$)).subscribe(params => {
        this.typ = params.typ;
        this.cards = []; this.cursor = 0;
        /*for (let friend of this.friends) {
          friend.$.unsubscribe();
        }*/
        let table = this.typ.slice(-2) === "er" ? "friender" : "friend";
        let val = this.typ.slice(0, 6) === "follow" ? "follow" : "support";
        this.db.database.ref(`${table}/${this.user.id}`).orderByValue().equalTo(val).once('value', query => {
          const promise = (friend) => new Promise((resolve, reject) => {
            this.db.database.ref(`user/${friend.key}`).on('value', snap => {
              const detail$ = this.db.list(`user/${friend.key}`).stateChanges(["child_changed"]);
              this.friends.push({ id: friend.key, ...snap.val(), detail$: detail$ });
              resolve(true);
            });
          });
          let promises = []; this.friends = [];
          query.forEach(friend => {
            promises.push(promise(friend));
          });
          Promise.all(promises).then(() => {
            this.friends.sort((a, b) => {
              if (a.view > b.view) return -1;
              if (a.view < b.view) return 1;
              return 0;
            });
            for (let friend of this.friends) {
              friend.detail$.pipe(takeUntil(this.onDestroy$)).subscribe(res => {
                friend[res.key] = res.payload.val();
              });
            }
            this.cardLoad(false);
          }).catch(err => {
            console.error(`ユーザーの読込に失敗しました。${err.message}`);
          });
        });
      });
    });
  }
  cardLoad(event) {
    let cards = []; const LIMIT = 20;
    let limit = this.cursor + LIMIT > this.friends.length ? this.friends.length - this.cursor : LIMIT;
    if (limit > 0) {
      for (let i = this.cursor; i < this.cursor + limit; i++) {
        this.db.database.ref(`friend/${this.friends[i].id}/${this.self.id}`).once('value', friend => {
          this.friends[i].friend = friend.val();
          this.cards.push(this.friends[i]);
          setTimeout(() => {
            this.dummy.nativeElement.click();
          }, 100);
        });
      }//this.cards.push(...cards);      
    }
    if (limit < LIMIT) {
      this.infinite.disabled = true;
    }
    if (event) event.target.complete();
    this.cursor += LIMIT;
  }
  dummyClick() {

  }
  ngOnDestroy() {
    this.onDestroy$.next();
  }
}

import { Component, OnInit, ViewChild, OnDestroy, ElementRef } from '@angular/core';
import { IonInfiniteScroll } from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AngularFireDatabase } from '@angular/fire/database';
import * as firebase from 'firebase';
import { UserService } from './../../../../service/user.service';
@Component({
  selector: 'app-card',
  templateUrl: './card.page.html',
  styleUrls: ['./card.page.scss'],
})
export class CardPage implements OnInit, OnDestroy {
  @ViewChild('infinite', { static: false }) infinite: IonInfiniteScroll;
  @ViewChild('dummy', { static: false }) dummy: ElementRef;
  user: any = { id: "", na: "" };
  self: any = { id: "", na: "" };
  users = [];
  cards = [];
  cursor: number = 0;
  dbcon: firebase.default.database.Query;
  private onDestroy$ = new Subject();
  constructor(private db: AngularFireDatabase, private userService: UserService, private route: ActivatedRoute, ) { }
  ngOnInit() {
    this.userService.$.pipe(takeUntil(this.onDestroy$)).subscribe(user => {
      this.self = user;
      this.route.params.pipe(takeUntil(this.onDestroy$)).subscribe(params => {
        this.cards = []; this.cursor = 0;
        this.db.database.ref(`user`).orderByChild(params.order).once('value', query => {
          this.users = [];
          query.forEach(user => {
            this.users.unshift({ id: user.key, ...user.val() });
          });
          this.cardLoad(false);
        });
      });
    });
  }
  cardLoad(event) {
    let cards = []; const LIMIT = 20;
    let limit = this.cursor + LIMIT > this.users.length ? this.users.length - this.cursor : LIMIT;
    if (limit > 0) {
      for (let i = this.cursor; i < this.cursor + limit; i++) {
        this.db.database.ref(`friend/${this.users[i].id}/${this.self.id}`).once('value', friend => {
          this.users[i].friend = friend.val();
          this.db.list(`user/${this.users[i].id}`).stateChanges(["child_changed"]).pipe(takeUntil(this.onDestroy$)).subscribe(res => {
            this.users[i][res.key] = res.payload.val();
          });
          this.cards.push(this.users[i]);
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

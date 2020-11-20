import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { IonInfiniteScroll } from '@ionic/angular';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AngularFireDatabase } from '@angular/fire/database';
import { TabsService } from '../tabs.service';
@Component({
  selector: 'app-chat',
  templateUrl: './chat.page.html',
  styleUrls: ['./chat.page.scss'],
})
export class ChatPage implements OnInit, OnDestroy {
  @ViewChild('infinite', { static: false }) infinite: IonInfiniteScroll;
  user: any = { id: "", na: "" };
  chats = [];
  private onDestroy$ = new Subject();
  constructor(private tabs: TabsService, private db: AngularFireDatabase) {
  }
  ngOnInit() {
    this.tabs.user.asObservable().pipe(takeUntil(this.onDestroy$)).subscribe(user => {
      this.user = user;
      this.db.database.ref(`chat/${this.user.id}`).orderByChild('upd').startAt(new Date().getTime()).limitToLast(1).on('child_added', snapshot => {
        const doc = snapshot.val();
        this.chats.unshift(doc);
      });
      this.chatLoad(false);
    });
  }
  async chatLoad(event) {
    let docs = []; const LIMIT = 10;
    let ref = this.db.database.ref(`chat/${this.user.id}`).orderByChild('upd');
    ref = this.chats.length ? ref.endAt(this.chats[this.chats.length - 1].upd - 1).limitToLast(LIMIT) : ref.limitToLast(LIMIT);
    const query = await ref.once('value');
    query.forEach(doc => {
      docs.unshift(doc.val());
    });
    if (event) event.target.complete();
    if (docs.length) {
      this.chats.push(...docs);
    } else {
      this.infinite.disabled = true;
    }
  }
  ngOnDestroy() {
    this.onDestroy$.next();
  }
}

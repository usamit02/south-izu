import { Component, OnInit, Input, ViewChild } from '@angular/core';
import { IonInfiniteScroll, PopoverController } from '@ionic/angular';
import { AngularFireDatabase } from '@angular/fire/database';
import { UserComponent } from '../user/user.component';
@Component({
  selector: 'app-talk',
  templateUrl: './talk.component.html',
  styleUrls: ['./talk.component.scss'],
})
export class TalkComponent implements OnInit {
  @Input() user;
  @ViewChild('infinite', { static: false }) infinite: IonInfiniteScroll;
  limit: number = 20;
  talks = [];
  constructor(private pop: PopoverController, private db: AngularFireDatabase, ) { }
  ngOnInit() {
    this.db.database.ref('talk').orderByChild('upd').startAt(new Date().getTime()).limitToLast(1).on('child_added', snapshot => {
      const doc = snapshot.val();
      this.talks.unshift(doc);
    });
    this.talkLoad(false);
  }
  async talkLoad(event) {
    let docs = [];
    let ref = this.db.database.ref(`talk`).orderByChild('upd');
    ref = this.talks.length ? ref.endAt(this.talks[this.talks.length - 1].upd - 1).limitToLast(this.limit) : ref.limitToLast(this.limit);
    const query = await ref.once('value');
    query.forEach(doc => {
      docs.unshift(doc.val());
    });
    if (event) event.target.complete();
    if (docs.length) {
      this.talks.push(...docs);
    } else {
      this.infinite.disabled = true;
    }
  }
  async popUser(event, uid) {
    const popover = await this.pop.create({
      component: UserComponent,
      componentProps: { id: uid, self: this.user },
      cssClass: 'user'
    });
    return await popover.present();
  }

}

import { Component, OnInit, Input, ViewChild } from '@angular/core';
import { IonInfiniteScroll, PopoverController } from '@ionic/angular';
import { AngularFireDatabase } from '@angular/fire/database';
import { UserComponent } from '../user/user.component';
@Component({
  selector: 'app-books',
  templateUrl: './books.component.html',
  styleUrls: ['./books.component.scss'],
})
export class BooksComponent implements OnInit {
  @Input() user;
  @Input() home;
  @ViewChild('infinite', { static: false }) infinite: IonInfiniteScroll;
  limit: number = 20;
  books = [];
  constructor(private pop: PopoverController, private db: AngularFireDatabase, ) { }
  ngOnInit() {
    this.db.database.ref(`book/${this.home}`).orderByChild('upd').startAt(new Date().getTime()).limitToLast(1).on('child_added', snapshot => {
      const doc = snapshot.val();
      this.books.unshift(doc);
    });
    this.bookLoad(false);
  }
  async bookLoad(event) {
    let docs = [];
    let ref = this.db.database.ref(`book/${this.home}`).orderByChild('upd');
    ref = this.books.length ? ref.endAt(this.books[this.books.length - 1].upd - 1).limitToLast(this.limit) : ref.limitToLast(this.limit);
    const query = await ref.once('value');
    query.forEach(doc => {
      docs.unshift(doc.val());
    });
    if (event) event.target.complete();
    if (docs.length) {
      this.books.push(...docs);
      let a=1;
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

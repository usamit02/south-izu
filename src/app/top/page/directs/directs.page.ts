import { Component, OnInit, OnDestroy } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { Observable, Subject } from 'rxjs';
import { UserService } from '../../../service/user.service';
import { takeUntil } from 'rxjs/operators';
@Component({
  selector: 'app-directs',
  templateUrl: './directs.page.html',
  styleUrls: ['./directs.page.scss'],
})
export class DirectsPage implements OnInit, OnDestroy {
  directs$: Observable<any>;
  private onDestroy$ = new Subject();
  constructor(private db: AngularFirestore, private user: UserService, ) { }
  ngOnInit() {
    this.user.$.pipe(takeUntil(this.onDestroy$)).subscribe(user => {
      if (user.id) {
        this.directs$ = this.db.collection(`user/${user.id}/direct`, ref => ref.orderBy('upd', 'desc')).valueChanges();
      } else {
        this.directs$ = null;
      }
    });
  }
  ngOnDestroy() {
    this.onDestroy$.next();
  }
}

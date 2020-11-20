import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AngularFireDatabase } from '@angular/fire/database';
import { TabsService } from './tabs.service';
@Component({
  selector: 'app-user',
  templateUrl: './user.page.html',
  styleUrls: ['./user.page.scss'],
})
export class UserPage implements OnInit, OnDestroy {
  private onDestroy$ = new Subject();
  constructor(private route: ActivatedRoute, private tabs: TabsService, private db: AngularFireDatabase, ) { }
  ngOnInit() {
    this.route.params.pipe(takeUntil(this.onDestroy$)).subscribe(params => {
      this.db.database.ref(`user/${params.id}`).once('value', snap => {
        this.tabs.user.next({ id: params.id, ...snap.val() });
      });
    });
  }
  ngOnDestroy() {
    this.onDestroy$.next();
  }
}

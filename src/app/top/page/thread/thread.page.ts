import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AngularFirestore } from '@angular/fire/firestore';
import { AngularFireDatabase } from '@angular/fire/database';
import { ApiService } from '../../../service/api.service';
import { UserService } from '../../../service/user.service';
@Component({
  selector: 'app-thread',
  templateUrl: './thread.page.html',
  styleUrls: ['./thread.page.scss'],
})
export class ThreadPage implements OnInit, OnDestroy {
  params;
  user: any = { id: "" };
  //dest = { id: "", na: "", avatar: "" };
  title: string = "";
  url: string = "";
  private onDestroy$ = new Subject();
  constructor(private api: ApiService, private store: AngularFirestore, private db: AngularFireDatabase,
    private userService: UserService, private route: ActivatedRoute, private router: Router, ) { }
  ngOnInit() {
    this.route.params.pipe(takeUntil(this.onDestroy$)).subscribe(params => {
      this.params = params;
    });
    this.userService.$.pipe(takeUntil(this.onDestroy$)).subscribe(user => {
      this.user = user;
    });
  }
  titleing(chat) {
    this.title = `${chat.na} さんへ返信`;
    this.url = `/${this.params.page}/${this.params.id}/${Math.floor(chat.upd.toDate().getTime() / 1000)}`;
  }
  ngOnDestroy() {
    this.onDestroy$.next();
  }
}

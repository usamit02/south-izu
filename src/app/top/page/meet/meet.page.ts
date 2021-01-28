import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ApiService } from '../../../service/api.service';
import { UserService } from '../../../service/user.service';
import { Store } from '../../../service/store.service';
import { HOME } from '../../../config';
import { User } from '../../../class';
@Component({
  selector: 'app-meet',
  templateUrl: './meet.page.html',
  styleUrls: ['./meet.page.scss'],
})
export class MeetPage implements OnInit, OnDestroy {
  @ViewChild('content', { read: ElementRef, static: false }) content: ElementRef;
  params;
  home: string = "";
  date: string = "2020-1-1";
  user: User;
  users = [];
  param: any = { id: null };//chat component の初期値
  private onDestroy$ = new Subject();
  constructor(private route: ActivatedRoute, private api: ApiService, private userService: UserService, private title: Title,
    private store: Store) { }
  ngOnInit() {
    this.route.params.pipe(takeUntil(this.onDestroy$)).subscribe(params => {
      this.params = params;
      this.home = HOME[params.home].na;
      this.date = params.date;
    });
    this.userService.$.pipe(takeUntil(this.onDestroy$)).subscribe(async user => {
      this.user = user;
      if (user.id) {
        this.undo();
      } else {
        this.param = { id: null };
        this.store.update(state => ({ ...state, users: [] }));
      }
    });
  }
  async undo(date?:number) {
    if (date) {
      let d = new Date(this.date);
      d.setDate(d.getDate() + date);
      this.date = `${d.getFullYear()}-${('0' + (d.getMonth() + 1)).slice(-2)}-${('0' + (d.getDate())).slice(-2)}`
    }
    const res = await this.api.get('query', { table: "bookmanaging", select: ['user', 'na', 'avatar', 'stay'], where: { home: this.params.home, dated: this.date } });
    if (res.bookmanags.filter(book => { return book.user === this.user.id; }).length ||
      HOME[this.params.home].users.filter(user => { return user === this.user.id; }).length || this.user.admin) {
      this.users = res.bookmanags.map(user => {
        return { ...user, id: user.user };
      });      
      this.param = { id: `${this.params.home}_${this.date}`, topInfinite: true };
      if (this.params.cursor) this.param.cursor = this.params.cursor;
      if (this.params.thread) this.param.thread = this.params.thread;
      this.store.update(state => ({ ...state, users: this.users }));
    } else {
      this.param = { id: null };
      this.store.update(state => ({ ...state, users: [] }));
    }
  }
  ngOnDestroy() {
    this.onDestroy$.next();
  }
}

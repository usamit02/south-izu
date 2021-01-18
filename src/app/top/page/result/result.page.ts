import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { PopoverController, IonInfiniteScroll } from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AngularFireDatabase } from '@angular/fire/database';
import { ApiService } from './../../../service/api.service';
import { UiService } from './../../../service/ui.service';
import { UserService } from './../../../service/user.service';
import { UserComponent } from '../../component/user/user.component';
@Component({
  selector: 'app-result',
  templateUrl: './result.page.html',
  styleUrls: ['./result.page.scss'],
})
export class ResultPage implements OnInit, OnDestroy {
  @ViewChild('infinite', { static: false }) infinite: IonInfiniteScroll;
  results = [];
  allResults = [];
  self;
  table:string;
  order: string;  
  where = {};
  score = {};
  private onDestroy$ = new Subject();
  constructor(private route: ActivatedRoute, private api: ApiService, private db: AngularFireDatabase,
    private ui: UiService, private userService: UserService, private pop: PopoverController, ) { }

  ngOnInit() {
    this.route.queryParams.pipe(takeUntil(this.onDestroy$)).subscribe(params => {
      this.table = params.table;
      this.order = params.order;
      this.where = JSON.parse(params.where);
      this.results = [];
      if (this.infinite) this.infinite.disabled = false;
      if (this.order !== "acked") {//acked以外はmysqlではなくfirebase realtimedbに保存されているので、mysqlとdbを合体させて並び替え
        this.api.get('query', { table: `${this.table}ed`, select: ['*'], where: this.where }).then(async res => {
          this.allResults = await Promise.all(res[`${this.table}s`].map(async result => {
            const doc = await this.db.database.ref(`${this.table}/${result.id}`).once('value');
            const detail = doc.val();
            if (detail) {
              const view = detail.view ? detail.view : 0;
              const chat = detail.chat ? detail.chat : 0;
              const good = detail.good ? detail.good : 0;
              const bad = detail.bad ? detail.bad : 0;
              return { ...result, detail: { view: view, chat: chat, good: good, bad: bad } };
            } else {
              return { ...result, detail: { view: 0, chat: 0, good: 0, bad: 0 } };
            }
          }));
          this.allResults.sort((a, b) => {
            if (a.detail[this.order] < b.detail[this.order]) {
              return 1;
            } else {
              return -1;
            }
          });
          this.load();
        });
      } else {
        this.load();
      }
    });
    this.userService.$.pipe(takeUntil(this.onDestroy$)).subscribe(user => {
      this.self = user;
    });
  }
  async load(cursor?: string | number) {
    const LIMIT = 15;
    if (this.order === 'acked') {
      const where = cursor ? { [this.order]: { up: cursor }, ...this.where } : this.where;
      this.api.get('query', { table: `${this.table}ed`, select: ['*'], where: where, order: { [this.order]: "DESC" }, limit: LIMIT }).then(res => {
        this.results.push(...res[`${this.table}s`]);
        this.results.map(result => {
          result.detail$ = this.db.object(`${this.table}/${result.id}`).valueChanges();
        });
        this.results.map(async result => {
          const snapshot = await this.db.database.ref(`user/${result.user}`).once('value');
          result.userDetail = snapshot.val();
        });
        if (res[`${this.table}s`].length < LIMIT) {
          this.infinite.disabled = true;
        }
      }).finally(() => {
        this.infinite.complete();
      });
    } else {
      let adds = this.allResults.slice(this.results.length, this.results.length + LIMIT);
      adds = await Promise.all(adds.map(async result => {
        const snapshot = await this.db.database.ref(`user/${result.user}`).once('value');
        result.userDetail = snapshot.val();
        return result;
      }));
      this.results.push(...adds);
      this.infinite.complete();
      if (adds.length < LIMIT) this.infinite.disabled = true;
    }
  }
  async popUser(event, uid) {
    const popover = await this.pop.create({
      component: UserComponent,
      componentProps: { id: uid, self: this.self },
      //event: event,
      translucent: true,
      cssClass: 'user'
    });
    return await popover.present();
  }
  ngOnDestroy() {
    this.onDestroy$.next();
  }
}
/*

 let term = params.term.split(":");
      let than;
      if (term[0] !== 'all') {
        let d = new Date();
        if (term[0] === 'day') {
          d.setDate(d.getDate() - term[1]);
        } else if (term[0] === 'month') {
          d.setMonth(d.getMonth() - term[1]);
        } else if (term[0] === 'year') {
          d.setFullYear(d.getFullYear() - term[1]);
        }
        than = [{ key: "acked", val: this.dateFormat(d), sign: ">" }];
      }




      const order = params.order === "kana" || params.order === "acked" ? { [params.order]: "" } : { idx: "" };
      let param: any = { table: 'reported', select: ['*'], where: where, order: order };
      this.api.get('query', param).then(res => {
        res.reporteds.map(report => {
          report.detail$ = this.db.object(`report/${report.id}`).valueChanges();
        });
        this.reports = res.reporteds;
        this.reports.map(async report => {
          const snapshot = await this.db.database.ref(`user/${report.user}`).once('value');
          report.userDetail = snapshot.val();
        });
      });

async loadScore() {
    if (!('view' in this.score)) {
      const casts = await this.db.database.ref(`total/${this.term}/cast`).once('value');
      casts.forEach(cast => {
        cast.forEach(action => {
          this.score[action.key].push(action.val());
        });
      });
    }
      this.score.sort((a, b) => {
        if (a.score < b.score) {
          return 1;
        } else {
          return -1;
        }
      this.more(key);
    });
  }












*/
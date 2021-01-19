import { Component, OnInit, Input, Output, EventEmitter, OnDestroy, OnChanges,SimpleChanges } from '@angular/core';
import { Router } from '@angular/router';
import { FormControl, FormBuilder, Validators } from '@angular/forms';
import { Subject, Observable } from 'rxjs';
import { take, takeUntil, debounceTime, skip } from 'rxjs/operators';
import { AngularFirestore } from '@angular/fire/firestore';
import { AngularFireDatabase } from '@angular/fire/database';
import { User } from '../../../../class';
import { ApiService } from './../../../../service/api.service';
import { UiService } from './../../../../service/ui.service';
import { Store } from './../../../../service/store.service';
@Component({
  selector: 'app-find',
  templateUrl: './find.component.html',
  styleUrls: ['./find.component.scss'],
})
export class FindComponent implements OnInit, OnChanges, OnDestroy {
  @Input() user: User;
  @Input() mode: string;
  @Output() modeChange = new EventEmitter();
  @Output() menuClose = new EventEmitter();
  reportIni = { genre: [] };
  genres = [];
  genre = new FormControl([]);
  reportForm = this.builder.group({
    genre: this.genre,
  });
  searchIni = { order: "acked", term: { lower: 0, upper: 7 } };
  order = new FormControl("acked");
  term = new FormControl({ lower: 0, upper: 7 });
  termVals = [{ na: '現在', key: 'day', val: 0 }, { na: '3日', key: 'day', val: 3 }, { na: '1週', key: 'day', val: 7 }, { na: '1月', key: 'month', val: 1 },
  { na: '3月', key: 'month', val: 3 }, { na: '半年', key: 'month', val: 6 }, { na: '1年', key: 'year', val: 1 }, { na: '全期間', key: 'year', val: 0 }];
  searchForm = this.builder.group({
    order: this.order, term: this.term,
  });
  condition: Condition = {//検索条件
    na: "init", reportForm: this.reportIni, searchForm: this.searchIni,
  };
  count: number;
  testCount: number = 0;
  private onDestroy$ = new Subject();
  constructor(private router: Router, private builder: FormBuilder, private storedb: AngularFirestore, private store: Store, private db: AngularFireDatabase,
    private ui: UiService, private api: ApiService,) { }
  ngOnInit() {
    this.term.valueChanges.pipe(debounceTime(500), takeUntil(this.onDestroy$)).subscribe(() => { this.getCount(); });
  }
  ngOnChanges(changes: SimpleChanges) {    
    if (this.user.id) {

    } else {
    }
  }
  async findMode(typ: string) {
    this.mode = this.mode === typ ? "" : typ;
    this.modeChange.emit(this.mode);
    if (this.mode) {
      this.router.navigate(['/result'], { queryParams: { table: this.mode, where: '{ "ack": 1 }', order: this.order.value } });
      if (this.condition.na === "init") {
        const res = await this.api.get('query', { table: 'genre' });
        this.genres = res.genres;
        if (this.user.id) {
          this.db.database.ref(`condition/${this.user.id}/default`).once('value').then(snap => {
            const condition = snap.val();
            if (condition) {
              this.condition = condition;
            } else {
              this.condition.na = "readed";
            }
            this.undo();
          }).catch(err => {
            this.ui.alert(`検索条件の読込に失敗しました。\r\n${err.message}`);
          });
        } else {
          this.condition.na = "guest";
          this.undo();
        }
      }
    }
  }
  getCount() {
    this.api.get('query', { count: this.mode, where: this.search(true) }).then(res => {
      this.count = res.count;
    });
  }
  search(count?: boolean): Object {
    let params: any = { ack: 1 };
    const getTerm = i => {
      let d = new Date();
      if (this.termVals[i].key === 'day') {
        d.setDate(d.getDate() - this.termVals[i].val);
      } else if (this.termVals[i].key === 'month') {
        d.setMonth(d.getMonth() - this.termVals[i].val);
      } else if (this.termVals[i].key === 'year') {
        d.setFullYear(d.getFullYear() - this.termVals[i].val);
      }
      return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate();
    }
    let acked: any = {};
    if (this.termVals[this.term.value.lower].val) {
      acked.upper = getTerm(this.term.value.lower);
    }
    if (this.termVals[this.term.value.upper].val) {
      acked.lower = getTerm(this.term.value.upper);
    }
    if (acked.lower || acked.upper) params.acked = acked;
    const controls = this.reportForm.controls;
    for (let key of Object.keys(controls)) {
      let a = controls[key].value;
      if (controls[key].value.length) params[key] = controls[key].value;
    }
    for (let key of Object.keys(params)) {
      if (params[key] == null) delete params[key];
    }
    if (count) {
      return params;
    } else {
      this.router.navigate(['/result'], { queryParams: { table: this.mode, where: JSON.stringify(params), order: this.order.value } });
      this.menuClose.emit();
    }
  }
  undo() {
    this.reportForm.reset(this.condition.reportForm, { emitEvent: true });
    this.searchForm.reset(this.condition.searchForm);
  }
  load() {

  }
  save() {

  }
  ngOnDestroy() {
    this.onDestroy$.next();
  }
}
class Condition {
  na: string;
  reportForm: any;
  searchForm: any;
}
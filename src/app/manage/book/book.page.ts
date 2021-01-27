import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormControl, FormBuilder, FormArray, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { User } from '../../class';
import { UserService } from '../../service/user.service';
import { ApiService } from '../../service/api.service';
import { UiService } from '../../service/ui.service';
import { HOME, STAYTYP } from '../../config';
@Component({
  selector: 'app-book',
  templateUrl: './book.page.html',
  styleUrls: ['./book.page.scss'],
})
export class BookPage implements OnInit, OnDestroy {
  user: User;
  params;
  dailys = [];
  sum: number;
  private onDestroy$ = new Subject();
  constructor(private route: ActivatedRoute, private userService: UserService, private api: ApiService, private ui: UiService,) { }

  ngOnInit() {
    this.route.params.pipe(takeUntil(this.onDestroy$)).subscribe(params => {
      this.params = params;
      this.userService.$.pipe(takeUntil(this.onDestroy$)).subscribe(async user => {
        this.user = user;
        this.undo();
      });
    });
  }
  async undo() {
    this.sum = 0; this.dailys = [];
    if (HOME[this.params.home].users.filter(uid => { return this.user.id === uid; }).length) {
      const res = await (this.api.get('query', { table: 'bookmanaging', select: ['*'], where: { home: this.params.home }, order: { dated: "", stay: "" } }));
      const now = new Date(); let fee: number; let rate: number;
      for (let book of res.bookmanags) {
        book.isChecked = false;
        book.typ = STAYTYP[book.typ].na;
        book.id = Number(book.id); book.amount = Number(book.amount); book.num = Number(book.num);
        this.sum += book.amount;
        if (!this.dailys.length || this.dailys[this.dailys.length - 1].dated !== book.dated) {
          fee = 0; rate = 0;
          const diff = Math.ceil((new Date(book.dated).getTime() - now.getTime()) / 86400000);
          for (let cancel of HOME[this.params.home].cancels) {
            const key = Number(Object.keys(cancel)[0]);
            if (diff <= key) {
              rate = cancel[key];
              break;
            }
          }
          book.rate = rate;
          book.fee = Math.floor(book.amount * rate / 100);
          this.dailys.push({ dated: book.dated, amount: book.amount, rate: rate, books: [book], isChecked: false });
        } else {
          book.rate = rate;
          book.fee = Math.floor(book.amount * rate / 100);
          this.dailys[this.dailys.length - 1].amount += book.amount;
          this.dailys[this.dailys.length - 1].books.push(book);
        }
      }
    }
  }
  checkDaily(daily) {
    for (let book of daily.books) {
      book.isChecked = daily.isChecked;
    }
  }
  checkAll() {
    const checkNum = this.dailys.filter(daily => { return daily.isChecked === true; }).length;
    const checked: boolean = checkNum === 0 || checkNum !== this.dailys.length ? true : false;
    for (let daily of this.dailys) {
      daily.isChecked = checked;
      for (let book of daily.books) {
        book.isChecked = checked;
      }
    }
  }
  check(){
    
  }
  rateChange(book) {
    if (book.rate > 100) {
      book.rate = 100;
    } else if (book.rate < 0) {
      book.rate = 0;
    }
    book.fee = Math.floor(book.amount * book.rate / 100);
  }
  feeChange(book) {
    book.rate = Math.floor(book.fee / book.amount * 100);
  }
  dailyRateChange(daily) {
    if (daily.rate > 100) {
      daily.rate = 100;
    } else if (daily.rate < 0) {
      daily.rate = 0;
    }
    for (let book of daily.books) {
      book.rate = daily.rate;
      book.fee = Math.floor(book.amount * book.rate / 100);
    }
  }
  save() {
    const cancels = [];
    for (let daily of this.dailys) {
      daily.books.filter(book => { return book.isChecked === true; }).map(book => {
        cancels.push({ id: book.id, dated: book.dated, num: book.num, amount: book.amount, fee: book.fee, payjp: book.payjp, user: book.user });
      });
    }
    if (cancels.length) {
      this.api.post('cancel', { uid: this.user.id, cancels: JSON.stringify(cancels) }, "処理中").then(res => {
        this.ui.pop('正常にキャンセル及び返金処理されました。');
        this.undo();
      }).catch(err => {
        this.ui.alert('キャンセルできませんでした。');
      })
    }
  }
  ngOnDestroy() {
    this.onDestroy$.next();
  }
}
/*
['id', 'dated', 'num', 'amount', 'payjp','user'
*/
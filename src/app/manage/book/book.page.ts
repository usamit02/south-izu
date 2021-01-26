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
  dailys = [];
  sum: number;
  private onDestroy$ = new Subject();
  constructor(private route: ActivatedRoute, private userService: UserService, private api: ApiService, private ui: UiService,) { }

  ngOnInit() {
    this.route.params.pipe(takeUntil(this.onDestroy$)).subscribe(params => {
      this.userService.$.pipe(takeUntil(this.onDestroy$)).subscribe(async user => {
        this.user = user;
        this.sum = 0;
        if (HOME[params.home].users.filter(uid => { return user.id === uid; }).length) {
          const res = await (this.api.get('query', { table: 'bookmanaging', select: ['*'], where: { home: params.home }, order: { dated: "", stay: "" } }));
          const now = new Date(); let fee: number; let rate: number;
          for (let book of res.bookmanags) {
            book.isChecked = false;
            book.typ = STAYTYP[book.typ].na;
            book.id = Number(book.id); book.amount = Number(book.amount); book.num = Number(book.num);
            this.sum += book.amount;
            if (!this.dailys.length || this.dailys[this.dailys.length - 1].dated !== book.dated) {
              fee = 0; rate = 0;
              const diff = Math.ceil(new Date(book.dated).getTime() - now.getTime() / 8640000);
              for (let cancel of HOME[params.home].cancels) {
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
        } else {
          this.dailys = [];
        }
      });
    });

  }
  checkDaily(daily) {
    for (let book of daily.books) {
      book.isChecked = daily.isChecked;
    }
  }
  check() {

  }
  save() {
    let a = this.dailys;
    let b = 1;
  }
  ngOnDestroy() {
    this.onDestroy$.next();
  }
}

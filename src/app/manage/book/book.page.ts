import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ModalController } from '@ionic/angular';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CalendarModal, CalendarModalOptions, DayConfig } from 'ion2-calendar';
import { User } from '../../class';
import { UserService } from '../../service/user.service';
import { ApiService } from '../../service/api.service';
import { UiService } from '../../service/ui.service';
import { HOME, STAYTYP, HOLIDAYS } from '../../config';
@Component({
  selector: 'app-book',
  templateUrl: './book.page.html',
  styleUrls: ['./book.page.scss'],
})
export class BookPage implements OnInit, OnDestroy {
  user: User;
  home;
  from;
  to;
  days: DayConfig[] = [];
  dailys = [];
  sum: number;
  disabled = true;
  private onDestroy$ = new Subject();
  constructor(private route: ActivatedRoute, private modal: ModalController, private userService: UserService, private api: ApiService, private ui: UiService,) { }

  ngOnInit() {
    this.route.params.pipe(takeUntil(this.onDestroy$)).subscribe(params => {
      this.home = params.home; this.from = params.from; this.to = params.to;
      this.userService.$.pipe(takeUntil(this.onDestroy$)).subscribe(async user => {
        this.user = user;
        this.undo();
      });
    });
    const now = new Date();
    const upper = new Date();
    upper.setMonth(upper.getMonth() + 1);
    for (let d = new Date(now); d < upper; d.setDate(d.getDate() + 1)) {
      let w = d.getDay();
      if (w === 0) {
        this.days.push({ date: new Date(d), cssClass: "sunday" });
      } else if (w === 6) {
        this.days.push({ date: new Date(d), cssClass: "satday" });
      }
    }
    for (let holiday of HOLIDAYS) {
      let d = new Date(holiday);
      if (now.getTime() <= d.getTime() && d.getTime() <= upper.getTime()) {
        this.days.push({ date: new Date(d), cssClass: "sunday" });
      }
    }
  }
  async undo() {
    this.sum = 0; this.dailys = [];
    if (HOME[this.home].users.filter(uid => { return this.user.id === uid; }).length) {
      const where = { home: this.home, dated: { lower: this.from, upper: this.to } };
      const res = await (this.api.get('query', { table: 'bookmanaging', select: ['*'], where: where, order: { dated: "", stay: "" } }));
      const now = new Date(); let fee: number; let rate: number;
      for (let book of res.bookmanags) {
        book.isChecked = false;
        book.typ = STAYTYP[book.typ].na;
        book.id = Number(book.id); book.amount = Number(book.amount); book.num = Number(book.num);
        this.sum += book.amount;
        if (!this.dailys.length || this.dailys[this.dailys.length - 1].dated !== book.dated) {
          fee = 0; rate = 0;
          const diff = Math.ceil((new Date(book.dated).getTime() - now.getTime()) / 86400000);
          for (let cancel of HOME[this.home].cancels) {
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
    this.disabled = checkNum === 0 || checkNum !== this.dailys.length ? false : true;
    for (let daily of this.dailys) {
      daily.isChecked = !this.disabled;
      for (let book of daily.books) {
        book.isChecked = !this.disabled;
      }
    }
  }
  check(book) {
    if (book.isChecked) {
      this.disabled = false;
    } else {
      this.disabled = true;
      for (let daily of this.dailys) {
        for (let book of daily.books) {
          if (book.isChecked) {
            this.disabled = false;
            break;
          }
        }
      }
    }
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
    if (book.fee > book.amount) {
      book.fee = book.amount;
    } else if (book.fee < 0) {
      book.fee = 0;
    }
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
  async openCalendar() {
    let d = new Date();
    const options: CalendarModalOptions = {
      pickMode: 'range',
      title: `期間を選択`,
      from: new Date(), to: d.setMonth(d.getMonth() + 1),
      weekdays: ['日', '月', '火', '水', '木', '金', '土'],
      closeIcon: true, doneIcon: true, cssClass: 'calendar',
      monthFormat: 'YYYY年M月', defaultScrollTo: new Date(), daysConfig: this.days,
    };
    let myCalendar = await this.modal.create({
      component: CalendarModal,
      componentProps: { options }
    });
    myCalendar.present();
    myCalendar.onDidDismiss().then(event => {
      if (event.data) {
        this.from = event.data.from.string;
        this.to = event.data.to.string;
        this.undo();
      }
    });
  }
  async save() {
    const cancels = [];
    let msg = "";
    for (let daily of this.dailys) {
      let amount = 0; let fee = 0; let user: any = {};
      const books = daily.books.filter(book => { return book.isChecked === true; }).map(book => {
        cancels.push({ id: book.id, dated: book.dated, num: book.num, amount: book.amount, fee: book.fee, payjp: book.payjp, user: book.user });
        amount += book.amount; fee += book.fee; user[book.user] = book.na;
      });
      if (books.length) {
        msg += `${daily.dated} ${Object.keys(user).length}人　料金${amount}円　返金${fee}円<br>`;
      }
    }
    if (cancels.length) {
      if (await this.ui.confirm("キャンセル処理", msg)) {
        this.api.post('cancel', { uid: this.user.id, cancels: JSON.stringify(cancels) }, "処理中").then(res => {
          this.ui.pop('正常にキャンセル及び返金処理されました。');
          this.undo();
        }).catch(err => {
          this.ui.alert('キャンセルできませんでした。');
        })
      }
    }
  }
  ngOnDestroy() {
    this.onDestroy$.next();
  }
}
/*
['id', 'dated', 'num', 'amount', 'payjp','user'
*/
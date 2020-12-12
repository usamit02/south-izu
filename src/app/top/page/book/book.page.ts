import { Component, OnInit, OnDestroy } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AngularFireDatabase } from '@angular/fire/database';
import { ApiService } from '../../../service/api.service';
import { UiService } from '../../../service/ui.service';
import { CalendarModal, CalendarModalOptions, DayConfig } from 'ion2-calendar';
import { UserService } from '../../../service/user.service';
import { User } from '../../../class';
@Component({
  selector: 'app-book',
  templateUrl: './book.page.html',
  styleUrls: ['./book.page.scss'],
})
export class BookPage implements OnInit, OnDestroy {
  user: User;
  book: Book;
  private onDestroy$ = new Subject();
  constructor(private route: ActivatedRoute, private location: Location, private modal: ModalController, private ui: UiService,
    private userService: UserService, private api: ApiService,) { }

  ngOnInit() {
    this.route.params.pipe(takeUntil(this.onDestroy$)).subscribe(async params => {
      const res = await this.api.get('query', { select: ['*'], table: 'stay', where: { stay: params.id } });
      if (res.stays.length) {
        const stay = res.stays[0];
        const amount=await this.calculate(stay.from,stay.to,params.id,stay.home,stay.price,stay.num);
        this.userService.$.pipe(takeUntil(this.onDestroy$)).subscribe(user => {
          this.user = user;          
          this.book = { stay: params.id, home: stay.home, user: user.id, na: user.na, avatar: user.avatar, amount: amount, from: new Date(params.from), to: new Date(params.to) };
        });
      } else {
        this.ui.alert('宿泊データがありません。');
      }
    });
  }
  calculate(from: string, to: string, id: number, home: number, price: number, num: number): Promise<number> {    
    const where = { dated: { lower: from, upper: to } };
    return new Promise((resolve, reject) => {
      this.api.get('query', { select: ['*'], table: 'calendar', where: { ...where, home: home } }).then(async res => {
        if (res.calendars.filter(calendar => { return calendar.close == 1; }).length) {
          reject();
        } else {
          let vprice; let vnum;
          for (let calendar of res.calendars) {
            if (calendar.rate) {
              vprice[calendar.dated] = price * calendar.rate;
            }
          }
          const stays = await this.api.get('query', { select: ['*'], table: 'stay_calendar', where: { ...where, id: id } });
          const books = await this.api.get('query', { select: ['*'], table: 'book', where: { ...where, stay: id } });

          for (let calendar of stays.stay_calendars) {
            if (calendar.close) {
              reject();
            }
            if (calendar.num) {
              vnum[calendar.dated] = calendar.num;
            }
            if (calendar.price) {
              vprice[calendar.dated] = calendar.price;
            } else if (calendar.rate) {
              vprice[calendar.dated] = price * calendar.rate;
            }
          }
          let book;
          for (let b of books.books) {
            book[b.dated] = book[b.dated] ? book[b.dated] + 1 : 1;
            if (vnum[b.dated] == null) {
              if (book[b.dated] > num) { reject(); }
            } else {
              if (book[b.dated] > vnum[b.dated]) { reject(); }
            }
          }
          let count = 0; let total = 0;
          Object.keys(vprice).forEach(key => {
            total += vprice[key]; count++;
          })
          total += ((new Date(to).getTime() - new Date(from).getTime()) / 86400000 - count + 1) * price;
          resolve(total);
        }
      }).catch(err => {
        this.ui.alert(`施設カレンダーの読み込みに失敗しました。\r\n${err.message}`);
        reject();
      });
    });
  }
  async changeFromto() {
    let d = new Date();
    let days: DayConfig[] = [];
    const options: CalendarModalOptions = {
      pickMode: 'range',
      title: `予約日を選択`,
      from: new Date(), to: d.setFullYear(d.getFullYear() + 1),
      weekdays: ['日', '月', '火', '水', '木', '金', '土'],
      closeIcon: true, doneIcon: true, cssClass: 'calendar',
      monthFormat: 'YYYY年M月', defaultScrollTo: new Date(), weekStart: 1, daysConfig: days,
    };
    let myCalendar = await this.modal.create({
      component: CalendarModal,
      componentProps: { options }
    });
    myCalendar.present();
    myCalendar.onDidDismiss().then(event => {
      if (event.data) {
        this.book.from = new Date(event.data.from.dateObj);
        this.book.to = new Date(event.data.to.dateObj);
      }
    });
  }
  bill(e) {
    this.ui.pop(`${this.book.na}を予約しました。`);
    this.location.back();
  }
  ngOnDestroy() {
    this.onDestroy$.next();
  }
}
interface Book {
  stay: number;
  home: number;
  user: string; na: string; avatar: string;
  amount: number;
  from: Date; to: Date;
  options?: Array<Option>
}
interface Option {
  id: number;
  na: string;
  price: number;
}
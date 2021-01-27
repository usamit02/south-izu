import { Component, OnInit, Input } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { AngularFireDatabase } from '@angular/fire/database';
import { ApiService } from '../../../service/api.service';
import { UiService } from '../../../service/ui.service';
@Component({
  selector: 'app-cancel',
  templateUrl: './cancel.component.html',
  styleUrls: ['./cancel.component.scss'],
})
export class CancelComponent implements OnInit {
  @Input() book;
  @Input() user;
  @Input() cancels;
  books = [];
  fee: number;
  rates = [];
  constructor(private api: ApiService, public modal: ModalController, private ui: UiService, private db: AngularFireDatabase,) { }
  ngOnInit() {
    for (let cancel of this.cancels) {
      const key = Number(Object.keys(cancel)[0]);
      this.rates.push({ day: key, percent: cancel[key] });
    }
    let now = new Date();
    let where = { payjp: this.book.payjp, dated: { lower: `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}` } };
    this.api.get('query', { select: ['id', 'dated', 'num', 'amount', 'payjp','user'], table: 'book', where: where }).then(res => {
      let fee = 0;
      this.books = res.books.map(book => {
        const diff = Math.ceil((new Date(book.dated).getTime() - now.getTime()) / 86400000);
        if (diff >= 0) {
          book.cancel = 0; book.fee = 0; book.isChecked = true;
          for (let cancel of this.cancels) {
            const key = Number(Object.keys(cancel)[0]);
            if (diff <= key) {
              book.cancel = cancel[key];
              book.fee = Math.floor(book.amount * cancel[key] / 100);
              fee += book.fee;
              break;
            }
          }
        }
        return book;
      })
      this.fee = fee ? fee : null;
    });
  }
  sumFee() {
    this.fee = null;
    for (let book of this.books) {
      if (book.isChecked) {
        this.fee = this.fee == null ? book.fee : this.fee + book.fee;
      }
    }
  }
  async save() {
    const cancels = this.books.filter(book => { return book.isChecked === true; });
    this.api.post('cancel', { uid: this.user.id, cancels: JSON.stringify(cancels) }, "処理中").then(res => {
      this.ui.pop('正常にキャンセル及び返金処理されました。');
      this.modal.dismiss(true);
    }).catch(err => {
      this.ui.alert('キャンセルできませんでした。');
    })
  }
}

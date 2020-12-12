import { Component, OnInit, OnChanges, Input, Output, EventEmitter } from '@angular/core';
import { FormControl, FormBuilder, Validators } from '@angular/forms';
import { ApiService } from '../../../service/api.service';
import { UiService } from '../../../service/ui.service';
import { APIURL } from '../../../../environments/environment';
declare var Payjp;
@Component({
  selector: 'app-bill',
  templateUrl: './bill.component.html',
  styleUrls: ['./bill.component.scss'],
})
export class BillComponent implements OnInit, OnChanges {
  @Input() user;
  @Input() book;
  @Output() bill = new EventEmitter();
  payjp;
  card = { last4: "", brand: "", exp_year: null, exp_month: null, change: false };
  cardNumber = new FormControl("", [Validators.pattern(/^(([0-9]{4}-[0-9]{4}-[0-9]{4}-[0-9]{4})|([0-9]{16}))$/), Validators.required]);
  cardCvc = new FormControl("", [Validators.pattern(/^([0-9]{3})$/), Validators.required]);
  cardRimit = new FormControl("2020-6", Validators.required);
  cardForm = this.builder.group({
    cardNumber: this.cardNumber, cardCVC: this.cardCvc, cardRimit: this.cardRimit,
  });
  whatCvc: boolean = false;
  cardimg = APIURL + "img/visamaster.jpg"; cvcimg = APIURL + "img/cvc.jpg";
  options=[];
  total:number;
  constructor(private api: ApiService, private ui: UiService, private builder: FormBuilder, ) { }

  ngOnInit() {
    Payjp.setPublicKey('pk_test_a77ab4464e1cecb66c3d1b21');//"pk_live_087f0146e09e1f1eceaf0750");
    this.total=this.book.total;
  }
  ngOnChanges() {
    this.api.get('card', { uid: this.user.id }).then(res => {      
      this.card = res.card;
    }).catch(() => {
      this.ui.alert(`カード読込に失敗しました。`);
    });
  }
  newpay() {
    this.ui.loading("トークン作成中");
    let d = new Date(this.cardRimit.value);
    let y = d.getFullYear();
    let m = d.getMonth() + 1;
    let card = { number: this.cardNumber.value.replace(/-/g, ''), cvc: this.cardCvc.value, exp_month: m, exp_year: y };
    Payjp.createToken(card, (s, res) => {
      this.ui.loadend();
      if (res.error) {
        this.ui.alert("クレジットカード情報の取得に失敗しました。");
      } else {
        this.billClick(res.id);
      }
    });
  }
  billClick(token: string) {
    this.api.post('bill', { uid: this.user.id, na: this.user.na, stay_id: this.book.id, token: token, amount: this.total,
      from:this.dateFormat(this.book.from),to:this.dateFormat(this.book.to) }, '決済中').then(res => {
      this.bill.emit(res);
    }).catch(() => {
      this.ui.alert(`決済手続きに失敗しました。`);
    });
  }
  dateFormat(date = new Date()) {//MySQL用日付文字列作成'yyyy-M-d H:m:s'    
    var y = date.getFullYear();
    var m = date.getMonth() + 1;
    var d = date.getDate();   
    return y + "-" + m + "-" + d;//+ " " + h + ":" + min + ":" + sec;
  }
}

import { Component, OnInit, OnChanges, Input, Output, EventEmitter } from '@angular/core';
import { FormControl, FormBuilder, Validators } from '@angular/forms';
import { ApiService } from '../../../service/api.service';
import { UiService } from '../../../service/ui.service';
import { APIURL } from '../../../../environments/environment';
declare var Payjp;
@Component({
  selector: 'app-pay',
  templateUrl: './pay.component.html',
  styleUrls: ['./pay.component.scss'],
})
export class PayComponent implements OnInit, OnChanges {
  @Input() user;
  @Input() dest;
  @Output() pay = new EventEmitter();
  payjp;
  card = { last4: "", brand: "", exp_year: null, exp_month: null, change: false };
  cardNumber = new FormControl("", [Validators.pattern(/^(([0-9]{4}-[0-9]{4}-[0-9]{4}-[0-9]{4})|([0-9]{16}))$/), Validators.required]);
  cardCvc = new FormControl("", [Validators.pattern(/^([0-9]{3})$/), Validators.required]);
  cardRimit = new FormControl("2020-6", Validators.required);
  cardForm = this.builder.group({
    cardNumber: this.cardNumber, cardCVC: this.cardCvc, cardRimit: this.cardRimit,
  });
  whatCvc: boolean = false;
  plan = { id: null, amount: null, billing_day: null, trial_days: null, auth_days: null, prorate: null };
  price;
  billing_day;
  trial_days;
  auth_days;
  cardimg = APIURL + "img/visamaster.jpg"; cvcimg = APIURL + "img/cvc.jpg";
  constructor(private api: ApiService, private ui: UiService, private builder: FormBuilder, ) { }

  ngOnInit() {
    Payjp.setPublicKey("pk_live_087f0146e09e1f1eceaf0750");
  }
  ngOnChanges() {
    this.api.get('plan', { uid: this.user.id, support: this.dest.id }).then(res => {
      if (!res.plan.billing_day && !res.plan.auth_days) {
        let date = new Date();
        date.setDate(date.getDate() + res.plan.trial_days);
        res.plan.billing_day = date.getDate();
      }
      this.plan = res.plan;
      this.card = res.card;
    }).catch(() => {
      this.ui.alert(`プラン読込に失敗しました。`);
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
        this.payClick(res.id);
      }
    });
  }
  payClick(token: string) {
    this.api.post('pay', { uid: this.user.id, na: this.user.na, plan: this.plan.id, token: token, dest: this.dest.id }, '決済中').then(res => {
      this.pay.emit(res);
    }).catch(() => {
      this.ui.alert(`決済手続きに失敗しました。`);
    });
  }
}

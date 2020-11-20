import { Component, OnInit, OnDestroy } from '@angular/core';
import { Platform,MenuController } from '@ionic/angular';
import * as firebase from 'firebase';
import { AngularFireAuth } from '@angular/fire/auth';
import { UiService } from '../../../service/ui.service';
import { Router } from '@angular/router';
import { UserService } from '../../../service/user.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { FormControl, FormBuilder, Validators } from '@angular/forms';
import { Location } from '@angular/common';
import { WindowService } from '../../../service/window';
import { AlertController } from '@ionic/angular';
@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage implements OnInit, OnDestroy {
  email = new FormControl("usamit@gmail.com", [Validators.email, Validators.required]);
  password = new FormControl("kx125l1", [Validators.required]);
  phone = new FormControl("", [Validators.pattern(/^(([0-9]{2,4}-[0-9]{2,4}-[0-9]{3,4})|([0-9]{9,11}))$/), Validators.required]);
  mailForm = this.builder.group({
    email: this.email,password:this.password
  });
  phoneForm = this.builder.group({
    phone: this.phone,
  });
  windowRef;
  recaptchaWidgetId;
  recaptchaOK: boolean = false;
  private onDestroy$ = new Subject();
  constructor(private menu: MenuController, private fireAuth: AngularFireAuth, private ui: UiService, private user: UserService,
    private router: Router, private builder: FormBuilder, private location: Location, private window: WindowService,
    private alert: AlertController, private platform: Platform,) {
    //this.menu.enable(false, 'custom');split-paneを無効にする場合
  }
  ngOnInit() {
    if (location.search) {
      this.user.mailLink(location.href);
    }
    this.user.$.pipe(takeUntil(this.onDestroy$)).subscribe(user => {
      if (user.id) {
        if (user.na) {
          this.ui.pop(`ようこそ${user.na}さん`);
          if (location.search) {
            this.router.navigate(['/']);
          } else {
            this.location.back();
          }
        } else {
          this.router.navigate(['/regist']);
        }
      }
    });
    /*this.windowRef = this.window.windowRef;
    this.windowRef.recaptchaVerifier = new firebase.auth.RecaptchaVerifier('recaptcha-container', {
      callback: responseToken => {
        this.recaptchaOK = true;
      }
    });
    this.windowRef.recaptchaVerifier.render().then(res => {
      this.recaptchaWidgetId = res;
    });*/
  }
  loginMailLink() {
    this.fireAuth.sendSignInLinkToEmail(this.email.value, { url: location.href, handleCodeInApp: true }).then(() => {
      localStorage.setItem('emailForSignIn', this.email.value);
      this.ui.alert("ログイン用メールを送信しました。\r\nメール内のリンクをクリックしてログインしてください。");
    }).catch(err => {
      let msg: string;
      switch (err.code) {
        case "auth/invalid-email":
          msg = "メールアドレスの形式が正しくありません。"; break;
        case "auth/email-already-in-use":
          msg = "このメールアドレスは既に使用されています。別のメールアドレスを入力してください。"; break;
        default:
          msg = "登録に失敗しました。\r\n" + err.toString();
      }
      this.ui.alert(msg);
    });
  }
  loginPhone() {
    let phone: string = this.phone.value;
    phone = "+81" + phone.replace(/-/g, "").slice(1);
    this.fireAuth.signInWithPhoneNumber(phone, this.windowRef.recaptchaVerifier).then(result => {
      this.windowRef.confirmationResult = result;
      this.verifySmsCode();
    }).catch(err => {
      this.windowRef.grecaptcha.reset(this.recaptchaWidgetId);
      this.ui.alert("SMSメッセージの発行に失敗しました。\r\n" + err.toString());
    });
  }
  async verifySmsCode() {
    const alert = await this.alert.create({
      header: 'SMS確認コード',
      message: '６桁の数字',
      inputs: [{
        name: "code", type: "number", min: 0, max: 999999
      }],
      buttons: [
        {
          text: 'キャンセル',
          role: 'cancel',
          cssClass: 'secondary',
          handler: () => {
            this.windowRef.grecaptcha.reset(this.recaptchaWidgetId);
          }
        }, {
          text: '検証',
          handler: (input) => {
            /*
            if (this.fireAuth.currentUser.uid) {//既にログイン済みなら電話番号を追加
              const verificationId = this.windowRef.confirmationResult.verificationId;
              const phoneCredential = firebase.auth.PhoneAuthProvider.credential(verificationId, input.code);
              this.fireAuth.currentUser.linkWithCredential(phoneCredential).catch(err => {
                this.ui.alert("電話番号の検証追加に失敗しました。\r\n" + err.toString());
              });
            } else {//電話番号アカウントでログイン
              this.windowRef.confirmationResult.confirm(input.code).then(res => {
                let a = res;
              }).catch(error => {
                this.ui.alert("検証に失敗しました。\r\n" + error.toString());
              });
            }
            */
          }
        }
      ]
    });
    await alert.present();
  }
  loginSns(button: string) {

      let provider;//: firebase.auth.AuthProvider;
      if (button === "twitter") {
        provider = new firebase.default.auth.TwitterAuthProvider();
      } else if (button === "facebook") {
        provider = new firebase.default.auth.FacebookAuthProvider();
      } else if (button === "google") {
        provider = new firebase.default.auth.GoogleAuthProvider();
        provider.setCustomParameters({ prompt: 'select_account' });
      }
      this.fireAuth.signInWithPopup(provider).then(() => {
      }).catch(err => {
        this.ui.alert(button + "のログインに失敗しました。\r\n" + err.toString());
      })
    }
  loginEmail() {
    this.fireAuth.signInWithEmailAndPassword(this.email.value,this.password.value).then(async user=>{
      
    }).catch(err=>{
      this.ui.alert("ログインに失敗しました。\r\n" + err.toString());
      console.log(`login fail ${err.message}`);
    })    
  }
  registerEmail() {
    this.fireAuth.createUserWithEmailAndPassword(this.email.value,this.password.value).then(async user=>{
      
    }).catch(err=>{
      this.ui.alert("新規登録に失敗しました。\r\n" + err.toString());
      console.log(`register fail ${err.message}`);
    })    
  }
  
  ngOnDestroy() {
    this.onDestroy$.next();
  }
}

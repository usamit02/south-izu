import { Injectable } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/database';
import * as firebase from 'firebase';
import 'firebase/messaging';
import { UserService } from './user.service';
@Injectable({
  providedIn: 'root',
})
export class MessagingService {
  private messaging = firebase.default.messaging();
  constructor(private db: AngularFireDatabase, private user: UserService, ) {
  }
  private updateToken(token): Promise<any> {
    return new Promise(async (resolve, reject) => {
      const user = await this.user.get();
      if (user.id) {
        await this.db.database.ref(`notify/push/${user.id}`).update({ token: token }).catch(err => { reject(err); });
        resolve(true);
      } else {
        reject();
      }
    });
  }
  getPermission(): Promise<any> {
    return new Promise((resolve, reject) => {
      Notification.requestPermission().then(async permission => {
        if (permission === 'default' || permission === 'granted') {
          const token = await this.messaging.getToken();
          await this.updateToken(token);
          resolve(true);
        } else if (permission === 'denied') {
          alert(`通知はブラウザの設定によりブロックされています。\r\nブロックを解除してから再操作してください。`);
          reject();
        } else {
          throw new Error('permisson must have default,granted or denied');
        }
      }).catch((err) => {
        if (err.code === "messaging/token-unsubscribe-failed") {
          alert(`既知のFirebaseバグです。もう一度試してみてください。`);
        } else {
          alert(`通知パーミッションの取得に失敗しました。\r\n${err}`);
        }
        reject();
      });
    });
  }
  init() {
    this.messaging.usePublicVapidKey('BMi7hB8gLGjObPJjZfvhTIdW23hjk7pfpzz1FPXXaOG50XsXeikEx-UoA-orOHb3Ck3SuEaJm6dyF-SG9W9CV2A');
    this.messaging.onMessage(payload => {
      console.log(`メッセージング受信`);
      const title = 'セクシャルレポート';
      const options = {
        body: payload.body,
        icon: payload.icon
      };
      const notification = new Notification(title, options);
    });
    this.messaging.onTokenRefresh(() => {
      this.messaging.getToken().then(token => {
        this.user.$.subscribe(() => {
          this.updateToken(token);
        });
      }).catch(err => {
        console.error(`FCMリフレッシュトークンの取得及び保存に失敗しました。${err}`);
      });
    });
  }
}
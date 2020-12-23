import { Component, OnInit, Input } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
@Component({
  selector: 'app-eval',
  templateUrl: './eval.component.html',
  styleUrls: ['./eval.component.scss'],
})
export class EvalComponent implements OnInit {
  @Input() user:string;
  @Input() author:string;
  @Input() typ:string;
  @Input() id:number; 
  @Input() na:string;
  eval:string=null;
  constructor(private store:AngularFirestore ) { }
  ngOnInit() {
    this.store.doc(`${this.typ}/${this.id}/eval/${this.user}`).get().toPromise().then(snap => {
      this.eval = snap.exists ? snap.data().id : null;
    });
  }
  evaluation(val) {
    this.store.doc(`${this.typ}/${this.id}/eval/${this.user}`).set({ id: val, uid: this.author, na: this.na, upd: new Date() }).then(() => {
      this.eval = val;
    }).catch(err => {
      alert(`評価の書き込みに失敗しました\r\n${err.message}`);
    });
  }
}

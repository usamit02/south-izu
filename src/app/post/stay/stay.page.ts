import { Component, OnDestroy, OnInit } from '@angular/core';
import { ModalController, } from '@ionic/angular';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { FormControl, FormBuilder, Validators } from '@angular/forms';
import { User } from '../../class';
import { UserService } from '../../service/user.service';
import { ApiService } from '../../service/api.service';
import { UiService } from '../../service/ui.service';
@Component({
  selector: 'app-stay',
  templateUrl: './stay.page.html',
  styleUrls: ['./stay.page.scss'],
})
export class StayPage implements OnInit,OnDestroy {
  user:User;
  params = { id: null };
  from: Date = new Date();
  to: Date = new Date();
  calendar={id: new FormControl(0, [Validators.required]),price: new FormControl(0),rate: new FormControl(0),close: new FormControl(0)}
  calendarForm = this.builder.group({
    id: this.calendar.id, price:this.calendar.price,rate:this.calendar.rate,close:this.calendar.close,
  });
  stay={id: new FormControl(0, [Validators.required]),typ: new FormControl(0, [Validators.required]),
    na: new FormControl("", [Validators.minLength(2), Validators.maxLength(20), Validators.required]),
    txt: new FormControl("", [Validators.minLength(2), Validators.maxLength(600), Validators.required]),
    img: new FormControl(""),simg: new FormControl(""),price: new FormControl(0, [Validators.required]),
    num: new FormControl(0, [Validators.required]),icon: new FormControl(0, [Validators.required]),
    close: new FormControl(0), chat: new FormControl(1)}
  stayForm = this.builder.group({
    id: this.stay.id,  na: this.stay.na, txt: this.stay.txt,img: this.stay.img, simg: this.stay.simg, price:this.stay.price,
    num:this.stay.num,icon: this.stay.icon, close:this.stay.close,chat:this.stay.chat
  });
  typs=[];
  private onDestroy$ = new Subject();
  constructor(private route:ActivatedRoute,private router:Router,private userService:UserService,private api:ApiService,
    private ui:UiService,private builder: FormBuilder,private modal:ModalController,) { }

  ngOnInit() {
    this.route.params.pipe(takeUntil(this.onDestroy$)).subscribe(params => {
      this.params.id = params.id;
      if (params.id) {
        this.userService.$.pipe(takeUntil(this.onDestroy$)).subscribe(async user => {
          this.user=user;
          if(!user.id){
            this.router.navigate(['login']);
          }else{
            this.load();
          }
        });
      }
    });
  }
  load(){
    this.api.get('query',{select:['*'],from:'stay',where:[{id:this.params.id}]}).then(async res=>{
      if(res.stays.length!==1){
        throw {message:'無効なparam.idです。'};
      };
      const controls = this.stayForm.controls
      for (let key of Object.keys(controls)) {
        if (res.stays[0][key] == null) {
          controls[key].reset();
        } else {
          controls[key].reset(res.stays[0][key].toString());
        }
      }
      const typ=await this.api.get('query',{select:['*'],table:'stay_typ'});
      this.typs=typ.stay_typs;
    }).catch(err=>{
      this.ui.alert(`施設情報の読み込みに失敗しました。\r\n${err.message}`);
    })
  }
  ngOnDestroy() {
    this.onDestroy$.next();
  }
}

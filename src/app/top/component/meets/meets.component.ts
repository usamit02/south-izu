import { Component, OnInit, Input } from '@angular/core';
import { PopoverController } from '@ionic/angular';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { UserComponent } from '../user/user.component';
import { Store } from '../../../service/store.service';
@Component({
  selector: 'app-meets',
  templateUrl: './meets.component.html',
  styleUrls: ['./meets.component.scss'],
})
export class MeetsComponent implements OnInit {
  @Input() user;
  @Input() home;
  users=[];  
  private onDestroy$ = new Subject();
  constructor(private pop: PopoverController,private store:Store,) { }
  ngOnInit() {
    this.store.select(state => state.users).pipe(takeUntil(this.onDestroy$)).subscribe(users => {
      this.users=users;
    });   
  }  
  async popUser(event, uid) {
    const popover = await this.pop.create({
      component: UserComponent,
      componentProps: { id: uid, self: this.user },
      cssClass: 'user'
    });
    return await popover.present();
  }
  ngOnDestroy() {
    this.onDestroy$.next();
  }
}

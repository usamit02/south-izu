import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { Platform } from '@ionic/angular';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { AngularFireDatabase } from '@angular/fire/database';
import { AngularFireFunctions } from '@angular/fire/functions';
import { UserService } from '../../service/user.service';
import { UiService } from '../../service/ui.service';
import { APIURL } from '../../../environments/environment';
@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss']
})
export class Tab1Page implements OnInit, OnDestroy {
  IMGURL=APIURL + 'img/tab1/';
  private onDestroy$ = new Subject();
  constructor(private router:Router,private db: AngularFireDatabase, private userService: UserService, private ui: UiService,
     private functions: AngularFireFunctions,private platform:Platform) { }

  ngOnInit() {
    
  }  
 
  ngOnDestroy() {
    this.onDestroy$.next();
  }
}

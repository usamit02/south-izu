import { Component, OnInit } from '@angular/core';
import { FormControl, FormBuilder,FormArray, Validators } from '@angular/forms';
import { User } from '../../class';
import { UserService } from '../../service/user.service';
import { ApiService } from '../../service/api.service';
import { UiService } from '../../service/ui.service';
@Component({
  selector: 'app-book',
  templateUrl: './book.page.html',
  styleUrls: ['./book.page.scss'],
})
export class BookPage implements OnInit {
  
  
  constructor(private userService:UserService,private api:ApiService,private ui:UiService,) { }

  ngOnInit() {
    
  }
  
}

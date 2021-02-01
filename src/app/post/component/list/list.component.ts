import { Component, OnInit, Input, ViewChildren, ElementRef, QueryList } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { ApiService } from '../../../service/api.service';
@Component({
  selector: 'app-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss'],
})
export class ListComponent implements OnInit {
  @Input() prop;
  @ViewChildren('listRef', { read: ElementRef }) listRefs: QueryList<ElementRef>;
  lists: Array<any> = [];
  search: string;
  col = { s: "6", m: "4", l: "4" };
  constructor(private api: ApiService, public pop: ModalController, ) { }
  ngOnInit() {
    if (this.prop.table) {
      this.col = this.prop.table === 'shop' ? { s: "6", m: "4", l: "4" } : { s: "3", m: "2", l: "2" };
      this.api.get('query', { table: this.prop.table, select: ['id', 'na','kana', 'img', 'simg'], where: this.prop.where, order: { kana: "ASC" } }).then(res => {
        this.lists = res[this.prop.table + "s"];
      });
    } else if (this.prop.reports) {
      this.lists = this.prop.reports;
    } else if (this.prop.columns) {
      this.lists = this.prop.columns;
    } else if (this.prop.markers) {
      this.lists = this.prop.markers;
    } else if(this.prop.lists){
      this.lists = this.prop.lists;
    }
  }
  seek(e) {
    let search = e.target.value;
    let kana = "";
    if (search.match(/^([ぁ-ん]|ー)+$/)) {
      kana = search.replace(/[ぁ-ん]/g, string => {
        return String.fromCharCode(string.charCodeAt(0) + 0x60);
      });
    }
    this.lists.map(list => {
      list.hidden = list.na.indexOf(search) === -1 && list.kana.indexOf(search) === -1 && (!kana || list.kana.indexOf(kana) === -1);
    });
  }
}

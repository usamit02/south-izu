import { Component, OnChanges, OnInit, Input, Output, EventEmitter, SimpleChanges } from '@angular/core';
import { ApiService } from '../../../service/api.service';
import { UiService } from '../../../service/ui.service';
@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss'],
})
export class MapComponent implements OnInit, OnChanges {
  @Input() typ: string;
  @Input() parent: number;
  @Input() undo: boolean;
  @Input() save: boolean;
  @Output() saved = new EventEmitter();
  lat: number = 34.68503331;
  lng: number = 138.85154339;
  openedWindow: number = 1;
  marker: Marker;
  markers: Array<Marker> = [];
  icons=[];
  constructor(private api: ApiService, private ui: UiService,) { }
  ngOnInit() { 
    this.api.get("query", { select: ['id', 'na', 'url'], table: 'markericon',order:{id:"ESC"} }).then(async res => {
      this.icons = res.markericons;
    });
  }
  ngOnChanges(changes: SimpleChanges) {
    if (changes.parent) {
      this.api.get('query', { select: ['id','latlng','na','txt', 'img', 'icon', 'idx'], table: 'story_marker', where: { typ: this.typ, parent: this.parent } }).then(res => {
        this.markers = res.story_markers;
        this.lat=this.markers[0].lat;this.lng=this.markers[0].lng;
      })
    }
  }
  markerClick(marker){

  }
  markerRightClick(marker){

  }
  mouseOver(e,marker){

  }
  openWindow(id) {
    this.openedWindow = id;
  }
  isInfoWindowOpen(id) {
    return this.openedWindow == id;
  }
}
interface Plan {
  from: Date;
  to: Date;
  fromTime?: number;
  toTime?: number;
  value: string;
  range: boolean;
}
interface Marker {
  id: number;
  lat: number;
  lng: number;
  na: string;
  txt: string;
  img: string;
  icon: number;
  idx: number;
}
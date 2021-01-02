import { Component, OnChanges, OnInit, Input, Output, EventEmitter, SimpleChanges } from '@angular/core';
import { Marker, MARKER } from '../../../class';
import { ApiService } from '../../../service/api.service';
import { UiService } from '../../../service/ui.service';
@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss'],
})
export class MapComponent implements OnInit, OnChanges {
  @Input() typ: string;
  @Input() id: number;
  @Input() undo: boolean;
  @Input() save: boolean;
  @Output() saved = new EventEmitter();
  lat: number = 34.68503331;
  lng: number = 138.85154339;
  zoom: number = 6;
  center = { lat: this.lat, lng: this.lng };
  openedWindow: number = 1;
  marker: Marker = MARKER;
  markers: Array<Marker> = [];
  constructor(private api: ApiService, private ui: UiService,) { }
  ngOnInit() { }
  ngOnChanges(changes: SimpleChanges) {
    if (changes.id) {
      this.api.get('query', { select: ['*'], table: 'story_marker', where: { typ: "report", id: this.id } }).then(res => {
        this.markers = res.story_markers;
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

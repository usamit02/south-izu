export const STAYTYPS=[
  {id:1,na:'キャンプ'},
  {id:2,na:'車中泊'},
  {id:3,na:'民泊'},
  {id:4,na:'バンガロー'}
]
export const STAYTYP={
  1:{na:'キャンプ'},
  2:{na:'車中泊'},
  3:{na:'民泊'},
  4:{na:'バンガロー'}
}
export const HOME={
 1:{na:'南伊豆ライダーハウス',path:'southizu-riderhouse',stayTyps:[1,2,3,4],lat:34.68503331,lng:138.85154339,zoom:12,marker:1,
  icon:"http://maps.google.co.jp/mapfiles/ms/icons/rangerstation.png",
  users:['rbcAU6MV38dArpipevYFLoV4YvK2','kZoun4t8D7YKhG8ifr7luuSJ4cw1'],
  txts:['山と川に囲まれた農村の片隅','管理棟','炊事場（予定地）','１０ほどのサイト','敷地面積2000㎡'],
  cancels:[{0:90},{1:70},{3:50},{7:20},{14:10}]
 


  },
 2:{na:'ｂｂロード',path:'bbload',stayTyps:[1,3],lat:34.7660779797,lng:138.93926235,zoom:11,marker:19,icon:"http://maps.google.co.jp/mapfiles/ms/icons/rangerstation.png",
    users:[''],
    txts:['宿は山に囲まれ目の前には美しい渓流が流れています','広いテラスではファミリーＢＢＱが楽しめます','西伊豆は絶景の宝庫！ドライブルートには事欠きません。もちろんお勧めコースのご案内も致します','客室','ロビー'],
    cancels:[{0:100}],
  }
}
export const HOLIDAYS =['2021-1-1','2021-1-11','2021-2-11','2021-2-23','2021-3-20','2021-4-29','2021-5-3','2021-5-4','2021-5-5',
'2021-7-22','2021-7-23','2021-8-9','2021-9-20','2021-9-23','2021-11-3','2021-11-23']

export const MARKERICON={
  1:{na:'地点',url:"http://maps.google.co.jp/mapfiles/ms/icons/red-dot.png"},
  2:{na:'スーパー',url:"http://maps.google.co.jp/mapfiles/ms/icons/convienancestore.png"},
  3:{na:'日帰入浴',url:"http://maps.google.co.jp/mapfiles/ms/icons/hotsprings.png"},
  4:{na:'キャンプ場',url:"http://maps.google.co.jp/mapfiles/ms/icons/campground.png"},
  5:{na:'喫茶店',url:"http://maps.google.co.jp/mapfiles/ms/icons/coffeehouse.png"},
  6:{na:'レストラン',url:"http://maps.google.co.jp/mapfiles/ms/icons/restaurant.png"},
  7:{na:'ファストフード',url:"http://maps.google.co.jp/mapfiles/ms/icons/snack_bar.png"},
  8:{na:'コンビニ',url:"http://maps.google.co.jp/mapfiles/ms/icons/homegardenbusiness.png"},
  9:{na:'トイレ',url:"http://maps.google.co.jp/mapfiles/ms/icons/toilets.png"},
  10:{na:'駐車場',url:"http://maps.google.co.jp/mapfiles/ms/icons/parkinglot.png"},
  11:{na:'港',url:"http://maps.google.co.jp/mapfiles/ms/icons/marina.png"},
  12:{na:'海水浴場',url:"http://maps.google.co.jp/mapfiles/ms/icons/swimming.png"},
  13:{na:'展望',url:"http://maps.google.co.jp/mapfiles/ms/icons/movies.png"},
  99:{na:'ホーム',url:"http://maps.google.co.jp/mapfiles/ms/icons/rangerstation.png"},
}
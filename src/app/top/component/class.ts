export class Mention {
  public id: number;//メンションしたuser.id
  public na: string;//メンションしたuser.na
  public avatar: string
  public description: string;//チャット本文50文字
  public upd: any;
  public url: string;//リンク先
  public page: string;
  public pid: number;
  public thread: string;
  public doc?: string;
}
export class Direct {
  public id: number;
  public uid: string;
  public na: string;
  public upd: Date | any;
  public pid?: string;
  public doc?: string;
  public cursor?: number;//csdをtoDate().getTime()したもの
}
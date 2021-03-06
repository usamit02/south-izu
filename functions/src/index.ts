import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as mailer from 'nodemailer';
import * as google from 'googleapis';
import { FieldValue } from '@google-cloud/firestore';
admin.initializeApp();
const URL = "https://touringstay.web.app";
const typVal: any = { report: "レポート", column: "コラム", marker: "マーカー", plan: "プラン", vehicle: "愛車", blog: "ブログ" };
//----------------------------------------ダイレクト---------------------------------------------
export const directCreate = functions.region('asia-northeast1').firestore.document('direct/{key}').onCreate((snapshot, context) => {
  const doc = snapshot.data();
  const url = `/direct/${context.params.key}`;
  const payload1 = { id: doc.id1, na: doc.na1, avatar: doc.avatar1, upd: doc.upd, url: url };
  admin.firestore().collection('user').doc(doc.id2).collection('direct').doc(context.params.key).set(payload1).then(() => {
    const payload2 = { id: doc.id2, na: doc.na2, avatar: doc.avatar2, upd: doc.upd, url: url };
    admin.firestore().collection('user').doc(doc.id1).collection('direct').doc(context.params.key).set(payload2).catch(err => {
      admin.firestore().collection('user').doc(doc.id2).collection('direct').doc(context.params.key).delete();
      console.error(`${doc.id1}のダイレクト作成に失敗しました。${err.message}`);
    });
  }).catch(err => {
    console.error(`${doc.id2}のダイレクト作成に失敗しました。${err.message}`);
  });
});
export const directChatCreate = functions.region('asia-northeast1').firestore.document('direct/{key}/chat/{doc}').onCreate((snap, context) => {
  const doc = snap.data();
  admin.firestore().collection('direct').doc(context.params.key).get().then(snapshot => {
    const data: any = snapshot.data();
    const dest = doc.uid === data.id1 ? { id: data.id2, na: data.na2, avatar: data.avatar2 } : { id: data.id1, na: data.na1, avatar: data.avatar1 };//ダイレクト相手方
    const ext = doc.txt.length > 50 ? "..." : "";
    const url = `/direct/${context.params.key}/${Math.floor(doc.upd._seconds)}`;
    const payload = { upd: doc.upd, discription: doc.txt.substring(0, 50) + ext, url: url };
    admin.firestore().collection('user').doc(doc.uid).collection('direct').doc(context.params.key).set(payload, { merge: true });
    admin.firestore().collection('user').doc(dest.id).collection('direct').doc(context.params.key).set(payload, { merge: true });
    admin.firestore().collection('user').doc(dest.id).collection('undirect').add({ pid: context.params.key, id: doc.uid, na: doc.na, avatar: doc.avatar, ...payload });
  }).catch(err => {
    console.error(`${doc.id}のダイレクト読込か書込に失敗しました。${err.message}`);
  });
});
export const undirectCreate = functions.region('asia-northeast1').firestore.document('user/{uid}/undirect/{doc}').onCreate((snap, context) => {
  const doc = snap.data();
  send(context.params.uid, 'direct', `${doc.na}からダイレクト\r\n${doc.discription}`, doc.url, doc.avatar);
});
export const unmentionCreate = functions.region('asia-northeast1').firestore.document('user/{uid}/unmention/{doc}').onCreate((snap, context) => {
  const doc = snap.data();
  send(context.params.uid, 'mention', `${doc.na}からメンション\r\n${doc.discription}`, doc.url, doc.avatar);
});
//---------------------------------ドキュメント作成---------------------------------
export const reportCreate = functions.region('asia-northeast1').database.ref(`report/{id}`).onCreate((snapshot, context) => {
  docCreate("report", snapshot, context);
});
export const columnCreate = functions.region('asia-northeast1').database.ref(`column/{id}`).onCreate((snapshot, context) => {
  docCreate("column", snapshot, context);
});
export const markerCreate = functions.region('asia-northeast1').database.ref(`marker/{id}`).onCreate((snapshot, context) => {
  docCreate("marker", snapshot, context);
});
export const planCreate = functions.region('asia-northeast1').database.ref(`plan/{id}`).onCreate((snapshot, context) => {
  docCreate("plan", snapshot, context);
});
export const blogCreate = functions.region('asia-northeast1').database.ref(`blog/{id}`).onCreate((snapshot, context) => {
  docCreate("blog", snapshot, context);
});
const docCreate = (typ: any, snapshot: any, context: any) => {
  const doc = snapshot.val();
  admin.database().ref(`user/${doc.uid}`).once('value', snap => {
    const user = snap.val();
    const txt = `${typVal[typ]}「${doc.na}」を投稿しました。`; const upd = new Date().getTime(); const url = `/${typ}/${context.params.id}`;
    const payload = { uid: doc.uid, na: user.na, avatar: user.avatar, txt: txt, upd: upd, media: "", url: url };
    admin.database().ref(`talk`).push(payload).catch(err => { console.error(`talk書込みに失敗しました。${typVal[typ]}:${doc.na}\r\n${err.message}`) });
    timeline(payload);
    admin.database().ref(`friender/${doc.uid}`).orderByValue().equalTo('support').once('value', query => {
      query.forEach((snap: any) => {
        send(snap.key, 'supportpost', `${user.na}が${txt}`, url, user.avatar).catch(err => { return `${doc.uid}の${typVal[typ]}「${doc.na}」の投稿通知に失敗しました\r\n${err.message}`; });
      });
    });
    admin.database().ref(`user/${doc.uid}/${typ}`).transaction(val => {
      return (val || 0) + 1;
    }).catch(err => { console.error(`${doc.uid}の${typVal[typ]}＋1に失敗しました。${err}`); });
    score('user', doc.uid, typ, 1000);
    if (typ === 'report') {
      score('shop', doc.shop, typ, 1000);
      score('cast', doc.cast, typ, 1000);
      admin.database().ref(`cast/${doc.cast}/report`).transaction(val => {
        return (val || 0) + 1;
      }).catch(err => { console.error(err); });
      admin.database().ref(`shop/${doc.shop}/report`).transaction(val => {
        return (val || 0) + 1;
      }).catch(err => { console.error(err); });
    }
  });
}
//---------------------------------------チャット---------------------------------------------------------
export const reportChatCreate = functions.region('asia-northeast1').firestore.document('report/{id}/chat/{key}').onCreate((snapshot, context) => {
  chatCreate('report', snapshot, context);
});
export const columnChatCreate = functions.region('asia-northeast1').firestore.document('column/{id}/chat/{key}').onCreate((snapshot, context) => {
  chatCreate('column', snapshot, context);
});
export const markerChatCreate = functions.region('asia-northeast1').firestore.document('marker/{id}/chat/{key}').onCreate((snapshot, context) => {
  chatCreate('marker', snapshot, context);
});
export const planChatCreate = functions.region('asia-northeast1').firestore.document('plan/{id}/chat/{key}').onCreate((snapshot, context) => {
  chatCreate('plan', snapshot, context);
});
export const blogChatCreate = functions.region('asia-northeast1').firestore.document('blog/{id}/chat/{key}').onCreate((snapshot, context) => {
  chatCreate('blog', snapshot, context);
});
export const vehicleChatCreate = functions.region('asia-northeast1').firestore.document('vehicle/{id}/chat/{key}').onCreate((snapshot, context) => {
  chatCreate('vehicle', snapshot, context);
});
export const reportThreadCreate = functions.region('asia-northeast1').firestore.document('report/{id}/chat/{key}/chat/{thread}').onCreate((snapshot, context) => {
  chatCreate('report', snapshot, context);
});
export const columnThreadCreate = functions.region('asia-northeast1').firestore.document('column/{id}/chat/{key}/chat/{thread}').onCreate((snapshot, context) => {
  chatCreate('column', snapshot, context);
});
export const markerThreadCreate = functions.region('asia-northeast1').firestore.document('marker/{id}/chat/{key}/chat/{thread}').onCreate((snapshot, context) => {
  chatCreate('marker', snapshot, context);
});
export const planThreadCreate = functions.region('asia-northeast1').firestore.document('plan/{id}/chat/{key}/chat/{thread}').onCreate((snapshot, context) => {
  chatCreate('plan', snapshot, context);
});
export const blogThreadCreate = functions.region('asia-northeast1').firestore.document('blog/{id}/chat/{key}/chat/{thread}').onCreate((snapshot, context) => {
  chatCreate('blog', snapshot, context);
});
export const vehicleThreadCreate = functions.region('asia-northeast1').firestore.document('vehicle/{id}/chat/{key}/chat/{thread}').onCreate((snapshot, context) => {
  chatCreate('vehicle', snapshot, context);
});
const chatCreate = (page: string, snapshot: any, context: any) => {
  const doc = snapshot.data();
  admin.database().ref(`${page}/${context.params.id}/chat`).transaction(val => {
    return (val || 0) + 1;
  }).catch(err => { console.error(err); });
  const ext = doc.txt.length > 50 ? "..." : "";
  const upd = doc.upd._seconds * 1000;
  let url: any; let key: any;
  if (context.params.thread) {
    url = `/thread/${page}/${context.params.id}/${context.params.key}/${Math.floor(doc.upd._seconds)}`;
    key = context.params.thread;
  } else {
    url = `/${page}/${context.params.id}/${Math.floor(doc.upd._seconds)}`;
    key = context.params.key;
  }
  admin.database().ref(`${page}/${context.params.id}`).once('value', snap => {
    const document = snap.val();
    let typ;
    let message = `${typVal[page]}「${document.na}」`;
    if (context.params.thread) {
      typ = "thread";
      message += `のコメントに${doc.na}から返信がありました。\r\n${doc.txt}`;
    } else {
      typ = "chat";
      message += `に${doc.na}からコメントがありました。\r\n${doc.txt}`;
    }
    send(document.uid, typ, message, url, doc.avatar);
    const source = `${typVal[page]}「${document.na}」`;
    const chat = { source: source, txt: doc.txt, upd: upd, media: doc.media, url: url };
    admin.database().ref(`chat/${doc.uid}/${key}`).set(chat).catch(err => { console.error(`chat書込みに失敗しました。user:${doc.na}\r\n${err.message}`) });
    timeline({ uid: doc.uid, na: doc.na, avatar: doc.avatar, txt: doc.txt, upd: upd, media: doc.media, url: url, source: source }, key);
    if (page === 'report') {
      admin.database().ref(`cast/${document.cast}/chat`).transaction(val => {
        return (val || 0) + 1;
      }).catch(err => { console.error(err); });
      admin.database().ref(`shop/${document.shop}/chat`).transaction(val => {
        return (val || 0) + 1;
      }).catch(err => { console.error(err); });
    }
  });
  const talk = { uid: doc.uid, na: doc.na, avatar: doc.avatar, upd: upd, txt: doc.txt.substring(0, 50) + ext, url: url };
  admin.database().ref(`talk`).push(talk).catch(err => { console.error(`talk書込みに失敗しました。user:${doc.na}\r\n${err.message}`) });
  admin.database().ref(`user/${doc.uid}/chat`).transaction(val => {
    return (val || 0) + 1;
  }).catch(err => { console.error(`${doc.uid}のチャット＋1に失敗しました。${err}`); });
  score('user', doc.uid, 'chat', 50);
}
export const reportChatUpdate = functions.region('asia-northeast1').firestore.document('report/{id}/chat/{key}').onUpdate((change, context) => {
  chatUpdate(change, context);
});
export const columnChatUpdate = functions.region('asia-northeast1').firestore.document('column/{id}/chat/{key}').onUpdate((change, context) => {
  chatUpdate(change, context);
});
export const markerChatUpdate = functions.region('asia-northeast1').firestore.document('marker/{id}/chat/{key}').onUpdate((change, context) => {
  chatUpdate(change, context);
});
export const planChatUpdate = functions.region('asia-northeast1').firestore.document('plan/{id}/chat/{key}').onUpdate((change, context) => {
  chatUpdate(change, context);
});
export const blogChatUpdate = functions.region('asia-northeast1').firestore.document('blog/{id}/chat/{key}').onUpdate((change, context) => {
  chatUpdate(change, context);
});
export const vehicleChatUpdate = functions.region('asia-northeast1').firestore.document('vehicle/{id}/chat/{key}').onUpdate((change, context) => {
  chatUpdate(change, context);
});
export const reportThreadUpdate = functions.region('asia-northeast1').firestore.document('report/{id}/chat/{key}/chat/{thread}').onUpdate((change, context) => {
  chatUpdate(change, context);
});
export const columnThreadUpdate = functions.region('asia-northeast1').firestore.document('column/{id}/chat/{key}/chat/{thread}').onUpdate((change, context) => {
  chatUpdate(change, context);
});
export const markerThreadUpdate = functions.region('asia-northeast1').firestore.document('marker/{id}/chat/{key}/chat/{thread}').onUpdate((change, context) => {
  chatUpdate(change, context);
});
export const planThreadUpdate = functions.region('asia-northeast1').firestore.document('plan/{id}/chat/{key}/chat/{thread}').onUpdate((change, context) => {
  chatUpdate(change, context);
});
export const blogThreadUpdate = functions.region('asia-northeast1').firestore.document('blog/{id}/chat/{key}/chat/{thread}').onUpdate((change, context) => {
  chatUpdate(change, context);
});
export const vehicleThreadUpdate = functions.region('asia-northeast1').firestore.document('vehicle/{id}/chat/{key}/chat/{thread}').onUpdate((change, context) => {
  chatUpdate(change, context);
});
const chatUpdate = (change: any, context: any) => {
  const doc = change.after.data();
  const before = change.before.data();
  if (doc.txt !== before.txt) {
    const upd = doc.upd._seconds * 1000;
    const path = change.after.ref.path.split("/");
    if (path.length > 2) {
      const url = path.length > 5 ? `${path[0]}/${path[1]}/chat/${path[3]}/thread/${upd}` : `${path[0]}/${path[1]}/${upd}`;
      const key = context.params.thread ? context.params.thread : context.params.key;
      console.log(`txt:${doc.txt} before:${before.txt} url2:${url}`);
      admin.database().ref(`${path[0]}/${path[1]}`).once('value', snap => {
        const chat = { txt: doc.txt, upd: upd, media: doc.media, url: url, source: `${typVal[path[0]]}「${snap.val().na}」` };
        admin.database().ref(`chat/${doc.uid}/${key}`).set(chat).catch(err => { console.error(`chat更新に失敗しました。user:${doc.na}\r\n${err.message}`) });
      });
      timeline({ uid: doc.uid, na: doc.na, avatar: doc.avatar, txt: doc.txt, upd: upd, media: doc.media, url: url }, key);
    } else {
      console.error(`パスの取得に失敗しました。 ${path[0]}`);
    }
  }

}
export const reportChatDelete = functions.region('asia-northeast1').firestore.document('report/{id}/chat/{key}').onDelete((snapshot, context) => {
  chatDelete('report', snapshot, context);
});
export const columnChatDelete = functions.region('asia-northeast1').firestore.document('column/{id}/chat/{key}').onDelete((snapshot, context) => {
  chatDelete('column', snapshot, context);
});
export const markerChatDelete = functions.region('asia-northeast1').firestore.document('marker/{id}/chat/{key}').onDelete((snapshot, context) => {
  chatDelete('marker', snapshot, context);
});
export const planChatDelete = functions.region('asia-northeast1').firestore.document('plan/{id}/chat/{key}').onDelete((snapshot, context) => {
  chatDelete('plan', snapshot, context);
});
export const blogChatDelete = functions.region('asia-northeast1').firestore.document('blog/{id}/chat/{key}').onDelete((snapshot, context) => {
  chatDelete('blog', snapshot, context);
});
export const vehicleChatDelete = functions.region('asia-northeast1').firestore.document('vehicle/{id}/chat/{key}').onDelete((snapshot, context) => {
  chatDelete('vehicle', snapshot, context);
});
export const reportThreadDelete = functions.region('asia-northeast1').firestore.document('report/{id}/chat/{key}/chat/{thread}').onDelete((snapshot, context) => {
  chatDelete('report', snapshot, context);
});
export const columnThreadDelete = functions.region('asia-northeast1').firestore.document('column/{id}/chat/{key}/chat/{thread}').onDelete((snapshot, context) => {
  chatDelete('column', snapshot, context);
});
export const markerThreadDelete = functions.region('asia-northeast1').firestore.document('marker/{id}/chat/{key}/chat/{thread}').onDelete((snapshot, context) => {
  chatDelete('marker', snapshot, context);
});
export const planThreadDelete = functions.region('asia-northeast1').firestore.document('plan/{id}/chat/{key}/chat/{thread}').onDelete((snapshot, context) => {
  chatDelete('plan', snapshot, context);
})
export const blogThreadDelete = functions.region('asia-northeast1').firestore.document('blog/{id}/chat/{key}/chat/{thread}').onDelete((snapshot, context) => {
  chatDelete('blog', snapshot, context);
});
export const vehicleThreadDelete = functions.region('asia-northeast1').firestore.document('vehicle/{id}/chat/{key}/chat/{thread}').onDelete((snapshot, context) => {
  chatDelete('vehicle', snapshot, context);
});
const chatDelete = (page: string, snapshot: any, context: any) => {
  const doc = snapshot.data();
  admin.database().ref(`${page}/${context.params.id}/chat`).transaction(val => {
    return (val || 1) - 1;
  }).catch(err => { console.error(err); });
  const key = context.params.thread ? context.params.thread : context.params.key;
  admin.database().ref(`chat/${doc.uid}/${key}`).remove().catch(err => { console.error(`chat削除に失敗しました。user:${doc.na}\r\n${err.message}`) });
  const timelineDelete = (query: any) => {
    query.forEach((snap: any) => {
      admin.database().ref(`timeline/${snap.key}/chat/${key}`).remove().catch(err => {
        console.error(`${snap.key}のタイムライン削除に失敗しました。${err.message}`);
      });
    });
  };
  admin.database().ref(`friender/${doc.uid}`).orderByValue().equalTo('support').once('value', query => { timelineDelete(query); });
  admin.database().ref(`friender/${doc.uid}`).orderByValue().equalTo('follow').once('value', query => { timelineDelete(query); });
  score('user', doc.uid, 'chat', -50);
}
//--------------------------------------------フォロー------------------------------------------------------
export const friendCreate = functions.region('asia-northeast1').database.ref(`friend/{me}/{you}`).onCreate((snapshot, context) => {
  const doc = snapshot.val();
  const me = context.params.me; const you = context.params.you;
  admin.database().ref(`user/${me}/${doc}`).transaction(val => {
    return (val || 0) + 1;
  }).catch(err => { console.error(err); });
  admin.database().ref(`user/${you}/${doc}er`).transaction(val => {
    return (val || 0) + 1;
  }).catch(err => { console.error(err); });
  admin.database().ref(`friender/${you}/${me}`).set(doc).catch(err => { console.error(err); });;
  admin.database().ref(`user/${me}`).once('value', snap => {
    const user = snap.val();
    send(you, 'friend', `${user.na}に${doc}されました。`, `/user/${me}`, user.avatar)
  }).catch(err => { console.error(`${you}への通知に失敗しました\r\n${err.message}`); });
  const point = (doc === 'support' ? 1000 : 0) + (doc === 'follow' ? 200 : 0) - (doc === 'block' ? 200 : 0);
  score('user', you, doc, point);
});
export const friendUpdate = functions.region('asia-northeast1').database.ref(`friend/{me}/{you}`).onUpdate((snapshot, context) => {
  const me = context.params.me; const you = context.params.you;
  const before = snapshot.before.val(); const after = snapshot.after.val();
  console.log(`before:${before} after:${after}  me:${me} you:${you}`);
  admin.database().ref(`user/${me}/${before}`).transaction(val => {
    return (val || 1) - 1;
  }).catch(err => { console.error(err); });
  admin.database().ref(`user/${you}/${before}er`).transaction(val => {
    return (val || 1) - 1;
  }).catch(err => { console.error(err); });
  admin.database().ref(`user/${me}/${after}`).transaction(val => {
    return (val || 0) + 1;
  }).catch(err => { console.error(err); });
  admin.database().ref(`user/${you}/${after}er`).transaction(val => {
    return (val || 0) + 1;
  }).catch(err => { console.error(err); });
  admin.database().ref(`friender/${you}/${me}`).set(after).catch(err => { console.error(err); });
  admin.database().ref(`user/${me}`).once('value', snap => {
    const user = snap.val();
    send(you, 'friend', `${user.na}に${after}されました。`, `/user/${me}`, user.avatar);
  }).catch(err => { console.error(`${you}への通知に失敗しました\r\n${err.message}`); });
  if (before === 'support') {
    admin.database().ref(`user/${you}`).once('value', snap => {
      const user = snap.val();
      send(me, 'admin', `${user.na}のサポート取消手続きが完了しました。`, `/user/${you}/friend/supporter`, user.avatar);
    });
  }
  const beforePoint = (before === 'support' ? -1000 : 0) + (before === 'follow' ? -200 : 0) + (before === 'block' ? 200 : 0);
  const afterPoint = (after === 'support' ? 1000 : 0) + (after === 'follow' ? 200 : 0) + (after === 'block' ? -200 : 0);
  score('user', you, before, beforePoint);
  score('user', you, after, afterPoint);
});
export const friendDelete = functions.region('asia-northeast1').database.ref(`friend/{me}/{you}`).onDelete((snapshot, context) => {
  const doc = snapshot.val();
  const me = context.params.me; const you = context.params.you;
  console.log(`doc:${doc}  me:${me} you:${you}`);
  admin.database().ref(`user/${me}/${doc}`).transaction(val => {
    return (val || 1) - 1;
  }).catch(err => { console.log(err); });
  admin.database().ref(`user/${you}/${doc}er`).transaction(val => {
    return (val || 1) - 1;
  }).catch(err => { console.log(err); });
  admin.database().ref(`friender/${you}/${me}`).remove().catch(err => { console.error(err); });
  const point = (doc === 'support' ? 1000 : 0) + (doc === 'follow' ? 200 : 0) - (doc === 'block' ? 200 : 0);
  score('user', you, doc, -point);
  if (doc === 'support') {
    admin.database().ref(`user/${you}`).once('value', snap => {
      const user = snap.val();
      send(me, 'admin', `${user.na}のサポート取消手続きが完了しました。`, `/user/${you}/friend/supporter`, user.avatar);
    });
  }
});
export const banCreate = functions.region('asia-northeast1').database.ref(`ban/{uid}`).onCreate((snapshot, context) => {
  const uid = context.params.uid;
  admin.database().ref(`friend/${uid}`).remove().catch(err => { console.error(err); });
  admin.database().ref(`friender/${uid}`).remove().catch(err => { console.error(err); });
  score('user', uid, 'ban', -10000);
});
export const frienderDelete = functions.region('asia-northeast1').database.ref(`friender/{me}/{you}`).onDelete((snapshot, context) => {
  const me = context.params.me; const you = context.params.you;
  admin.database().ref(`friend/${you}/${me}`).remove().catch(err => { console.error(err); });
});
//---------------------------------------------------評価----------------------------------------------
export const reportEval = functions.region('asia-northeast1').firestore.document('report/{id}/eval/{user}').onCreate((snapshot, context) => {
  evaluation('report', snapshot, context);
});
export const columnEval = functions.region('asia-northeast1').firestore.document('column/{id}/eval/{user}').onCreate((snapshot, context) => {
  evaluation('column', snapshot, context);
});
export const markerEval = functions.region('asia-northeast1').firestore.document('marker/{id}/eval/{user}').onCreate((snapshot, context) => {
  evaluation('marker', snapshot, context);
});
export const planEval = functions.region('asia-northeast1').firestore.document('plan/{id}/eval/{user}').onCreate((snapshot, context) => {
  evaluation('plan', snapshot, context);
});
export const blogEval = functions.region('asia-northeast1').firestore.document('blog/{id}/eval/{user}').onCreate((snapshot, context) => {
  evaluation('blog', snapshot, context);
});
export const vehicleEval = functions.region('asia-northeast1').firestore.document('vehicle/{id}/eval/{user}').onCreate((snapshot, context) => {
  evaluation('vehilce', snapshot, context);
});
const evaluation = (page: string, snapshot: any, context: any) => {
  const doc = snapshot.data();
  admin.database().ref(`${page}/${context.params.id}/${doc.id}`).transaction(val => {
    return (val || 0) + 1;
  }).catch(err => { console.error(`${typVal[page]}評価プラス１に失敗しました。${err.message}`); });
  admin.database().ref(`user/${doc.uid}/${doc.id}`).transaction(val => {
    return (val || 0) + 1;
  }).catch(err => { console.error(`${typVal[page]}評価によるユーザー評価プラス１に失敗しました。${err.message}`); });
  admin.database().ref(`user/${context.params.user}`).once('value', snap => {
    const user = { id: context.params.user, ...snap.val() };
    const evaluation: any = { good: 'いいね！', bad: "ダメだし" };
    const txt = `「${doc.na}」の${typVal[page]}に${evaluation[doc.id]}しました。`;
    const payload = {
      uid: user.id, na: user.na, avatar: user.avatar, txt: txt, upd: doc.upd._seconds * 1000, media: "",
      url: `/${page}/${context.params.id}`
    };
    timeline(payload);
    admin.database().ref(`${page}/${context.params.id}`).once('value', snap => {
      const document = snap.val();
      let point = user.report + Math.floor(user.column / 2);
      point = doc.id === 'bad' ? 0 - point : point;
      console.log(`評価によるスコア加算:${point}`);
      score('shop', document.shop, doc.id, point);
      score('cast', document.cast, doc.id, point);
      score('user', document.uid, doc.id, point);
    })
  });
}
export const chatEval = functions.region('asia-northeast1').firestore.document('report/{id}/chat/{key}/eval/{user}').onCreate((snapshot, context) => {
  const doc = snapshot.data();
  admin.firestore().doc(`report/${context.params.id}/chat/${context.params.key}`).set({ [doc.id]: FieldValue.increment(1) }, { merge: true }).catch(err => {
    console.error(`チャット評価プラス１に失敗しました。${err.message}`);
  });
  admin.database().ref(`user/${doc.uid}/${doc.id}`).transaction(val => {
    return (val || 0) + 1;
  }).catch(err => { console.error(`チャット評価によるユーザー評価プラス１に失敗しました。${err.message}`); });
  admin.database().ref(`user/${context.params.user}`).once('value', snap => {
    const user = { id: context.params.user, ...snap.val() };
    const evaluation: any = { good: 'いいね！', bad: "ダメだし" };
    const txt = `${doc.na}のコメントに${evaluation[doc.id]}しました。`;
    const payload = { uid: user.id, na: user.na, avatar: user.avatar, txt: txt, upd: doc.upd._seconds * 1000, media: "", url: doc.url };
    timeline(payload, `eval${doc.upd._seconds}`);
    admin.firestore().doc(doc.path).get().then(snap => {
      let chat: any = snap.data();
      chat.upd = doc.upd._seconds * 1000 + 1;
      timeline(chat, snap.id);
    });
  });
  const point = doc.id === 'bad' ? 0 - 100 : 100;
  score('user', context.params.user, doc.id, point);
});
export const tipCreate = functions.region('asia-northeast1').firestore.document('tip/{key}').onCreate((snapshot, context) => {
  const doc = snapshot.data();
  admin.database().ref(`admin`).once('value', snap => {
    snap.forEach((adminUser: any) => {
      send(adminUser.key, "tip", `「${doc.na}」の投稿に「${doc.tiper}」から通報がありました。\r\n${doc.txt}`, doc.url);
    });
  });
});
export const viewReportUpdate = functions.region('asia-northeast1').database.ref(`report/{id}/view`).onUpdate((change, context) => {
  admin.database().ref(`report/${context.params.id}`).once('value', snapshot => {
    const doc = snapshot.val();
    score('shop', doc.shop, 'view', 1);
    score('cast', doc.cast, 'view', 1);
    score('user', doc.uid, 'view', 1);
    admin.database().ref(`cast/${doc.cast}/view`).transaction(val => { return (val || 0) + 1; });
    admin.database().ref(`shop/${doc.shop}/view`).transaction(val => { return (val || 0) + 1; });
  }).catch(err => { console.error(`ビュー更新に失敗しました。${err.message}`); });;
});
export const viewColumnUpdate = functions.region('asia-northeast1').database.ref(`column/{id}/view`).onUpdate((change, context) => {
  admin.database().ref(`column/${context.params.id}`).once('value', snapshot => {
    const doc = snapshot.val();
    score('user', doc.uid, 'view', 1);
  });
});
export const viewMarkerUpdate = functions.region('asia-northeast1').database.ref(`marker/{id}/view`).onUpdate((change, context) => {
  admin.database().ref(`marker/${context.params.id}`).once('value', snapshot => {
    const doc = snapshot.val();
    score('user', doc.uid, 'view', 1);
  });
});
export const viewPlanUpdate = functions.region('asia-northeast1').database.ref(`plan/{id}/view`).onUpdate((change, context) => {
  admin.database().ref(`plan/${context.params.id}`).once('value', snapshot => {
    const doc = snapshot.val();
    score('user', doc.uid, 'view', 1);
  });
});
export const viewBlogUpdate = functions.region('asia-northeast1').database.ref(`blog/{id}/view`).onUpdate((change, context) => {
  admin.database().ref(`blog/${context.params.id}`).once('value', snapshot => {
    const doc = snapshot.val();
    score('user', doc.uid, 'view', 1);
  });
});
export const viewVehicleUpdate = functions.region('asia-northeast1').database.ref(`vehilce/{id}/view`).onUpdate((change, context) => {
  admin.database().ref(`vehilce/${context.params.id}`).once('value', snapshot => {
    const doc = snapshot.val();
    score('user', doc.uid, 'view', 1);
  });
});
export const postCreate = functions.region('asia-northeast1').database.ref(`post/{id}`).onCreate((snapshot, context) => {
  const doc = snapshot.val();
  admin.database().ref(`admin`).once('value', admins => {
    const message = `${doc.user.na}から「${doc.na}」の投稿がありました。審査してください。`;
    admins.forEach((admin: any) => {
      send(admin.key, "admin", message, doc.url, doc.user.avatar);
    });
  }).catch(err => {
    console.error(`${doc.na}の投稿審査通知に失敗しました。${err.message}`);
  });
});
export const avatarUpdate = functions.region('asia-northeast1').database.ref('user/{uid}/avatar').onUpdate((change, context) => {
  const avatar = change.after.val();
  const uid = context.params.uid;
  admin.database().ref(`talk`).orderByChild('uid').equalTo(uid).once('value', talks => {
    talks.forEach(talk => {
      admin.database().ref(`talk/${talk.key}`).update({ avatar: avatar });
    });
  });
  admin.database().ref(`friender/${uid}`).once('value', friends => {
    friends.forEach(friend => {
      if (friend.val() === 'follow' || friend.val() === 'support') {
        admin.database().ref(`timeline/${friend.key}/chat`).orderByChild('uid').equalTo(uid).once('value', timelines => {
          timelines.forEach(timeline => {
            admin.database().ref(`timeline/${friend.key}/chat/${timeline.key}`).update({ avatar: avatar });
          });
        });
      }
    });
  });
  admin.firestore().collectionGroup(`chat`).where("uid", "==", uid).get().then(chats => {
    chats.forEach(chat => {
      console.log(`chatPath:${chat.ref.path}`);
      admin.firestore().doc(`${chat.ref.path}`).update({ avatar: avatar });
    });
  });
  /*
  admin.firestore().collection(`column/{id}/chat/{key}`).where('uid', '==', uid).get().then(snapshot => {
    snapshot.forEach(chat => {
      admin.firestore().doc(`column/`)
    })
  })*/
});

const timeline = (doc: any, key?: string) => {
  const set = (query: any) => {
    query.forEach((snap: any) => {
      admin.database().ref(`timeline/${snap.key}/chat/${key}`).set(doc).catch(err => {//admin.firestore().collection('test').doc(snap.key).collection('timeline').add(payload)
        console.error(`${snap.key}のタイムライン書込みに失敗しました。${err.message}`);
      });
    });
  }
  const push = (query: any) => {
    query.forEach((snap: any) => {
      admin.database().ref(`timeline/${snap.key}/chat`).push(doc).catch(err => {//admin.firestore().collection('test').doc(snap.key).collection('timeline').add(payload)
        console.error(`${snap.key}のタイムライン書込みに失敗しました。${err.message}`);
      });
    });
  }
  console.log(`タイムライン開始　uid:${doc.uid} chat:${key}`);
  admin.database().ref(`friender/${doc.uid}`).orderByValue().equalTo('support').once('value', query => {
    if (key) { set(query) } else { push(query) };
  });
  admin.database().ref(`friender/${doc.uid}`).orderByValue().equalTo('follow').once('value', query => {
    if (key) { set(query) } else { push(query) };
  });
}
const send = async (id: string, typ: string, message: string, url?: string, avatar?: string) => {
  const push = (await admin.database().ref(`notify/push/${id}`).once('value')).val();//.orderByChild(typ).equalTo('true').once('value');  
  if (push && (push[typ] || typ === "admin")) {
    const payload = {
      notification: {
        title: 'ツーリングスティ', // Pushメッセージのタイトル
        body: message, // Pushメッセージ本文
        clickAction: `${URL}${url}`, // Push通知をタップした時に、飛ばすURLを指定
        icon: avatar, // Push通知で使うロゴ
      },
    }
    admin.messaging().sendToDevice(push.token, payload).then(res => {
      console.log(`${id}へのプッシュ通知に成功しました`);
    }).catch(err => {
      console.error(`${id} へのプッシュ通知に失敗しました。 ${err}`);
    });
  } else {
    console.log(`${id}はプッシュ通知対象でありません。push:${push}`);
  }
  const mail = (await admin.database().ref(`notify/mail/${id}`).once('value')).val();
  if (mail && (mail[typ] || typ === "admin")) {
    const OAuth2 = google.google.auth.OAuth2;
    const APP_NAME = "touringstay";
    const clientID = "440896250861-n28clt4aviv07rlm04rldf1a6bmchefh.apps.googleusercontent.com";
    const clientSecret = "L7VB0DfzYowNTbexvlDhWGKB";
    const refreshToken = "1//04ngcnvQ17C7yCgYIARAAGAQSNwF-L9IrWF7It-zXAgpQHGmTv9Ab1FQWD2qkmFFTsF_OC_dA_sjN_lZGxJenAucSZ_qx3RXOV_M";
    const oauth2Client = new OAuth2(
      clientID, clientSecret, "https://developers.google.com/oauthplayground" // Redirect URL
    );
    oauth2Client.setCredentials({
      refresh_token: refreshToken
    });
    oauth2Client.refreshAccessToken().then((tokens: any) => {
      const accessToken = tokens.credentials.access_token;
      const smtpTransport = mailer.createTransport({
        service: "gmail",
        auth: {
          type: "OAuth2",
          user: "touringstay@gmail.com",
          clientId: clientID,
          clientSecret: clientSecret,
          refreshToken: refreshToken,
          accessToken: accessToken
        }
      });

      let mailOptions: any = {
        from: `${APP_NAME} <touringstay@gmail.com>`,
        to: mail.email, //sending to email IDs in app request, please check README.md
        subject: `ツーリングスティ`,
        text: message
      };
      if (url) {
        message = message.replace('\r\n', '<br>');
        mailOptions.html = `${message}<div><a href="${URL}${url}" target="_blank">${URL}${url}</a></div>`;
      }
      smtpTransport.sendMail(mailOptions, (error: any, info: any) => {
        if (error) {
          console.error(`touringstayから${id}へgmailの送信に失敗しました。\r\n${error.message}`);
          smtpTransport.close();
        } else {
          console.log(`${id}へgmailを送信しました。`);
        }
      });
    }).catch(err => {
      console.error("touringstay gmail oauthアクセストークンの取得に失敗しました。\r\n" + err.message);
    });
  } else {
    console.log(`${id}はメール通知対象でありません。push:${mail}`);
  }
}
const score = (typ: string, id: string | number, action: string, score: number) => {
  const today = new Date();
  const Y = today.getFullYear();
  const M = today.getMonth() + 1;
  const D = today.getDate();
  admin.database().ref(`score/${Y}/${M}/${D}/${typ}/${id}/score`).transaction(val => {
    return (val || 0) + score;
  }).catch(err => {
    console.error(`${typ} ${id}のスコアリングに失敗しました。${err.message}`);
  });
  admin.database().ref(`score/${Y}/${M}/${D}/${typ}/${id}/${action}`).transaction(val => {
    const point = score > 0 ? 1 : -1;
    return (val || 0) + point;
  }).catch(err => {
    console.error(`${typ} ${id}のスコアリングに失敗しました。${err.message}`);
  });
}
export const scoreing = functions.region('asia-northeast1').https.onRequest(async (req, res) => {
  let score: any = { cast: {}, shop: {}, user: {} };
  let promises = [];
  const dailyScore = (i: any) => new Promise((resolve, reject) => {
    let day = new Date();
    day.setDate(day.getDate() - i);
    const Y = day.getFullYear();
    const M = day.getMonth() + 1;
    const D = day.getDate();
    admin.database().ref(`score/${Y}/${M}/${D}`).once('value', daily => {
      daily.forEach((typ: any) => {
        typ.forEach((doc: any) => {
          if (!(doc.key in score[typ.key])) score[typ.key][doc.key] = {};
          doc.forEach((action: any) => {
            const point = action.key in score[typ.key][doc.key] ? score[typ.key][doc.key][action.key] : 0;
            score[typ.key][doc.key][action.key] = point + action.val();
          });
        });
      });
      resolve(true);
    }).catch(err => {
      reject(err);
    });
  });
  const monthlyScore = (i: any) => new Promise((resolve, reject) => {
    let day = new Date();
    day.setMonth(day.getMonth() - i);
    const Y = day.getFullYear();
    const M = day.getMonth() + 1;
    admin.database().ref(`total/${Y}/${M}`).once('value', monthly => {
      monthly.forEach((typ: any) => {
        typ.forEach((doc: any) => {
          if (!(doc.key in score[typ.key])) score[typ.key][doc.key] = {};
          doc.forEach((action: any) => {
            score[typ.key][doc.key][action.key] = (score[typ.key][doc.key][action.key] | 0) + action.val();
          });
        });
      });
      resolve(true);
    }).catch(err => {
      reject(err);
    });
  });
  try {
    for (let i = 0; i < 7; i++) {
      promises.push(dailyScore(i));
    }
    await Promise.all(promises);
    admin.database().ref(`total/week`).set(score);
    promises = [];
    for (let i = 7; i < 31; i++) {
      promises.push(dailyScore(i));
    }
    await Promise.all(promises);
    admin.database().ref(`total/month`).set(score);
    const day = new Date();
    if (day.getDate() === 1) {//月初めはtotalに先月の合計を保存し、年scoreを集計
      const Y = day.getFullYear();
      const M = day.getMonth();//先月
      await admin.database().ref(`total/${Y}/${M}`).set(score);
      promises = [];
      for (let i = 0; i < 12; i++) {
        promises.push(monthlyScore(i));
      }
      await Promise.all(promises);
      admin.database().ref(`total/year`).set(score);
    }
    console.log('total score sum done!');
  } catch (err) {
    console.error(`スコア集計処理に失敗しました。${err.message}`);
  };
  res.status(200).send("ok");
});
export const sitemap = functions.https.onRequest((req, res) => {
  res.set('Content-Type', 'application/xml');
  let urls: Array<any> = [];
  let html = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
  const promise = (page: string) => new Promise((resolve, reject) => {
    admin.database().ref(`${page}`).orderByChild('upd').limitToLast(500).once('value').then((snapshot: any) => {
      if (snapshot.exists) {
        snapshot.forEach((doc: any) => {
          const data = doc.val();
          urls.push({ loc: `${URL}/${page}/${doc.key}`, mod: new Date(data.upd), upd: data.upd });
        });
      }
      resolve(true);
    }).catch(err => reject(err));
  });
  Promise.all([promise('report'), promise('column'), promise('marker'), promise('blog'), promise('vehicle')]).then(() => {
    urls.sort((a, b) => {
      if (a.upd < b.upd) {
        return 1;
      } else {
        return -1;
      }
    });
    urls.forEach(url => {
      html += `<url>\n<loc>${url.loc}</loc>\n<lastmod>${url.mod.getFullYear()}-${url.mod.getMonth() + 1}-${url.mod.getDate()}</lastmod>\n</url>\n`;
    });
    res.set('Cache-Control', 'public, max-age=3600, s-maxage=3600');
    res.status(200).send(html + "</urlset>");
  }).catch(err => {
    res.status(500).end();
    throw err;
  });
});
export const rss = functions.https.onRequest((req, res) => {
  res.set('Content-Type', 'application/xml');
  let items: Array<any> = [];
  let html = `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0">\n<channel>\n<title>ツーリングスティ</title>
  <description>ライダー、ドライバー、チャリダー全ての旅人が安心して滞在し、感動を分かち合える場所をオンラインとオフラインにつくります。</description><link>${URL}</link><language>ja</language>`;
  const promise = (page: string) => new Promise((resolve, reject) => {
    admin.database().ref(`${page}`).orderByChild('upd').limitToLast(10).once('value').then((snapshot: any) => {
      if (snapshot.exists) {
        snapshot.forEach((doc: any) => {
          const data = doc.val();
          items.push({ link: `${URL}/${page}/${doc.key}`, date: new Date(data.upd), upd: data.upd, title: data.na, description: data.description });
        });
      }
      resolve(true);
    }).catch(err => reject(err));
  });
  Promise.all([promise('report'), promise('column'), promise('marker'), promise('blog'), promise('vehicle')]).then(() => {
    items.sort((a, b) => {
      if (a.upd < b.upd) {
        return 1;
      } else {
        return -1;
      }
    });
    html += `<lastBuildDate>${items[0].date.toUTCString()}</lastBuildDate>\n`;
    items.forEach(item => {
      html += `<item>\n<title>${item.title}</title>\n<link>${item.link}</link><guid isPermaLink="true">${item.link}</guid>
      <pubDate>${item.date.toUTCString()}</pubDate><description>${item.description}</description>\n</item>\n`;
    });
    res.set('Cache-Control', 'public, max-age=3600, s-maxage=3600');
    res.status(200).send(html + "</channel></rss>");
  }).catch(err => {
    res.status(500).end();
    throw err;
  });
});
// // Start writing Firebase Functions
// // https://firebase.google.com/docs/functions/typescript
//
// export const helloWorld = functions.https.onRequest((request, response) => {
//   functions.logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

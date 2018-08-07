import firebase from 'firebase/app';
import 'firebase/database';

import Vue from 'vue';
import vueCallList from './call_list.vue';
import vuePeerList from './peer_list.vue';

const config = {
  apiKey: process.env["FIREBASE_API_KEY"],
  authDomain: process.env["FIREBASE_AUTH_DOMAIN"],
  databaseURL: process.env["FIREBASE_DATABASE_URL"],
  projectId: process.env["FIREBASE_PROJECT_ID"],
  storageBucket: process.env["FIREBASE_STORAGE_BUCKET"],
  messagingSenderId: process.env["FIREBASE_MESSAGING_SENDER_ID"],
};
firebase.initializeApp(config);

const call_list = new Vue(Object.assign(vueCallList, {
  el: "#call-list",
}));
const peer_list = new Vue(Object.assign(vuePeerList, {
  el: "#peer-list",
}));

const database = firebase.database();
const ref_calls = database.ref('calls');

ref_calls.on('value', (snap) => {
  const list = snap.toJSON();
  if (list) {
    Object.keys(list).forEach(key => {
      call_list.add(key, list[key]);
    });
  }
  console.log("value", list);
});
ref_calls.on('child_added', (snap) => {
  call_list.add(snap.key, snap.val());
  console.log('child_added', snap.key, snap.val(), snap)
});
ref_calls.on('child_changed', (snap) => {
  console.log('child_changed', snap.key, snap.val(), snap)
});
ref_calls.on('child_removed', (snap) => {
  call_list.remove(snap.key);
  console.log('child_removed', snap.key, snap.val(), snap)
});


const ref_peers = database.ref('monitoring_peers');
ref_peers.once('value', (snap) => {
  const list = snap.toJSON();
  if (list) {
    Object.keys(list).forEach(call_key => {
      const peer = list[call_key];
      Object.keys(peer).forEach(key => {
        const item = peer[key];
        item["call_key"] = call_key;
        peer_list.add(key, item);
      });
    });
  }
  console.log("value", list);
});
ref_peers.on('child_added', (snap) => {
  console.log("ref_peers.on('child_added')", {key: snap.key, val: snap.val()});
});
ref_peers.on('child_changed', (snap) => {
  // FIXME 変更後の値が来る call_keyの下に追加された場合や削除された場合、どちらでも呼ばれる
  console.log("ref_peers.on('child_changed')", {key: snap.key, val: snap.val()});
});
ref_peers.on('child_removed', (snap) => {
  console.log("ref_peers.on('child_removed')", {key: snap.key, val: snap.val()});
});


// TODO 通話を選んで、 monitoring_peersを追加する処理 calls側のpushで作られるキーをkeyをキーとして使う
call_list.$on('select', (key) => {
  console.log('call select', key);

  // root
  const ref_rtc = database.ref(`monitoring_peers/${key}`).push();
  // answer待ち受け用
  const ref_answer = database.ref(`monitoring_peers/${key}/${ref_rtc.key}/answer`);

  const config = {"iceServers":[{ "url": "stun:stun.l.google.com:19302" }]};
  const peer = new RTCPeerConnection(config);
  peer.onicecandidate = (event) => {
    // TODO iceを受け渡すか、iceが揃ってからoffer/sdpをセットする
  };

  navigator.mediaDevices.getUserMedia({video: false, audio: true})
    .then(stream => {
      stream.getTracks().forEach(track => {
        console.log('addTrack', track);
        peer.addTrack(track);
      });
    })
    .then(() => {
      peer.createOffer()
        .then(session => {
          console.log('createOffer then', session);
          return Promise.all([
            ref_rtc.update({
              "offer/sdp": session.sdp
            }),
            peer.setLocalDescription(session)
          ]);
        })
        .then(() => {
          console.log('setLocalDescription() and offer/sdp update success');
        })
        .catch(err => {
          console.warn(err);
        });
    });

  console.log(peer);

  ref_rtc.on('value', (snap) => {
    console.log("ref_rtc.on('value')", snap.toJSON());
  });

  // answerがセットされたときの動作
  ref_answer.on('child_added', (snap) => {
    console.log("ref_answer.on('child_added')", snap.val());
  });
});
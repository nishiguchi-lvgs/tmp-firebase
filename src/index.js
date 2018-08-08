import firebase from 'firebase/app';
import 'firebase/database';

import Vue from 'vue';
import vueCallList from './call_list.vue';
import vuePeerList from './peer_list.vue';
import './favicon.ico';

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

const peers = {};

const database = firebase.database();
const ref_calls = database.ref('calls');

// calls
ref_calls.on('value', (snap) => {
  const list = snap.toJSON();
  if (list) {
    Object.keys(list).forEach(key => {
      call_list.add(key, list[key]);
    });
  }
});
ref_calls.on('child_added', (snap) => {
  const call_key = snap.key;
  call_list.add(call_key, snap.val());
  peers[call_key] = {};
  console.log('child_added', {key: call_key, val:snap.val()})
});
ref_calls.on('child_changed', (snap) => {
  console.log('child_changed', {key: snap.key, val:snap.val()})
});
ref_calls.on('child_removed', (snap) => {
  const call_key = snap.key;
  call_list.remove(call_key);
  console.log('child_removed', {key: call_key, val:snap.val()});

  // callが消えたら下位のpeerを全て解放する
  if (peers[call_key]) {
    Object.keys(peers[call_key]).forEach(peer_key => {
      peers[call_key][peer_key].close();
      peers[call_key][peer_key] = null;
    });
    delete peers[call_key];
  }
});

// peers
const ref_peers = database.ref('monitoring_peers');
ref_peers.once('value')
  .then((snap) => {
    const list = snap.toJSON();
    if (list) {
      Object.keys(list).forEach(call_key => {
        peer_list.add(call_key, list[call_key]);
      });
    }
  });

ref_peers.on('child_added', (snap) => {
  peer_list.add(snap.key, snap.val());
  console.log("ref_peers.on('child_added')", {key: snap.key, val: snap.val()});
});
ref_peers.on('child_changed', (snap) => {
  // 変更後の値が来る call_keyの下に追加された場合や削除された場合、どちらでも呼ばれる
  // peer_listではcall_key以下は毎回置き換えてる状態になるので、一応両方に対応してる
  peer_list.add(snap.key, snap.val());
  console.log("ref_peers.on('child_changed')", {key: snap.key, val: snap.val()});
});
ref_peers.on('child_removed', (snap) => {
  peer_list.remove(snap.key);
  console.log("ref_peers.on('child_removed')", {key: snap.key, val: snap.val()});
});

const audio = document.getElementById("local-audio");

// FIXME 複数のStreamを混ぜる方法
const audioContext = new AudioContext();

// TODO 通話を選んで、 monitoring_peersを追加する処理 calls側のpushで作られるキーをkeyをキーとして使う
call_list.$on('select', (key) => {
  console.log('call select', key);

  // root
  const ref_rtc = database.ref(`monitoring_peers/${key}`).push();
  // answer待ち受け用
  const ref_answer = database.ref(`monitoring_peers/${key}/${ref_rtc.key}/answer`);

  const config = {"iceServers": [{"url": "stun:stun.l.google.com:19302"}]};
  const peer = new RTCPeerConnection(config);
  peers[key][ref_rtc.key] = peer;

  peer.onicecandidate = (event) => {
    if (! event.candidate) {
      // icecandidate付きでSDPを送信
      ref_rtc.update({
        "offer/sdp": peer.localDescription.sdp
      })
        .then(() => {
          console.log("update offer/sdp", key);
        })
        .catch(err => {
          console.warn("error update offer/sdp", err)
        });
    } else {
      console.log("peer.onicecandidate", event);
    }
  };

  // FIXME 複数のStreamを混ぜる方法 今のcreateMediaStreamDestinationを使う方法はうまく行かなかった
  const destination = audioContext.createMediaStreamDestination();
  peer.onaddstream = (event) => {
    console.log('-- peer.onaddstream');
    const stream = audioContext.createMediaStreamSource(event.stream);
    stream.connect(destination);
    audio.srcObject = destination.stream;
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
          return peer.setLocalDescription(session);
        })
        .then(() => {
          console.log('setLocalDescription() success');
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
    console.log("ref_answer.on('child_added')", {key: snap.key, val: snap.val()});
    if (snap.key !== "sdp") {
      return;

    }
    const session = new RTCSessionDescription({
      sdp: snap.val(),
      type: "answer",
    });
    peer.setRemoteDescription(session)
      .then(() => {
        console.log("peer.setRemoteDescription(session) success");
      })
      .catch(err => {
        console.warn("peer.setRemoteDescription(session) failure", err)
      });
  });
});

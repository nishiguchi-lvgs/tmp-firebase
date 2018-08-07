<template>
    <table>
        <thead>
            <tr>
                <th>call_key</th>
                <th>peer_key</th>
                <th>offer/sdp</th>
                <th>answer/sdp</th>
            </tr>
        </thead>
        <tbody>
            <tr v-for="item in list">
                <td>{{ item.call_key }}</td>
                <td>{{ item.key }}</td>
                <td><div class="sdp">{{ item.offer ? item.offer.sdp : "" }}</div></td>
                <td><div class="sdp">{{ item.answer ? item.answer.sdp : "" }}</div></td>
            </tr>
        </tbody>
    </table>
</template>
<script>
  export default {
    data() {
      return {
        list: [],
        keys: [],
      }
    },
    methods: {
      add(key, value) {
        if (this.keys.includes(key)) {
          return;
        }

        this.keys.push(key);
        this.list.push(Object.assign({key}, value));
        console.log('add', key, this.list, this.keys);
      },
      remove(key) {
        this.list = this.list.filter(item => item.key !== key);
        this.keys = this.keys.filter(item_key => item_key !== key);
        console.log('remove', key, this.list, this.keys);
      },
    }
  }
</script>
<style scoped>
    .sdp {
        font-size: 80%;
        font-family: monospace;
        white-space:pre-wrap;
        word-wrap:break-word;
        max-height: 100px;
        overflow: auto;
    }
</style>
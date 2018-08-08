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
            <template v-for="(items, call_key) in list">
                <tr v-for="(item, peer_key) in items">
                    <td>{{ call_key }}</td>
                    <td>{{ peer_key }}</td>
                    <td><div class="sdp">{{ item.offer ? item.offer.sdp : "" }}</div></td>
                    <td><div class="sdp">{{ item.answer ? item.answer.sdp : "" }}</div></td>
                </tr>
            </template>
        </tbody>
    </table>
</template>
<script>
  export default {
    data() {
      return {
        list: {}
      }
    },
    methods: {
      add(call_key, peers) {
        this.$set(this.list, call_key, peers);
        console.log('add', call_key, this.list);
      },
      remove(call_key) {
        this.$delete(this.list, call_key);
        console.log('remove', call_key, this.list);
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
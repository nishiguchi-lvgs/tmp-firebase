<template>
    <table>
        <thead>
            <tr>
                <th>key</th>
                <th>call_sid</th>
                <th>identity</th>
                <th>incoming</th>
                <th>number</th>
                <th>to</th>
                <th>monitor</th>
            </tr>
        </thead>
        <tbody>
            <tr v-for="item in list">
                <td>{{ item.key }}</td>
                <td>{{ item.call_sid }}</td>
                <td>{{ item.identity }}</td>
                <td>{{ item.incoming}} </td>
                <td>{{ item.number }}</td>
                <td>{{ item.to }}</td>
                <td><button @click="select(item.key)">select</button></td>
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
      select(key) {
        this.$emit('select', key);
      }
    }
  }
</script>
<style scoped>
</style>
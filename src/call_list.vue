<template>
    <table>
        <thead>
            <tr>
                <th>monitor</th>
                <th>key</th>
                <th>call_sid</th>
                <th>identity</th>
                <th>incoming</th>
                <th>number</th>
                <th>to</th>
            </tr>
        </thead>
        <tbody>
            <tr v-for="(item, key) in list">
                <td><button @click="select(key)">select</button></td>
                <td>{{ key }}</td>
                <td>{{ item.call_sid }}</td>
                <td>{{ item.identity }}</td>
                <td>{{ item.incoming}} </td>
                <td>{{ item.number }}</td>
                <td>{{ item.to }}</td>
            </tr>
        </tbody>
    </table>
</template>
<script>
  export default {
    data() {
      return {
        list: {},
      }
    },
    methods: {
      add(key, value) {
        this.$set(this.list, key, value);
        console.log('add', key, this.list);
      },
      remove(key) {
        this.$delete(this.list, key);
        console.log('remove', key, this.list);
      },
      select(key) {
        this.$emit('select', key);
      }
    }
  }
</script>
<style scoped>
</style>
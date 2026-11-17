<template>
  <div class="thaid-gate">
    <img alt="" class="thaid-icon" src="/thaid.png" />
    <template v-if="!revealed">
      <h2>ยืนยันตัวตนครั้งแรก</h2>
      <p>{{ detail }}</p>
      <p class="thaid-note">แอปยังไม่รู้ชื่อหรือเลขบัตร จนกว่าจะเปิด ThaiD</p>
      <v-btn class="thaid-action" color="primary" rounded="lg" size="large" @click="revealed = true">เปิด ThaiD</v-btn>
    </template>
    <template v-else>
      <h2>ได้ชื่อจาก ThaiD แล้ว</h2>
      <div class="thaid-name">{{ name }}</div>
      <p>{{ relation }} · บัตร {{ maskedId }}</p>
      <p class="thaid-note">ได้แค่ชื่อกับผลว่าเป็นบุคคลจริง ไม่ได้ดึงข้อมูลสุขภาพ</p>
      <v-btn class="thaid-action" color="primary" rounded="lg" size="large" @click="emit('confirm')">ใช้ชื่อนี้และไปต่อ</v-btn>
    </template>
  </div>
</template>

<script setup lang="ts">
  import { ref } from 'vue'

  defineProps<{
    name: string
    relation: string
    maskedId: string
    detail: string
  }>()

  const emit = defineEmits<{ confirm: [] }>()
  const revealed = ref(false)
</script>

<style scoped>
  .thaid-gate {
    min-height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
    padding: 8px 8px 20px;
  }

  .thaid-icon {
    width: 56px;
    height: 56px;
    border-radius: 14px;
    margin-bottom: 20px;
  }

  h2 {
    margin: 0 0 8px;
    font-size: 1.35rem;
    font-weight: 600;
    letter-spacing: 0;
  }

  p {
    margin: 0;
    max-width: 34ch;
    color: #5c564e;
    line-height: 1.55;
  }

  .thaid-note {
    margin-top: 8px;
  }

  .thaid-name {
    margin-bottom: 4px;
    font-size: 1.2rem;
    font-weight: 700;
  }

  .thaid-action {
    width: 100%;
    max-width: 280px;
    margin-top: 28px;
    flex: none;
  }
</style>

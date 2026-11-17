<template>
  <article class="care-update">
    <header>
      <v-icon color="primary" icon="mdi-heart-outline" size="22" />
      <div>
        <div class="title">lhanja care update</div>
        <div class="sub">ข้อความแจ้งอาการจากทีมดูแล</div>
      </div>
    </header>
    <p v-if="visit" class="visit">{{ visit }}</p>
    <p class="hello">{{ greeting }}</p>
    <p>วันนี้ทีมดูแลขอแจ้งความคืบหน้าเกี่ยวกับอาการของ{{ elderLabel }}ค่ะ</p>
    <ul>
      <li><span>อาการ:</span> {{ symptom || 'ยังไม่ได้เลือก' }}</li>
      <li><span>การรักษา:</span> {{ treatment || 'ยังไม่ได้เลือก' }}</li>
      <li><span>ขั้นตอนถัดไป:</span> {{ next || 'ยังไม่ได้เลือก' }}</li>
      <li v-if="followUp"><span>นัดครั้งต่อไป:</span> {{ followUp }}</li>
    </ul>
    <p v-if="extra" class="extra">{{ extra }}</p>
    <p class="closing">{{ closing }}</p>
    <p class="caption">{{ caption }}</p>
  </article>
</template>

<script setup lang="ts">
  defineProps<{
    greeting: string
    elderLabel: string
    symptom: string
    treatment: string
    next: string
    closing: string
    followUp?: string
    visit?: string
    extra?: string
    caption?: string
  }>()
</script>

<style scoped>
  .care-update {
    background: #fff;
    color: #241c16;
    border: 1px solid #e4d8c8;
    border-radius: 16px;
    padding: 14px;
    font-size: 13px;
    line-height: 1.5;
  }

  header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 12px;
  }

  .title {
    font-weight: 700;
  }

  .sub,
  .visit,
  .caption {
    color: #6d6256;
    font-size: 12px;
  }

  .hello {
    margin: 0 0 8px;
  }

  ul {
    margin: 8px 0;
    padding-left: 18px;
  }

  li span {
    font-weight: 700;
  }

  .extra,
  .closing {
    margin: 8px 0 0;
  }

  .caption {
    margin: 12px 0 0;
  }
</style>

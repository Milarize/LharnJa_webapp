<template>
  <div class="thaid-gate">
    <template v-if="!revealed">
      <div class="welcome">
        <div class="mark" aria-hidden="true">
          <v-icon color="primary" icon="mdi-hand-heart" size="22" />
        </div>

        <h1>หลานจ๋า</h1>
        <p class="lead">{{ kind === 'provider' ? 'อยู่ดูแลที่โรงพยาบาล แล้วส่งโน้ตให้ครอบครัว' : 'มีคนอยู่ด้วยตอนพบแพทย์' }}</p>
      </div>

      <ol class="story">
        <li v-for="step in steps" :key="step.title">
          <span class="dot" aria-hidden="true">
            <v-icon color="primary" :icon="step.icon" size="20" />
          </span>
          <div>
            <strong>{{ step.title }}</strong>
            <p>{{ step.text }}</p>
          </div>
        </li>
      </ol>

      <div class="cta">
        <v-btn class="thaid-action" rounded="lg" size="large" variant="flat" @click="revealed = true">
          <img alt="" class="btn-mark" src="/thaid.png" />
          เปิด ThaID
        </v-btn>
        <p class="fine">ยืนยันตัวตนครั้งเดียว แล้วเข้าใช้งานได้เลย</p>
      </div>
    </template>

    <div v-else class="confirmed">
      <img alt="" class="thaid-icon" src="/thaid.png" />
      <h2>ได้ชื่อจาก ThaID แล้ว</h2>
      <div class="thaid-name">{{ name }}</div>
      <p>{{ relation }} · บัตร {{ maskedId }}</p>
      <p class="thaid-note">ได้แค่ชื่อกับผลว่าเป็นบุคคลจริง ไม่ได้ดึงข้อมูลสุขภาพ</p>
      <v-btn class="thaid-action" color="primary" rounded="lg" size="large" @click="emit('confirm')">ใช้ชื่อนี้และไปต่อ</v-btn>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed, ref } from 'vue'

  const props = withDefaults(
    defineProps<{
      name: string
      relation: string
      maskedId: string
      detail: string
      kind?: 'family' | 'provider'
    }>(),
    { kind: 'family' },
  )

  const emit = defineEmits<{ confirm: [] }>()
  const revealed = ref(false)
  const steps = computed(() =>
    props.kind === 'provider'
      ? [
          { icon: 'mdi-clipboard-check-outline', title: 'รับงานที่ชัดเจน', text: 'เห็นโรงพยาบาลและแผนกก่อนกดรับ' },
          { icon: 'mdi-hospital-building', title: 'อยู่ดูแลที่โรงพยาบาล', text: 'เริ่มดูแลจนจบงาน ไม่ต้องออกไปรับ' },
          { icon: 'mdi-note-text-outline', title: 'สรุปให้ลูกหลาน', text: 'เลือกข้อความสั้น ๆ ส่งเข้า LINE' },
        ]
      : [
          { icon: 'mdi-calendar-plus', title: 'จองนัดที่ต้องการ', text: 'เลือกแพ็กเกจ แล้วเลือกวันนัด' },
          { icon: 'mdi-account-heart-outline', title: 'มีคนอยู่ด้วยตลอดนัด', text: 'รอคิวและพบแพทย์ที่โรงพยาบาล' },
          { icon: 'mdi-message-text-outline', title: 'ครอบครัวเห็นความคืบหน้า', text: 'สถานะและสรุปส่งเข้า LINE' },
        ],
  )
</script>

<style scoped>
  .thaid-gate {
    display: flex;
    flex-direction: column;
    min-height: 100%;
    text-align: left;
    padding: 8px 4px 8px;
  }

  .welcome {
    margin-bottom: 18px;
  }

  .mark {
    display: grid;
    place-items: center;
    width: 40px;
    height: 40px;
    margin-bottom: 12px;
    border: 1.5px solid #d7ebe7;
    border-radius: 50%;
    background: #fff;
  }

  .eyebrow {
    margin: 0;
    color: #0e6b62;
    font-size: 0.95rem;
    font-weight: 700;
  }

  h1 {
    margin: 0;
    font-family: inherit;
    font-size: 2.35rem;
    font-weight: 700;
    line-height: 1.15;
    color: #0e6b62;
  }

  .lead {
    margin: 4px 0 0;
    color: #3f3832;
    font-size: 1.05rem;
    line-height: 1.45;
  }

  .story {
    position: relative;
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .story::before {
    content: '';
    position: absolute;
    top: 20px;
    bottom: 20px;
    left: 19px;
    width: 2px;
    background: #cfe0dc;
  }

  .story li {
    position: relative;
    display: grid;
    grid-template-columns: 40px 1fr;
    gap: 12px;
    align-items: center;
  }

  .dot {
    z-index: 1;
    display: grid;
    place-items: center;
    width: 40px;
    height: 40px;
    border: 1.5px solid #d7ebe7;
    border-radius: 50%;
    background: #fff;
  }

  .story strong {
    display: block;
    color: #241c16;
    font-size: 1.05rem;
    line-height: 1.3;
  }

  .story p,
  .thaid-note,
  .fine {
    margin: 0;
    color: #5c534c;
    font-size: 0.95rem;
    line-height: 1.4;
  }

  .cta {
    margin-top: 22px;
  }

  .fine {
    margin-top: 8px;
    text-align: center;
  }

  .thaid-action :deep(.v-btn__content) {
    align-items: center;
    gap: 8px;
  }

  .btn-mark {
    width: 26px;
    height: 26px;
    border-radius: 7px;
    flex: none;
  }

  .confirmed {
    display: flex;
    flex: 0 0 auto;
    flex-direction: column;
    align-items: center;
    width: 100%;
    margin: auto 0;
    padding: 28px 18px 22px;
    border: 1.5px solid #d7c8b4;
    border-radius: 20px;
    background: #fffcf8;
    text-align: center;
  }

  .thaid-icon {
    display: block;
    width: 56px;
    height: 56px;
    margin: 0 auto 12px;
    border-radius: 14px;
  }

  h2 {
    margin: 0 0 8px;
    text-align: center;
    font-size: 1.5rem;
    color: #0e6b62;
  }

  .thaid-name {
    text-align: center;
    font-size: 1.25rem;
    font-weight: 700;
  }

  .thaid-gate > p,
  .thaid-note {
    text-align: center;
  }

  .thaid-action {
    width: 100%;
    margin: 0;
    background: #0e6b62;
    color: #fff;
  }
</style>

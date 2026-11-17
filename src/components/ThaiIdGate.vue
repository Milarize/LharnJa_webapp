<template>
  <div class="thaid-gate">
    <template v-if="!revealed">
      <p class="eyebrow">{{ kind === 'provider' ? 'สำหรับผู้ดูแล' : 'เพื่อนดูแลไปด้วย' }}</p>
      <h1>หลานจ๋า</h1>
      <p class="lead">{{ kind === 'provider' ? 'รับงานอยู่ดูแลที่โรงพยาบาล แล้วส่งโน้ตให้ครอบครัว' : 'มีคนอยู่ด้วยตอนพบแพทย์ แล้วบอกครอบครัวให้ครบ' }}</p>

      <ol class="story">
        <li v-for="(step, index) in steps" :key="step.title">
          <span>{{ index + 1 }}</span>
          <div>
            <strong>{{ step.title }}</strong>
            <p>{{ step.text }}</p>
          </div>
        </li>
      </ol>

      <div class="thaid-strip">
        <img alt="" src="/thaid.png" />
        <div>
          <strong>ยืนยันตัวตน</strong>
          <p>คลิกปุ่มด้านล่างเพื่อเปิดหน้าจอง</p>
        </div>
      </div>
      <v-btn class="thaid-action" color="primary" rounded="lg" size="large" @click="revealed = true">เปิด ThaiD</v-btn>
    </template>

    <template v-else>
      <img alt="" class="thaid-icon" src="/thaid.png" />
      <h2>ได้ชื่อจาก ThaiD แล้ว</h2>
      <div class="thaid-name">{{ name }}</div>
      <p>{{ relation }} · บัตร {{ maskedId }}</p>
      <p class="thaid-note">ได้แค่ชื่อกับผลว่าเป็นบุคคลจริง ไม่ได้ดึงข้อมูลสุขภาพ</p>
      <v-btn class="thaid-action" color="primary" rounded="lg" size="large" @click="emit('confirm')">ใช้ชื่อนี้และไปต่อ</v-btn>
    </template>
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
          { title: 'รับงานที่ชัดเจน', text: 'รู้โรงพยาบาล แผนก และรายได้ของครั้งนี้ก่อนกดรับ' },
          { title: 'อยู่ดูแลที่โรงพยาบาล', text: 'เริ่มดูแลจนจบงาน โดยไม่ต้องออกไปรับ' },
          { title: 'จดโน้ตให้ครอบครัว', text: 'เลือกข้อความสำเร็จรูป แล้วส่งเข้า LINE ของลูกหลาน' },
        ]
      : [
          { title: 'จองนัดที่ต้องการ', text: 'โรงพยาบาล คลินิก หรือศูนย์กายภาพ จองล่วงหน้าอย่างน้อย 1 วัน' },
          { title: 'มีคนอยู่ด้วยตลอดนัด', text: 'รอคิวและพบแพทย์ด้วยกัน ที่โรงพยาบาล' },
          { title: 'ครอบครัวเห็นความคืบหน้า', text: 'สถานะและโน้ตส่งเข้า LINE ของลูกหลาน' },
        ],
  )
</script>

<style scoped>
  .thaid-gate {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    text-align: left;
    padding: 4px 2px 12px;
  }

  .eyebrow {
    margin: 0;
    color: #0e6b62;
    font-size: 13px;
    font-weight: 700;
  }

  h1 {
    margin: 2px 0 6px;
    font-family: "Noto Serif Thai", "Leelawadee UI", serif;
    font-size: 2.4rem;
    font-weight: 700;
    line-height: 1.15;
    color: #241c16;
  }

  .lead {
    margin: 0 0 14px;
    color: #5c564e;
    line-height: 1.5;
  }

  .story {
    list-style: none;
    margin: 0 0 14px;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .story li {
    display: flex;
    gap: 10px;
    align-items: flex-start;
    background: white;
    border-radius: 14px;
    padding: 10px 12px;
  }

  .story span {
    flex: none;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: #0e6b62;
    color: white;
    display: grid;
    place-items: center;
    font-size: 13px;
    font-weight: 700;
  }

  .story strong {
    display: block;
    margin-bottom: 2px;
  }

  .story p,
  .thaid-strip p,
  .thaid-note {
    margin: 0;
    color: #5c564e;
    font-size: 13px;
    line-height: 1.45;
  }

  .thaid-strip {
    display: flex;
    gap: 10px;
    align-items: flex-start;
    background: #f6f1e8;
    border: 1px solid #e4d8c8;
    border-radius: 14px;
    padding: 10px 12px;
  }

  .thaid-strip img,
  .thaid-icon {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    flex: none;
  }

  .thaid-strip strong {
    display: block;
    margin-bottom: 2px;
  }

  .thaid-icon {
    margin: 12px auto 12px;
  }

  h2 {
    margin: 0 0 8px;
    text-align: center;
    font-size: 1.25rem;
  }

  .thaid-name {
    text-align: center;
    font-size: 1.15rem;
    font-weight: 700;
  }

  .thaid-gate > p,
  .thaid-note {
    text-align: center;
  }

  .thaid-action {
    width: 100%;
    max-width: 280px;
    margin: 16px auto 0;
    flex: none;
    align-self: center;
  }
</style>

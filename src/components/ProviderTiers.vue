<template>
  <v-card class="pa-4" rounded="md" variant="outlined">
    <div class="text-title-medium font-weight-medium mb-1">แพ็กเกจการแจ้งลูกหลาน</div>
    <p class="text-body-medium text-medium-emphasis mb-4">
      เลือกวิธีรับโน้ตหลังมีคนอยู่ดูแลที่โรงพยาบาล แล้วกดสมัคร ครอบครัวเป็นคนจ่าย
    </p>
    <div class="tier-scroll">
      <table class="tier-table">
        <thead>
          <tr>
            <th>หัวข้อ</th>
            <th v-for="tier in PROVIDER_TIERS" :key="tier.id" :class="{ 'is-on': store.providerTier === tier.id }">
              {{ tier.name }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in TIER_ROWS" :key="row.key">
            <th>{{ row.label }}</th>
            <td v-for="tier in PROVIDER_TIERS" :key="tier.id" :class="{ 'is-on': store.providerTier === tier.id }">
              {{ tier[row.key] }}
            </td>
          </tr>
          <tr>
            <th></th>
            <td v-for="tier in PROVIDER_TIERS" :key="tier.id" :class="{ 'is-on': store.providerTier === tier.id }">
              <v-btn
                :color="store.providerTier === tier.id ? 'primary' : undefined"
                size="small"
                :variant="store.providerTier === tier.id ? 'flat' : 'outlined'"
                @click="store.subscribePlan(tier.id)"
              >
                {{ store.providerTier === tier.id ? 'กำลังใช้อยู่' : 'สมัคร' }}
              </v-btn>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </v-card>
</template>

<script setup lang="ts">
  import { PROVIDER_TIERS, TIER_ROWS } from '@/domain/model'
  import { useCareStore } from '@/stores/care'

  const store = useCareStore()
</script>

<style scoped>
  .tier-scroll {
    overflow-x: auto;
  }

  .tier-table {
    border-collapse: collapse;
    min-width: 640px;
    width: 100%;
    font-size: 14px;
    line-height: 1.45;
  }

  .tier-table th,
  .tier-table td {
    border-bottom: 1px solid rgba(0, 0, 0, 0.08);
    padding: 10px 8px;
    text-align: left;
    vertical-align: top;
  }

  .tier-table thead th {
    font-weight: 700;
  }

  .is-on {
    background: #e7f3f1;
  }
</style>

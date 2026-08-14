<template>
  <q-page class="wiki-page">
    <div class="wiki-main wiki-main--wide">
      <div :class="isDesktop ? 'text-h4 text-weight-bold q-mb-lg' : 'text-h6 q-mb-md'">사이트 관리</div>

      <div class="row q-col-gutter-lg">
        <div :class="isDesktop ? 'col-3' : 'col-12'">
          <q-tabs
            v-if="!isDesktop"
            :model-value="activePath"
            dense
            no-caps
            align="left"
            active-color="primary"
            indicator-color="primary"
            class="q-mb-md"
            outside-arrows
            mobile-arrows
          >
            <q-route-tab
              v-for="item in menu"
              :key="item.to"
              :name="item.to"
              :to="item.to"
              :icon="item.icon"
              :label="item.label"
            />
          </q-tabs>

          <q-list v-else bordered class="wiki-settings-nav rounded-borders">
            <q-item
              v-for="item in menu"
              :key="item.to"
              :to="item.to"
              clickable
              v-ripple
              active-class="wiki-settings-nav__active"
            >
              <q-item-section avatar>
                <q-icon :name="item.icon" />
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ item.label }}</q-item-label>
                <q-item-label caption>{{ item.caption }}</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </div>

        <div :class="isDesktop ? 'col-9' : 'col-12'">
          <router-view />
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useLayout } from '@/composables/useLayout'

const route = useRoute()
const { isDesktop } = useLayout()

const menu = [
  {
    to: '/settings/general',
    label: '일반',
    caption: '제목, 파비콘, 테마, 글자, 트리, 에디터',
    icon: 'tune'
  },
  {
    to: '/settings/categories',
    label: '카테고리',
    caption: '추가, 이름 변경, 이동, 삭제',
    icon: 'folder'
  },
  {
    to: '/settings/homepage',
    label: '홈페이지',
    caption: '홈에 표시할 글 순서',
    icon: 'home'
  },
  {
    to: '/settings/attachments',
    label: '첨부파일',
    caption: '용량 제한, 미연결 파일 정리',
    icon: 'attach_file'
  },
  {
    to: '/settings/backup',
    label: '백업/복구',
    caption: '데이터 백업과 전체 복구',
    icon: 'backup'
  }
]

const activePath = computed(() => {
  const match = menu.find((item) => route.path.startsWith(item.to))
  return match?.to || '/settings/general'
})
</script>

<template>
  <section class="section-block">
    <div v-if="categories.length > 1" class="chip-scroll chip-scroll--nested">
      <AkChip :active="filterId === null" @click="filterId = null">Todas</AkChip>
      <AkChip
        v-for="cat in categories"
        :key="cat.id"
        :active="filterId === cat.id"
        :color="cat.color"
        @click="filterId = cat.id"
      >
        {{ cat.name }}
      </AkChip>
    </div>

    <AkSectionHeader :title="title">
      <template v-if="hasMore" #action>
        <AkButton size="sm" variant="ghost" @click="emit('browse')">
          Ver todas ({{ totalCount }})
        </AkButton>
      </template>
    </AkSectionHeader>

    <AkEmptyState
      v-if="subjects.length === 0"
      title="Sem matérias"
      description="Cadastre matérias para começar a registrar."
    />

    <AkList v-else-if="visibleItems.length === 0">
      <li class="empty-filter-row text-sm text-muted">
        Nenhuma matéria nesta categoria.
      </li>
    </AkList>

    <AkList v-else>
      <AkListRow
        v-for="item in previewItems"
        :key="item.subjectId"
        interactive
        class="subject-row"
        :class="{ 'subject-row--active': activeId === item.subjectId }"
        :divider="item !== previewItems[previewItems.length - 1] || hasMore"
        @click="emit('select', item.subjectId)"
      >
        <template #leading>
          <div
            class="subject-leading"
            :style="{ background: subjectBgMix(item.color, 16) }"
          >
            {{ item.icon }}
          </div>
        </template>

        <span class="truncate">{{ item.name }}</span>

        <template #subtitle>
          <span class="text-xs text-muted truncate">
            {{ item.subtitle }}
          </span>
        </template>

        <template #trailing>
          <span class="numeric text-sm text-secondary shrink-0">
            {{ item.seconds > 0 ? formatDuration(item.seconds) : '—' }}
          </span>
          <AkIcon
            v-if="showPlay && activeId !== item.subjectId"
            name="play-outline"
            :size="18"
            class="subject-row__play"
          />
          <AkBadge v-else-if="activeId === item.subjectId" variant="success" label="●" />
        </template>
      </AkListRow>

      <li v-if="hasMore" class="list-more-row">
        <button type="button" class="list-more-row__btn tap-scale" @click="emit('browse')">
          + {{ hiddenCount }} {{ hiddenCount === 1 ? 'matéria' : 'matérias' }} — ver todas
        </button>
      </li>
    </AkList>
  </section>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  AkBadge, AkButton, AkChip, AkEmptyState, AkIcon, AkList, AkListRow, AkSectionHeader,
} from '@rafael_dias/akoma'
import { useSubjectsStore } from '@/stores/subjects'
import { useSessionsStore } from '@/stores/sessions'
import { formatDuration } from '@/types'
import { subjectBgMix } from '@/utils/colors'

const HOME_PREVIEW_LIMIT = 8

const props = withDefaults(defineProps<{
  activeId?: string | null
  extraSeconds?: number
  extraSubjectId?: string | null
  showPlay?: boolean
  previewLimit?: number
  title?: string
}>(), {
  showPlay: true,
  previewLimit: HOME_PREVIEW_LIMIT,
  title: 'Matérias de hoje',
})

const emit = defineEmits<{ select: [id: string]; browse: [] }>()

const subjectsStore = useSubjectsStore()
const sessionsStore = useSessionsStore()
const filterId = ref<string | null>(null)

const subjects = computed(() => subjectsStore.subjects)
const categories = computed(() => subjectsStore.categories)

function categoryName(categoryId: string | null) {
  if (!categoryId) return 'Sem categoria'
  return subjectsStore.getCategory(categoryId)?.name ?? 'Sem categoria'
}

const items = computed(() => {
  const bySubject = new Map(sessionsStore.todayBySubject)
  if (props.extraSubjectId && props.extraSeconds) {
    bySubject.set(
      props.extraSubjectId,
      (bySubject.get(props.extraSubjectId) ?? 0) + props.extraSeconds
    )
  }

  return subjects.value
    .map(subject => {
      const seconds = bySubject.get(subject.id) ?? 0
      const cat = categoryName(subject.categoryId)
      return {
        subjectId: subject.id,
        categoryId: subject.categoryId,
        name: subject.name,
        color: subject.color,
        icon: subject.icon,
        seconds,
        subtitle: seconds > 0 ? `${cat} · ${formatDuration(seconds)} hoje` : cat,
      }
    })
    .sort((a, b) => b.seconds - a.seconds || a.name.localeCompare(b.name))
})

const visibleItems = computed(() => {
  if (!filterId.value) return items.value
  return items.value.filter(item => item.categoryId === filterId.value)
})

const totalCount = computed(() => visibleItems.value.length)

const previewItems = computed(() => {
  const list = visibleItems.value
  const limit = props.previewLimit
  if (list.length <= limit) return list

  const picked = list.slice(0, limit)
  const activeId = props.activeId
  if (!activeId || picked.some(item => item.subjectId === activeId)) return picked

  const active = list.find(item => item.subjectId === activeId)
  if (!active) return picked

  return [...picked.slice(0, limit - 1), active]
})

const hasMore = computed(() => totalCount.value > previewItems.value.length)

const hiddenCount = computed(() => totalCount.value - previewItems.value.length)
</script>

<style scoped>
.chip-scroll--nested {
  margin: 0 0 var(--space-2);
  padding-left: 0;
  padding-right: 0;
}

.empty-filter-row {
  padding: var(--space-5) var(--space-4);
  text-align: center;
}

.subject-row--active {
  background: color-mix(in srgb, var(--accent) 6%, var(--bg-elevated));
  box-shadow: inset 3px 0 0 var(--accent);
}

.subject-row__play {
  color: var(--accent);
  flex-shrink: 0;
}

.list-more-row {
  list-style: none;
  border-top: 1px solid var(--border);
}

.list-more-row__btn {
  width: 100%;
  padding: var(--space-3) var(--space-4);
  background: transparent;
  border: none;
  font: inherit;
  font-size: 13px;
  font-weight: 600;
  color: var(--accent);
  text-align: center;
  cursor: pointer;
}

.list-more-row__btn:hover {
  background: var(--bg-soft);
}
</style>

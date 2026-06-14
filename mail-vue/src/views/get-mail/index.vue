<template>
  <div class="pickup-page">
    <main class="pickup-shell">
      <section class="pickup-header">
        <div>
          <div class="label">邮件取件</div>
          <h1>{{ info.email || '取件链接' }}</h1>
          <p v-if="info.email">
            {{ info.permanent ? '永久有效' : `有效期至 ${formatTime(info.expireTime)}` }}
          </p>
          <p v-else>通过取件链接查看指定邮箱的收件箱。</p>
        </div>
        <el-button :loading="loading" circle @click="reload">
          <Icon icon="ion:reload" width="17" height="17"/>
        </el-button>
      </section>

      <el-alert
          v-if="error"
          class="notice"
          :title="error"
          type="error"
          show-icon
          :closable="false"
      />

      <section v-else class="mail-layout">
        <aside class="mail-list">
          <div class="list-title">收件箱</div>
          <el-skeleton v-if="loading && !emails.length" :rows="6" animated/>
          <el-empty v-else-if="!emails.length" description="暂无邮件"/>
          <button
              v-for="item in emails"
              v-else
              :key="item.emailId"
              class="mail-item"
              :class="{ active: current?.emailId === item.emailId }"
              @click="openMail(item)"
          >
            <span class="subject">{{ item.subject || '(无主题)' }}</span>
            <span class="sender">{{ item.sendEmail || item.name || '未知发件人' }}</span>
            <span class="summary">{{ item.text || item.code || '' }}</span>
            <span class="time">{{ formatTime(item.createTime) }}</span>
          </button>
          <el-button v-if="emails.length && hasMore" plain :loading="listLoading" @click="loadMore">
            加载更多
          </el-button>
        </aside>

        <article class="mail-detail">
          <el-skeleton v-if="detailLoading" :rows="8" animated/>
          <el-empty v-else-if="!current" description="选择一封邮件查看"/>
          <template v-else>
            <header class="detail-head">
              <h2>{{ current.subject || '(无主题)' }}</h2>
              <div class="meta">
                <span>发件人：{{ current.sendEmail || current.name || '未知' }}</span>
                <span>收件人：{{ current.toEmail || info.email }}</span>
                <span>{{ formatTime(current.createTime) }}</span>
              </div>
            </header>
            <div v-if="current.attList?.length" class="attachments">
              <a
                  v-for="att in current.attList"
                  :key="att.attId"
                  :href="getMailAttachmentUrl(gtoken, att.attId)"
                  target="_blank"
                  rel="noopener"
              >
                <Icon icon="mdi:paperclip" width="16" height="16"/>
                {{ att.filename || '附件' }}
              </a>
            </div>
            <ShadowHtml v-if="current.content" class="html-content" :html="formatImage(current.content)"/>
            <pre v-else class="plain-content">{{ current.text || '无正文内容' }}</pre>
          </template>
        </article>
      </section>
    </main>
  </div>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import { Icon } from '@iconify/vue'
import ShadowHtml from '@/components/shadow-html/index.vue'
import { getMailAttachmentUrl, getMailDetail, getMailInfo, getMailList } from '@/request/get-mail.js'

const route = useRoute()
const gtoken = computed(() => String(route.query.gtoken || ''))
const info = reactive({
  email: '',
  expireTime: '',
  permanent: false
})
const emails = ref([])
const current = ref(null)
const loading = ref(false)
const listLoading = ref(false)
const detailLoading = ref(false)
const error = ref('')
const hasMore = ref(true)

function formatTime(time) {
  if (!time) return ''
  return String(time).replace('T', ' ').slice(0, 16)
}

function formatImage(content) {
  return (content || '').replace(/{{domain}}\//g, '')
}

async function reload() {
  if (!gtoken.value) {
    error.value = '取件链接缺少令牌'
    return
  }
  loading.value = true
  error.value = ''
  emails.value = []
  current.value = null
  hasMore.value = true
  try {
    const data = await getMailInfo(gtoken.value)
    info.email = data.email
    info.expireTime = data.expireTime
    info.permanent = data.permanent
    await loadMore()
  } catch (e) {
    error.value = e?.message || '取件令牌无效或已过期'
  } finally {
    loading.value = false
  }
}

async function loadMore() {
  if (!hasMore.value || listLoading.value) return
  listLoading.value = true
  try {
    const last = emails.value[emails.value.length - 1]
    const list = await getMailList({
      gtoken: gtoken.value,
      emailId: last?.emailId || '',
      size: 20
    })
    emails.value.push(...(list || []))
    hasMore.value = (list || []).length >= 20
    if (!current.value && emails.value.length) {
      await openMail(emails.value[0])
    }
  } finally {
    listLoading.value = false
  }
}

async function openMail(item) {
  detailLoading.value = true
  try {
    current.value = await getMailDetail({
      gtoken: gtoken.value,
      emailId: item.emailId
    })
  } finally {
    detailLoading.value = false
  }
}

reload()
</script>

<style lang="scss" scoped>
.pickup-page {
  min-height: 100vh;
  background: #f4f7fb;
  color: #1f2937;
}

.pickup-shell {
  width: min(1180px, calc(100% - 32px));
  margin: 0 auto;
  padding: 32px 0;
}

.pickup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  padding: 20px 0 24px;

  .label {
    color: #0f766e;
    font-weight: 700;
    font-size: 13px;
  }

  h1 {
    margin: 6px 0;
    font-size: 28px;
    line-height: 1.2;
    word-break: break-all;
  }

  p {
    margin: 0;
    color: #64748b;
  }
}

.notice {
  margin-top: 18px;
}

.mail-layout {
  display: grid;
  grid-template-columns: minmax(280px, 360px) minmax(0, 1fr);
  gap: 18px;
  min-height: 680px;
}

.mail-list,
.mail-detail {
  background: #ffffff;
  border: 1px solid #dbe4ee;
  border-radius: 8px;
}

.mail-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 14px;
}

.list-title {
  font-weight: 700;
  padding: 2px 4px 8px;
}

.mail-item {
  display: grid;
  gap: 5px;
  width: 100%;
  border: 1px solid transparent;
  border-radius: 6px;
  padding: 11px;
  background: transparent;
  text-align: left;
  cursor: pointer;

  &:hover,
  &.active {
    background: #eef7f6;
    border-color: #99d5ce;
  }

  span {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .subject {
    font-weight: 700;
  }

  .sender,
  .time {
    color: #64748b;
    font-size: 12px;
  }

  .summary {
    color: #475569;
    font-size: 13px;
  }
}

.mail-detail {
  min-width: 0;
  padding: 24px;
}

.detail-head {
  border-bottom: 1px solid #e5edf5;
  padding-bottom: 16px;
  margin-bottom: 18px;

  h2 {
    margin: 0 0 12px;
    font-size: 22px;
    line-height: 1.35;
    word-break: break-word;
  }
}

.meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 18px;
  color: #64748b;
  font-size: 13px;
}

.attachments {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 18px;

  a {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 7px 10px;
    border-radius: 6px;
    background: #f1f5f9;
    color: #0f766e;
    text-decoration: none;
  }
}

.html-content {
  min-height: 420px;
}

.plain-content {
  white-space: pre-wrap;
  word-break: break-word;
  margin: 0;
  font-family: inherit;
  color: #334155;
}

@media (max-width: 820px) {
  .pickup-shell {
    width: min(100% - 20px, 680px);
    padding: 18px 0;
  }

  .mail-layout {
    grid-template-columns: 1fr;
  }

  .mail-detail {
    padding: 16px;
  }
}
</style>

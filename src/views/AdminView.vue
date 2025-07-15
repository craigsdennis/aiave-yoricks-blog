<template>
  <div class="admin-container">
    <header class="admin-header">
      <h1 class="admin-title">Admin Control Panel</h1>
      <p class="admin-subtitle">Manage your digital knowledge base</p>
    </header>
    
    <main class="admin-section">
      <div v-if="loading" class="loading">
        <div class="loading-spinner"></div>
        <p>Accessing admin systems...</p>
      </div>
      <div v-else-if="error" class="error">
        <h2>Access Error</h2>
        <p>Failed to connect to admin systems.</p>
      </div>
      <div v-else-if="drafts.length === 0" class="no-drafts">
        <h2>No Drafts Found</h2>
        <p>All posts have been published or archived.</p>
      </div>
      <div v-else class="drafts-grid">
        <div class="drafts-header">
          <h2>Draft Posts</h2>
          <span class="draft-count">{{ drafts.length }} {{ drafts.length === 1 ? 'draft' : 'drafts' }}</span>
        </div>
        <article v-for="post in drafts" :key="post.slug" class="draft-card" @click="navigateToEdit(post.slug)">
          <h3 class="draft-title">{{ post.title }}</h3>
          <div class="draft-meta">
            <span class="draft-category">{{ post.category }}</span>
            <span class="draft-date">{{ formatDate(post.created_at) }}</span>
          </div>
          <div class="draft-status">
            <span class="status-badge draft">{{ post.status }}</span>
          </div>
        </article>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

interface AdminPost {
  id: number
  title: string
  slug: string
  content: string
  status: 'draft' | 'published' | 'archived'
  category_id: number
  created_at: string
  published_at: string | null
  category: string
}

const router = useRouter()
const drafts = ref<AdminPost[]>([])
const loading = ref(true)
const error = ref(false)

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const navigateToEdit = (slug: string) => {
  router.push(`/admin/post/${slug}`)
}

onMounted(async () => {
  try {
    const response = await fetch('/api/admin/posts')
    if (!response.ok) {
      error.value = true
      return
    }
    drafts.value = await response.json()
  } catch (err) {
    error.value = true
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.admin-container {
  min-height: 100%;
  color: #e0e6ed;
  font-family: 'Monaco', 'Consolas', monospace;
}

.admin-header {
  text-align: center;
  padding: 4rem 2rem;
  background: rgba(0, 0, 0, 0.3);
  border-bottom: 2px solid rgba(255, 100, 100, 0.5);
}

.admin-title {
  font-size: 3.5rem;
  margin: 0 0 1rem 0;
  color: #ff6464;
  text-shadow: 0 0 20px rgba(255, 100, 100, 0.8);
  font-weight: bold;
}

.admin-subtitle {
  font-size: 1.3rem;
  margin: 0;
  color: #ffaa64;
  text-shadow: 0 0 10px rgba(255, 170, 100, 0.5);
}

.admin-section {
  padding: 3rem 2rem;
  width: 100%;
}

.loading {
  text-align: center;
  padding: 4rem 0;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #333;
  border-top: 3px solid #ff6464;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error, .no-drafts {
  text-align: center;
  padding: 4rem 0;
  color: #ff6b6b;
}

.error h2, .no-drafts h2 {
  color: #ff4757;
  margin-bottom: 1rem;
}

.drafts-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid rgba(255, 100, 100, 0.3);
}

.drafts-header h2 {
  font-size: 2rem;
  color: #ff6464;
  margin: 0;
}

.draft-count {
  color: #ffaa64;
  font-size: 1.1rem;
}

.drafts-grid {
  width: 100%;
}

.draft-card {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 100, 100, 0.3);
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
  position: relative;
  overflow: hidden;
}

.draft-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #ff6464, #ffaa64);
  transform: scaleX(0);
  transition: transform 0.3s ease;
}

.draft-card:hover::before {
  transform: scaleX(1);
}

.draft-card:hover {
  transform: translateY(-5px);
  border-color: #ff6464;
  box-shadow: 0 10px 30px rgba(255, 100, 100, 0.3);
}

.draft-title {
  font-size: 1.5rem;
  margin: 0 0 1rem 0;
  color: #ff6464;
  text-shadow: 0 0 5px rgba(255, 100, 100, 0.3);
  line-height: 1.3;
}

.draft-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.draft-category {
  background: rgba(255, 170, 100, 0.2);
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.8rem;
  border: 1px solid rgba(255, 170, 100, 0.4);
  color: #ffaa64;
}

.draft-date {
  color: #8892b0;
  font-size: 0.9rem;
}

.draft-status {
  display: flex;
  justify-content: flex-end;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: bold;
  text-transform: uppercase;
}

.status-badge.draft {
  background: rgba(255, 200, 100, 0.2);
  color: #ffc864;
  border: 1px solid rgba(255, 200, 100, 0.4);
}

@media (max-width: 768px) {
  .admin-header {
    padding: 2rem 1rem;
  }
  
  .admin-title {
    font-size: 2.5rem;
  }
  
  .admin-subtitle {
    font-size: 1.1rem;
  }
  
  .admin-section {
    padding: 2rem 1rem;
  }
  
  .drafts-header {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }
  
  .draft-card {
    padding: 1rem;
  }
  
  .draft-meta {
    flex-direction: column;
    gap: 0.5rem;
    align-items: flex-start;
  }
}
</style>
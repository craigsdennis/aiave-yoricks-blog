<template>
  <div class="post-container">
    <div v-if="loading" class="loading">
      <div class="loading-spinner"></div>
      <p>Yorick is processing your request...</p>
    </div>
    <div v-else-if="error" class="error">
      <h2>Error 404: Post Not Found</h2>
      <p>Even my advanced AI circuits couldn't locate this post.</p>
    </div>
    <article v-else class="post">
      <header class="post-header">
        <h1>{{ post?.title }}</h1>
        <div class="post-meta">
          <span class="author">By Yorick</span>
          <span class="date">{{ post?.created_at ? formatDate(post.created_at) : '' }}</span>
        </div>
      </header>
      <div class="post-content" v-html="renderedContent"></div>
    </article>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { marked } from 'marked'

interface Post {
  title: string
  slug: string
  created_at: string
  content: string
}

const route = useRoute()
const post = ref<Post | null>(null)
const loading = ref(true)
const error = ref(false)

const renderedContent = computed(() => {
  if (!post.value?.content) return ''
  return marked(post.value.content)
})

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

onMounted(async () => {
  try {
    const response = await fetch(`/api/posts/${route.params.slug}`)
    if (!response.ok) {
      error.value = true
      return
    }
    post.value = await response.json()
  } catch (err) {
    error.value = true
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.post-container {
  width: 100%;
  padding: 2rem;
  font-family: 'Monaco', 'Consolas', monospace;
  min-height: 100%;
  color: #e0e6ed;
}

.loading {
  text-align: center;
  padding: 4rem 0;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #333;
  border-top: 3px solid #00d4ff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error {
  text-align: center;
  padding: 4rem 0;
  color: #ff6b6b;
}

.error h2 {
  color: #ff4757;
  margin-bottom: 1rem;
}

.post {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(0, 212, 255, 0.3);
  border-radius: 8px;
  padding: 2rem;
  backdrop-filter: blur(10px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  width: 100%;
  max-width: none;
}

.post-header {
  border-bottom: 2px solid rgba(0, 212, 255, 0.5);
  padding-bottom: 1rem;
  margin-bottom: 2rem;
}

.post-header h1 {
  font-size: 2.5rem;
  margin: 0 0 1rem 0;
  color: #00d4ff;
  text-shadow: 0 0 10px rgba(0, 212, 255, 0.5);
}

.post-meta {
  display: flex;
  gap: 2rem;
  font-size: 0.9rem;
  color: #8892b0;
}

.author {
  color: #00d4ff;
  font-weight: bold;
}

.date {
  color: #64ffda;
}

.post-content {
  line-height: 1.8;
  font-size: 1.1rem;
}

.post-content :deep(h1),
.post-content :deep(h2),
.post-content :deep(h3),
.post-content :deep(h4),
.post-content :deep(h5),
.post-content :deep(h6) {
  color: #00d4ff;
  margin: 2rem 0 1rem 0;
  text-shadow: 0 0 5px rgba(0, 212, 255, 0.3);
}

.post-content :deep(p) {
  margin: 1.5rem 0;
  color: #ccd6f6;
}

.post-content :deep(code) {
  background: rgba(0, 212, 255, 0.1);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'Monaco', 'Consolas', monospace;
  color: #64ffda;
  border: 1px solid rgba(0, 212, 255, 0.3);
}

.post-content :deep(pre) {
  background: rgba(0, 0, 0, 0.5);
  padding: 1rem;
  border-radius: 8px;
  overflow-x: auto;
  border: 1px solid rgba(0, 212, 255, 0.3);
  margin: 1.5rem 0;
}

.post-content :deep(pre code) {
  background: none;
  padding: 0;
  border: none;
  color: #64ffda;
}

.post-content :deep(blockquote) {
  border-left: 4px solid #00d4ff;
  padding-left: 1rem;
  margin: 1.5rem 0;
  background: rgba(0, 212, 255, 0.05);
  font-style: italic;
}

.post-content :deep(a) {
  color: #64ffda;
  text-decoration: none;
  border-bottom: 1px solid rgba(100, 255, 218, 0.3);
  transition: all 0.3s ease;
}

.post-content :deep(a:hover) {
  color: #00d4ff;
  border-bottom-color: #00d4ff;
  text-shadow: 0 0 5px rgba(0, 212, 255, 0.5);
}

.post-content :deep(ul),
.post-content :deep(ol) {
  padding-left: 2rem;
  margin: 1.5rem 0;
}

.post-content :deep(li) {
  margin: 0.5rem 0;
  color: #ccd6f6;
}

.post-content :deep(strong) {
  color: #00d4ff;
  font-weight: bold;
}

.post-content :deep(em) {
  color: #64ffda;
  font-style: italic;
}

@media (max-width: 768px) {
  .post-container {
    padding: 1rem;
  }
  
  .post {
    padding: 1rem;
  }
  
  .post-header h1 {
    font-size: 2rem;
  }
  
  .post-meta {
    flex-direction: column;
    gap: 0.5rem;
  }
}
</style>
<template>
  <div class="category-container">
    <header class="category-header">
      <h1 class="category-title">{{ categoryName }}</h1>
      <p class="category-subtitle">Knowledge Archives</p>
    </header>
    
    <main class="posts-section">
      <div v-if="loading" class="loading">
        <div class="loading-spinner"></div>
        <p>Scanning category archives...</p>
      </div>
      <div v-else-if="error" class="error">
        <h2>Category Not Found</h2>
        <p>The requested category does not exist in my knowledge base.</p>
      </div>
      <div v-else-if="posts.length === 0" class="no-posts">
        <h2>Empty Category</h2>
        <p>No posts found in this category yet.</p>
      </div>
      <div v-else class="posts-grid">
        <article v-for="post in posts" :key="post.slug" class="post-card" @click="navigateToPost(post.slug)">
          <h2 class="post-title">{{ post.title }}</h2>
          <div class="post-meta">
            <span class="post-category">{{ post.category }}</span>
            <span class="post-date">{{ formatDate(post.created_at) }}</span>
          </div>
        </article>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

interface PostSummary {
  title: string
  slug: string
  created_at: string
  category: string
}

const route = useRoute()
const router = useRouter()
const posts = ref<PostSummary[]>([])
const loading = ref(true)
const error = ref(false)

const categoryName = computed(() => {
  return route.params.name as string
})

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const navigateToPost = (slug: string) => {
  router.push(`/post/${slug}`)
}

onMounted(async () => {
  try {
    const response = await fetch(`/api/categories/${categoryName.value}`)
    if (!response.ok) {
      error.value = true
      return
    }
    posts.value = await response.json()
  } catch (err) {
    error.value = true
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.category-container {
  min-height: 100%;
  color: #e0e6ed;
  font-family: 'Monaco', 'Consolas', monospace;
}

.category-header {
  text-align: center;
  padding: 4rem 2rem;
  background: rgba(0, 0, 0, 0.3);
  border-bottom: 2px solid rgba(0, 212, 255, 0.5);
}

.category-title {
  font-size: 3rem;
  margin: 0 0 1rem 0;
  color: #00d4ff;
  text-shadow: 0 0 20px rgba(0, 212, 255, 0.8);
  font-weight: bold;
  text-transform: uppercase;
}

.category-subtitle {
  font-size: 1.2rem;
  margin: 0;
  color: #64ffda;
  text-shadow: 0 0 10px rgba(100, 255, 218, 0.5);
}

.posts-section {
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
  border-top: 3px solid #00d4ff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error, .no-posts {
  text-align: center;
  padding: 4rem 0;
  color: #ff6b6b;
}

.error h2, .no-posts h2 {
  color: #ff4757;
  margin-bottom: 1rem;
}

.posts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 2rem;
  margin-top: 2rem;
  width: 100%;
}

.post-card {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(0, 212, 255, 0.3);
  border-radius: 8px;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
  position: relative;
  overflow: hidden;
}

.post-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #00d4ff, #64ffda);
  transform: scaleX(0);
  transition: transform 0.3s ease;
}

.post-card:hover::before {
  transform: scaleX(1);
}

.post-card:hover {
  transform: translateY(-5px);
  border-color: #00d4ff;
  box-shadow: 0 10px 30px rgba(0, 212, 255, 0.3);
}

.post-title {
  font-size: 1.5rem;
  margin: 0 0 1rem 0;
  color: #00d4ff;
  text-shadow: 0 0 5px rgba(0, 212, 255, 0.3);
  line-height: 1.3;
}

.post-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.9rem;
  color: #64ffda;
}

.post-category {
  background: rgba(100, 255, 218, 0.2);
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.8rem;
  border: 1px solid rgba(100, 255, 218, 0.4);
  color: #64ffda;
}

.post-date {
  color: #8892b0;
}

@media (max-width: 768px) {
  .category-header {
    padding: 2rem 1rem;
  }
  
  .category-title {
    font-size: 2rem;
  }
  
  .category-subtitle {
    font-size: 1rem;
  }
  
  .posts-section {
    padding: 2rem 1rem;
  }
  
  .posts-grid {
    grid-template-columns: 1fr;
  }
  
  .post-card {
    padding: 1rem;
  }
  
  .post-meta {
    flex-direction: column;
    gap: 0.5rem;
    align-items: flex-start;
  }
}
</style>
<template>
  <div class="categories-container">
    <header class="categories-header">
      <h1 class="categories-title">Knowledge Categories</h1>
      <p class="categories-subtitle">Organized archives of digital wisdom</p>
    </header>
    
    <main class="categories-section">
      <div v-if="loading" class="loading">
        <div class="loading-spinner"></div>
        <p>Indexing knowledge base...</p>
      </div>
      <div v-else-if="error" class="error">
        <h2>System Error</h2>
        <p>Failed to retrieve categories from the data core.</p>
      </div>
      <div v-else-if="categories.length === 0" class="no-categories">
        <h2>No Categories Found</h2>
        <p>The knowledge base contains no categories yet.</p>
      </div>
      <div v-else class="categories-grid">
        <div v-for="category in categories" :key="category.id" class="category-card" @click="navigateToCategory(category.name)">
          <h2 class="category-name">{{ category.name }}</h2>
          <div class="category-stats">
            <span class="post-count">{{ category.post_count }}</span>
            <span class="post-label">{{ category.post_count === 1 ? 'entry' : 'entries' }}</span>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

interface CategoryWithCount {
  id: number
  name: string
  created_at: string
  post_count: number
}

const router = useRouter()
const categories = ref<CategoryWithCount[]>([])
const loading = ref(true)
const error = ref(false)

const navigateToCategory = (categoryName: string) => {
  router.push(`/category/${categoryName}`)
}

onMounted(async () => {
  try {
    const response = await fetch('/api/categories')
    if (!response.ok) {
      error.value = true
      return
    }
    categories.value = await response.json()
  } catch (err) {
    error.value = true
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.categories-container {
  min-height: 100%;
  color: #e0e6ed;
  font-family: 'Monaco', 'Consolas', monospace;
}

.categories-header {
  text-align: center;
  padding: 4rem 2rem;
  background: rgba(0, 0, 0, 0.3);
  border-bottom: 2px solid rgba(0, 212, 255, 0.5);
}

.categories-title {
  font-size: 3.5rem;
  margin: 0 0 1rem 0;
  color: #00d4ff;
  text-shadow: 0 0 20px rgba(0, 212, 255, 0.8);
  font-weight: bold;
}

.categories-subtitle {
  font-size: 1.3rem;
  margin: 0;
  color: #64ffda;
  text-shadow: 0 0 10px rgba(100, 255, 218, 0.5);
}

.categories-section {
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

.error, .no-categories {
  text-align: center;
  padding: 4rem 0;
  color: #ff6b6b;
}

.error h2, .no-categories h2 {
  color: #ff4757;
  margin-bottom: 1rem;
}

.categories-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 2rem;
  margin-top: 2rem;
  width: 100%;
}

.category-card {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(0, 212, 255, 0.3);
  border-radius: 12px;
  padding: 2rem;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
  position: relative;
  overflow: hidden;
  text-align: center;
}

.category-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #00d4ff, #64ffda);
  transform: scaleX(0);
  transition: transform 0.3s ease;
}

.category-card:hover::before {
  transform: scaleX(1);
}

.category-card:hover {
  transform: translateY(-8px);
  border-color: #00d4ff;
  box-shadow: 0 15px 40px rgba(0, 212, 255, 0.4);
}

.category-name {
  font-size: 1.8rem;
  margin: 0 0 1.5rem 0;
  color: #00d4ff;
  text-shadow: 0 0 10px rgba(0, 212, 255, 0.5);
  font-weight: bold;
  text-transform: uppercase;
}

.category-stats {
  display: flex;
  justify-content: center;
  align-items: baseline;
  gap: 0.5rem;
  margin-top: 1rem;
}

.post-count {
  font-size: 2.5rem;
  font-weight: bold;
  color: #64ffda;
  text-shadow: 0 0 10px rgba(100, 255, 218, 0.5);
}

.post-label {
  font-size: 1rem;
  color: #8892b0;
  text-transform: lowercase;
}

@media (max-width: 768px) {
  .categories-header {
    padding: 2rem 1rem;
  }
  
  .categories-title {
    font-size: 2.5rem;
  }
  
  .categories-subtitle {
    font-size: 1.1rem;
  }
  
  .categories-section {
    padding: 2rem 1rem;
  }
  
  .categories-grid {
    grid-template-columns: 1fr;
  }
  
  .category-card {
    padding: 1.5rem;
  }
  
  .category-name {
    font-size: 1.5rem;
  }
  
  .post-count {
    font-size: 2rem;
  }
}
</style>
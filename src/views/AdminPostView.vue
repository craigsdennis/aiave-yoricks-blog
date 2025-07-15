<template>
  <div class="admin-post-container">
    <div v-if="loading" class="loading">
      <div class="loading-spinner"></div>
      <p>Loading post editor...</p>
    </div>
    <div v-else-if="error" class="error">
      <h2>Error: Post Not Found</h2>
      <p>The requested post could not be loaded.</p>
    </div>
    <div v-else class="admin-post-editor">
      <header class="editor-header">
        <h1 class="editor-title">Edit Post</h1>
        <div class="editor-actions">
          <button @click="savePost" :disabled="saving" class="btn btn-save">
            {{ saving ? 'Saving...' : 'Save' }}
          </button>
          <button @click="publishPost" :disabled="saving" class="btn btn-publish">
            {{ saving ? 'Publishing...' : 'Publish' }}
          </button>
          <button @click="deletePost" :disabled="saving" class="btn btn-delete">
            Delete
          </button>
        </div>
      </header>
      
      <div class="editor-content">
        <div class="editor-form">
          <div class="form-group">
            <label for="title">Title</label>
            <input 
              id="title"
              v-model="editData.title" 
              type="text" 
              class="form-input"
              placeholder="Post title..."
            />
          </div>
          
          <div class="form-group">
            <label for="category">Category</label>
            <select 
              id="category"
              v-model="editData.category_id" 
              class="form-select"
            >
              <option value="">Select category...</option>
              <option v-for="category in categories" :key="category.id" :value="category.id">
                {{ category.name }}
              </option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="content">Content (Markdown)</label>
            <textarea 
              id="content"
              v-model="editData.content" 
              class="form-textarea"
              placeholder="Write your post content in markdown..."
              rows="20"
            ></textarea>
          </div>
        </div>
        
        <div class="editor-preview">
          <h3>Preview</h3>
          <div class="preview-content" v-html="renderedContent"></div>
        </div>
      </div>
      
      <div class="editor-footer">
        <div class="post-info">
          <span class="info-item">Status: <strong>{{ post?.status }}</strong></span>
          <span class="info-item">Created: {{ post?.created_at ? formatDate(post.created_at) : 'Unknown' }}</span>
          <span class="info-item" v-if="post?.published_at">Published: {{ formatDate(post.published_at) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { marked } from 'marked'

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

interface Category {
  id: number
  name: string
  created_at: string
}

interface PostUpdateData {
  title?: string
  content?: string
  status?: 'draft' | 'published' | 'archived'
  category_id?: number
}

const route = useRoute()
const router = useRouter()
const post = ref<AdminPost | null>(null)
const categories = ref<Category[]>([])
const loading = ref(true)
const error = ref(false)
const saving = ref(false)

const editData = ref<PostUpdateData>({
  title: '',
  content: '',
  category_id: undefined
})

const renderedContent = computed(() => {
  if (!editData.value.content) return ''
  try {
    return marked(editData.value.content)
  } catch (e) {
    return '<p>Error rendering markdown</p>'
  }
})

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const loadPost = async () => {
  try {
    const response = await fetch(`/api/admin/posts/${route.params.slug}`)
    if (!response.ok) {
      error.value = true
      return
    }
    post.value = await response.json()
    
    // Initialize edit data with current post data
    if (post.value) {
      editData.value = {
        title: post.value.title,
        content: post.value.content,
        category_id: post.value.category_id
      }
    }
  } catch (err) {
    error.value = true
  }
}

const loadCategories = async () => {
  try {
    const response = await fetch('/api/admin/categories')
    if (response.ok) {
      categories.value = await response.json()
    }
  } catch (err) {
    console.error('Failed to load categories:', err)
  }
}

const savePost = async () => {
  if (!post.value) return
  
  saving.value = true
  try {
    const response = await fetch(`/api/admin/posts/${post.value.slug}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(editData.value)
    })
    
    if (response.ok) {
      const updatedPost = await response.json()
      post.value = updatedPost
      alert('Post saved successfully!')
    } else {
      alert('Failed to save post')
    }
  } catch (err) {
    alert('Error saving post')
  } finally {
    saving.value = false
  }
}

const publishPost = async () => {
  if (!post.value) return
  
  saving.value = true
  try {
    const publishData = {
      ...editData.value,
      status: 'published' as const
    }
    
    const response = await fetch(`/api/admin/posts/${post.value.slug}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(publishData)
    })
    
    if (response.ok) {
      const updatedPost = await response.json()
      post.value = updatedPost
      alert('Post published successfully!')
    } else {
      alert('Failed to publish post')
    }
  } catch (err) {
    alert('Error publishing post')
  } finally {
    saving.value = false
  }
}

const deletePost = async () => {
  if (!post.value) return
  
  if (!confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
    return
  }
  
  saving.value = true
  try {
    const response = await fetch(`/api/admin/posts/${post.value.slug}`, {
      method: 'DELETE'
    })
    
    if (response.ok) {
      alert('Post deleted successfully!')
      router.push('/admin')
    } else {
      alert('Failed to delete post')
    }
  } catch (err) {
    alert('Error deleting post')
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  await Promise.all([loadPost(), loadCategories()])
  loading.value = false
})
</script>

<style scoped>
.admin-post-container {
  min-height: 100%;
  color: #e0e6ed;
  font-family: 'Monaco', 'Consolas', monospace;
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

.error {
  text-align: center;
  padding: 4rem 0;
  color: #ff6b6b;
}

.error h2 {
  color: #ff4757;
  margin-bottom: 1rem;
}

.admin-post-editor {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid rgba(255, 100, 100, 0.5);
}

.editor-title {
  font-size: 2.5rem;
  color: #ff6464;
  margin: 0;
  text-shadow: 0 0 10px rgba(255, 100, 100, 0.5);
}

.editor-actions {
  display: flex;
  gap: 1rem;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  font-family: 'Monaco', 'Consolas', monospace;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-save {
  background: rgba(100, 255, 218, 0.2);
  color: #64ffda;
  border: 1px solid rgba(100, 255, 218, 0.4);
}

.btn-save:hover:not(:disabled) {
  background: rgba(100, 255, 218, 0.3);
  transform: translateY(-2px);
}

.btn-publish {
  background: rgba(0, 212, 255, 0.2);
  color: #00d4ff;
  border: 1px solid rgba(0, 212, 255, 0.4);
}

.btn-publish:hover:not(:disabled) {
  background: rgba(0, 212, 255, 0.3);
  transform: translateY(-2px);
}

.btn-delete {
  background: rgba(255, 100, 100, 0.2);
  color: #ff6464;
  border: 1px solid rgba(255, 100, 100, 0.4);
}

.btn-delete:hover:not(:disabled) {
  background: rgba(255, 100, 100, 0.3);
  transform: translateY(-2px);
}

.editor-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  margin-bottom: 2rem;
}

.editor-form {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 100, 100, 0.3);
  border-radius: 8px;
  padding: 2rem;
  backdrop-filter: blur(10px);
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: #ff6464;
  font-weight: bold;
}

.form-input,
.form-select,
.form-textarea {
  width: 100%;
  padding: 0.75rem;
  background: rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(255, 100, 100, 0.3);
  border-radius: 4px;
  color: #e0e6ed;
  font-family: 'Monaco', 'Consolas', monospace;
  font-size: 1rem;
}

.form-input:focus,
.form-select:focus,
.form-textarea:focus {
  outline: none;
  border-color: #ff6464;
  box-shadow: 0 0 10px rgba(255, 100, 100, 0.3);
}

.form-textarea {
  resize: vertical;
  min-height: 400px;
}

.editor-preview {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(0, 212, 255, 0.3);
  border-radius: 8px;
  padding: 2rem;
  backdrop-filter: blur(10px);
}

.editor-preview h3 {
  color: #00d4ff;
  margin: 0 0 1rem 0;
  text-shadow: 0 0 5px rgba(0, 212, 255, 0.3);
}

.preview-content {
  color: #ccd6f6;
  line-height: 1.6;
  max-height: 500px;
  overflow-y: auto;
}

.preview-content :deep(h1),
.preview-content :deep(h2),
.preview-content :deep(h3),
.preview-content :deep(h4),
.preview-content :deep(h5),
.preview-content :deep(h6) {
  color: #00d4ff;
  margin: 1rem 0 0.5rem 0;
}

.preview-content :deep(p) {
  margin: 1rem 0;
}

.preview-content :deep(code) {
  background: rgba(0, 212, 255, 0.1);
  padding: 2px 4px;
  border-radius: 3px;
  color: #64ffda;
}

.preview-content :deep(pre) {
  background: rgba(0, 0, 0, 0.5);
  padding: 1rem;
  border-radius: 4px;
  overflow-x: auto;
}

.editor-footer {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 100, 100, 0.3);
  border-radius: 8px;
  padding: 1rem 2rem;
  backdrop-filter: blur(10px);
}

.post-info {
  display: flex;
  gap: 2rem;
  font-size: 0.9rem;
  color: #8892b0;
}

.info-item strong {
  color: #ffaa64;
}

@media (max-width: 1024px) {
  .editor-content {
    grid-template-columns: 1fr;
  }
  
  .editor-header {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }
  
  .editor-actions {
    width: 100%;
    justify-content: space-between;
  }
}

@media (max-width: 768px) {
  .admin-post-editor {
    padding: 1rem;
  }
  
  .editor-title {
    font-size: 2rem;
  }
  
  .editor-actions {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .btn {
    padding: 0.5rem 1rem;
    font-size: 0.9rem;
  }
  
  .post-info {
    flex-direction: column;
    gap: 0.5rem;
  }
}
</style>
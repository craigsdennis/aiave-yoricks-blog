<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <div class="app">
    <nav class="main-nav">
      <div class="nav-container">
        <RouterLink to="/" class="nav-brand">Fistful of Knowledge</RouterLink>
        <div class="nav-links">
          <RouterLink to="/" class="nav-link">Home</RouterLink>
          <RouterLink to="/categories" class="nav-link">Categories</RouterLink>
          <RouterLink to="/about" class="nav-link">About</RouterLink>
        </div>
      </div>
    </nav>
    <main class="main-content">
      <RouterView />
    </main>
    <footer class="sticky-footer">
      <div class="footer-content">
        <div class="footer-line">
          <span>Built with 🧡 on </span>
          <a href="#" class="footer-link">Cloudflare Workers</a>
          <span> && </span>
          <a href="#" class="footer-link">Workflows</a>
          <span> && </span>
          <a href="#" class="footer-link">Workers AI</a>
        </div>
        <div class="footer-line">
          <a href="#" class="footer-link">👀 the code</a>
        </div>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.app {
  min-height: 100vh;
  background: linear-gradient(135deg, #0d1421, #1a2332);
  color: #e0e6ed;
  font-family: 'Monaco', 'Consolas', monospace;
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
}

.main-nav {
  background: rgba(0, 0, 0, 0.5);
  border-bottom: 1px solid rgba(0, 212, 255, 0.3);
  position: sticky;
  top: 0;
  z-index: 100;
  backdrop-filter: blur(10px);
}

.nav-container {
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.nav-brand {
  font-size: 1.5rem;
  font-weight: bold;
  color: #00d4ff;
  text-decoration: none;
  text-shadow: 0 0 10px rgba(0, 212, 255, 0.5);
  transition: all 0.3s ease;
}

.nav-brand:hover {
  text-shadow: 0 0 20px rgba(0, 212, 255, 0.8);
}

.nav-links {
  display: flex;
  gap: 2rem;
}

.nav-link {
  color: #ccd6f6;
  text-decoration: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  transition: all 0.3s ease;
  position: relative;
}

.nav-link:hover {
  color: #00d4ff;
  background: rgba(0, 212, 255, 0.1);
}

.nav-link.router-link-exact-active {
  color: #00d4ff;
  background: rgba(0, 212, 255, 0.2);
}

.sticky-footer {
  background: rgba(0, 0, 0, 0.8);
  border-top: 1px solid rgba(0, 212, 255, 0.3);
  padding: 1rem 0;
  margin-top: auto;
  backdrop-filter: blur(10px);
}

.footer-content {
  padding: 0 2rem;
  text-align: center;
}

.footer-line {
  margin: 0.5rem 0;
  font-size: 0.9rem;
  color: #8892b0;
}

.footer-link {
  color: #00d4ff;
  text-decoration: none;
  transition: all 0.3s ease;
  border-bottom: 1px solid transparent;
}

.footer-link:hover {
  color: #64ffda;
  border-bottom-color: #64ffda;
  text-shadow: 0 0 5px rgba(100, 255, 218, 0.5);
}

@media (max-width: 768px) {
  .nav-container {
    padding: 1rem;
  }
  
  .nav-brand {
    font-size: 1.2rem;
  }
  
  .nav-links {
    gap: 1rem;
  }
  
  .nav-link {
    padding: 0.25rem 0.5rem;
    font-size: 0.9rem;
  }
  
  .footer-content {
    padding: 0 1rem;
  }
  
  .footer-line {
    font-size: 0.8rem;
  }
}
</style>

<template>
  <header class="app-header">
    <div class="header-container">
      <div class="logo">
        <span class="logo-icon">🍌</span>
        <span class="logo-text">Nano Banana Pro</span>
      </div>
      <nav class="nav">
        <router-link to="/" class="nav-item" active-class="active">生图</router-link>
        <router-link to="/gallery" class="nav-item" active-class="active">作品集</router-link>
      </nav>
    </div>
  </header>
</template>

<style scoped>
.app-header {
  background: var(--color-bg-card);
  border-bottom: 1px solid var(--color-border-light);
  padding: var(--spacing-md) 0;
  position: sticky;
  top: 0;
  z-index: 100;
  backdrop-filter: blur(20px);
  background: rgba(255, 255, 255, 0.8);
}

.header-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 var(--spacing-lg);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-weight: 600;
  font-size: 18px;
  color: var(--color-text-title);
}

.logo-icon {
  font-size: 24px;
}

.nav {
  display: flex;
  gap: var(--spacing-lg);
}

.nav-item {
  color: var(--color-text-secondary);
  font-size: 15px;
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-sm);
  transition: all 0.2s;
}

.nav-item:hover {
  color: var(--color-primary);
  background: var(--color-primary-soft);
}

.nav-item.active {
  color: var(--color-primary);
  background: var(--color-primary-subtle);
  font-weight: 500;
}
</style>


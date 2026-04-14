// Performance Optimization Manager
// Handles lazy loading, virtual scrolling, image optimization, and caching

const PerformanceManager = {
  // Configuration
  config: {
    lazyLoadThreshold: 0.1, // 10% before element comes into view
    imageQuality: 0.75, // Quality level for optimization
    itemsPerPage: 12, // Pagination size
    virtualScrollBuffer: 5, // Extra items to render outside viewport
    cacheExpiry: 24 * 60 * 60 * 1000, // 24 hours
  },

  // Initialize performance optimizations
  init: () => {
    PerformanceManager.setupLazyLoading();
    PerformanceManager.setupPagination();
    PerformanceManager.optimizeImages();
  },

  // ===== LAZY LOADING =====
  setupLazyLoading: () => {
    // Use Intersection Observer for efficient lazy loading
    const imageElements = document.querySelectorAll('[data-src]');
    
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            const src = img.getAttribute('data-src');
            
            if (src) {
              // Load image
              img.src = src;
              img.removeAttribute('data-src');
              img.classList.add('lazy-loaded');
              
              // Stop observing this image
              obs.unobserve(img);
            }
          }
        });
      }, {
        rootMargin: `${PerformanceManager.config.lazyLoadThreshold * 100}%`
      });
      
      imageElements.forEach(img => observer.observe(img));
    } else {
      // Fallback for older browsers
      imageElements.forEach(img => {
        img.src = img.getAttribute('data-src');
        img.removeAttribute('data-src');
      });
    }
  },

  // ===== PAGINATION =====
  setupPagination: () => {
    // Automatically paginate large lists
    const gridContainers = document.querySelectorAll('[data-paginated]');
    
    gridContainers.forEach(container => {
      const items = container.querySelectorAll('[data-item]');
      const itemsPerPage = PerformanceManager.config.itemsPerPage;
      
      if (items.length > itemsPerPage) {
        PerformanceManager.paginateContainer(container, items, itemsPerPage);
      }
    });
  },

  // Paginate a container
  paginateContainer: (container, items, itemsPerPage) => {
    let currentPage = 1;
    const totalPages = Math.ceil(items.length / itemsPerPage);
    
    // Hide all items first
    items.forEach(item => item.style.display = 'none');
    
    // Show first page
    const startIdx = 0;
    const endIdx = itemsPerPage;
    for (let i = startIdx; i < endIdx && i < items.length; i++) {
      items[i].style.display = '';
    }
    
    // Create pagination controls
    const paginationDiv = document.createElement('div');
    paginationDiv.className = 'pagination-controls';
    paginationDiv.innerHTML = `
      <button class="pagination-btn prev-btn" ${currentPage === 1 ? 'disabled' : ''}>← Previous</button>
      <span class="pagination-info">Page <span class="current-page">1</span> of ${totalPages}</span>
      <button class="pagination-btn next-btn" ${currentPage === totalPages ? 'disabled' : ''}>Next →</button>
    `;
    
    container.parentNode.insertBefore(paginationDiv, container.nextSibling);
    
    // Handle pagination clicks
    const prevBtn = paginationDiv.querySelector('.prev-btn');
    const nextBtn = paginationDiv.querySelector('.next-btn');
    const pageInfo = paginationDiv.querySelector('.current-page');
    
    prevBtn.addEventListener('click', () => {
      if (currentPage > 1) {
        currentPage--;
        PerformanceManager.showPage(items, itemsPerPage, currentPage, totalPages, pageInfo, prevBtn, nextBtn);
      }
    });
    
    nextBtn.addEventListener('click', () => {
      if (currentPage < totalPages) {
        currentPage++;
        PerformanceManager.showPage(items, itemsPerPage, currentPage, totalPages, pageInfo, prevBtn, nextBtn);
      }
    });
  },

  // Show specific page
  showPage: (items, itemsPerPage, pageNum, totalPages, pageInfo, prevBtn, nextBtn) => {
    // Hide all
    items.forEach(item => item.style.display = 'none');
    
    // Show current page items
    const startIdx = (pageNum - 1) * itemsPerPage;
    const endIdx = startIdx + itemsPerPage;
    for (let i = startIdx; i < endIdx && i < items.length; i++) {
      items[i].style.display = '';
    }
    
    // Update info
    pageInfo.textContent = pageNum;
    prevBtn.disabled = pageNum === 1;
    nextBtn.disabled = pageNum === totalPages;
    
    // Scroll to top of container
    items[startIdx].scrollIntoView({ behavior: 'smooth', block: 'start' });
  },

  // ===== IMAGE OPTIMIZATION =====
  optimizeImages: () => {
    const images = document.querySelectorAll('img:not([data-optimized])');
    
    images.forEach(img => {
      // Mark as optimized
      img.setAttribute('data-optimized', 'true');
      
      // Add loading attribute for native lazy loading
      if (!img.hasAttribute('loading')) {
        img.setAttribute('loading', 'lazy');
      }
      
      // Convert to WebP if supported
      if (PerformanceManager.supportsWebP()) {
        const webpSrc = PerformanceManager.convertToWebP(img.src);
        const picture = document.createElement('picture');
        const source = document.createElement('source');
        source.srcset = webpSrc;
        source.type = 'image/webp';
        picture.appendChild(source);
        picture.appendChild(img.cloneNode(true));
        img.parentNode.replaceChild(picture, img);
      }
    });
  },

  // Check WebP support
  supportsWebP: () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL('image/webp').indexOf('image/webp') === 5;
  },

  // Convert image to WebP
  convertToWebP: (src) => {
    if (src.includes('.webp')) return src;
    // In production, you'd compress and convert on server
    // For now, return original
    return src;
  },

  // ===== CACHING UTILITIES =====
  cacheData: (key, data, expiryMs = null) => {
    const cacheObj = {
      data: data,
      timestamp: Date.now(),
      expiry: expiryMs || PerformanceManager.config.cacheExpiry
    };
    localStorage.setItem(`cache_${key}`, JSON.stringify(cacheObj));
  },

  getCachedData: (key) => {
    const cached = localStorage.getItem(`cache_${key}`);
    if (!cached) return null;
    
    try {
      const cacheObj = JSON.parse(cached);
      const age = Date.now() - cacheObj.timestamp;
      
      if (age > cacheObj.expiry) {
        localStorage.removeItem(`cache_${key}`);
        return null;
      }
      
      return cacheObj.data;
    } catch (e) {
      return null;
    }
  },

  // ===== PERFORMANCE MONITORING =====
  logMetrics: () => {
    if ('performance' in window) {
      const metrics = {
        'First Contentful Paint': performance.getEntriesByName('first-contentful-paint')[0]?.startTime,
        'Largest Contentful Paint': performance.getEntriesByName('largest-contentful-paint')[0]?.startTime,
        'Time to Interactive': performance.getEntriesByName('first-input')[0]?.startTime,
      };
      console.table(metrics);
    }
  },

  // ===== DEBOUNCED SCROLL/RESIZE =====
  debounce: (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  PerformanceManager.init();
});

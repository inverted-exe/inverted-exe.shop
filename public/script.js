// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', ()=> {
  const burger = document.getElementById('burger');
  const mobileNav = document.getElementById('mobileNav');
  const header = document.querySelector('.site-header');

  // Check if on landing page
  const isLandingPage = document.querySelector('.landing-page') !== null;

  // (no body class manipulation) Leave DOM classes unchanged here

  // Build mobile nav menu
  let mobileMenuHTML = '';
  if (isLandingPage) {
    // On landing page, don't show landing menu
    mobileMenuHTML = `
      <a href="/shop" class="mobile-link">shop</a>
      <a href="/archive" class="mobile-link">archive</a>
      <a href="/gallery" class="mobile-link">gallery</a>
    `;
  } else {
    // On other pages, show all menus
    mobileMenuHTML = `
      <a href="/shop" class="mobile-link">shop</a>
      <a href="/archive" class="mobile-link">archive</a>
      <a href="/gallery" class="mobile-link">gallery</a>
    `;
  }
  mobileNav.innerHTML = mobileMenuHTML;

  // Burger menu toggle
  burger && burger.addEventListener('click', (e) => {
    burger.classList.toggle('open');
    mobileNav.classList.toggle('open');
    document.body.classList.toggle('mobile-nav-open');
    header.classList.toggle('mobile-nav-active');
    e.stopPropagation();
  });

  // Close mobile nav on link click
  document.querySelectorAll('.mobile-link').forEach(link => {
    link.addEventListener('click', () => {
      burger.classList.remove('open');
      mobileNav.classList.remove('open');
      document.body.classList.remove('mobile-nav-open');
      header.classList.remove('mobile-nav-active');
    });
  });

  // Scroll detection for header styling (on landing page)
  if (isLandingPage) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 100) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    });
  }

  // Pre-set when clicking brand/logo to avoid blinking on navigation
  const brandLink = document.querySelector('.brand a');
  if (brandLink) {
    brandLink.addEventListener('click', () => {
      // No need to pre-set, localStorage will handle it
    });
  }

  // Pre-set when clicking nav links to avoid blinking on navigation
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      // No need to pre-set, localStorage will handle it
    });
  });

  // Set active nav link based on current page
  function setActiveNavLink() {
    const currentPath = window.location.pathname;
    document.querySelectorAll('.nav-link:not(.profile-link)').forEach(link => {
      link.classList.remove('active');
      const href = link.getAttribute('href');
      if (href && currentPath.startsWith(href)) {
        link.classList.add('active');
      }
    });
    
    // Also set active for mobile links
    document.querySelectorAll('.mobile-link').forEach(link => {
      link.classList.remove('active');
      const href = link.getAttribute('href');
      if (href && currentPath.startsWith(href)) {
        link.classList.add('active');
      }
    });
  }
  
  setActiveNavLink();
  window.addEventListener('popstate', setActiveNavLink);

  // Close mobile nav on outside click
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.mobile-nav-overlay') && !e.target.closest('.burger')) {
      burger.classList.remove('open');
      mobileNav.classList.remove('open');
      document.body.classList.remove('mobile-nav-open');
      header.classList.remove('mobile-nav-active');
    }
  });

  // Reattach mobile listeners
  function reattachMobileListeners() {
    // Re-attach click event listeners to mobile links
    document.querySelectorAll('.mobile-link').forEach(link => {
      // Remove old listeners by cloning
      const newLink = link.cloneNode(true);
      link.parentNode.replaceChild(newLink, link);
      
      // Add new listener
      newLink.addEventListener('click', () => {
        burger.classList.remove('open');
        mobileNav.classList.remove('open');
      });
    });
  }
});

// Notification helper
function showNotification(message) {
  let notification = document.getElementById('notification');
  
  if (!notification) {
    notification = document.createElement('div');
    notification.id = 'notification';
    notification.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: #44ff44;
      color: #111111;
      padding: 12px 20px;
      border-radius: 4px;
      font-weight: 600;
      z-index: 9999;
      font-family: Poppins, sans-serif;
      font-size: 14px;
      animation: slideInRight 0.3s ease;
      box-shadow: 0 4px 12px rgba(68, 255, 68, 0.3);
    `;
    document.body.appendChild(notification);
  }
  
  notification.textContent = message;
  notification.style.display = 'block';
  
  // Auto hide after 3 seconds
  setTimeout(() => {
    notification.style.display = 'none';
  }, 3000);
}

// TeePublic Redirect
function redirectToTeePublic(event, teepublicLink, productName) {
  if (!teepublicLink) {
    alert('TeePublic link not available for this product');
    return;
  }

  event.preventDefault();
  event.stopPropagation();

  // Show notification
  showNotification(`Opening ${productName} on TeePublic...`);

  // Redirect after short delay
  setTimeout(() => {
    window.open(teepublicLink, '_blank');
  }, 500);
}

function redirectToTees(event, teesLink, productName) {
  if (!teesLink) {
    alert('Tees.co.id link not available for this product');
    return;
  }

  event.preventDefault();
  event.stopPropagation();

  // Show notification
  showNotification(`Opening ${productName} on Tees.co.id...`);

  // Redirect after short delay
  setTimeout(() => {
    window.open(teesLink, '_blank');
  }, 500);
}

// Update auth when storage changes
window.addEventListener('storage', () => {
  initializeAuth();
});

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
  const userDropdown = document.getElementById('userDropdown');
  const userBtnNotLogged = document.querySelector('.user-btn.not-logged-in');
  const userBtnLogged = document.querySelector('.user-btn.logged-in');
  const isClickOnButton = userBtnNotLogged?.contains(e.target) || userBtnLogged?.contains(e.target);
  const isClickOnDropdown = userDropdown?.contains(e.target);
  
  if (userDropdown && !isClickOnButton && !isClickOnDropdown) {
    userDropdown.classList.remove('active');
  }
});

// ===== DATA LOADER (previously in admin/data-loader.js) =====

function loadAdminData() {
  return DatabaseSync.load();
}

// ===== OPTIMIZED SHOP ITEMS =====
function displayShopItems() {
  console.log('Loading shop items...');
  const adminData = loadAdminData();
  const shopContainer = document.querySelector('.shop-grid');
  
  if (!shopContainer) {
    console.log('Shop container not found');
    return;
  }

  if (!adminData.shop || adminData.shop.length === 0) {
    console.log('No shop items');
    return;
  }

  // Enable pagination for large datasets
  if (adminData.shop.length > 12) {
    shopContainer.setAttribute('data-paginated', 'true');
  }

  // Render with lazy loading
  shopContainer.innerHTML = adminData.shop.map((item, idx) => `
    <div class="shop-item-simple" data-item="${idx}" data-product-id="${item.id}">
      <a href="/shop/product-detail.html?id=${item.id}" class="shop-item-link">
        <div class="shop-image-simple">
          ${item.image ? `
            <img 
              ${idx < 12 ? `src="${item.image}"` : `data-src="${item.image}"`}
              alt="${item.name}" 
              loading="lazy"
              class="shop-item-img"
            >
          ` : '<div style="background: rgba(255,255,255,0.1); height: 100%; display:flex; align-items:center; justify-content:center;">No Image</div>'}
        </div>
        <h3 class="shop-item-title">${item.name}</h3>
      </a>
    </div>
  `).join('');

  // Setup lazy loading for images
  PerformanceManager.setupLazyLoading();
  // Setup pagination if needed
  PerformanceManager.setupPagination();
  
  console.log('Shop items loaded:', adminData.shop.length);
}

// ===== OPTIMIZED ARCHIVE ITEMS =====
function displayArchiveItems() {
  console.log('Loading archive items...');
  const adminData = loadAdminData();
  const archiveContainer = document.querySelector('.archive-grid');
  
  if (!archiveContainer) return;

  if (!adminData.archive || adminData.archive.length === 0) return;

  // Enable pagination for large datasets
  if (adminData.archive.length > 12) {
    archiveContainer.setAttribute('data-paginated', 'true');
  }

  // Check if it's simple layout (public archive page)
  const isSimpleLayout = archiveContainer.classList.contains('archive-simple');
  
  if (isSimpleLayout) {
    // Display like shop items with gray styling
    archiveContainer.innerHTML = adminData.archive.map((item, idx) => `
      <div class="archive-item-simple" data-item="${idx}">
        <div class="archive-image-simple">
          ${item.image ? `
            <img 
              ${idx < 12 ? `src="${item.image}"` : `data-src="${item.image}"`}
              alt="${item.title}" 
              loading="lazy"
              class="archive-item-img"
            >
          ` : '<div style="background: rgba(255,255,255,0.1); height: 100%"></div>'}
        </div>
        <h3 class="archive-item-title">${item.title}</h3>
      </div>
    `).join('');
  } else {
    // Admin panel detailed layout
    archiveContainer.innerHTML = adminData.archive.map((item, idx) => `
      <div class="archive-item" data-item="${idx}" onclick="openImageLightbox('${item.images ? item.images[0] : item.image}', '${item.title}')" style="cursor:pointer;">
        <div class="archive-image">
          ${item.image ? `
            <img 
              ${idx < 12 ? `src="${item.image}"` : `data-src="${item.image}"`}
              alt="${item.title}"
              loading="lazy"
              class="archive-item-img"
            >
          ` : '<div style="background: rgba(255,255,255,0.1); height: 100%"></div>'}
        </div>
        <div class="archive-info">
          <h3>${item.title}</h3>
          <p class="archive-category">${item.category}</p>
          <p>${item.description}</p>
          <time>${new Date(item.createdAt).toLocaleDateString()}</time>
        </div>
      </div>
    `).join('');
  }

  // Setup lazy loading and pagination
  PerformanceManager.setupLazyLoading();
  PerformanceManager.setupPagination();

  console.log('Archive items loaded:', adminData.archive.length);
}

// ===== OPTIMIZED GALLERY IMAGES =====
function displayGalleryImages() {
  console.log('Loading gallery images...');
  const adminData = loadAdminData();
  const galleryContainer = document.querySelector('.gallery-grid');
  
  if (!galleryContainer) return;

  if (!adminData.gallery || adminData.gallery.length === 0) return;

  // Enable pagination for large datasets
  if (adminData.gallery.length > 12) {
    galleryContainer.setAttribute('data-paginated', 'true');
  }

  // Store gallery data globally for modal access
  window.galleryData = adminData.gallery;

  galleryContainer.innerHTML = adminData.gallery.map((item, index) => `
    <div class="gallery-item" data-item="${index}" onclick="openGalleryModal(${index})" style="cursor:pointer;">
      <div class="gallery-image-wrapper">
        ${item.image ? `
          <img 
            ${index < 12 ? `src="${item.image}"` : `data-src="${item.image}"`}
            alt="${item.title}" 
            loading="lazy"
            class="gallery-img"
          >
        ` : '<div style="background: rgba(255,255,255,0.1); height: 100%"></div>'}
        <div class="gallery-item-overlay">
          <i class="ri-expand-alt-line"></i>
        </div>
      </div>
    </div>
  `).join('');

  // Setup lazy loading and pagination
  PerformanceManager.setupLazyLoading();
  PerformanceManager.setupPagination();

  console.log('Gallery items loaded:', adminData.gallery.length, 'items');
}

async function initializeAdminData() {
  console.log('Initializing data loader...');
  // Tunggu Firebase sync terlebih dahulu
  if (typeof DatabaseSync !== 'undefined') {
    await DatabaseSync.init(true); // true untuk menggunakan Firebase
  }
  
  // Tunggu localStorage ter-update dari Firebase
  await new Promise(resolve => setTimeout(resolve, 500));
  
  displayShopItems();
  displayArchiveItems();
  displayGalleryImages();
  setupImageLightbox();
  console.log('Data initialization complete');
}

// Simple image lightbox for archive
function openImageLightbox(imageSrc, title) {
  const lightbox = document.getElementById('imageLightbox');
  if (!lightbox) return;
  document.getElementById('lightboxImage').src = imageSrc;
  document.getElementById('lightboxImage').alt = title || 'Image';
  lightbox.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeImageLightbox() {
  const lightbox = document.getElementById('imageLightbox');
  if (!lightbox) return;
  lightbox.classList.remove('active');
  document.body.style.overflow = 'auto';
}

// Setup enhanced gallery modal with full navigation
function setupImageLightbox() {
  if (!document.getElementById('imageLightbox')) {
    const lightbox = document.createElement('div');
    lightbox.id = 'imageLightbox';
    lightbox.className = 'image-lightbox';
    lightbox.innerHTML = `
      <div class="lightbox-content">
        <button class="lightbox-close" onclick="closeImageLightbox()">&times;</button>
        <img id="lightboxImage" src="" alt="">
      </div>
    `;
    document.body.appendChild(lightbox);
  }

  if (!document.getElementById('galleryModal')) {
    const modal = document.createElement('div');
    modal.id = 'galleryModal';
    modal.className = 'gallery-modal';
    modal.innerHTML = `
      <div class="gallery-modal-content">
        <button class="gallery-modal-close" onclick="closeGalleryModal()">&times;</button>
        
        <div class="gallery-modal-main" id="galleryModalMain">
          <button class="gallery-modal-nav prev-nav" onclick="previousGalleryImage()">
            <i class="ri-arrow-left-s-line"></i>
          </button>
          
          <div class="gallery-modal-image-wrapper">
            <div class="gallery-modal-image-container">
              <img id="galleryModalImage" src="" alt="">
            </div>
          </div>
          
          <button class="gallery-modal-nav next-nav" onclick="nextGalleryImage()">
            <i class="ri-arrow-right-s-line"></i>
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }
}

// Global gallery state
let currentGalleryIndex = 0;

// Open gallery modal
function openGalleryModal(index) {
  if (!window.galleryData || window.galleryData.length === 0) return;
  
  currentGalleryIndex = index;
  const item = window.galleryData[index];
  const modal = document.getElementById('galleryModal');
  
  // Set main image
  document.getElementById('galleryModalImage').src = item.image;
  
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

// Navigate to next gallery item (continuous)
function nextGalleryImage() {
  if (!window.galleryData || window.galleryData.length === 0) return;
  const nextIndex = (currentGalleryIndex + 1) % window.galleryData.length;
  openGalleryModal(nextIndex);
}

// Navigate to previous gallery item (continuous)
function previousGalleryImage() {
  if (!window.galleryData || window.galleryData.length === 0) return;
  const prevIndex = (currentGalleryIndex - 1 + window.galleryData.length) % window.galleryData.length;
  openGalleryModal(prevIndex);
}

// Close gallery modal
function closeGalleryModal() {
  const modal = document.getElementById('galleryModal');
  modal.classList.remove('active');
  document.body.style.overflow = 'auto';
}

// Close gallery modal when clicking outside
document.addEventListener('click', (e) => {
  const modal = document.getElementById('galleryModal');
  if (modal && e.target === modal) {
    closeGalleryModal();
  }
  
  const lightbox = document.getElementById('imageLightbox');
  if (lightbox && e.target === lightbox) {
    closeImageLightbox();
  }
});

// Swipe gesture for gallery modal
let touchStartX = 0;
let touchEndX = 0;
let touchStartTime = 0;

document.addEventListener('touchstart', (e) => {
  const modal = document.getElementById('galleryModal');
  if (modal && modal.classList.contains('active')) {
    touchStartX = e.changedTouches[0].screenX;
    touchStartTime = Date.now();
  }
}, false);

document.addEventListener('touchend', (e) => {
  const modal = document.getElementById('galleryModal');
  if (modal && modal.classList.contains('active')) {
    touchEndX = e.changedTouches[0].screenX;
    const touchDuration = Date.now() - touchStartTime;
    const swipeDistance = Math.abs(touchEndX - touchStartX);
    
    // Swipe threshold: at least 50px and within 500ms
    if (swipeDistance > 50 && touchDuration < 500) {
      if (touchEndX < touchStartX) {
        // Swiped left, go to next image
        nextGalleryImage();
      } else if (touchEndX > touchStartX) {
        // Swiped right, go to previous image
        previousGalleryImage();
      }
    }
  }
}, false);

// Keyboard navigation for gallery
document.addEventListener('keydown', (e) => {
  const modal = document.getElementById('galleryModal');
  if (modal && modal.classList.contains('active')) {
    if (e.key === 'ArrowRight') {
      nextGalleryImage();
    } else if (e.key === 'ArrowLeft') {
      previousGalleryImage();
    } else if (e.key === 'Escape') {
      closeGalleryModal();
    }
  }
  
  const lightbox = document.getElementById('imageLightbox');
  if (lightbox && lightbox.classList.contains('active') && e.key === 'Escape') {
    closeImageLightbox();
  }
});

// Download Gallery Image Function
function downloadGalleryImage(imageUrl, imageName) {
  if (!imageUrl) {
    console.error('No image URL provided');
    return;
  }

  // Create a clean filename
  let filename = imageName.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'gallery-image';
  if (!filename.endsWith('.jpg') && !filename.endsWith('.png')) {
    filename += '.jpg';
  }

  // Create a temporary anchor element
  const link = document.createElement('a');
  link.href = imageUrl;
  link.download = filename;
  link.style.display = 'none';

  // Append to body and click
  document.body.appendChild(link);
  link.click();

  // Clean up
  document.body.removeChild(link);
}

// Wait for DOM to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeAdminData);
} else {
  initializeAdminData();
}
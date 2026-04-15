// ADMIN PANEL FUNCTIONALITY

// Enhanced Authentication check with session tokens
async function checkAuth() {
  const sessionToken = sessionStorage.getItem('sessionToken');

  if (!sessionToken) {
    window.location.href = '/admin/login.html';
    return;
  }

  try {
    // Verify token with backend
    const response = await fetch('https://inverted-exeshop-production.up.railway.app/api/auth/verify', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sessionToken}`
      }
    });

    if (!response.ok) {
      sessionStorage.removeItem('sessionToken');
      window.location.href = '/admin/login.html';
    }
  } catch (error) {
    console.error('Auth check failed:', error);
    sessionStorage.removeItem('sessionToken');
    window.location.href = '/admin/login.html';
  }
}

// Setup session monitors
function setupSessionMonitor() {
  ['mousedown', 'keydown', 'scroll', 'touchstart'].forEach(event => {
    document.addEventListener(event, () => checkAuth(), true);
  });

  setInterval(() => checkAuth(), 5 * 60 * 1000);
}

// Initialize auth check
async function initAuthCheck() {
  await checkAuth();
  setupSessionMonitor();
}

// Logout function
async function logout() {
  const sessionToken = sessionStorage.getItem('sessionToken');

  try {
    await fetch('https://inverted-exeshop-production.up.railway.app/api/auth/logout', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sessionToken}`
      }
    });
  } catch (error) {
    console.error('Logout error:', error);
  }

  sessionStorage.removeItem('sessionToken');
  window.location.href = '/admin/login.html';
}

// Call on load
initAuthCheck();

// Current section tracking
let currentSection = 'shop';
let currentEditingId = null;
let currentEditingType = null;

// Data storage
let adminData = {
  shop: [],
  archive: [],
  gallery: []
};

// Upload image to backend API (which handles Firebase Storage)
async function uploadImageToStorage(base64Data, fileName) {
  try {
    const sessionToken = sessionStorage.getItem('sessionToken');
    const response = await fetch('https://inverted-exeshop-production.up.railway.app/api/admin/upload-images', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sessionToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        images: [base64Data],
        type: 'shop' // or 'gallery', doesn't matter for upload
      })
    });

    if (!response.ok) {
      throw new Error('Failed to upload image');
    }

    const result = await response.json();
    return result.urls[0]; // Return the first (and only) URL

  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
  initializeAdmin();
});

async function initializeAdmin() {
  console.log('Initializing admin panel...');
  
  // Setup session security
  setupSessionMonitor();
  
  // Wait for Firebase to initialize
  await new Promise(resolve => {
    if (typeof db !== 'undefined') {
      resolve();
    } else {
      setTimeout(resolve, 500);
    }
  });

  // Load initial data
  loadAllData();

  // Setup event listeners
  setupEventListeners();

  console.log('Admin panel initialized');
}

// Load all data from backend API
async function loadAllData() {
  try {
    const sessionToken = sessionStorage.getItem('sessionToken');
    const response = await fetch('https://inverted-exeshop-production.up.railway.app/api/admin/data', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${sessionToken}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to load data');
    }

    const data = await response.json();

    adminData.shop = data.shop || [];
    adminData.archive = data.archive || [];
    adminData.gallery = data.gallery || [];

    // Initial render
    renderShopItems();

  } catch (error) {
    console.error('Error loading data:', error);
    alert('Failed to load admin data. Please refresh the page.');
  }
}

// Setup all event listeners
function setupEventListeners() {
  // Section navigation
  document.querySelectorAll('[data-section]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      switchSection(link.dataset.section);
    });
  });

  // Add buttons
  document.getElementById('addShopBtn').addEventListener('click', () => openItemModal('shop'));
  document.getElementById('addGalleryBtn').addEventListener('click', () => openItemModal('gallery'));

  // Sync button
  const syncBtn = document.getElementById('syncBtn');
  if (syncBtn) {
    syncBtn.addEventListener('click', syncAllDataToFirebase);
  }

  // Modal controls
  document.getElementById('modalClose').addEventListener('click', closeItemModal);
  document.getElementById('itemModal').addEventListener('click', (e) => {
    if (e.target.id === 'itemModal') closeItemModal();
  });

  // Confirm modal
  document.getElementById('confirmCancel').addEventListener('click', closeConfirmModal);
  document.getElementById('confirmModal').addEventListener('click', (e) => {
    if (e.target.id === 'confirmModal') closeConfirmModal();
  });

  // Logout
  document.getElementById('logoutBtn').addEventListener('click', async () => {
    if (confirm('logout from admin panel?')) {
      try {
        await firebase.auth().signOut();
      } catch (err) {
        console.warn('firebase signOut failed', err);
      }

      // Clear all session data
      sessionStorage.removeItem('adminAuthenticated');
      sessionStorage.removeItem('adminLoginTime');
      
      // Log security event
      const logs = JSON.parse(localStorage.getItem('adminSecurityLog') || '[]');
      logs.push({ 
        timestamp: new Date().toISOString(), 
        event: 'manual_logout',
        details: { user: 'admin' }
      });
      localStorage.setItem('adminSecurityLog', JSON.stringify(logs.slice(-50)));
      
      // Clear form data
      const forms = document.querySelectorAll('form');
      forms.forEach(form => form.reset());
      
      window.location.href = '/admin/login.html';
    }
  });

  // Mobile burger menu
  const burger = document.getElementById('burger');
  const mobileNav = document.getElementById('mobileNav');
  const header = document.querySelector('.site-header');

  // Populate mobile nav with section links
  if (mobileNav) {
    mobileNav.innerHTML = `
      <a href="#shop-section" class="mobile-link active" data-section="shop">shop</a>
      <a href="#archive-section" class="mobile-link" data-section="archive">.archive</a>
      <a href="#gallery-section" class="mobile-link" data-section="gallery">gallery</a>
    `;

    // Mobile nav link click handlers
    mobileNav.querySelectorAll('[data-section]').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        switchSection(link.dataset.section);
        
        // Update active state
        mobileNav.querySelectorAll('[data-section]').forEach(l => l.classList.remove('active'));
        link.classList.add('active');
        
        // Close menu
        burger.classList.remove('open');
        mobileNav.classList.remove('open');
        document.body.classList.remove('mobile-nav-open');
        header.classList.remove('mobile-nav-active');
      });
    });
  }

  if (burger) {
    burger.addEventListener('click', (e) => {
      burger.classList.toggle('open');
      mobileNav.classList.toggle('open');
      document.body.classList.toggle('mobile-nav-open');
      header.classList.toggle('mobile-nav-active');
      e.stopPropagation();
    });
  }

  // Close mobile nav when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.burger') && !e.target.closest('.mobile-nav-overlay')) {
      if (burger && burger.classList.contains('open')) {
        burger.classList.remove('open');
        mobileNav.classList.remove('open');
        document.body.classList.remove('mobile-nav-open');
        header.classList.remove('mobile-nav-active');
      }
    }
  });
}

// Switch section
function switchSection(section) {
  currentSection = section;

  // Update nav links
  document.querySelectorAll('[data-section]').forEach(link => {
    link.classList.toggle('active', link.dataset.section === section);
  });

  // Hide all sections
  document.querySelectorAll('.admin-section').forEach(s => s.style.display = 'none');

  // Show current section
  document.getElementById(`${section}-section`).style.display = 'block';

  // Render appropriate data
  switch (section) {
    case 'shop':
      renderShopItems();
      break;
    case 'archive':
      renderArchiveItems();
      break;
    case 'gallery':
      renderGalleryItems();
      break;
  }

  // Close mobile menu
  const burger = document.getElementById('burger');
  if (burger) {
    burger.classList.remove('open');
    document.getElementById('mobileNav').classList.remove('open');
    document.body.classList.remove('mobile-nav-open');
    document.querySelector('.site-header').classList.remove('mobile-nav-active');
  }
}

// SHOP ITEMS RENDERING
function renderShopItems() {
  const grid = document.getElementById('shopGrid');

  if (!adminData.shop || adminData.shop.length === 0) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <i class="ri-shopping-bag-line"></i>
        <p>no products yet. add one to get started.</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = adminData.shop.map((item, idx) => `
    <div class="admin-item-card">
      <div class="admin-item-image ${!item.image ? 'empty' : ''}">
        ${item.image ? `<img src="${item.image}" alt="${item.name}">` : '<i class="ri-image-add-line"></i>'}
      </div>
      <div class="admin-item-info">
        <h4 class="admin-item-title">${item.name || 'untitled'}</h4>
        <div class="admin-item-meta">
          <span>💰 $${item.price || '0'}</span>
          ${item.teepublicLink ? `<span>🔗 teepublic linked</span>` : ''}
          ${item.teesLink ? `<span>🛍️ tees.co.id linked</span>` : ''}
        </div>
      </div>
      <div class="admin-item-actions">
        <button class="btn-edit" onclick="editShopItem(${idx})">edit</button>
        <button class="btn-archive" onclick="archiveShopItem(${idx})">archive</button>
        <button class="btn-delete" onclick="deleteShopItem(${idx})">delete</button>
      </div>
    </div>
  `).join('');
}

// ARCHIVE ITEMS RENDERING
function renderArchiveItems() {
  const grid = document.getElementById('archiveGrid');

  if (!adminData.archive || adminData.archive.length === 0) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <i class="ri-archive-line"></i>
        <p>no archive items yet. add one to get started.</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = adminData.archive.map((item, idx) => `
    <div class="admin-item-card">
      <div class="admin-item-image ${!item.image ? 'empty' : ''}">
        ${item.image ? `<img src="${item.image}" alt="${item.name}">` : '<i class="ri-image-add-line"></i>'}
      </div>
      <div class="admin-item-info">
        <h4 class="admin-item-title">${item.name || 'untitled'}</h4>
        <div class="admin-item-meta">
          <span>💰 $${item.price || '0'}</span>
          <span>📅 ${item.archivedAt ? new Date(item.archivedAt).toLocaleDateString() : 'unknown'}</span>
        </div>
      </div>
      <div class="admin-item-actions">
        <button class="btn-unarchive" onclick="unarchiveArchiveItem(${idx})">unarchive</button>
        <button class="btn-delete" onclick="deleteArchiveItem(${idx})">delete</button>
      </div>
    </div>
  `).join('');
}

// GALLERY ITEMS RENDERING
function renderGalleryItems() {
  const grid = document.getElementById('galleryGrid');

  if (!adminData.gallery || adminData.gallery.length === 0) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <i class="ri-gallery-line"></i>
        <p>no gallery items yet. add one to get started.</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = adminData.gallery.map((item, idx) => `
    <div class="admin-item-card">
      <div class="admin-item-image ${!item.image ? 'empty' : ''}">
        ${item.image ? `<img src="${item.image}" alt="${item.title}">` : '<i class="ri-image-add-line"></i>'}
      </div>
      <div class="admin-item-info">
        <h4 class="admin-item-title">${item.title || 'untitled'}</h4>
        <div class="admin-item-meta">
          <span>📸 gallery image</span>
        </div>
      </div>
      <div class="admin-item-actions">
        <button class="btn-edit" onclick="editGalleryItem(${idx})">edit</button>
        <button class="btn-delete" onclick="deleteGalleryItem(${idx})">delete</button>
      </div>
    </div>
  `).join('');
}

// MODAL FUNCTIONS
function openItemModal(type, itemIndex = null) {
  const modal = document.getElementById('itemModal');
  const form = document.getElementById('itemForm');
  const title = document.getElementById('modalTitle');
  
  currentEditingType = type;
  currentEditingId = itemIndex;

  // Initialize editing images array with existing images (if editing)
  if (type === 'shop') {
    window.shopCurrentImagesEditing = [];
    if (itemIndex !== null) {
      const existingItem = adminData.shop[itemIndex];
      if (existingItem?.images) {
        window.shopCurrentImagesEditing = [...existingItem.images];
      }
    }
  } else if (type === 'gallery') {
    window.galleryImageData = null;
  }

  let formHTML = '';
  let item = null;

  if (itemIndex !== null) {
    title.textContent = `edit ${type}`;
    if (type === 'shop') item = adminData.shop[itemIndex];
    else if (type === 'archive') item = adminData.archive[itemIndex];
    else if (type === 'gallery') item = adminData.gallery[itemIndex];
  } else {
    title.textContent = `add ${type}`;
  }

  // Build form based on type
  if (type === 'shop') {
    formHTML = `
      <div class="form-group">
        <label for="shopName">product name</label>
        <input type="text" id="shopName" placeholder="e.g., vintage tee" value="${item?.name || ''}">
      </div>
      <div class="form-group">
        <label for="shopPrice">price ($)</label>
        <input type="number" id="shopPrice" placeholder="0.00" value="${item?.price || ''}" step="0.01">
      </div>
      <div class="form-group">
        <label>product images</label>
        <div class="image-upload-group">
          <div class="images-preview-container" id="shopImagesPreview">
            ${item?.images && item.images.length > 0 ? item.images.map((img, i) => `
              <div class="image-preview-item">
                <img src="${img}" alt="preview ${i + 1}">
                <button type="button" class="btn-remove-image" onclick="removeImageFromPreview('shop', ${i})">×</button>
              </div>
            `).join('') : '<div class="empty-preview"><i class="ri-image-add-line"></i><p>no images selected</p></div>'}
          </div>
          <div class="upload-options">
            <div class="form-group">
              <label for="shopImageFile">choose files (multiple)</label>
              <input type="file" id="shopImageFile" accept="image/*" multiple onchange="handleMultipleImageUpload(event, 'shop')">
              <small>you can select multiple images at once</small>
            </div>
            <div class="divider">or</div>
            <div class="form-group">
              <label for="shopImageUrl">image url</label>
              <input type="url" id="shopImageUrl" placeholder="https://example.com/image.jpg" value="${item?.images && item.images.length === 1 && !item.images[0].startsWith('data:') ? item.images[0] : ''}">
              <small>add single image via URL</small>
            </div>
          </div>
        </div>
      </div>
      <div class="form-group">
        <label for="shopDescription">description</label>
        <textarea id="shopDescription" placeholder="describe your product">${item?.description || ''}</textarea>
      </div>
      <div class="form-group">
        <label for="shopTeepublic">teepublic link</label>
        <input type="url" id="shopTeepublic" placeholder="https://teepublic.com/..." value="${item?.teepublicLink || ''}">
      </div>
      <div class="form-group">
        <label for="shopTees">tees.co.id link</label>
        <input type="url" id="shopTees" placeholder="https://tees.co.id/..." value="${item?.teesLink || ''}">
      </div>
      <div class="form-group">
        <label for="shopDesignBy">design by</label>
        <input type="text" id="shopDesignBy" placeholder="e.g., designer name" value="${item?.designBy || ''}">
      </div>
      <div class="form-actions">
        <button type="button" class="btn-cancel" onclick="closeItemModal()">cancel</button>
        <button type="button" class="btn-save" onclick="saveShopItem()">save product</button>
      </div>
    `;
  } else if (type === 'archive') {
    formHTML = `
      <div class="form-group">
        <label>⚠️ this item is archived and cannot be edited</label>
        <p class="archive-notice">unarchive this item to make changes to it</p>
      </div>
      <div class="form-group">
        <label for="archiveTitle">title</label>
        <input type="text" id="archiveTitle" placeholder="archive item title" value="${item?.name || ''}" readonly>
      </div>
      <div class="form-group">
        <label for="archivePrice">price ($)</label>
        <input type="text" id="archivePrice" value="$${item?.price || '0'}" readonly>
      </div>
      <div class="form-group">
        <label>product image</label>
        <div class="image-upload-group">
          <div class="image-preview-container">
            <div class="image-preview" id="archiveImagePreview">
              ${item?.image ? `<img src="${item.image}" alt="preview">` : '<i class="ri-image-add-line"></i><p>no image</p>'}
            </div>
          </div>
        </div>
      </div>
      <div class="form-group">
        <label for="archiveDescription">description</label>
        <textarea id="archiveDescription" placeholder="describe this archive item" readonly>${item?.description || ''}</textarea>
      </div>
      <div class="form-actions">
        <button type="button" class="btn-cancel" onclick="closeItemModal()">close</button>
        <button type="button" class="btn-unarchive" onclick="unarchiveArchiveItem(${itemIndex})" style="flex: 1;">unarchive item</button>
      </div>
    `;
  } else if (type === 'gallery') {
    formHTML = `
      <div class="form-group">
        <label for="galleryTitle">title</label>
        <input type="text" id="galleryTitle" placeholder="gallery item title" value="${item?.title || ''}">
      </div>
      <div class="form-group">
        <label>gallery image</label>
        <div class="image-upload-group">
          <div class="image-preview-container">
            <div class="image-preview" id="galleryImagePreview">
              ${item?.image ? `<img src="${item.image}" alt="preview">` : '<i class="ri-image-add-line"></i><p>no image selected</p>'}
            </div>
          </div>
          <div class="upload-options">
            <div class="form-group">
              <label for="galleryImageFile">choose file</label>
              <input type="file" id="galleryImageFile" accept="image/*" onchange="handleImageUpload(event, 'gallery')">
            </div>
            <div class="divider">or</div>
            <div class="form-group">
              <label for="galleryImageUrl">image url</label>
              <input type="url" id="galleryImageUrl" placeholder="https://example.com/image.jpg" value="${item?.image && !item.image.startsWith('data:') ? item.image : ''}">
            </div>
          </div>
        </div>
      </div>
      <div class="form-actions">
        <button type="button" class="btn-cancel" onclick="closeItemModal()">cancel</button>
        <button type="button" class="btn-save" onclick="saveGalleryItem()">save image</button>
      </div>
    `;
  }

  form.innerHTML = formHTML;
  modal.classList.add('active');
}

// Handle image upload and preview
function handleImageUpload(event, type) {
  const file = event.target.files[0];
  if (!file) return;

  // Validate file size (max 5MB)
  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    showNotification('image size must be less than 5MB', 'error');
    return;
  }

  // Read file and convert to base64
  const reader = new FileReader();
  reader.onload = (e) => {
    const imageData = e.target.result;
    const previewId = `${type}ImagePreview`;
    const preview = document.getElementById(previewId);
    
    if (preview) {
      preview.innerHTML = `<img src="${imageData}" alt="preview">`;
    }

    // Store image data in a hidden input or variable
    window[`${type}ImageData`] = imageData;
  };
  reader.readAsDataURL(file);
}

// Handle multiple image uploads for shop
function handleMultipleImageUpload(event, type) {
  const files = Array.from(event.target.files);
  if (files.length === 0) return;

  // Initialize array if not exists
  if (!window[`${type}CurrentImagesEditing`]) {
    window[`${type}CurrentImagesEditing`] = [];
  }

  let filesProcessed = 0;

  files.forEach((file, index) => {
    // Validate file size (max 5MB each)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      showNotification(`image ${index + 1} is too large (max 5MB)`, 'error');
      return;
    }

    // Read file and convert to base64
    const reader = new FileReader();
    reader.onload = (e) => {
      const imageData = e.target.result;
      window[`${type}CurrentImagesEditing`].push(imageData);
      filesProcessed++;

      // Update preview
      if (filesProcessed === files.length) {
        updateImagesPreview(type);
      }
    };
    reader.readAsDataURL(file);
  });

  showNotification(`${files.length} image(s) added`, 'success');
}

// Update preview for multiple images
function updateImagesPreview(type) {
  const allImages = window[`${type}CurrentImagesEditing`] || [];
  const previewId = `${type}ImagesPreview`;
  const preview = document.getElementById(previewId);

  if (!preview) return;

  if (allImages.length === 0) {
    preview.innerHTML = '<div class="empty-preview"><i class="ri-image-add-line"></i><p>no images selected</p></div>';
  } else {
    preview.innerHTML = allImages.map((img, i) => `
      <div class="image-preview-item">
        <img src="${img}" alt="preview ${i + 1}">
        <button type="button" class="btn-remove-image" onclick="removeImageFromPreview('${type}', ${i})">×</button>
      </div>
    `).join('');
  }
}

// Remove image from preview
function removeImageFromPreview(type, index) {
  const imagesArray = window[`${type}CurrentImagesEditing`];
  if (imagesArray && imagesArray.length > index) {
    imagesArray.splice(index, 1);
    updateImagesPreview(type);
  }
}

function closeItemModal() {
  document.getElementById('itemModal').classList.remove('active');
  currentEditingId = null;
  currentEditingType = null;
  // Clear images editing array
  window.shopCurrentImagesEditing = [];
  window.galleryImageData = null;
}

function closeConfirmModal() {
  document.getElementById('confirmModal').classList.remove('active');
}

// SAVE FUNCTIONS
async function saveShopItem() {
  const name = document.getElementById('shopName').value.trim();
  const price = parseFloat(document.getElementById('shopPrice').value) || 0;
  const description = document.getElementById('shopDescription').value.trim();
  const teepublicLink = document.getElementById('shopTeepublic').value.trim();
  const teesLink = document.getElementById('shopTees').value.trim();
  const designBy = document.getElementById('shopDesignBy').value.trim();

  // Use images from the editing array
  let images = window.shopCurrentImagesEditing || [];

  // Fallback to URL if no images in array
  if (images.length === 0) {
    const imageUrl = document.getElementById('shopImageUrl').value.trim();
    if (imageUrl) {
      images = [imageUrl];
    }
  }

  if (!name) {
    showNotification('please enter product name', 'error');
    return;
  }

  if (images.length === 0) {
    if (currentEditingId === null) {
      showNotification('please select or enter at least one image for new product', 'error');
    } else {
      showNotification('at least one image required', 'error');
    }
    return;
  }

  // Upload base64 images to backend API
  const base64Images = images.filter(img => img.startsWith('data:'));
  let uploadedImages = images.filter(img => !img.startsWith('data:')); // Keep existing URLs

  if (base64Images.length > 0) {
    try {
      showNotification(`uploading ${base64Images.length} image(s)...`);
      const sessionToken = sessionStorage.getItem('sessionToken');
      const response = await fetch('https://inverted-exeshop-production.up.railway.app/api/admin/upload-images', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sessionToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          images: base64Images,
          type: 'shop'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to upload images');
      }

      const result = await response.json();
      uploadedImages = uploadedImages.concat(result.urls);
    } catch (error) {
      console.error('Failed to upload images:', error);
      showNotification('failed to upload images', 'error');
      return;
    }
  }

  // Get createdAt - handle case where it might be undefined
  let createdAt;
  if (currentEditingId !== null) {
    createdAt = adminData.shop[currentEditingId]?.createdAt || new Date().toISOString();
  } else {
    createdAt = new Date().toISOString();
  }

  const item = {
    id: currentEditingId !== null ? adminData.shop[currentEditingId].id : Date.now(),
    name,
    price,
    images: uploadedImages, // Store uploaded URLs
    image: uploadedImages[0], // Keep first image as primary for backward compatibility
    description,
    teepublicLink,
    teesLink,
    designBy,
    createdAt: createdAt,
    updatedAt: new Date().toISOString()
  };

  try {
    // Validate all required fields are not undefined
    if (item.createdAt === undefined) {
      throw new Error('createdAt is undefined');
    }

    if (currentEditingId !== null) {
      // Update existing
      adminData.shop[currentEditingId] = item;
    } else {
      // Add new
      adminData.shop.push(item);
    }

    // Clean up any undefined values in the entire shop array before saving
    const cleanedShop = adminData.shop.map(shopItem => {
      return {
        id: shopItem.id,
        name: shopItem.name || '',
        price: shopItem.price || 0,
        images: shopItem.images || [],
        image: shopItem.image || '',
        description: shopItem.description || '',
        teepublicLink: shopItem.teepublicLink || '',
        teesLink: shopItem.teesLink || '',
        designBy: shopItem.designBy || '',
        createdAt: shopItem.createdAt || new Date().toISOString(),
        updatedAt: shopItem.updatedAt || new Date().toISOString()
      };
    });

    // Save to backend API
    const sessionToken = sessionStorage.getItem('sessionToken');
    const response = await fetch('https://inverted-exeshop-production.up.railway.app/api/admin/save', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sessionToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type: 'shop',
        data: cleanedShop
      })
    });

    if (!response.ok) {
      throw new Error('Failed to save to server');
    }

    const result = await response.json();
    console.log('Save result:', result);

    // Clear image data
    window.shopCurrentImagesEditing = [];

    showNotification('product saved successfully');
    closeItemModal();
    renderShopItems();
  } catch (error) {
    console.error('Error saving shop item:', error);
    showNotification('failed to save product', 'error');
  }
}

async function saveArchiveItem() {
  // Archive items are read-only, cannot be edited
  showNotification('archive items cannot be edited', 'info');
  closeItemModal();
}

async function saveGalleryItem() {
  const title = document.getElementById('galleryTitle').value.trim();
  let image = document.getElementById('galleryImageUrl').value.trim();

  // Use uploaded image data if available
  if (window.galleryImageData) {
    image = window.galleryImageData;
  }

  if (!title) {
    showNotification('please enter image title', 'error');
    return;
  }

  if (!image) {
    showNotification('please select or enter an image', 'error');
    return;
  }

  // Upload base64 image to backend API if needed
  let finalImage = image;
  if (image.startsWith('data:')) {
    try {
      showNotification('uploading image...');
      const sessionToken = sessionStorage.getItem('sessionToken');
      const response = await fetch('https://inverted-exeshop-production.up.railway.app/api/admin/upload-images', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sessionToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          images: [image],
          type: 'gallery'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to upload image');
      }

      const result = await response.json();
      finalImage = result.urls[0];
    } catch (error) {
      console.error('Failed to upload image:', error);
      showNotification('failed to upload image', 'error');
      return;
    }
  }

  const item = {
    id: currentEditingId !== null ? adminData.gallery[currentEditingId].id : Date.now(),
    title,
    image: finalImage,
    updatedAt: new Date().toISOString()
  };

  try {
    if (currentEditingId !== null) {
      // Update existing
      adminData.gallery[currentEditingId] = item;
    } else {
      // Add new
      adminData.gallery.push(item);
    }

    // Save to backend API
    const sessionToken = sessionStorage.getItem('sessionToken');
    const response = await fetch('https://inverted-exeshop-production.up.railway.app/api/admin/save', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sessionToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type: 'gallery',
        data: adminData.gallery
      })
    });

    if (!response.ok) {
      throw new Error('Failed to save to server');
    }

    const result = await response.json();
    console.log('Save result:', result);

    // Clear image data
    window.galleryImageData = null;

    showNotification('gallery image saved successfully');
    closeItemModal();
    renderGalleryItems();
  } catch (error) {
    console.error('Error saving gallery item:', error);
    showNotification('failed to save image', 'error');
  }
}

// EDIT FUNCTIONS
function editShopItem(idx) {
  openItemModal('shop', idx);
}

function editArchiveItem(idx) {
  openItemModal('archive', idx);
}

function editGalleryItem(idx) {
  openItemModal('gallery', idx);
}

// ARCHIVE FUNCTIONS
function archiveShopItem(idx) {
  const item = adminData.shop[idx];
  openConfirmDelete(() => {
    const archivedItem = {
      ...item,
      archivedAt: new Date().toISOString()
    };
    
    // Move to archive
    adminData.archive.push(archivedItem);
    adminData.shop.splice(idx, 1);
    
    // Save to Firebase
    db.ref('content/shop').set(adminData.shop);
    db.ref('content/archive').set(adminData.archive);
    
    showNotification('product archived successfully');
    renderShopItems();
  }, 'archive');
}

function unarchiveArchiveItem(idx) {
  const item = adminData.archive[idx];
  openConfirmDelete(() => {
    const unarchivedItem = {
      ...item,
      archivedAt: null
    };
    
    // Move back to shop
    adminData.shop.push(unarchivedItem);
    adminData.archive.splice(idx, 1);
    
    // Save to Firebase
    db.ref('content/shop').set(adminData.shop);
    db.ref('content/archive').set(adminData.archive);
    
    showNotification('product unarchived successfully');
    renderArchiveItems();
  }, 'unarchive');
}

// DELETE FUNCTIONS
function deleteShopItem(idx) {
  openConfirmDelete(() => {
    adminData.shop.splice(idx, 1);
    db.ref('content/shop').set(adminData.shop);
    showNotification('product deleted');
    renderShopItems();
  });
}

function deleteArchiveItem(idx) {
  openConfirmDelete(() => {
    adminData.archive.splice(idx, 1);
    db.ref('content/archive').set(adminData.archive);
    showNotification('archive item deleted');
    renderArchiveItems();
  });
}

function deleteGalleryItem(idx) {
  openConfirmDelete(() => {
    adminData.gallery.splice(idx, 1);
    db.ref('content/gallery').set(adminData.gallery);
    showNotification('gallery image deleted');
    renderGalleryItems();
  });
}

function openConfirmDelete(onConfirm, action = 'delete') {
  const confirmModal = document.getElementById('confirmModal');
  const modalTitle = confirmModal.querySelector('h3');
  const modalText = confirmModal.querySelector('p');
  const deleteBtn = document.getElementById('confirmDelete');
  
  // Update modal text based on action
  if (action === 'archive') {
    modalTitle.textContent = 'confirm archive';
    modalText.textContent = 'are you sure you want to archive this product? you can unarchive it later.';
    deleteBtn.textContent = 'archive';
    deleteBtn.className = 'btn-archive';
  } else if (action === 'unarchive') {
    modalTitle.textContent = 'confirm unarchive';
    modalText.textContent = 'are you sure you want to unarchive this product? it will return to the shop.';
    deleteBtn.textContent = 'unarchive';
    deleteBtn.className = 'btn-unarchive';
  } else {
    modalTitle.textContent = 'confirm delete';
    modalText.textContent = 'are you sure you want to delete this item? this action cannot be undone.';
    deleteBtn.textContent = 'delete';
    deleteBtn.className = 'btn-delete';
  }
  
  document.getElementById('confirmDelete').onclick = () => {
    onConfirm();
    closeConfirmModal();
  };
  confirmModal.classList.add('active');
}

// NOTIFICATIONS
function showNotification(message, type = 'success') {
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.remove();
  }, 3000);
}

// SYNC ALL DATA TO FIREBASE
async function syncAllDataToFirebase() {
  const syncBtn = document.getElementById('syncBtn');
  
  try {
    // Set button to loading state
    syncBtn.classList.add('syncing');
    syncBtn.disabled = true;
    
    showNotification('Syncing all data to Firebase...', 'info');

    // Clean all data before upload
    const cleanedData = {
      shop: [],
      archive: [],
      gallery: []
    };

    // Clean shop items
    if (adminData.shop && Array.isArray(adminData.shop)) {
      cleanedData.shop = adminData.shop.map(item => ({
        id: item.id,
        name: item.name || '',
        price: item.price || 0,
        images: Array.isArray(item.images) ? item.images : (item.image ? [item.image] : []),
        image: item.image || '',
        description: item.description || '',
        teepublicLink: item.teepublicLink || '',
        teesLink: item.teesLink || '',
        designBy: item.designBy || '',
        createdAt: item.createdAt || new Date().toISOString(),
        updatedAt: item.updatedAt || new Date().toISOString()
      }));
    }

    // Clean archive items
    if (adminData.archive && Array.isArray(adminData.archive)) {
      cleanedData.archive = adminData.archive.map(item => ({
        id: item.id,
        name: item.name || '',
        price: item.price || 0,
        images: Array.isArray(item.images) ? item.images : (item.image ? [item.image] : []),
        image: item.image || '',
        description: item.description || '',
        teepublicLink: item.teepublicLink || '',
        teesLink: item.teesLink || '',
        designBy: item.designBy || '',
        createdAt: item.createdAt || new Date().toISOString(),
        updatedAt: item.updatedAt || new Date().toISOString()
      }));
    }

    // Clean gallery items
    if (adminData.gallery && Array.isArray(adminData.gallery)) {
      cleanedData.gallery = adminData.gallery.map(item => ({
        id: item.id,
        title: item.title || '',
        image: item.image || '',
        createdAt: item.createdAt || new Date().toISOString()
      }));
    }

    // Upload to Firebase
    if (typeof db !== 'undefined') {
      // Upload each section
      await db.ref('content/shop').set(cleanedData.shop);
      await db.ref('content/archive').set(cleanedData.archive);
      await db.ref('content/gallery').set(cleanedData.gallery);

      // Save to localStorage too
      localStorage.setItem('inverted_admin_data', JSON.stringify(cleanedData));
      localStorage.setItem('inverted_last_sync', new Date().toISOString());

      showNotification('✅ All data synced to Firebase successfully!', 'success');
      console.log('Firebase sync completed:', cleanedData);
    } else {
      throw new Error('Firebase not initialized');
    }
  } catch (error) {
    console.error('Error syncing to Firebase:', error);
    showNotification('Failed to sync to Firebase: ' + error.message, 'error');
  } finally {
    // Reset button state
    syncBtn.classList.remove('syncing');
    syncBtn.disabled = false;
  }
}

// Product Detail Page Logic

let currentProductData = {
  images: [],
  currentImageIndex: 0
};

function loadAdminData() {
  const adminData = JSON.parse(localStorage.getItem('inverted_admin_data')) || {
    shop: [],
    archive: [],
    gallery: []
  };
  return adminData;
}

function getProductIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return parseInt(params.get('id'));
}

function displayProductDetail() {
  const productId = getProductIdFromUrl();
  const adminData = loadAdminData();
  const product = adminData.shop.find(p => p.id === productId);

  if (!product) {
    document.querySelector('.detail-content').innerHTML = `
      <div style="text-align: center; padding: 60px 20px;">
        <h2 style="color: var(--accent); margin-bottom: 20px;">Product Not Found</h2>
        <p style="color: rgba(255,255,255,0.7); margin-bottom: 30px;">Sorry, this product doesn't exist.</p>
        <a href="/shop" class="btn btn-primary" style="display: inline-block; padding: 12px 24px; border: 2px solid var(--accent); color: var(--accent); text-decoration: none; border-radius: 2px; transition: all 0.2s;">Back to Shop</a>
      </div>
    `;
    return;
  }

  // Ensure all properties exist (for backward compatibility with old data)
  if (!product.teepublicLink) product.teepublicLink = '';
  if (!product.teesLink) product.teesLink = '';

  // Set up image gallery data
  currentProductData = {
    images: product.images || [product.image],
    currentImageIndex: 0
  };

  // Render all images in vertical layout
  const imagesContainer = document.getElementById('detailProductImages');
  imagesContainer.innerHTML = currentProductData.images.map((img, index) => `
    <div class="product-image-item">
      <img src="${img}" alt="Product Image ${index + 1}">
    </div>
  `).join('');

  // Set product info
  document.getElementById('detailProductName').textContent = product.name || '';
  document.getElementById('detailProductPrice').textContent = product.price ? `$${product.price}` : 'Contact for Price';
  document.getElementById('detailProductDescription').textContent = product.description || '';

  // Set created date
  if (product.createdAt) {
    const date = new Date(product.createdAt).toLocaleDateString();
    document.getElementById('detailCreatedAt').textContent = date;
  } else if (product.updatedAt) {
    // Fallback to updatedAt if createdAt doesn't exist
    const date = new Date(product.updatedAt).toLocaleDateString();
    document.getElementById('detailCreatedAt').textContent = date;
  }

  // Set design by
  if (product.designBy) {
    const designByElement = document.getElementById('detailDesignBy');
    designByElement.textContent = `design by ${product.designBy}`;
    designByElement.style.display = 'block';
  }

  // Display available sizes as pills
  const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
  const availableSizes = sizes.filter(size => {
    const stock = product.stock && product.stock[size] ? parseInt(product.stock[size]) : 0;
    return stock > 0;
  });

  if (availableSizes.length > 0) {
    const detailSizes = document.getElementById('detailSizes');
    const sizesPillsContainer = document.getElementById('sizesPillsContainer');
    
    detailSizes.style.display = 'block';
    sizesPillsContainer.innerHTML = availableSizes.map(size => `
      <span class="size-pill">${size}</span>
    `).join('');
  }

  // Setup TeePublic button
  const detailTeepublicBtn = document.getElementById('detailTeepublicBtn');
  const detailTeesBtn = document.getElementById('detailTeesBtn');
  const actionDivider = document.getElementById('actionDivider');
  
  if (product.teepublicLink) {
    detailTeepublicBtn.onclick = (e) => redirectToTeePublic(e, product.teepublicLink, product.name);
    detailTeepublicBtn.style.display = 'block';
  } else {
    detailTeepublicBtn.style.display = 'none';
  }

  // Setup Tees button
  if (product.teesLink) {
    detailTeesBtn.onclick = (e) => redirectToTees(e, product.teesLink, product.name);
    detailTeesBtn.style.display = 'block';
  } else {
    detailTeesBtn.style.display = 'none';
  }

  // Show divider only if both buttons are visible
  const hasTeepublic = product.teepublicLink && product.teepublicLink.trim() !== '';
  const hasTees = product.teesLink && product.teesLink.trim() !== '';
  if (hasTeepublic && hasTees) {
    actionDivider.style.display = 'block';
  } else {
    actionDivider.style.display = 'none';
  }

  // Setup image gallery
  // (All images are displayed vertically, no navigation needed)


  console.log('Product detail loaded:', product);
  console.log('TeePublic Link:', product.teepublicLink);
  console.log('Tees Link:', product.teesLink);
  console.log('detailTeesBtn element:', detailTeesBtn);
  console.log('detailTeesBtn display:', detailTeesBtn.style.display);
}

function selectProductImage(index) {
  // Navigation disabled - all images displayed vertically
}

function nextProductImage() {
  // Navigation disabled - all images displayed vertically
}

function previousProductImage() {
  // Navigation disabled - all images displayed vertically
}

// Keyboard navigation disabled - all images displayed vertically

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', displayProductDetail);
} else {
  displayProductDetail();
}

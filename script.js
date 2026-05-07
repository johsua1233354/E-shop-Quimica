const API_URL = 'api';

let currentUser = null;
let cart = [];

const products = [
    {
        id: 1,
        name: 'Champú de Coco',
        shortDescription: 'Champú natural con extracto de coco, ideal para cabello suave y brillante.',
        fullDescription: 'Nuestro champú de coco está elaborado con ingredientes 100% naturales y extracto puro de coco. Proporciona hidratación profunda, suavidad y brillo natural a tu cabello. Perfecto para todo tipo de cabello, especialmente para cabello seco o dañado.',
        uses: 'Cuidado diario del cabello, hidratación, reparación de cabello dañado, brillo y suavidad.',
        safety: 'Producto natural, hipoalergénico. Evitar contacto con los ojos. En caso de irritación, suspender su uso.',
        formula: 'Coco Natural + Aloe Vera',
        purity: '100% Natural',
        price: 25.99,
        stock: 100,
        emoji: '🥥'
    }
];

const particlesContainer = document.getElementById('particles');
const loginBtn = document.getElementById('loginBtn');
const userBtn = document.getElementById('userBtn');
const userDisplay = document.getElementById('userDisplay');
const navLinks = document.querySelectorAll('.nav-link');
const inicioContent = document.getElementById('inicioContent');
const productosContent = document.getElementById('productosContent');
const ventasContent = document.getElementById('ventasContent');
const nosotrosContent = document.getElementById('nosotrosContent');
const serviciosContent = document.getElementById('serviciosContent');
const productGrid = document.getElementById('productGrid');
const ventasProductGrid = document.getElementById('ventasProductGrid');
const loginModal = document.getElementById('loginModal');
const modalClose = document.getElementById('modalClose');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const loginError = document.getElementById('loginError');
const registerError = document.getElementById('registerError');
const tabBtns = document.querySelectorAll('.tab-btn');
const productModal = document.getElementById('productModal');
const productModalClose = document.getElementById('productModalClose');
const modalBody = document.getElementById('modalBody');
const cartBtn = document.getElementById('cartBtn');
const cartCount = document.getElementById('cartCount');
const cartModal = document.getElementById('cartModal');
const cartModalClose = document.getElementById('cartModalClose');
const cartItems = document.getElementById('cartItems');
const cartEmpty = document.getElementById('cartEmpty');
const cartTotal = document.getElementById('cartTotal');
const subtotalEl = document.getElementById('subtotal');
const totalEl = document.getElementById('total');
const checkoutBtn = document.getElementById('checkoutBtn');
const ventasTabs = document.querySelectorAll('.ventas-tab');
const ventasProductos = document.getElementById('ventasProductos');
const ventasHistorial = document.getElementById('ventasHistorial');
const historialContent = document.getElementById('historialContent');

function createParticles() {
    const particleCount = 60;
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.top = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 20 + 's';
        particle.style.animationDuration = (15 + Math.random() * 15) + 's';
        particlesContainer.appendChild(particle);
    }
}

loginBtn.addEventListener('click', () => {
    loginModal.classList.remove('hidden');
});

userBtn.addEventListener('click', () => {
    if (confirm('¿Deseas cerrar sesión?')) {
        currentUser = null;
        cart = [];
        updateAuthButtons();
        updateCartUI();
    }
});

function updateAuthButtons() {
    if (currentUser) {
        loginBtn.classList.add('hidden');
        userBtn.classList.remove('hidden');
        userDisplay.textContent = '👤 ' + currentUser.name;
    } else {
        loginBtn.classList.remove('hidden');
        userBtn.classList.add('hidden');
    }
}

modalClose.addEventListener('click', () => {
    loginModal.classList.add('hidden');
    loginError.textContent = '';
    registerError.textContent = '';
    loginForm.reset();
    registerForm.reset();
});

loginModal.querySelector('.modal-overlay').addEventListener('click', () => {
    loginModal.classList.add('hidden');
    loginError.textContent = '';
    registerError.textContent = '';
});

tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        if (btn.dataset.tab === 'login') {
            loginForm.classList.remove('hidden');
            registerForm.classList.add('hidden');
        } else {
            loginForm.classList.add('hidden');
            registerForm.classList.remove('hidden');
        }
        
        loginError.textContent = '';
        registerError.textContent = '';
    });
});

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;

    try {
        const response = await fetch(`${API_URL}/users/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        
        if (response.ok) {
            currentUser = await response.json();
            loginModal.classList.add('hidden');
            updateAuthButtons();
            loginForm.reset();
            loginError.textContent = '';
            await loadCart();
        } else {
            loginError.textContent = 'Usuario o contraseña incorrectos';
        }
    } catch (err) {
        loginError.textContent = 'Error de conexión con el servidor';
        console.error(err);
    }
});

registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('regName').value;
    const email = document.getElementById('regEmail').value;
    const username = document.getElementById('regUsername').value;
    const password = document.getElementById('regPassword').value;

    try {
        const response = await fetch(`${API_URL}/users/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, username, password })
        });
        
        if (response.ok) {
            const data = await response.json();
            currentUser = data;
            loginModal.classList.add('hidden');
            updateAuthButtons();
            registerForm.reset();
            registerError.textContent = '';
            alert('¡Registro exitoso! Bienvenido/a ' + name);
        } else {
            const errData = await response.json();
            registerError.textContent = errData.error || 'Error al registrar';
        }
    } catch (err) {
        registerError.textContent = 'Error de conexión con el servidor';
        console.error(err);
    }
});

navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const section = link.dataset.section;
        
        navLinks.forEach(l => l.classList.remove('active'));
        link.classList.add('active');
        
        showSection(section);
    });
});

document.querySelectorAll('.btn-primary, .btn-secondary').forEach(btn => {
    if (btn.dataset.section) {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const section = btn.dataset.section;
            
            navLinks.forEach(l => l.classList.remove('active'));
            navLinks.forEach(l => {
                if (l.dataset.section === section) {
                    l.classList.add('active');
                }
            });
            
            showSection(section);
        });
    }
});

function showSection(section) {
    inicioContent.classList.add('hidden');
    productosContent.classList.add('hidden');
    ventasContent.classList.add('hidden');
    nosotrosContent.classList.add('hidden');
    serviciosContent.classList.add('hidden');
    
    if (section === 'inicio') {
        inicioContent.classList.remove('hidden');
    } else if (section === 'productos') {
        productosContent.classList.remove('hidden');
        loadProducts();
    } else if (section === 'ventas') {
        ventasContent.classList.remove('hidden');
        loadVentasProducts();
        loadPurchaseHistory();
    } else if (section === 'nosotros') {
        nosotrosContent.classList.remove('hidden');
    } else if (section === 'servicios') {
        serviciosContent.classList.remove('hidden');
    }
}

function loadProducts() {
    productGrid.innerHTML = '';
    products.forEach((product, index) => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.style.animationDelay = (index * 0.05) + 's';
        
        card.innerHTML = `
            <div class="product-image">
                ${product.emoji}
            </div>
            <h3>${product.name}</h3>
            <p class="description">${product.shortDescription}</p>
            <p class="price">$${product.price.toFixed(2)}</p>
            <p class="stock">
                <span class="stock-dot"></span>
                Stock: ${product.stock} unidades
            </p>
        `;
        
        card.addEventListener('click', () => openProductModal(product));
        
        productGrid.appendChild(card);
    });
}

function loadVentasProducts() {
    ventasProductGrid.innerHTML = '';
    products.forEach((product, index) => {
        const card = document.createElement('div');
        card.className = 'ventas-product-card';
        card.style.animationDelay = (index * 0.05) + 's';
        
        card.innerHTML = `
            <div class="product-image">
                ${product.emoji}
            </div>
            <h3>${product.name}</h3>
            <p class="description">${product.shortDescription}</p>
            <p class="price">$${product.price.toFixed(2)}</p>
            <p class="stock">
                <span class="stock-dot"></span>
                Stock: ${product.stock} unidades
            </p>
            <div class="product-actions">
                <button class="add-to-cart-btn" data-id="${product.id}">
                    🛒 Agregar al Carrito
                </button>
            </div>
        `;
        
        card.querySelector('.add-to-cart-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            addToCart(product);
        });
        
        ventasProductGrid.appendChild(card);
    });
}

function openProductModal(product) {
    modalBody.innerHTML = `
        <div class="modal-product-image">
            ${product.emoji}
        </div>
        <h2 class="modal-product-name">${product.name}</h2>
        
        <div class="modal-product-detail">
            <div class="modal-product-detail-label">Fórmula Química</div>
            <div class="modal-product-detail-value">${product.formula}</div>
        </div>
        
        <div class="modal-product-detail">
            <div class="modal-product-detail-label">Pureza</div>
            <div class="modal-product-detail-value">${product.purity}</div>
        </div>
        
        <div class="modal-product-detail">
            <div class="modal-product-detail-label">Descripción</div>
            <div class="modal-product-detail-value">${product.fullDescription}</div>
        </div>
        
        <div class="modal-product-detail">
            <div class="modal-product-detail-label">Aplicaciones</div>
            <div class="modal-product-detail-value">${product.uses}</div>
        </div>
        
        <div class="modal-product-detail">
            <div class="modal-product-detail-label">Seguridad</div>
            <div class="modal-product-detail-value">${product.safety}</div>
        </div>
        
        <div class="modal-product-price">$${product.price.toFixed(2)}</div>
        <div class="modal-product-stock">
            <span class="stock-dot"></span>
            Stock disponible: ${product.stock} unidades
        </div>
    `;
    
    productModal.classList.remove('hidden');
}

productModalClose.addEventListener('click', () => {
    productModal.classList.add('hidden');
});

productModal.querySelector('.modal-overlay').addEventListener('click', () => {
    productModal.classList.add('hidden');
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        if (!loginModal.classList.contains('hidden')) {
            loginModal.classList.add('hidden');
        }
        if (!productModal.classList.contains('hidden')) {
            productModal.classList.add('hidden');
        }
        if (!cartModal.classList.contains('hidden')) {
            cartModal.classList.add('hidden');
        }
    }
});

async function addToCart(product) {
    if (!currentUser) {
        alert('Por favor, inicia sesión para agregar productos al carrito');
        loginModal.classList.remove('hidden');
        return;
    }

    try {
        await fetch(`${API_URL}/cart`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: currentUser.id,
                productId: product.id,
                productName: product.name,
                productEmoji: product.emoji,
                price: product.price,
                quantity: 1
            })
        });
        
        await loadCart();
        alert(`¡${product.name} agregado al carrito!`);
    } catch (err) {
        console.error(err);
        alert('Error al agregar al carrito');
    }
}

async function removeFromCart(cartItemId) {
    try {
        await fetch(`${API_URL}/cart/${cartItemId}`, {
            method: 'DELETE'
        });
        await loadCart();
    } catch (err) {
        console.error(err);
    }
}

async function updateQuantity(cartItemId, change) {
    const item = cart.find(i => i.id === cartItemId);
    if (item) {
        const newQuantity = item.quantity + change;
        if (newQuantity <= 0) {
            await removeFromCart(cartItemId);
        } else {
            try {
                await fetch(`${API_URL}/cart/${cartItemId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ quantity: newQuantity })
                });
                await loadCart();
            } catch (err) {
                console.error(err);
            }
        }
    }
}

async function loadCart() {
    if (!currentUser) {
        cart = [];
        updateCartUI();
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/cart/${currentUser.id}`);
        const data = await response.json();
        cart = data.map(item => ({
            ...item,
            userId: item.user_id,
            productId: item.product_id,
            productName: item.product_name,
            productEmoji: item.product_emoji
        }));
        updateCartUI();
    } catch (err) {
        console.error(err);
    }
}

function updateCartUI() {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    
    if (totalItems > 0) {
        cartCount.textContent = totalItems;
        cartCount.classList.remove('hidden');
    } else {
        cartCount.classList.add('hidden');
    }
    
    renderCartItems();
}

function renderCartItems() {
    if (cart.length === 0) {
        cartItems.innerHTML = '';
        cartEmpty.classList.remove('hidden');
        cartTotal.classList.add('hidden');
        return;
    }
    
    cartEmpty.classList.add('hidden');
    cartTotal.classList.remove('hidden');
    
    cartItems.innerHTML = cart.map(item => `
        <div class="cart-item">
            <span class="cart-item-emoji">${item.productEmoji}</span>
            <div class="cart-item-info">
                <div class="cart-item-name">${item.productName}</div>
                <div class="cart-item-price">$${item.price.toFixed(2)} c/u</div>
            </div>
            <div class="cart-item-quantity">
                <button class="quantity-btn" onclick="updateQuantity(${item.id}, -1)">-</button>
                <span class="quantity-value">${item.quantity}</span>
                <button class="quantity-btn" onclick="updateQuantity(${item.id}, 1)">+</button>
            </div>
            <button class="remove-btn" onclick="removeFromCart(${item.id})">Eliminar</button>
        </div>
    `).join('');
    
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const total = subtotal;
    
    subtotalEl.textContent = `$${subtotal.toFixed(2)}`;
    totalEl.textContent = `$${total.toFixed(2)}`;
}

cartBtn.addEventListener('click', async () => {
    if (currentUser) {
        await loadCart();
    }
    renderCartItems();
    cartModal.classList.remove('hidden');
});

cartModalClose.addEventListener('click', () => {
    cartModal.classList.add('hidden');
});

cartModal.querySelector('.modal-overlay').addEventListener('click', () => {
    cartModal.classList.add('hidden');
});

checkoutBtn.addEventListener('click', async () => {
    if (!currentUser) {
        alert('Por favor, inicia sesión para realizar una compra');
        cartModal.classList.add('hidden');
        loginModal.classList.remove('hidden');
        return;
    }
    
    if (cart.length === 0) {
        alert('Tu carrito está vacío');
        return;
    }
    
    try {
        const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const itemsForPurchase = cart.map(item => ({
            id: item.productId,
            name: item.productName,
            emoji: item.productEmoji,
            price: item.price,
            quantity: item.quantity
        }));
        
        await fetch(`${API_URL}/purchases`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: currentUser.id,
                items: itemsForPurchase,
                total: total
            })
        });
        
        await loadCart();
        cartModal.classList.add('hidden');
        alert('¡Compra realizada con éxito!');
        loadPurchaseHistory();
    } catch (err) {
        console.error(err);
        alert('Error al finalizar la compra');
    }
});

async function loadPurchaseHistory() {
    if (!currentUser) {
        historialContent.innerHTML = '<p class="cart-empty">Inicia sesión para ver tu historial de compras</p>';
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/purchases/${currentUser.id}`);
        const userPurchases = await response.json();
        
        if (userPurchases.length === 0) {
            historialContent.innerHTML = '<p class="cart-empty">No tienes compras registradas</p>';
            return;
        }
        
        historialContent.innerHTML = userPurchases.map(purchase => `
            <div class="historial-item">
                <div class="historial-header">
                    <div>
                        <div class="historial-id">Compra #${purchase.id}</div>
                        <div class="historial-date">${new Date(purchase.date).toLocaleString('es-ES')}</div>
                    </div>
                    <div class="historial-total">$${parseFloat(purchase.total).toFixed(2)}</div>
                </div>
                <div class="historial-products">
                    ${purchase.items.map(item => `
                        <div class="historial-product">
                            <div class="historial-product-info">
                                <span class="historial-product-emoji">${item.product_emoji}</span>
                                <div>
                                    <div class="historial-product-name">${item.product_name}</div>
                                    <div class="historial-product-quantity">Cantidad: ${item.quantity}</div>
                                </div>
                            </div>
                            <div class="historial-product-price">$${(parseFloat(item.price) * item.quantity).toFixed(2)}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('');
    } catch (err) {
        console.error(err);
        historialContent.innerHTML = '<p class="cart-empty">Error al cargar el historial</p>';
    }
}

ventasTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        ventasTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        if (tab.dataset.ventasTab === 'productos') {
            ventasProductos.classList.remove('hidden');
            ventasHistorial.classList.add('hidden');
        } else {
            ventasProductos.classList.add('hidden');
            ventasHistorial.classList.remove('hidden');
            loadPurchaseHistory();
        }
    });
});

createParticles();
updateAuthButtons();
updateCartUI();

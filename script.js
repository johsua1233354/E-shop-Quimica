// Ruta del API (modo simple). En hosting asegúrate de que exista /api/* con .htaccess.
function getApiBaseUrl() {
    const origin = window.location.origin;
    let dir = window.location.pathname || '/';
    if (!dir.endsWith('/')) {
        const last = dir.split('/').pop() || '';
        if (last.includes('.')) {
            dir = dir.slice(0, dir.length - last.length);
        } else {
            dir = dir + '/';
        }
    }
    return origin + dir.replace(/\/+$/, '/') + 'api';
}

const API_URL = getApiBaseUrl();

async function apiFetch(path, options = {}) {
    const url = `${API_URL}${String(path || '').startsWith('/') ? '' : '/'}${path}`;

    // #region debug-point B:apiFetch
    if (!url.includes('/debug/event')) {
        fetch(`${API_URL}/debug/event`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                sessionId: 'login-cart-failure',
                runId: 'pre',
                hypothesisId: 'B',
                location: 'script.js:apiFetch',
                msg: '[DEBUG] apiFetch request',
                data: { url, method: (options && options.method) ? String(options.method) : 'GET', hasBody: Boolean(options && options.body) }
            })
        }).catch(() => {});
    }
    // #endregion

    const response = await fetch(url, options);
    let data = null;
    try {
        data = await response.json();
    } catch (_) {
        data = null;
    }
    if (!response.ok) {
        // #region debug-point D:apiFetch-error
        if (!url.includes('/debug/event')) {
            fetch(`${API_URL}/debug/event`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sessionId: 'login-cart-failure',
                    runId: 'pre',
                    hypothesisId: 'D',
                    location: 'script.js:apiFetch',
                    msg: '[DEBUG] apiFetch response not ok',
                    data: { url, status: response.status, hasErrorField: Boolean(data && data.error), error: data && data.error ? String(data.error) : null }
                })
            }).catch(() => {});
        }
        // #endregion
        const message = data && data.error ? data.error : `Error HTTP ${response.status}`;
        throw new Error(message);
    }
    return data;
}

let currentUser = null;
let cart = [];

const AUTH_STORAGE_KEY = 'eshop_currentUser';

function persistCurrentUser() {
    if (!currentUser) return;
    const safeUser = {
        id: currentUser.id,
        name: currentUser.name,
        username: currentUser.username,
        email: currentUser.email
    };
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(safeUser));
}

function restoreCurrentUser() {
    try {
        const raw = localStorage.getItem(AUTH_STORAGE_KEY);
        if (!raw) return;
        const data = JSON.parse(raw);
        if (data && data.id) {
            currentUser = data;
        }
    } catch (_) {
        currentUser = null;
    }
}

function clearStoredUser() {
    localStorage.removeItem(AUTH_STORAGE_KEY);
}

const products = [
    {
        id: 1,
        name: 'Crema de Peinar de Coco',
        image: 'assets/producto-coco.jpg',
        shortDescription: 'Crema de peinar con extracto de coco para definir, suavizar y controlar el frizz sin enjuague.',
        fullDescription: 'Nuestra Crema de Peinar de Coco está formulada con extracto de coco y activos nutritivos que ayudan a hidratar, suavizar y mejorar la manejabilidad del cabello sin dejarlo pesado.<br><br>Ideal para uso diario, ayuda a controlar el frizz, definir ondas o rizos y proteger las puntas, dejando un acabado sedoso y con brillo natural.<br><br><strong>Beneficios</strong><br>• Control del frizz y la resequedad<br>• Aporta suavidad y brillo natural<br>• Facilita el peinado y desenredo<br>• Ayuda a definir ondas o rizos<br>• Protege y mejora el aspecto de las puntas<br><br><strong>Modo de Uso</strong><br>Aplicar una cantidad pequeña sobre el cabello húmedo o seco, de medios a puntas. Peinar como de costumbre. No enjuagar. Ajustar la cantidad según el largo y tipo de cabello.<br><br><strong>Presentación</strong><br>Disponible en diferentes tamaños para uso personal o profesional.',
        uses: '<strong>Aplicaciones</strong><br>• Peinado diario sin enjuague<br>• Definición de ondas o rizos<br>• Control del frizz<br>• Hidratación y suavidad en puntas resecas',
        safety: 'Producto elaborado con ingredientes naturales e hipoalergénicos. Uso externo únicamente. Evitar el contacto directo con los ojos. En caso de irritación o reacción alérgica, suspender su uso y consultar a un especialista.',
        formula: 'Extracto de Coco + Activos Nutritivos',
        purity: 'Libre de Parabenos • Sin Sulfatos',
        price: 25.99,
        stock: 100,
        emoji: '🥥'
    },
    {
        id: 2,
        name: 'Gotero de Coco',
        image: 'assets/gotero-coco.jpg',
        shortDescription: 'Sérum en gotero con extracto de coco para brillo, suavidad y control del frizz.',
        fullDescription: 'El Gotero de Coco es un sérum ligero de rápida absorción, ideal para aportar brillo inmediato, suavidad y una sensación sedosa sin dejar el cabello pesado.<br><br><strong>Beneficios</strong><br>• Brillo instantáneo<br>• Suavidad y aspecto saludable<br>• Control del frizz<br>• Ayuda a proteger las puntas<br><br><strong>Modo de Uso</strong><br>Aplicar 2–4 gotas en la palma de la mano, frotar suavemente y distribuir de medios a puntas en cabello húmedo o seco. No enjuagar. Ajustar la cantidad según el largo del cabello.<br><br><strong>Presentación</strong><br>Frasco con gotero para aplicación precisa.',
        uses: '<strong>Aplicaciones</strong><br>• Brillo y acabado final<br>• Control del frizz<br>• Suavidad en puntas resecas<br>• Rutina diaria de cuidado capilar',
        safety: 'Uso externo únicamente. Evitar contacto con los ojos. Si ocurre irritación, suspender su uso. Mantener fuera del alcance de los niños.',
        formula: 'Extracto de Coco + Aceites Naturales',
        purity: 'Libre de Parabenos',
        price: 19.99,
        stock: 100,
        emoji: '💧'
    }
];

function renderProductMedia(product) {
    if (product && product.image) {
        return `<img src="${product.image}" alt="${product.name}">`;
    }
    return product && product.emoji ? product.emoji : '';
}

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
const resenasContent = document.getElementById('resenasContent');
const faqContent = document.getElementById('faqContent');
const contactoContent = document.getElementById('contactoContent');
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
const cartOwner = document.getElementById('cartOwner');
const subtotalEl = document.getElementById('subtotal');
const totalEl = document.getElementById('total');
const checkoutBtn = document.getElementById('checkoutBtn');
const ventasTabs = document.querySelectorAll('.ventas-tab');
const ventasProductos = document.getElementById('ventasProductos');
const ventasHistorial = document.getElementById('ventasHistorial');
const historialContent = document.getElementById('historialContent');

// Toasts (notificaciones bonitas)
const toastContainer = document.getElementById('toastContainer');
function showToast({ type = 'info', title = '', message = '', timeout = 3500 } = {}) {
    if (!toastContainer) return;

    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    const icon = type === 'success' ? '✓' : type === 'error' ? '!' : 'i';

    toast.innerHTML = `
        <div class="toast-icon" aria-hidden="true">${icon}</div>
        <div class="toast-body">
            ${title ? `<div class="toast-title">${title}</div>` : ''}
            ${message ? `<div class="toast-text">${message}</div>` : ''}
        </div>
        <button class="toast-close" type="button" aria-label="Cerrar">×</button>
    `;

    const remove = () => {
        if (toast && toast.parentNode) toast.parentNode.removeChild(toast);
    };
    toast.querySelector('.toast-close').addEventListener('click', remove);
    toastContainer.appendChild(toast);
    if (timeout > 0) setTimeout(remove, timeout);
}

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
        clearStoredUser();
        updateAuthButtons();
        updateCartUI();
        // Cambia el chat a modo invitado
        loadChatConversationId();
    }
});

function openLoginModalToLogin() {
    loginModal.classList.remove('hidden');
    tabBtns.forEach(b => b.classList.remove('active'));
    const loginTab = Array.from(tabBtns).find(b => b.dataset.tab === 'login') || tabBtns[0];
    if (loginTab) loginTab.classList.add('active');
    loginForm.classList.remove('hidden');
    registerForm.classList.add('hidden');
    loginError.textContent = '';
    registerError.textContent = '';
}

function updateCartOwnerLabel() {
    if (!cartOwner) return;
    cartOwner.textContent = currentUser ? currentUser.name : '—';
}

function updateAuthButtons() {
    if (currentUser) {
        loginBtn.classList.add('hidden');
        userBtn.classList.remove('hidden');
        userDisplay.textContent = '👤 ' + currentUser.name;
    } else {
        loginBtn.classList.remove('hidden');
        userBtn.classList.add('hidden');
    }
    updateCartOwnerLabel();
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
        // #region debug-point A:login-submit
        fetch(`${API_URL}/debug/event`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                sessionId: 'login-cart-failure',
                runId: 'pre',
                hypothesisId: 'A',
                location: 'script.js:login',
                msg: '[DEBUG] login submit',
                data: { hasCurrentUser: Boolean(currentUser) }
            })
        }).catch(() => {});
        // #endregion

        currentUser = await apiFetch('/users/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        persistCurrentUser();
            
        // #region debug-point A:login-success
        fetch(`${API_URL}/debug/event`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                sessionId: 'login-cart-failure',
                runId: 'pre',
                hypothesisId: 'A',
                location: 'script.js:login',
                msg: '[DEBUG] login success',
                data: { id: currentUser && currentUser.id ? currentUser.id : null, name: currentUser && currentUser.name ? String(currentUser.name) : null, keys: currentUser ? Object.keys(currentUser) : [] }
            })
        }).catch(() => {});
        // #endregion
            
            loginModal.classList.add('hidden');
            updateAuthButtons();
            loadChatConversationId();
            loginForm.reset();
            loginError.textContent = '';
            await loadCart();
    } catch (err) {
        // #region debug-point D:login-error
        fetch(`${API_URL}/debug/event`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                sessionId: 'login-cart-failure',
                runId: 'pre',
                hypothesisId: 'D',
                location: 'script.js:login',
                msg: '[DEBUG] login error',
                data: { message: err && err.message ? String(err.message) : null }
            })
        }).catch(() => {});
        // #endregion
        loginError.textContent = err && err.message ? err.message : 'Error de conexión con el servidor';
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
        // #region debug-point A:register-submit
        fetch(`${API_URL}/debug/event`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                sessionId: 'login-cart-failure',
                runId: 'pre',
                hypothesisId: 'A',
                location: 'script.js:register',
                msg: '[DEBUG] register submit',
                data: { hasCurrentUser: Boolean(currentUser), hasName: Boolean(name), hasEmail: Boolean(email), hasUsername: Boolean(username) }
            })
        }).catch(() => {});
        // #endregion

        currentUser = await apiFetch('/users/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, username, password })
        });
        persistCurrentUser();
            
        // #region debug-point A:register-success
        fetch(`${API_URL}/debug/event`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                sessionId: 'login-cart-failure',
                runId: 'pre',
                hypothesisId: 'A',
                location: 'script.js:register',
                msg: '[DEBUG] register success',
                data: { id: currentUser && currentUser.id ? currentUser.id : null, name: currentUser && currentUser.name ? String(currentUser.name) : null, keys: currentUser ? Object.keys(currentUser) : [] }
            })
        }).catch(() => {});
        // #endregion
            
            loginModal.classList.add('hidden');
            updateAuthButtons();
            loadChatConversationId();
            registerForm.reset();
            registerError.textContent = '';
            await loadCart();
            alert('¡Registro exitoso! Bienvenido/a ' + name);
    } catch (err) {
        // #region debug-point D:register-error
        fetch(`${API_URL}/debug/event`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                sessionId: 'login-cart-failure',
                runId: 'pre',
                hypothesisId: 'D',
                location: 'script.js:register',
                msg: '[DEBUG] register error',
                data: { message: err && err.message ? String(err.message) : null }
            })
        }).catch(() => {});
        // #endregion
        registerError.textContent = err && err.message ? err.message : 'Error de conexión con el servidor';
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

// Links del footer
document.querySelectorAll('.footer-link').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const section = link.dataset.section;
        navLinks.forEach(l => l.classList.remove('active'));
        navLinks.forEach(l => {
            if (l.dataset.section === section) l.classList.add('active');
        });
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

document.querySelectorAll('.ad-cta').forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.preventDefault();
        const section = btn.dataset.section || 'productos';
        const productId = btn.dataset.productId ? parseInt(btn.dataset.productId, 10) : null;
        
        navLinks.forEach(l => l.classList.remove('active'));
        navLinks.forEach(l => {
            if (l.dataset.section === section) {
                l.classList.add('active');
            }
        });
        
        showSection(section);
        
        if (section === 'productos' && productId) {
            const product = products.find(p => p.id === productId);
            if (product) {
                openProductModal(product);
            }
        }
    });
});

function showSection(section) {
    inicioContent.classList.add('hidden');
    productosContent.classList.add('hidden');
    ventasContent.classList.add('hidden');
    nosotrosContent.classList.add('hidden');
    serviciosContent.classList.add('hidden');
    if (resenasContent) resenasContent.classList.add('hidden');
    if (faqContent) faqContent.classList.add('hidden');
    if (contactoContent) contactoContent.classList.add('hidden');
    
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
    } else if (section === 'resenas') {
        if (resenasContent) resenasContent.classList.remove('hidden');
    } else if (section === 'faq') {
        if (faqContent) faqContent.classList.remove('hidden');
    } else if (section === 'contacto') {
        if (contactoContent) contactoContent.classList.remove('hidden');
    }
}

// Año en el footer
const yearNowEl = document.getElementById('yearNow');
if (yearNowEl) {
    yearNowEl.textContent = String(new Date().getFullYear());
}

// Políticas rápidas (se muestran en el modal de producto)
const policyCopy = {
    envios: {
        title: 'Política de envíos',
        html: '<p>Procesamos pedidos rápido y te compartimos el seguimiento cuando esté disponible. El tiempo de entrega depende de tu zona.</p>'
    },
    devoluciones: {
        title: 'Devoluciones',
        html: '<p>Si tu producto llegó con algún inconveniente, contáctanos y te ayudamos a resolverlo. Conserva el empaque y la evidencia del estado.</p>'
    },
    privacidad: {
        title: 'Privacidad',
        html: '<p>Usamos tus datos solo para procesar tu compra y darte soporte. No compartimos tu información con terceros fuera de lo necesario para la entrega.</p>'
    }
};

document.querySelectorAll('.policy-link').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const key = link.dataset.policy;
        const item = policyCopy[key];
        if (!item) return;
        modalBody.innerHTML = `
            <h2 class="modal-product-name">${item.title}</h2>
            <div class="modal-product-detail">
                <div class="modal-product-detail-value">${item.html}</div>
            </div>
        `;
        productModal.classList.remove('hidden');
    });
});

// Formulario de contacto
const contactForm = document.getElementById('contactForm');
const contactStatus = document.getElementById('contactStatus');
if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (contactStatus) contactStatus.textContent = '';

        const name = (document.getElementById('contactName')?.value || '').trim();
        const email = (document.getElementById('contactEmail')?.value || '').trim();
        const message = (document.getElementById('contactMessage')?.value || '').trim();

        if (!name || !email || !message) {
            showToast({ type: 'error', title: 'Faltan datos', message: 'Completa nombre, correo y mensaje.' });
            return;
        }

        const submitBtn = contactForm.querySelector('button[type="submit"]');
        if (submitBtn) submitBtn.disabled = true;
        if (contactStatus) contactStatus.textContent = 'Enviando...';

        try {
            await apiFetch('/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, message })
            });

            contactForm.reset();
            if (contactStatus) contactStatus.textContent = 'Listo: recibimos tu mensaje.';
            showToast({ type: 'success', title: 'Mensaje enviado', message: 'Te responderemos lo antes posible.' });
        } catch (err) {
            console.error(err);
            if (contactStatus) contactStatus.textContent = 'No se pudo enviar. Intenta de nuevo.';
            showToast({ type: 'error', title: 'No se pudo enviar', message: err && err.message ? err.message : 'Intenta nuevamente.' });
        } finally {
            if (submitBtn) submitBtn.disabled = false;
        }
    });
}

function loadProducts() {
    productGrid.innerHTML = '';
    const query = normalizeText((document.getElementById('productSearch')?.value || '').trim());
    const filtered = query
        ? products.filter(p => normalizeText(`${p.name} ${p.shortDescription}`).includes(query))
        : products;

    filtered.forEach((product, index) => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.style.animationDelay = (index * 0.05) + 's';
        
        card.innerHTML = `
            <div class="product-image">
                ${renderProductMedia(product)}
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
    const query = normalizeText((document.getElementById('ventasSearch')?.value || '').trim());
    const filtered = query
        ? products.filter(p => normalizeText(`${p.name} ${p.shortDescription}`).includes(query))
        : products;

    filtered.forEach((product, index) => {
        const card = document.createElement('div');
        card.className = 'ventas-product-card';
        card.style.animationDelay = (index * 0.05) + 's';
        
        card.innerHTML = `
            <div class="product-image">
                ${renderProductMedia(product)}
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

// Buscadores
const productSearchEl = document.getElementById('productSearch');
if (productSearchEl) {
    productSearchEl.addEventListener('input', () => loadProducts());
}
const ventasSearchEl = document.getElementById('ventasSearch');
if (ventasSearchEl) {
    ventasSearchEl.addEventListener('input', () => loadVentasProducts());
}

function openProductModal(product) {
    modalBody.innerHTML = `
        <div class="modal-product-image">
            ${renderProductMedia(product)}
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
        showToast({ type: 'error', title: 'Inicia sesión', message: 'Debes iniciar sesión para agregar productos al carrito.' });
        openLoginModalToLogin();
        return;
    }

    try {
        // #region debug-point A:addToCart-start
        fetch(`${API_URL}/debug/event`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                sessionId: 'login-cart-failure',
                runId: 'pre',
                hypothesisId: 'A',
                location: 'script.js:addToCart',
                msg: '[DEBUG] addToCart start',
                data: {
                    apiUrl: API_URL,
                    userId: currentUser && currentUser.id ? currentUser.id : null,
                    userIdType: currentUser && currentUser.id !== undefined ? typeof currentUser.id : null,
                    productId: product && product.id ? product.id : null
                }
            })
        }).catch(() => {});
        // #endregion

        await apiFetch('/cart', {
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

        // #region debug-point D:addToCart-success
        fetch(`${API_URL}/debug/event`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                sessionId: 'login-cart-failure',
                runId: 'pre',
                hypothesisId: 'D',
                location: 'script.js:addToCart',
                msg: '[DEBUG] addToCart success',
                data: { cartSize: Array.isArray(cart) ? cart.length : null }
            })
        }).catch(() => {});
        // #endregion
    } catch (err) {
        // #region debug-point D:addToCart-error
        fetch(`${API_URL}/debug/event`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                sessionId: 'login-cart-failure',
                runId: 'pre',
                hypothesisId: 'D',
                location: 'script.js:addToCart',
                msg: '[DEBUG] addToCart error',
                data: { message: err && err.message ? String(err.message) : null }
            })
        }).catch(() => {});
        // #endregion
        console.error(err);
        showToast({ type: 'error', title: 'No se pudo agregar', message: err && err.message ? err.message : 'Intenta de nuevo.' });
        return;
    }
    
    showToast({ type: 'success', title: 'Agregado al carrito', message: product.name });
}

async function removeFromCart(cartItemId) {
    if (!currentUser) {
        openLoginModalToLogin();
        return;
    }
    try {
        await apiFetch(`/cart/${cartItemId}`, { method: 'DELETE' });
        await loadCart();
    } catch (err) {
        console.error(err);
        alert(err && err.message ? err.message : 'Error al eliminar del carrito');
    }
}

async function updateQuantity(cartItemId, change) {
    if (!currentUser) {
        openLoginModalToLogin();
        return;
    }
    const item = cart.find(i => i.id === cartItemId);
    if (item) {
        const newQuantity = item.quantity + change;
        if (newQuantity <= 0) {
            await removeFromCart(cartItemId);
        } else {
            try {
                await apiFetch(`/cart/${cartItemId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ quantity: newQuantity })
                });
                await loadCart();
            } catch (err) {
                console.error(err);
                alert(err && err.message ? err.message : 'Error al actualizar cantidad');
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
        const data = await apiFetch(`/cart/${currentUser.id}`);
        if (!Array.isArray(data)) {
            throw new Error('Respuesta inválida del carrito');
        }

        // #region debug-point C:loadCart-raw
        fetch(`${API_URL}/debug/event`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                sessionId: 'login-cart-failure',
                runId: 'pre',
                hypothesisId: 'C',
                location: 'script.js:loadCart',
                msg: '[DEBUG] loadCart raw response',
                data: {
                    length: data.length,
                    sampleKeys: data[0] ? Object.keys(data[0]) : [],
                    sampleId: data[0] && data[0].id !== undefined ? data[0].id : null
                }
            })
        }).catch(() => {});
        // #endregion

        cart = data.map(item => ({
            ...item,
            id: Number(item.id),
            userId: item.user_id,
            productId: item.product_id,
            productName: item.product_name,
            productEmoji: item.product_emoji,
            price: item.price !== undefined && item.price !== null ? Number(item.price) : 0,
            quantity: item.quantity !== undefined && item.quantity !== null ? Number(item.quantity) : 0
        }));

        // #region debug-point C:loadCart-mapped
        fetch(`${API_URL}/debug/event`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                sessionId: 'login-cart-failure',
                runId: 'pre',
                hypothesisId: 'C',
                location: 'script.js:loadCart',
                msg: '[DEBUG] loadCart mapped result',
                data: {
                    length: cart.length,
                    first: cart[0] ? { id: cart[0].id, userId: cart[0].userId, productId: cart[0].productId, productName: cart[0].productName } : null
                }
            })
        }).catch(() => {});
        // #endregion
        updateCartUI();
    } catch (err) {
        // #region debug-point D:loadCart-error
        fetch(`${API_URL}/debug/event`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                sessionId: 'login-cart-failure',
                runId: 'pre',
                hypothesisId: 'D',
                location: 'script.js:loadCart',
                msg: '[DEBUG] loadCart error',
                data: { message: err && err.message ? String(err.message) : null }
            })
        }).catch(() => {});
        // #endregion
        console.error(err);
        cart = [];
        updateCartUI();
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
        <div class="cart-item" data-id="${item.id}">
            <span class="cart-item-emoji">${item.productEmoji}</span>
            <div class="cart-item-info">
                <div class="cart-item-name">${item.productName}</div>
                <div class="cart-item-price">Agregado por: ${currentUser ? currentUser.name : '—'}</div>
                <div class="cart-item-price">$${parseFloat(item.price).toFixed(2)} c/u</div>
            </div>
            <div class="cart-item-quantity">
                <button class="quantity-btn" data-action="decrease" data-id="${item.id}">-</button>
                <span class="quantity-value">${item.quantity}</span>
                <button class="quantity-btn" data-action="increase" data-id="${item.id}">+</button>
            </div>
            <button class="remove-btn" data-id="${item.id}">Eliminar</button>
        </div>
    `).join('');
    
    cartItems.querySelectorAll('.quantity-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt(e.target.dataset.id);
            const action = e.target.dataset.action;
            const change = action === 'increase' ? 1 : -1;
            updateQuantity(id, change);
        });
    });
    
    cartItems.querySelectorAll('.remove-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt(e.target.dataset.id);
            removeFromCart(id);
        });
    });
    
    const subtotal = cart.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0);
    const total = subtotal;
    
    subtotalEl.textContent = `$${subtotal.toFixed(2)}`;
    totalEl.textContent = `$${total.toFixed(2)}`;
}

cartBtn.addEventListener('click', async () => {
    if (!currentUser) {
        showToast({ type: 'info', title: 'Inicia sesión', message: 'Debes iniciar sesión para ver tu carrito.' });
        openLoginModalToLogin();
        return;
    }
    await loadCart();
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
        showToast({ type: 'error', title: 'Inicia sesión', message: 'Debes iniciar sesión para finalizar la compra.' });
        openLoginModalToLogin();
        return;
    }
    if (cart.length === 0) {
        showToast({ type: 'error', title: 'Carrito vacío', message: 'Agrega un producto para continuar.' });
        return;
    }
    
    try {
        const total = cart.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0);
        const itemsForPurchase = cart.map(item => ({
            id: item.productId,
            name: item.productName,
            emoji: item.productEmoji,
            price: parseFloat(item.price),
            quantity: item.quantity
        }));
        
        const purchaseResp = await fetch(`${API_URL}/purchases`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: currentUser.id,
                items: itemsForPurchase,
                total: total
            })
        });
        if (!purchaseResp.ok) {
            throw new Error(`HTTP ${purchaseResp.status}`);
        }
        
        await loadCart();
        
        updateCartUI();
        cartModal.classList.add('hidden');
        showToast({ type: 'success', title: 'Compra realizada', message: 'Gracias por tu compra. ¡Tu pedido va en camino!' });
        if (currentUser) {
            loadPurchaseHistory();
        }
    } catch (err) {
        console.error(err);
        showToast({ type: 'error', title: 'No se pudo finalizar', message: err && err.message ? err.message : 'Inténtalo nuevamente.' });
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

const chatbotToggle = document.getElementById('chatbotToggle');
const chatbotWindow = document.getElementById('chatbotWindow');
const chatbotClose = document.getElementById('chatbotClose');
const chatbotInput = document.getElementById('chatbotInput');
const chatbotSend = document.getElementById('chatbotSend');
const chatbotMessages = document.getElementById('chatbotMessages');

const chatbotState = {
    lastIntent: null
};

let chatConversationId = null;

function getChatConversationStorageKey() {
    return currentUser ? `chatConversationId_user_${currentUser.id}` : 'chatConversationId_guest';
}

function loadChatConversationId() {
    const key = getChatConversationStorageKey();
    const raw = localStorage.getItem(key);
    chatConversationId = raw ? parseInt(raw, 10) : null;
    if (Number.isNaN(chatConversationId)) chatConversationId = null;
}

function saveChatConversationId(id) {
    const key = getChatConversationStorageKey();
    if (!id) {
        localStorage.removeItem(key);
        chatConversationId = null;
        return;
    }
    chatConversationId = id;
    localStorage.setItem(key, String(id));
}

chatbotToggle.addEventListener('click', () => {
    chatbotWindow.classList.toggle('hidden');
    if (!chatbotWindow.classList.contains('hidden')) {
        chatbotInput.focus();
    }
});

chatbotClose.addEventListener('click', () => {
    chatbotWindow.classList.add('hidden');
});

function normalizeText(text) {
    return String(text || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s@._-]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function containsAny(text, words) {
    return words.some(w => text.includes(w));
}

function getProductsList() {
    return Array.isArray(products) ? products : [];
}

function getProductAliases() {
    return [
        { id: 1, aliases: ['champu', 'shampoo', 'champu de coco', 'champu coco', 'coco natural'] },
        { id: 2, aliases: ['gotero', 'gotero de coco', 'serum', 'aceite', 'coco gotero'] }
    ];
}

function findReferencedProduct(message) {
    const list = getProductsList();
    const aliases = getProductAliases();
    const hits = [];
    
    for (const product of list) {
        const normalizedName = normalizeText(product.name);
        let score = 0;
        
        if (normalizedName && message.includes(normalizedName)) score += 6;
        
        const aliasGroup = aliases.find(a => a.id === product.id);
        if (aliasGroup) {
            for (const alias of aliasGroup.aliases) {
                if (message.includes(normalizeText(alias))) score += 3;
            }
        }
        
        const nameTokens = normalizedName.split(' ').filter(Boolean);
        for (const token of nameTokens) {
            if (token.length >= 4 && message.includes(token)) score += 1;
        }
        
        if (score > 0) hits.push({ product, score });
    }
    
    hits.sort((a, b) => b.score - a.score);
    return hits.length ? hits[0].product : null;
}

function addMessage(text, isUser = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${isUser ? 'user' : 'bot'}`;
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.textContent = String(text || '');
    messageDiv.appendChild(contentDiv);
    chatbotMessages.appendChild(messageDiv);
    chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
    return messageDiv;
}

function executeChatAction(action) {
    if (!action) return;
    
    if (action.type === 'navigate') {
        const section = action.section || 'inicio';
        navLinks.forEach(l => l.classList.remove('active'));
        navLinks.forEach(l => {
            if (l.dataset.section === section) {
                l.classList.add('active');
            }
        });
        showSection(section);
    }
    
    if (action.type === 'openProduct') {
        const productId = action.productId;
        const product = getProductsList().find(p => p.id === productId);
        if (product) {
            navLinks.forEach(l => l.classList.remove('active'));
            navLinks.forEach(l => {
                if (l.dataset.section === 'productos') {
                    l.classList.add('active');
                }
            });
            showSection('productos');
            openProductModal(product);
        }
    }
    
    if (action.type === 'addToCart') {
        const productId = action.productId;
        const product = getProductsList().find(p => p.id === productId);
        if (product) {
            addToCart(product);
        }
    }
}

function buildBotResponse(userMessage) {
    const message = normalizeText(userMessage);
    const list = getProductsList();
    const referencedProduct = findReferencedProduct(message);
    const hasProducts = list.length > 0;
    const isGreeting = containsAny(message, ['hola', 'buenas', 'buenos dias', 'buenas tardes', 'buenas noches', 'hi', 'hello']);
    const isThanks = containsAny(message, ['gracias', 'muchas gracias', 'genial', 'perfecto']);
    const isGoodbye = containsAny(message, ['adios', 'hasta luego', 'bye', 'nos vemos']);
    const asksHelp = containsAny(message, ['ayuda', 'help', 'soporte', 'problema', 'error']);

    const intentRules = [
        {
            name: 'greeting',
            test: () => isGreeting,
            respond: () => ({ text: currentUser ? `¡Hola, ${currentUser.name}! ¿En qué te ayudo hoy?` : '¡Hola! ¿En qué te ayudo hoy?' })
        },
        {
            name: 'product_price',
            test: () => containsAny(message, ['precio', 'cuanto cuesta', 'cuanto vale', 'costo', 'valor']),
            respond: () => {
                if (!hasProducts) return { text: 'Ahora mismo no encuentro productos cargados. Intenta recargar la página.' };
                if (referencedProduct) {
                    return { text: `El precio de ${referencedProduct.name} es $${Number(referencedProduct.price).toFixed(2)}.` };
                }
                const lines = list.map(p => `- ${p.name}: $${Number(p.price).toFixed(2)}`);
                return { text: `Estos son los precios:\n${lines.join('\n')}` };
            }
        },
        {
            name: 'product_info',
            test: () => containsAny(message, ['producto', 'productos', 'champu', 'shampoo', 'gotero', 'coco', 'ingredientes', 'para que sirve', 'descripcion', 'serum', 'aceite', 'catalogo', 'catologo', 'lista']),
            respond: () => {
                if (!hasProducts) return { text: 'Ahora mismo no encuentro productos cargados. Intenta recargar la página.' };
                if (containsAny(message, ['ver productos', 'lista', 'catalogo', 'catologo'])) {
                    const lines = list.map(p => `- ${p.name}: ${p.shortDescription}`);
                    return { text: `Tenemos estos productos:\n${lines.join('\n')}`, action: { type: 'navigate', section: 'productos' } };
                }
                if (referencedProduct) {
                    return { text: `${referencedProduct.emoji} ${referencedProduct.name}\n${referencedProduct.shortDescription}\n\nTe lo abro para que veas los detalles.`, action: { type: 'openProduct', productId: referencedProduct.id } };
                }
                const lines = list.map(p => `- ${p.name}`);
                return { text: `Tenemos:\n${lines.join('\n')}\n\nDime cuál quieres ver (ej: “ver gotero de coco”).`, action: { type: 'navigate', section: 'productos' } };
            }
        },
        {
            name: 'how_to_buy',
            test: () => containsAny(message, ['comprar', 'como compro', 'como comprar', 'pagar', 'checkout', 'finalizar compra']),
            respond: () => {
                if (referencedProduct && containsAny(message, ['agregar', 'anadir', 'añadir', 'comprar'])) {
                    return { text: `Listo. Agregué ${referencedProduct.name} al carrito. Abre el carrito (🛒) para finalizar la compra.`, action: { type: 'addToCart', productId: referencedProduct.id } };
                }
                const steps = [
                    '1) Ve a “Ventas”.',
                    '2) Pulsa “Agregar al Carrito”.',
                    '3) Abre el carrito (🛒) y pulsa “Finalizar Compra”.'
                ];
                return { text: steps.join('\n'), action: { type: 'navigate', section: 'ventas' } };
            }
        },
        {
            name: 'open_product',
            test: () => containsAny(message, ['abrir', 'mostrar', 'ver']) && Boolean(referencedProduct),
            respond: () => ({ text: `Abriendo ${referencedProduct.name}...`, action: { type: 'openProduct', productId: referencedProduct.id } })
        },
        {
            name: 'go_to_section',
            test: () => containsAny(message, ['ir a', 'abre', 'abrir']) && containsAny(message, ['productos', 'ventas', 'inicio', 'nosotros', 'servicios']),
            respond: () => {
                const section = containsAny(message, ['ventas']) ? 'ventas'
                    : containsAny(message, ['productos']) ? 'productos'
                    : containsAny(message, ['nosotros']) ? 'nosotros'
                    : containsAny(message, ['servicios']) ? 'servicios'
                    : 'inicio';
                return { text: `Listo, te llevo a “${section}”.`, action: { type: 'navigate', section } };
            }
        },
        {
            name: 'cart_actions',
            test: () => containsAny(message, ['carrito', 'sumar', 'restar', 'quitar', 'eliminar', 'cantidad', 'no me deja sumar', 'no me deja quitar']),
            respond: () => {
                const base = `Puedes abrir el carrito con el botón 🛒.\nDentro puedes aumentar/disminuir cantidades con + / - y eliminar con “Eliminar”.`;
                if (cart.length === 0) return `${base}\n\nAhora mismo tu carrito está vacío.`;
                return `${base}\n\nAhora mismo tienes ${cart.reduce((s, i) => s + i.quantity, 0)} artículo(s) en el carrito.`;
            }
        },
        {
            name: 'cart_problem',
            test: () => containsAny(message, ['no me deja', 'no funciona', 'no sirve', 'no puedo']) && containsAny(message, ['carrito', 'agregar', 'sumar', 'restar', 'eliminar']),
            respond: () => {
                const checks = [
                    'Probemos rápido:',
                    '1) Recarga la página (F5).',
                    '2) Abre el carrito y prueba + / -.',
                    '3) Asegúrate de tener sesión iniciada.',
                    '4) Si el problema sigue, prueba cerrar sesión e iniciar de nuevo.'
                ];
                return `${checks.join('\n')}\n\nDime exactamente qué botón no responde (+, -, Eliminar o Agregar al carrito) y si estabas con sesión iniciada.`;
            }
        },
        {
            name: 'auth_login',
            test: () => containsAny(message, ['iniciar sesion', 'login', 'entrar', 'iniciar', 'usuario', 'contraseña', 'contrasena']),
            respond: () => {
                if (currentUser) return `Ya tienes sesión iniciada como ${currentUser.name}.`;
                return 'Para iniciar sesión: pulsa “Iniciar Sesión”, escribe tu usuario y contraseña, y presiona “Ingresar”.';
            }
        },
        {
            name: 'auth_register',
            test: () => containsAny(message, ['registrar', 'registro', 'crear cuenta', 'registrarse', 'cuenta nueva']),
            respond: () => 'Para registrarte: pulsa “Iniciar Sesión” y luego la pestaña “Registrarse”. Completa los datos y presiona “Registrarse”.'
        },
        {
            name: 'purchase_history',
            test: () => containsAny(message, ['historial', 'mis compras', 'compras', 'pedido', 'pedidos']),
            respond: () => {
                if (!currentUser) return 'Para ver el historial de compras necesitas iniciar sesión. Está en “Ventas” → “Historial de Compras”.';
                return 'Tu historial está en “Ventas” → “Historial de Compras”.';
            }
        },
        {
            name: 'about_services',
            test: () => containsAny(message, ['servicios', 'entrega', 'envio', 'garantia', 'devolucion', 'contacto', 'horario', 'direccion', 'email', 'telefono']),
            respond: () => 'Puedes ver “Servicios” para detalles de entrega y soporte. En “Nosotros” está la información de contacto.'
        },
        {
            name: 'thanks',
            test: () => isThanks,
            respond: () => '¡De nada! Si quieres, dime qué estás intentando hacer y te guío paso a paso.'
        },
        {
            name: 'goodbye',
            test: () => isGoodbye,
            respond: () => '¡Perfecto! Si vuelves a necesitar ayuda, aquí estaré.'
        },
        {
            name: 'help',
            test: () => asksHelp,
            respond: () => {
                return [
                    'Puedo ayudarte con:',
                    '- Productos y precios',
                    '- Cómo comprar',
                    '- Problemas con el carrito',
                    '- Registro e inicio de sesión',
                    '- Ver el catálogo (Champú de Coco Natural / Gotero de Coco)',
                    '',
                    'Dime qué necesitas (ej: “no me deja agregar al carrito”).'
                ].join('\n');
            }
        }
    ];

    const matched = intentRules.find(r => r.test());
    if (matched) {
        chatbotState.lastIntent = matched.name;
        const result = matched.respond();
        if (typeof result === 'string') return { text: result };
        return result;
    }

    chatbotState.lastIntent = 'unknown';
    return { text: 'Entiendo. Para ayudarte mejor, dime qué quieres hacer:\n- Ver productos\n- Saber precio\n- Agregar al carrito\n- Finalizar compra\n- Ver historial\n\nEjemplos:\n- “precio del gotero”\n- “abrir champú”\n- “agregar gotero al carrito”' };
}

function sendMessage() {
    const message = chatbotInput.value.trim();
    if (message) {
        addMessage(message, true);
        chatbotInput.value = '';
        
        // Mensaje placeholder mientras responde el servicio
        const typingEl = addMessage('Escribiendo...', false);
        const typingContent = typingEl.querySelector('.message-content');

        (async () => {
            try {
                const response = await fetch(`${API_URL}/ai-chat`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        message,
                        userId: currentUser ? currentUser.id : null,
                        conversationId: chatConversationId
                    })
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }

                const data = await response.json();
                if (data && data.conversationId) {
                    saveChatConversationId(parseInt(data.conversationId, 10));
                }

                const reply = data && data.reply ? String(data.reply) : '';
                typingContent.textContent = reply || 'No pude generar respuesta ahora mismo.';
            } catch (err) {
                console.error(err);
                // Fallback al bot local si el servicio falla
                const fallback = buildBotResponse(message);
                typingContent.textContent = fallback.text;
                executeChatAction(fallback.action);
            }
        })();
    }
}

chatbotSend.addEventListener('click', sendMessage);

chatbotInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

createParticles();
restoreCurrentUser();
updateAuthButtons();
loadChatConversationId();
loadCart();

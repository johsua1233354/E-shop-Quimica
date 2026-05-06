const API_URL = 'api';

let currentUser = null;
let cart = [];

const products = [
    {
        id: 1,
        name: 'Ácido Sulfúrico',
        shortDescription: 'Ácido sulfúrico técnico, 98% de pureza. Usado en procesos industriales y laboratorio.',
        fullDescription: 'El ácido sulfúrico (H₂SO₄) es uno de los productos químicos más importantes y versátiles en la industria. Nuestro producto cuenta con una pureza del 98%, ideal para una amplia gama de aplicaciones.',
        uses: 'Fabricación de fertilizantes, refinación de petróleo, tratamiento de aguas, baterías de plomo-ácido, síntesis química, limpieza de metales.',
        safety: 'Corrosivo fuerte. Puede causar quemaduras graves. Evitar el contacto con la piel y ojos. Usar equipo de protección personal adecuado.',
        formula: 'H₂SO₄',
        purity: '98%',
        price: 45.50,
        stock: 50,
        emoji: '⚗️'
    },
    {
        id: 2,
        name: 'Hidróxido de Sodio',
        shortDescription: 'Sosa cáustica escamas, 99% de pureza. Ideal para limpieza y procesos químicos.',
        fullDescription: 'El hidróxido de sodio (NaOH), también conocido como sosa cáustica, es un álcali fuerte que se presenta en escamas blancas. Nuestro producto tiene una pureza del 99%.',
        uses: 'Fabricación de jabones y detergentes, tratamiento de aguas, industria papelera, limpieza industrial, biodiesel, procesamiento de alimentos.',
        safety: 'Corrosivo. Puede causar quemaduras graves. Reacciona violentamente con ácidos. Almacenar en lugar seco y fresco.',
        formula: 'NaOH',
        purity: '99%',
        price: 32.00,
        stock: 80,
        emoji: '🧴'
    },
    {
        id: 3,
        name: 'Etanol Absoluto',
        shortDescription: 'Alcohol etílico 99.9%. Apto para uso en laboratorio y aplicaciones industriales.',
        fullDescription: 'El etanol absoluto (C₂H₅OH) es alcohol etílico de alta pureza, sin agua ni aditivos. Perfecto para aplicaciones donde la presencia de agua no es deseable.',
        uses: 'Solvente en laboratorio, extracción de compuestos, limpieza de equipos, industria farmacéutica, cosmética, combustible.',
        safety: 'Inflamable. Evitar fuentes de ignición. Mantener en recipiente cerrado. Puede causar irritación en vías respiratorias.',
        formula: 'C₂H₅OH',
        purity: '99.9%',
        price: 28.75,
        stock: 120,
        emoji: '🍶'
    },
    {
        id: 4,
        name: 'Cloruro de Sodio',
        shortDescription: 'Sal común, grado reactivo. 99.5% de pureza para uso analítico.',
        fullDescription: 'El cloruro de sodio (NaCl), también conocido como sal común, es un compuesto iónico esencial para la vida. Nuestro producto es grado reactivo con 99.5% de pureza.',
        uses: 'Análisis químico, preparación de disoluciones, conservación de alimentos, industria alimentaria, tratamiento de aguas, cloración.',
        safety: 'Generalmente seguro en cantidades normales. Evitar consumo excesivo. Almacenar en lugar seco.',
        formula: 'NaCl',
        purity: '99.5%',
        price: 15.20,
        stock: 200,
        emoji: '🧂'
    },
    {
        id: 5,
        name: 'Amoniaco',
        shortDescription: 'Solución de amoniaco al 25%. Utilizado en limpieza y síntesis química.',
        fullDescription: 'La solución de amoniaco (NH₃) es un gas disuelto en agua. Nuestra solución al 25% es ideal para múltiples aplicaciones industriales y domésticas.',
        uses: 'Limpieza doméstica e industrial, fertilizantes, refrigeración, síntesis de productos farmacéuticos, tratamiento de metales, industria del caucho.',
        safety: 'Irritante. Vapores pueden causar irritación en vías respiratorias y ojos. Usar en área ventilada.',
        formula: 'NH₃ (aq)',
        purity: '25%',
        price: 22.00,
        stock: 65,
        emoji: '💧'
    },
    {
        id: 6,
        name: 'Peróxido de Hidrógeno',
        shortDescription: 'Agua oxigenada al 30%. Grado técnico para procesos oxidativos.',
        fullDescription: 'El peróxido de hidrógeno (H₂O₂) es un poderoso agente oxidante. Nuestra solución al 30% es grado técnico ideal para procesos industriales.',
        uses: 'Blanqueamiento de textiles y papel, tratamiento de aguas, desinfección, oxidación química, industria cosmética, limpieza de superficies.',
        safety: 'Oxidante fuerte. Puede causar irritación. Evitar contacto con sustancias combustibles. Almacenar en recipiente ventilado.',
        formula: 'H₂O₂',
        purity: '30%',
        price: 18.90,
        stock: 90,
        emoji: '✨'
    },
    {
        id: 7,
        name: 'Ácido Cítrico',
        shortDescription: 'Ácido cítrico monohidratado, grado alimenticio. 99.5% de pureza.',
        fullDescription: 'El ácido cítrico es un ácido orgánico triprótico que se encuentra naturalmente en los cítricos. Nuestro producto es monohidratado, grado alimenticio con 99.5% de pureza.',
        uses: 'Industria alimentaria (conservante, acidulante), bebidas, cosmética, farmacia, limpieza y descalcificación, fotografía.',
        safety: 'Generalmente seguro. Es irritante en concentraciones elevadas. Almacenar en lugar seco.',
        formula: 'C₆H₈O₇·H₂O',
        purity: '99.5%',
        price: 35.00,
        stock: 150,
        emoji: '🍋'
    },
    {
        id: 8,
        name: 'Carbonato de Sodio',
        shortDescription: 'Soda caliza, grado técnico. Usado en detergentes y procesos industriales.',
        fullDescription: 'El carbonato de sodio (Na₂CO₃), también conocido como soda caliza o ceniza de sosa, es una sal de sodio del ácido carbónico. Nuestro producto es grado técnico.',
        uses: 'Fabricación de jabones y detergentes, tratamiento de aguas, industria vidriera, papelera, textiles, limpieza doméstica, regulación de pH.',
        safety: 'Irritante en contacto prolongado. Evitar inhalación de polvo. Almacenar en lugar seco y fresco.',
        formula: 'Na₂CO₃',
        purity: '99%',
        price: 19.80,
        stock: 110,
        emoji: '🧪'
    },
    {
        id: 9,
        name: 'Ácido Nítrico',
        shortDescription: 'Ácido nítrico concentrado, 70% de pureza. Ideal para laboratorio y síntesis.',
        fullDescription: 'El ácido nítrico (HNO₃) es un ácido mineral fuerte y un poderoso agente oxidante. Nuestro producto está concentrado al 70% para múltiples aplicaciones.',
        uses: 'Fabricación de fertilizantes, explosivos, nitratos, tratamiento de metales, grabado, laboratorio químico.',
        safety: 'Corrosivo y oxidante. Puede causar quemaduras graves. Reacciona violentamente con sustancias orgánicas.',
        formula: 'HNO₃',
        purity: '70%',
        price: 52.00,
        stock: 45,
        emoji: '🧪'
    },
    {
        id: 10,
        name: 'Cloroformo',
        shortDescription: 'Cloroformo estabilizado, grado técnico. Solvente orgánico versatile.',
        fullDescription: 'El cloroformo (CHCl₃) es un solvente orgánico no polar de uso común. Nuestro producto está estabilizado para mayor seguridad.',
        uses: 'Solvente en extracciones, síntesis química, limpieza de equipos, industria farmacéutica, refrigeración (histórico).',
        safety: 'Tóxico. Evitar inhalación y contacto prolongado. Usar solo en campana de extracción. Posible carcinógeno.',
        formula: 'CHCl₃',
        purity: '99%',
        price: 48.50,
        stock: 35,
        emoji: '🫗'
    },
    {
        id: 11,
        name: 'Acetona',
        shortDescription: 'Acetona pura, grado técnico. Solvente universal para múltiples usos.',
        fullDescription: 'La acetona (CH₃COCH₃) es el solvente orgánico más simple y uno de los más utilizados en la industria y laboratorio.',
        uses: 'Limpieza de superficies, removedor de pintura, solvente en síntesis, industria cosmética, laboratorio químico.',
        safety: 'Altamente inflamable. Evitar fuentes de ignición. Vapores pueden causar mareos. Usar en área ventilada.',
        formula: 'CH₃COCH₃',
        purity: '99.5%',
        price: 24.00,
        stock: 180,
        emoji: '🧴'
    },
    {
        id: 12,
        name: 'Glicerina',
        shortDescription: 'Glicerina vegetal, 99.5% de pureza. Cosmética y farmacéutica.',
        fullDescription: 'La glicerina (C₃H₈O₃), también llamada glicerol, es un alcohol trihídrico natural presente en grasas y aceites.',
        uses: 'Industria cosmética, farmacéutica, alimentaria, humectante, lubricante, explosivos (nitroglicerina).',
        safety: 'Generalmente seguro. Biodegradable. Puede causar irritación en piel sensible en casos raros.',
        formula: 'C₃H₈O₃',
        purity: '99.5%',
        price: 29.90,
        stock: 140,
        emoji: '🧴'
    },
    {
        id: 13,
        name: 'Ácido Clorhídrico',
        shortDescription: 'Ácido clorhídrico concentrado, 37%. Ácido fuerte de uso industrial.',
        fullDescription: 'El ácido clorhídrico (HCl), también conocido como ácido muriático, es una disolución de cloruro de hidrógeno en agua.',
        uses: 'Tratamiento de metales (decapado), limpieza industrial, tratamiento de aguas, pH regulator, laboratorio químico.',
        safety: 'Corrosivo fuerte. Vapores irritantes. Puede causar quemaduras graves. Usar equipo de protección.',
        formula: 'HCl',
        purity: '37%',
        price: 38.00,
        stock: 70,
        emoji: '⚗️'
    },
    {
        id: 14,
        name: 'Permanganato de Potasio',
        shortDescription: 'Permanganato de potasio cristalizado, grado reactivo. Oxidante fuerte.',
        fullDescription: 'El permanganato de potasio (KMnO₄) es un compuesto químico de color púrpura intenso y un poderoso agente oxidante.',
        uses: 'Desinfección, tratamiento de aguas, análisis químico (titulación), oxidante en síntesis, blanqueo.',
        safety: 'Oxidante fuerte. Puede causar quemaduras. Mancha la piel y textiles de forma permanente.',
        formula: 'KMnO₄',
        purity: '99%',
        price: 42.50,
        stock: 55,
        emoji: '💜'
    },
    {
        id: 15,
        name: 'Tiosulfato de Sodio',
        shortDescription: 'Tiosulfato de sodio pentahidratado, 99% de pureza. Fixador fotográfico.',
        fullDescription: 'El tiosulfato de sodio (Na₂S₂O₃), también conocido como hipo, es un compuesto químico con múltiples aplicaciones industriales.',
        uses: 'Fixador en fotografía, tratamiento de aguas (desclorinación), extracción de oro, antídoto para cianuro, laboratorio.',
        safety: 'Generalmente seguro. Baja toxicidad. Puede causar irritación leve en contacto prolongado.',
        formula: 'Na₂S₂O₃·5H₂O',
        purity: '99%',
        price: 26.00,
        stock: 95,
        emoji: '📸'
    },
    {
        id: 16,
        name: 'Yoduro de Potasio',
        shortDescription: 'Yoduro de potasio, grado reactivo. 99% de pureza para laboratorio.',
        fullDescription: 'El yoduro de potasio (KI) es un compuesto químico iónico formado por potasio y yodo. Es la fuente más común de yodo en aplicaciones.',
        uses: 'Suplemento dietético (yodo), tratamiento de radiación, fotografía, síntesis química, laboratorio analítico.',
        safety: 'Generalmente seguro en dosis adecuadas. Puede causar efectos adversos en dosis elevadas.',
        formula: 'KI',
        purity: '99%',
        price: 44.00,
        stock: 40,
        emoji: '💊'
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

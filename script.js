const STATE = {
    products: [],
    users: [], 
    cart: JSON.parse(localStorage.getItem("ee_cart") || "[]"),
    favs: JSON.parse(localStorage.getItem("ee_fav") || "[]"),
    user: JSON.parse(localStorage.getItem("ee_user") || "null")
};

document.addEventListener("DOMContentLoaded", async () => {
    await loadProducts();
    await loadUsers();
    init();
});

async function loadProducts() {
    try {
        const res = await fetch("products.json", { cache: "no-store" });
        if (!res.ok) throw new Error("products.json not found");
        const json = await res.json();
        if (Array.isArray(json)) STATE.products = json;
    } catch (err) {
        console.warn("Could not load products.json:", err);
    }
}

async function loadUsers() {
    try {
        const res = await fetch("username.json", { cache: "no-store" });
        if (!res.ok) throw new Error("username.json not found");
        const json = await res.json();
        if (Array.isArray(json)) STATE.users = json;
    } catch (err) {
        console.warn("Could not load username.json:", err);
    }
}

function init() {
    setYear();
    updateBadges();
    updateUserUI();
    if (document.getElementById("featuredGrid")) renderFeatured();
    if (document.getElementById("categoryGrid")) renderCategories();
    if (document.getElementById("carouselExampleAutoplaying")) renderHomeCarousel();
    if (document.getElementById("productsGrid")) initProductsPage();
    if (document.getElementById("specialsGrid")) renderSpecials();
    if (document.getElementById("productDetail")) renderProductDetail();
    if (document.getElementById("favGrid")) renderFavorites();
    if (document.getElementById("cartBody")) renderCart();
    if (document.getElementById("loginForm")) initLoginForm();
}

function renderHomeCarousel() {
    const carouselEl = document.getElementById('carouselExampleAutoplaying');
    if (!carouselEl) return;
    const inner = carouselEl.querySelector('.carousel-inner');
    if (!inner) return;

    inner.innerHTML = '';

    const products = Array.isArray(STATE.products) ? STATE.products : [];
    if (products.length === 0) return;

    const itemsPerSlide = window.innerWidth >= 992 ? 3 : (window.innerWidth >= 768 ? 2 : 1);

    for (let i = 0; i < products.length; i += itemsPerSlide) {
        const slide = document.createElement('div');
        slide.className = 'carousel-item' + (i === 0 ? ' active' : '');

        const row = document.createElement('div');
        row.className = 'row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4 justify-content-center';

        products.slice(i, i + itemsPerSlide).forEach(p => {
            const col = document.createElement('div');
            col.className = 'col';
            col.innerHTML = `
                <div class="text-center">
                  <img src="${p.image}" class="d-block mx-auto carousel-product-img" alt="${escapeHtml(p.name)}">
                  <div class="carousel-product-caption mt-2">${escapeHtml(p.name)}</div>
                </div>`;
            row.appendChild(col);
        });

        slide.appendChild(row);
        inner.appendChild(slide);
    }

    const instance = bootstrap.Carousel.getOrCreateInstance(carouselEl, {
        interval: 3000,
        ride: 'carousel'
    });
    instance.cycle();
}

function setYear() {
    const el = document.getElementById("year");
    if (el) el.textContent = new Date().getFullYear();
}

function updateBadges() {
    const c = document.getElementById("cartCount");
    const f = document.getElementById("favCount");
    if (c) c.textContent = STATE.cart.length;
    if (f) f.textContent = STATE.favs.length;
}

function updateUserUI() {
    const loginBtn = document.querySelector('.navbar-nav a[href="login.html"]');
    if (loginBtn) {
        if (STATE.user) {
            loginBtn.innerHTML = `<i class="fa-solid fa-user"></i> ${escapeHtml(STATE.user.name || STATE.user.email)}`;
            loginBtn.href = "#";
            loginBtn.classList.remove("btn-outline-light");
            loginBtn.classList.add("btn-light");
            loginBtn.addEventListener("click", (e) => {
                e.preventDefault();
                logout();
            });
        } else {
            loginBtn.innerHTML = "Login";
            loginBtn.href = "login.html";
            loginBtn.classList.remove("btn-light");
            loginBtn.classList.add("btn-outline-light");
        }
    }
}

function initLoginForm() {
    const form = document.getElementById("loginForm");
    if (!form) return;
    
    
    if (STATE.user) {
        form.innerHTML = `
            <div class="alert alert-success">
                <h4>שלום ${escapeHtml(STATE.user.name || STATE.user.email)}!</h4>
                <p>אתה כבר מחובר למערכת.</p>
                <button id="logoutBtn" class="btn btn-outline-danger mt-2">התנתק</button>
            </div>
        `;
        document.getElementById("logoutBtn").addEventListener("click", logout);
        return;
    }
    
   
    form.innerHTML += `
        <hr class="my-4">
        <div class="text-center">
            <p>אין לך חשבון?</p>
            <button id="showRegisterBtn" class="btn btn-outline-primary">הרשם עכשיו</button>
        </div>
    `;
    
    
    const registerForm = document.createElement("form");
    registerForm.id = "registerForm";
    registerForm.className = "card p-4 shadow-sm mt-4 d-none";
    registerForm.innerHTML = `
        <h3 class="mb-3 text-center">הרשמה</h3>
        <div class="mb-3">
            <label class="form-label">שם מלא</label>
            <input type="text" class="form-control" id="regName" required>
        </div>
        <div class="mb-3">
            <label class="form-label">אימייל</label>
            <input type="email" class="form-control" id="regEmail" required>
        </div>
        <div class="mb-3">
            <label class="form-label">סיסמה</label>
            <input type="password" class="form-control" id="regPassword" required>
        </div>
        <button class="btn btn-success w-100" type="submit">הרשם</button>
    `;
    form.parentNode.appendChild(registerForm);
    
  
    document.getElementById("showRegisterBtn").addEventListener("click", (e) => {
        e.preventDefault();
        registerForm.classList.remove("d-none");
        form.classList.add("d-none");
    });
    
    form.addEventListener("submit", (e) => {
        e.preventDefault();
        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;
        login(email, password);
    });
    
    registerForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const name = document.getElementById("regName").value;
        const email = document.getElementById("regEmail").value;
        const password = document.getElementById("regPassword").value;
        register(name, email, password);
    });
}

function login(email, password) {
    
    const users = JSON.parse(localStorage.getItem("ee_users") || "[]");
    const user = users.find(u => u.email === email && u.password === password);
    
    if (user) {
    
        const { password, ...userWithoutPassword } = user;
        STATE.user = userWithoutPassword;
        localStorage.setItem("ee_user", JSON.stringify(userWithoutPassword));
        showMessage("התחברת בהצלחה!", "success");
        setTimeout(() => {
            window.location.href = "index.html";
        }, 1500);
    } else {
        showMessage("אימייל או סיסמה שגויים", "danger");
    }
}

function register(name, email, password) {
    const users = JSON.parse(localStorage.getItem("ee_users") || "[]");
    
   
    if (users.some(u => u.email === email)) {
        showMessage("אימייל זה כבר רשום במערכת", "danger");
        return;
    }
    
   
    const newUser = { id: Date.now(), name, email, password };
    users.push(newUser);
    localStorage.setItem("ee_users", JSON.stringify(users));
    
   
    const { password: _, ...userWithoutPassword } = newUser;
    STATE.user = userWithoutPassword;
    localStorage.setItem("ee_user", JSON.stringify(userWithoutPassword));
    
    showMessage("נרשמת בהצלחה!", "success");
    setTimeout(() => {
        window.location.href = "index.html";
    }, 1500);
}

function logout() {
    STATE.user = null;
    localStorage.removeItem("ee_user");
    updateUserUI();
    showMessage("התנתקת בהצלחה", "info");
    
  
    if (document.getElementById("loginForm")) {
        setTimeout(() => {
            window.location.reload();
        }, 1000);
    }
}

function showMessage(message, type = "info") {
 
    let alertEl = document.getElementById("alertMessage");
    if (!alertEl) {
        alertEl = document.createElement("div");
        alertEl.id = "alertMessage";
        alertEl.className = `alert alert-${type} alert-dismissible fade show position-fixed top-0 start-50 translate-middle-x mt-3`;
        alertEl.setAttribute("role", "alert");
        alertEl.style.zIndex = "9999";
        document.body.appendChild(alertEl);
    } else {
        alertEl.className = `alert alert-${type} alert-dismissible fade show position-fixed top-0 start-50 translate-middle-x mt-3`;
    }
    
    alertEl.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    

    setTimeout(() => {
        const bsAlert = new bootstrap.Alert(alertEl);
        bsAlert.close();
    }, 3000);
}
    const loginBtn = document.querySelector('.navbar-nav a[href="login.html"]');
    if (loginBtn) {
        if (STATE.user) {
            loginBtn.innerHTML = `<i class="fa-solid fa-user"></i> ${escapeHtml(STATE.user.name || STATE.user.email)}`;
            loginBtn.href = "#";
            loginBtn.classList.remove("btn-outline-light");
            loginBtn.classList.add("btn-light");
            loginBtn.addEventListener("click", (e) => {
                e.preventDefault();
                logout();
            });
        } else {
            loginBtn.innerHTML = "Login";
            loginBtn.href = "login.html";
            loginBtn.classList.remove("btn-light");
            loginBtn.classList.add("btn-outline-light");
        }
    }


function initLoginForm() {
    const form = document.getElementById("loginForm");
    if (!form) return;
    
    
    if (STATE.user) {
        form.innerHTML = `
            <div class="alert alert-success">
                <h4>שלום ${escapeHtml(STATE.user.name || STATE.user.email)}!</h4>
                <p>אתה כבר מחובר למערכת.</p>
                <button id="logoutBtn" class="btn btn-outline-danger mt-2">התנתק</button>
            </div>
        `;
        document.getElementById("logoutBtn").addEventListener("click", logout);
        return;
    }
    
    
    form.innerHTML += `
        <hr class="my-4">
        <div class="text-center">
            <p>אין לך חשבון?</p>
            <button id="showRegisterBtn" class="btn btn-outline-primary">הרשם עכשיו</button>
        </div>
    `;
    
  
    const registerForm = document.createElement("form");
    registerForm.id = "registerForm";
    registerForm.className = "card p-4 shadow-sm mt-4 d-none";
    registerForm.innerHTML = `
        <h3 class="mb-3 text-center">הרשמה</h3>
        <div class="mb-3">
            <label class="form-label">שם מלא</label>
            <input type="text" class="form-control" id="regName" required>
        </div>
        <div class="mb-3">
            <label class="form-label">אימייל</label>
            <input type="email" class="form-control" id="regEmail" required>
        </div>
        <div class="mb-3">
            <label class="form-label">סיסמה</label>
            <input type="password" class="form-control" id="regPassword" required>
        </div>
        <button class="btn btn-success w-100" type="submit">הרשם</button>
    `;
    form.parentNode.appendChild(registerForm);
    
  
    document.getElementById("showRegisterBtn").addEventListener("click", (e) => {
        e.preventDefault();
        registerForm.classList.remove("d-none");
        form.classList.add("d-none");
    });
    
    form.addEventListener("submit", (e) => {
        e.preventDefault();
        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;
        login(email, password);
    });
    
    registerForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const name = document.getElementById("regName").value;
        const email = document.getElementById("regEmail").value;
        const password = document.getElementById("regPassword").value;
        register(name, email, password);
    });
}

function login(email, password) {
  
    const users = JSON.parse(localStorage.getItem("ee_users") || "[]");
    const user = users.find(u => u.email === email && u.password === password);
    
    if (user) {
        
        const { password, ...userWithoutPassword } = user;
        STATE.user = userWithoutPassword;
        localStorage.setItem("ee_user", JSON.stringify(userWithoutPassword));
        showMessage("התחברת בהצלחה!", "success");
        setTimeout(() => {
            window.location.href = "index.html";
        }, 1500);
    } else {
        showMessage("אימייל או סיסמה שגויים", "danger");
    }
}

function register(name, email, password) {
    const users = JSON.parse(localStorage.getItem("ee_users") || "[]");
    
  
    if (users.some(u => u.email === email)) {
        showMessage("אימייל זה כבר רשום במערכת", "danger");
        return;
    }
    
  
    const newUser = { id: Date.now(), name, email, password };
    users.push(newUser);
    localStorage.setItem("ee_users", JSON.stringify(users));
    

    const { password: _, ...userWithoutPassword } = newUser;
    STATE.user = userWithoutPassword;
    localStorage.setItem("ee_user", JSON.stringify(userWithoutPassword));
    
    showMessage("נרשמת בהצלחה!", "success");
    setTimeout(() => {
        window.location.href = "index.html";
    }, 1500);
}

function logout() {
    STATE.user = null;
    localStorage.removeItem("ee_user");
    updateUserUI();
    showMessage("התנתקת בהצלחה", "info");
    
  
    if (document.getElementById("loginForm")) {
        setTimeout(() => {
            window.location.reload();
        }, 1000);
    }
}

function showMessage(message, type = "info") {
   
    let alertEl = document.getElementById("alertMessage");
    if (!alertEl) {
        alertEl = document.createElement("div");
        alertEl.id = "alertMessage";
        alertEl.className = `alert alert-${type} alert-dismissible fade show position-fixed top-0 start-50 translate-middle-x mt-3`;
        alertEl.setAttribute("role", "alert");
        alertEl.style.zIndex = "9999";
        document.body.appendChild(alertEl);
    } else {
        alertEl.className = `alert alert-${type} alert-dismissible fade show position-fixed top-0 start-50 translate-middle-x mt-3`;
    }
    
    alertEl.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    
    setTimeout(() => {
        const bsAlert = new bootstrap.Alert(alertEl);
        bsAlert.close();
    }, 3000);
}

function formatPrice(v = 0) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v);
}

function renderFeatured() {
    const grid = document.getElementById("featuredGrid");
    if (!grid) return;
    grid.innerHTML = "";
    STATE.products.slice(0, 4).forEach(p => {
        const name = p.name || p.title || "Product";
        const img = p.image || "";
        const col = document.createElement("div");
        col.className = "col-sm-6 col-md-4 col-lg-3";
        col.innerHTML = `
            <div class="card ee h-100">
                <div class="img-wrap">
                    ${img ? `<img src="${img}" alt="${escapeHtml(name)}">` : `<i class="fa-solid fa-box-open fa-3x text-muted"></i>`}
                </div>
                <div class="card-body d-flex flex-column">
                    <h5 class="card-title mb-1">${escapeHtml(name)}</h5>
                    <p class="text-muted small mb-2">${escapeHtml((p.description||"").split(".")[0]||"")}</p>
                    <div class="mt-auto d-flex justify-content-between align-items-center">
                        <a class="btn btn-sm btn-outline-primary" href="product.html?id=${encodeURIComponent(p.id||p.name||"") }">View</a>
                        <div class="fw-bold">${formatPrice(p.price||0)}</div>
                    </div>
                </div>
            </div>`;
        grid.appendChild(col);
    });
}

function renderCategories() {
    const grid = document.getElementById("categoryGrid");
    if (!grid) return;
    grid.innerHTML = "";
    const map = new Map();
    STATE.products.forEach(p => {
        const cat = p.category || p.cat || "Other";
        map.set(cat, (map.get(cat) || 0) + 1);
    });
    const fallback = [
        { label: "Laptops", icon: "fa-laptop" },
        { label: "Desktops", icon: "fa-desktop" },
        { label: "Gaming", icon: "fa-gamepad" },
        { label: "Monitors", icon: "fa-tv" },
        { label: "Audio", icon: "fa-headphones" },
        { label: "Accessories", icon: "fa-keyboard" }
    ];
    const categories = map.size ? Array.from(map.keys()).map(k => ({ label: k, icon: pickIcon(k) })) : fallback;
    categories.forEach(cat => {
        const col = document.createElement("div");
        col.className = "col-6 col-sm-4 col-md-3";
        col.innerHTML = `
            <div class="category-card" data-cat="${escapeHtml(cat.label)}" role="button">
                <div class="icon"><i class="fa-solid ${cat.icon}"></i></div>
                <div class="label">${escapeHtml(cat.label)}</div>
            </div>`;
        grid.appendChild(col);
    });
    grid.querySelectorAll(".category-card").forEach(el => {
        el.addEventListener("click", () => {
            const c = el.dataset.cat;
            location.href = `products.html?cat=${encodeURIComponent(c)}`;
        });
    });
}

function pickIcon(label = "") {
    const s = label.toLowerCase();
    if (s.includes("laptop")) return "fa-laptop";
    if (s.includes("desk") || s.includes("pc")) return "fa-desktop";
    if (s.includes("game")) return "fa-gamepad";
    if (s.includes("monitor") || s.includes("screen")) return "fa-tv";
    if (s.includes("audio") || s.includes("head")) return "fa-headphones";
    if (s.includes("phone") || s.includes("mobile")) return "fa-mobile-screen-button";
    return "fa-box-open";
}

function initProductsPage() {
    populateFilters();
    document.getElementById("q")?.addEventListener("input", renderProducts);
    document.getElementById("cat")?.addEventListener("change", renderProducts);
    document.getElementById("brand")?.addEventListener("change", renderProducts);
    document.getElementById("sort")?.addEventListener("change", renderProducts);
    document.getElementById("clearFilters")?.addEventListener("click", () => {
        const qEl = document.getElementById("q");
        if (qEl) qEl.value = "";
        const catEl = document.getElementById("cat");
        if (catEl) catEl.selectedIndex = 0;
        const brandEl = document.getElementById("brand");
        if (brandEl) brandEl.selectedIndex = 0;
        const sortEl = document.getElementById("sort");
        if (sortEl) sortEl.selectedIndex = 0;
        renderProducts();
    });
    const url = new URL(location.href);
    const qcat = url.searchParams.get("cat");
    if (qcat) {
        const sel = document.getElementById("cat");
        if (sel) sel.value = qcat;
    }
    renderProducts();
}

function populateFilters() {
    const cats = new Set();
    const brands = new Set();
    STATE.products.forEach(p => { if (p.category) cats.add(p.category); if (p.brand) brands.add(p.brand); });
    const catEl = document.getElementById("cat");
    const brandEl = document.getElementById("brand");
    if (catEl) {
        catEl.innerHTML = `<option value="">All</option>` + Array.from(cats).map(c => `<option>${escapeHtml(c)}</option>`).join("");
    }
    if (brandEl) {
        brandEl.innerHTML = `<option value="">All</option>` + Array.from(brands).map(b => `<option>${escapeHtml(b)}</option>`).join("");
    }
    const sortEl = document.getElementById("sort");
    if (sortEl) {
        sortEl.innerHTML = `<option value="">Default</option>
            <option value="price-asc">Price ↑</option>
            <option value="price-desc">Price ↓</option>`;
    }
}

function renderProducts() {
    const grid = document.getElementById("productsGrid");
    if (!grid) return;
    const q = (document.getElementById("q")?.value || "").toLowerCase();
    const cat = (document.getElementById("cat")?.value || "");
    const brand = (document.getElementById("brand")?.value || "");
    const sort = (document.getElementById("sort")?.value || "");
    let items = STATE.products.filter(p => {
        const txt = ((p.name||"") + " " + (p.description||"")).toLowerCase();
        if (q && !txt.includes(q)) return false;
        if (cat && (p.category||"") !== cat) return false;
        if (brand && (p.brand||"") !== brand) return false;
        return true;
    });
    if (sort === "price-asc") items.sort((a,b)=> (a.price||0)-(b.price||0));
    if (sort === "price-desc") items.sort((a,b)=> (b.price||0)-(a.price||0));
    grid.innerHTML = "";
    items.forEach(p => {
        const name = p.name || "Product";
        const img = p.image || "";
        const col = document.createElement("div");
        col.className = "col-sm-6 col-md-4 col-lg-3";
        col.innerHTML = `
            <div class="card ee h-100">
                <div class="img-wrap">${img ? `<img src="${img}" alt="${escapeHtml(name)}">` : `<i class="fa-solid fa-box-open fa-3x text-muted"></i>`}</div>
                <div class="card-body d-flex flex-column">
                    <h5 class="card-title mb-1">${escapeHtml(name)}</h5>
                    <div class="mt-auto d-flex justify-content-between align-items-center">
                        <a class="btn btn-sm btn-outline-primary" href="product.html?id=${encodeURIComponent(p.id||p.name||"")}">View</a>
                        <div class="fw-bold">${formatPrice(p.price||0)}</div>
                    </div>
                </div>
            </div>`;
        grid.appendChild(col);
    });
}

function renderSpecials() {
    const grid = document.getElementById("specialsGrid");
    if (!grid) return;
    grid.innerHTML = "";
    const specials = STATE.products.filter(p => p.discount && p.discount > 0);
    specials.forEach(p => {
        const col = document.createElement("div");
        col.className = "col-sm-6 col-md-4 col-lg-3";
        col.innerHTML = `
            <div class="card ee h-100">
                <div class="img-wrap">${p.image ? `<img src="${p.image}" alt="${escapeHtml(p.name||'')}">` : `<i class="fa-solid fa-tag fa-3x text-muted"></i>`}</div>
                <div class="card-body d-flex flex-column">
                    <h5 class="card-title mb-1">${escapeHtml(p.name||"")}</h5>
                    <div class="mt-auto d-flex justify-content-between align-items-center">
                        <a class="btn btn-sm btn-outline-primary" href="product.html?id=${encodeURIComponent(p.id||p.name||"")}">View</a>
                        <div class="fw-bold">${formatPrice((p.price||0) * (1 - (p.discount||0)))}</div>
                    </div>
                </div>
            </div>`;
        grid.appendChild(col);
    });
}

function renderProductDetail() {
    const container = document.getElementById("productDetail");
    if (!container) return;
    const url = new URL(location.href);
    const id = url.searchParams.get("id");
    const product = STATE.products.find(x => String(x.id) === String(id) || x.name === id);
    if (!product) {
        container.innerHTML = `<div class="alert alert-warning">Product not found.</div>`;
        return;
    }
    
   
    let carouselHtml = '';
    const images = product.images || [product.image];
    
    if (images.length > 1) {
       
        carouselHtml = `
            <div id="productCarousel" class="carousel slide" data-bs-ride="carousel">
                <div class="carousel-indicators">
                    ${images.map((_, index) => 
                        `<button type="button" data-bs-target="#productCarousel" data-bs-slide-to="${index}" 
                        ${index === 0 ? 'class="active" aria-current="true"' : ''} aria-label="Slide ${index+1}"></button>`
                    ).join('')}
                </div>
                <div class="carousel-inner">
                    ${images.map((img, index) => 
                        `<div class="carousel-item ${index === 0 ? 'active' : ''}">
                            <img src="${img}" class="d-block w-100" alt="${product.name}">
                        </div>`
                    ).join('')}
                </div>
                <button class="carousel-control-prev" type="button" data-bs-target="#productCarousel" data-bs-slide="prev">
                    <span class="carousel-control-prev-icon" aria-hidden="true"></span>
                    <span class="visually-hidden">Previous</span>
                </button>
                <button class="carousel-control-next" type="button" data-bs-target="#productCarousel" data-bs-slide="next">
                    <span class="carousel-control-next-icon" aria-hidden="true"></span>
                    <span class="visually-hidden">Next</span>
                </button>
            </div>
        `;
    } else {
        
        carouselHtml = `<img src="${images[0]}" class="img-fluid" alt="${product.name}">`;
    }

    const discountedPrice = product.price * (1 - product.discount);
    
    container.innerHTML = `
        <div class="row">
            <div class="col-md-6">
                ${carouselHtml}
            </div>
            <div class="col-md-6">
                <h1>${product.name}</h1>
                <p class="text-muted">${product.brand}</p>
                <div class="mb-3">
                    ${product.discount > 0 
                        ? `<span class="text-decoration-line-through">${formatPrice(product.price)}</span> 
                            <span class="text-danger fs-4">${formatPrice(discountedPrice)}</span>
                            <span class="badge bg-danger">${Math.round(product.discount * 100)}% OFF</span>`
                        : `<span class="fs-4">${formatPrice(product.price)}</span>`
                    }
                </div>
                <p>${product.description}</p>
                <button class="btn btn-primary" id="addCart">
                    <i class="fa-solid fa-cart-plus"></i> Add to Cart
                </button>
                <button class="btn btn-outline-danger" id="toggleFav">
                    <i class="fa-solid fa-heart"></i> Add to Favorites
                </button>
            </div>
        </div>
    `;

   
    if (images.length > 1) {
        new bootstrap.Carousel(document.getElementById('productCarousel'));
    }

    
    document.getElementById("addCart").addEventListener("click", () => {
        STATE.cart.push({ id: product.id, name: product.name, price: product.price, qty: 1 });
        localStorage.setItem("ee_cart", JSON.stringify(STATE.cart));
        updateBadges();
        showMessage("Added to cart", "success");
    });
    
    const favBtn = document.getElementById("toggleFav");
    favBtn.addEventListener("click", () => {
        const exists = STATE.favs.find(x => x.id === product.id || x.name === product.name);
        if (exists) {
            STATE.favs = STATE.favs.filter(x => x.id !== product.id && x.name !== product.name);
            showMessage("Removed from favorites", "info");
        } else {
            STATE.favs.push({ id: product.id, name: product.name, price: product.price });
            showMessage("Added to favorites", "success");
        }
        localStorage.setItem("ee_fav", JSON.stringify(STATE.favs));
        updateBadges();
    });
}

function renderFavorites() {
    const grid = document.getElementById("favGrid");
    if (!grid) return;
    grid.innerHTML = "";
    STATE.favs.forEach(p => {
      
        const fullProduct = STATE.products.find(product => product.id === p.id || product.name === p.name);
        const productImage = fullProduct ? fullProduct.image : "";
        
        const col = document.createElement("div");
        col.className = "col-sm-6 col-md-4 col-lg-3";
        col.innerHTML = `
            <div class="card ee h-100">
                <div class="img-wrap">
                    ${productImage ? 
                        `<img src="${productImage}" alt="${escapeHtml(p.name)}">` : 
                        `<i class="fa-solid fa-heart fa-3x text-danger"></i>`
                    }
                </div>
                <div class="card-body d-flex flex-column">
                    <h5 class="card-title mb-1">${escapeHtml(p.name)}</h5>
                    <div class="mt-auto d-flex justify-content-between align-items-center">
                        <a class="btn btn-sm btn-outline-primary" href="product.html?id=${encodeURIComponent(p.id||p.name||"")}">View</a>
                        <div class="fw-bold">${formatPrice(p.price||0)}</div>
                    </div>
                </div>
            </div>`;
        grid.appendChild(col);
    });
}

function renderCart() {
    const tbody = document.getElementById("cartBody");
    if (!tbody) return;
    tbody.innerHTML = "";
    let subtotal = 0;
    STATE.cart.forEach((item, i) => {
        const tr = document.createElement("tr");
        const total = (item.price||0) * (item.qty||1);
        subtotal += total;
        tr.innerHTML = `
            <td>${escapeHtml(item.name)}</td>
            <td>${formatPrice(item.price||0)}</td>
            <td>${item.qty}</td>
            <td>${formatPrice(total)}</td>
            <td><button class="btn btn-sm btn-danger remove" data-i="${i}">&times;</button></td>`;
        tbody.appendChild(tr);
    });
    const subtotalEl = document.getElementById("subtotal");
    if (subtotalEl) subtotalEl.textContent = formatPrice(subtotal);
    tbody.querySelectorAll(".remove").forEach(btn => {
        btn.addEventListener("click", () => {
            const i = Number(btn.getAttribute("data-i"));
            STATE.cart.splice(i,1);
            localStorage.setItem("ee_cart", JSON.stringify(STATE.cart));
            updateBadges();
            renderCart();
        });
    });
}

function escapeHtml(s = "") {
    return String(s).replace(/[&<>"]/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;" }[c]));
}


function initLoginForm() {
    const form = document.getElementById("loginForm");
    if (!form) return;
    if (STATE.user) {
        form.innerHTML = `
            <div class="alert alert-success">
                <h4>שלום ${escapeHtml(STATE.user.username || STATE.user.name || STATE.user.email)}!</h4>
                <p>כבר התחברת למערכת.</p>
                <button id="logoutBtn" class="btn btn-outline-danger mt-2">התנתק</button>
            </div>
        `;
        document.getElementById("logoutBtn").addEventListener("click", logout);
        return;
    }
    form.addEventListener("submit", (e) => {
        e.preventDefault();
        const identifier = document.getElementById("email").value; 
        const password = document.getElementById("password").value;
        login(identifier, password);
    });
}


function login(identifier, password) {
    const id = String(identifier || "").trim().toLowerCase();
    const users = Array.isArray(STATE.users) ? STATE.users : [];
    const user = users.find(u => (
        (u.email && String(u.email).toLowerCase() === id) ||
        (u.username && String(u.username).toLowerCase() === id)
    ) && u.password === password);

    if (user) {
        const { password: _pw, ...userWithoutPassword } = user;
        STATE.user = userWithoutPassword;
        localStorage.setItem("ee_user", JSON.stringify(userWithoutPassword));
        updateUserUI();
        showMessage("התחברת בהצלחה!", "success");
        setTimeout(() => { window.location.href = "index.html"; }, 1000);
    } else {
        showMessage("שם משתמש/אימייל או סיסמה שגויים", "danger");
    }
}

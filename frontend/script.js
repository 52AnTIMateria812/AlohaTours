const API_URL = 'http://127.0.0.1:8000/api';
let token = localStorage.getItem('token');
let allTours = [];
let allProperties = [];
let currentBookingTour = null;
let currentBookingProperty = null;
let activeTab = 'tours';

function parseJwt (token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch(e) { return null; }
}

function toggleTheme() {
    // В версии Grayscale всегда используется темная тема
}

// Применяем тему при загрузке
if (localStorage.getItem('theme') === 'dark') {
    // legacy
}

function updateAuthUI() {
    const adminBtn = document.getElementById('admin-btn');
    if (token) {
        document.getElementById('auth-section').style.display = 'none';
        document.getElementById('user-section').style.display = 'flex';
        document.getElementById('user-name').innerText = "Вы вошли";
        
        const payload = parseJwt(token);
        if (payload && payload.role === 'manager') {
            adminBtn.style.display = 'block';
        } else {
            adminBtn.style.display = 'none';
        }
    } else {
        document.getElementById('auth-section').style.display = 'block';
        document.getElementById('user-section').style.display = 'none';
        adminBtn.style.display = 'none';
    }
}

async function loadTours() {
    try {
        const res = await fetch(`${API_URL}/tours/`);
        allTours = await res.json();
        renderTours(allTours);
    } catch (err) {
        console.error("Ошибка загрузки туров", err);
    }
}

function renderTours(tours) {
    const container = document.getElementById('tours-container');
    container.innerHTML = '';
    
    if (tours.length === 0) {
        container.innerHTML = '<p style="padding: 20px; color: #fff;">Туров не найдено. Попробуйте изменить параметры поиска.</p>';
        return;
    }

    tours.forEach(tour => {
        const card = document.createElement('div');
        card.className = 'tour-card';
        const imgHtml = tour.image_url ? `<img class="tour-img" src="${tour.image_url}" alt="${tour.title}">` : '';
        
        let stars = '';
        if (tour.hotel_stars) {
            stars = '⭐'.repeat(tour.hotel_stars);
        }

        card.innerHTML = `
            ${imgHtml}
            <div class="tour-info">
                <h3 style="margin-top:0;">${tour.hotel_name || tour.title} <span style="color:#ffd700;">${stars}</span></h3>
                <p><strong>Маршрут:</strong> ${tour.origin_city || 'Любой'} ➔ ${tour.country} (${tour.resort || 'Любой курорт'})</p>
                <p><strong>Питание:</strong> ${tour.board_type || 'Не указано'}</p>
                <p><strong>Ночей:</strong> ${tour.nights || '-'} | <strong>Вылет:</strong> ${tour.start_date}</p>
                <p style="font-size: 0.85em; color: #ccc;">Осталось мест: ${tour.capacity}</p>
                <p class="price">$${tour.price}</p>
                <button class="gs-btn-primary" onclick='openBookingModal(${tour.id})'>BOOK NOW</button>
            </div>
        `;
        container.appendChild(card);
    });
}

async function performAdvancedSearch() {
    const origin = document.getElementById('search-origin')?.value;
    const dest = document.getElementById('search-destination')?.value || document.getElementById('countryFilter')?.value;
    const date = document.getElementById('search-date')?.value;
    const nights = document.getElementById('search-nights')?.value;
    const adults = document.getElementById('search-adults')?.value;
    const children = document.getElementById('search-children')?.value;
    const stars = document.getElementById('filter-stars')?.value;
    const board = document.getElementById('filter-board')?.value;
    
    const params = new URLSearchParams();
    if (origin) params.append('origin_city', origin);
    if (dest) {
        params.append('destination', dest);
    }
    if (date) params.append('date_start', date);
    if (nights) params.append('nights', nights);
    if (adults) params.append('adults', adults);
    if (children) params.append('children', children);
    if (stars) params.append('hotel_stars', stars);
    if (board) params.append('board_type', board);

    try {
        const res = await fetch(`${API_URL}/tours/search?${params.toString()}`);
        if (res.ok) {
            allTours = await res.json();
            renderTours(allTours);
        }
    } catch (err) {
        console.error("Ошибка поиска туров", err);
    }
}

function filterAll() {
    if (activeTab === 'tours') {
        performAdvancedSearch();
    } else {
        const query = document.getElementById('countryFilter').value.toLowerCase();
        const filtered = allProperties.filter(prop => 
            prop.location.toLowerCase().includes(query) || 
            prop.title.toLowerCase().includes(query)
        );
        renderProperties(filtered);
    }
}

function switchTab(tab) {
    activeTab = tab;
    if (tab === 'tours') {
        document.getElementById('tours-container').style.display = 'flex';
        document.getElementById('properties-container').style.display = 'none';
        document.getElementById('tab-tours').classList.add('active');
        document.getElementById('tab-properties').classList.remove('active');
    } else {
        document.getElementById('tours-container').style.display = 'none';
        document.getElementById('properties-container').style.display = 'flex';
        document.getElementById('tab-properties').classList.add('active');
        document.getElementById('tab-tours').classList.remove('active');
    }
    filterAll();
}

async function loadProperties() {
    try {
        const res = await fetch(`${API_URL}/properties/`);
        allProperties = await res.json();
        renderProperties(allProperties);
    } catch (err) {
        console.error("Ошибка загрузки недвижимости", err);
    }
}

function renderProperties(properties) {
    const container = document.getElementById('properties-container');
    container.innerHTML = '';
    
    if (properties.length === 0) {
        container.innerHTML = '<p style="padding: 20px;">Недвижимость не найдена.</p>';
        return;
    }

    properties.forEach(prop => {
        const card = document.createElement('div');
        card.className = 'tour-card';
        const imgHtml = prop.image_url ? `<img class="tour-img" src="${prop.image_url}" alt="${prop.title}">` : '';
        
        card.innerHTML = `
            ${imgHtml}
            <div class="tour-info">
                <h3>${prop.title}</h3>
                <p><strong>Локация:</strong> ${prop.location}</p>
                <p style="font-size: 0.9em; color: #555;">${prop.description}</p>
                <p style="font-size: 0.85em;">Вместимость: ${prop.capacity} чел.</p>
                <p class="price">$${prop.price_per_night} / ночь</p>
                <button class="gs-btn-primary" onclick='openPropertyBookingModal(${prop.id})'>RENT PROPERTY</button>
            </div>
        `;
        container.appendChild(card);
    });
}

function showLogin() { document.getElementById('loginModal').style.display = 'flex'; }
function showRegister() { document.getElementById('registerModal').style.display = 'flex'; }
function closeModals() { 
    document.querySelectorAll('.modal').forEach(m => m.style.display = 'none');
}

async function login() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);

    const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData
    });

    if (res.ok) {
        const data = await res.json();
        token = data.access_token;
        localStorage.setItem('token', token);
        closeModals();
        updateAuthUI();
        loadTours();
    } else {
        alert("Ошибка входа! Проверьте данные.");
    }
}

async function register() {
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;
    const name = document.getElementById('regName').value;

    const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, full_name: name })
    });

    if (res.ok) {
        alert("Регистрация успешна! Теперь войдите.");
        closeModals();
        showLogin();
    } else {
        const errorData = await res.json();
        let errorMsg = "Ошибка регистрации!";
        if (errorData.detail) {
            if (Array.isArray(errorData.detail)) {
                errorMsg = errorData.detail.map(e => e.msg).join(", ");
            } else {
                errorMsg = errorData.detail;
            }
        }
        alert(errorMsg);
    }
}

function logout() {
    token = null;
    localStorage.removeItem('token');
    updateAuthUI();
    loadTours();
    hideAdminPanel();
}

// Бронирование
function openBookingModal(tourId) {
    if (!token) {
        document.getElementById('authRequiredModal').style.display = 'flex';
        return;
    }
    const tour = allTours.find(t => t.id === tourId);
    if (!tour) return;
    
    currentBookingTour = tour;
    document.getElementById('book-tour-title').innerText = tour.title;
    document.getElementById('book-tour-price').innerText = `$${tour.price}`;
    document.getElementById('book-people').value = 1;
    document.getElementById('book-people').max = tour.capacity;
    updateBookingPrice();
    document.getElementById('bookingModal').style.display = 'flex';
}

function updateBookingPrice() {
    if (!currentBookingTour) return;
    const count = parseInt(document.getElementById('book-people').value) || 1;
    const total = count * currentBookingTour.price;
    document.getElementById('book-total-price').innerText = `$${total.toFixed(2)}`;
}

async function confirmBooking() {
    const count = parseInt(document.getElementById('book-people').value) || 1;
    
    if (count > currentBookingTour.capacity) {
        return alert("Недостаточно мест!");
    }

    const res = await fetch(`${API_URL}/orders/`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ tour_id: currentBookingTour.id, people_count: count })
    });

    if (res.ok) {
        alert("Успешно забронировано!");
        closeModals();
        loadTours();
    } else {
        const err = await res.json();
        alert("Ошибка: " + (err.detail || "Не удалось забронировать"));
    }
}

// Бронирование недвижимости
function openPropertyBookingModal(propId) {
    if (!token) {
        document.getElementById('authRequiredModal').style.display = 'flex';
        return;
    }
    const prop = allProperties.find(p => p.id === propId);
    if (!prop) return;
    
    currentBookingProperty = prop;
    document.getElementById('book-prop-title').innerText = prop.title;
    document.getElementById('book-prop-price').innerText = `$${prop.price_per_night}`;
    
    document.getElementById('prop-start-date').value = '';
    document.getElementById('prop-end-date').value = '';
    document.getElementById('prop-people').value = 1;
    document.getElementById('prop-people').max = prop.capacity;
    document.getElementById('prop-total-price').innerText = '$0.00';
    
    document.getElementById('propertyBookingModal').style.display = 'flex';
}

function updatePropBookingPrice() {
    if (!currentBookingProperty) return;
    const startStr = document.getElementById('prop-start-date').value;
    const endStr = document.getElementById('prop-end-date').value;
    
    if (startStr && endStr) {
        const start = new Date(startStr);
        const end = new Date(endStr);
        const diffTime = end - start;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
        
        if (diffDays > 0) {
            const total = diffDays * currentBookingProperty.price_per_night;
            document.getElementById('prop-total-price').innerText = `$${total.toFixed(2)}`;
            return;
        }
    }
    document.getElementById('prop-total-price').innerText = '$0.00';
}

async function confirmPropertyBooking() {
    const start = document.getElementById('prop-start-date').value;
    const end = document.getElementById('prop-end-date').value;
    const count = parseInt(document.getElementById('prop-people').value) || 1;
    
    if (!start || !end) return alert("Выберите даты заезда и выезда!");
    if (count > currentBookingProperty.capacity) return alert("Количество человек превышает вместимость!");

    const startObj = new Date(start);
    const endObj = new Date(end);
    if (endObj <= startObj) return alert("Дата выезда должна быть позже даты заезда!");

    const res = await fetch(`${API_URL}/property_orders/`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
            property_id: currentBookingProperty.id, 
            start_date: start,
            end_date: end,
            people_count: count 
        })
    });

    if (res.ok) {
        alert("Недвижимость успешно забронирована!");
        closeModals();
    } else {
        const err = await res.json();
        alert("Ошибка: " + (err.detail || "Не удалось забронировать"));
    }
}

// Админ панель
async function showAdminPanel() {
    document.getElementById('main-content').style.display = 'none';
    document.getElementById('admin-content').style.display = 'flex';
    
    try {
        const res = await fetch(`${API_URL}/admin/users`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error("Нет доступа");
        const users = await res.json();
        
        const container = document.getElementById('admin-users-container');
        let html = '<table class="admin-table"><tr><th>ФИО</th><th>Email</th><th>Роль</th><th>Заказы</th></tr>';
        
        users.forEach(u => {
            let ordersHtml = u.orders.map(o => `Тур #${o.tour_id} (${o.people_count} чел.) - $${o.fixed_price} [${o.status}]`).join('<br>');
            let propOrdersHtml = u.property_orders && u.property_orders.length > 0 
                ? u.property_orders.map(o => `Аренда #${o.property_id} (${o.start_date} - ${o.end_date}, ${o.people_count} чел.) - $${o.total_price} [${o.status}]`).join('<br>') 
                : '';
            
            let allOrders = [ordersHtml, propOrdersHtml].filter(Boolean).join('<br><hr style="margin:2px 0;">');
            if (!allOrders) allOrders = "Нет заказов";

            html += `<tr>
                <td>${u.full_name}</td>
                <td>${u.email}</td>
                <td>${u.role}</td>
                <td style="font-size:0.85em;">${allOrders}</td>
            </tr>`;
        });
        html += '</table>';
        container.innerHTML = html;
        
    } catch (e) {
        alert("Ошибка загрузки данных администратора");
    }
}

function hideAdminPanel() {
    document.getElementById('main-content').style.display = 'flex';
    document.getElementById('admin-content').style.display = 'none';
}

updateAuthUI();
loadTours();
loadProperties();

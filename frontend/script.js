const API_URL = 'http://127.0.0.1:8000/api';
let token = localStorage.getItem('token');
let allTours = [];
let currentBookingTour = null;

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
        container.innerHTML = '<p style="padding: 20px;">Туров не найдено.</p>';
        return;
    }

    tours.forEach(tour => {
        const card = document.createElement('div');
        card.className = 'tour-card aero-glass-light';
        const imgHtml = tour.image_url ? `<img class="tour-img" src="${tour.image_url}" alt="${tour.title}">` : '';
        
        card.innerHTML = `
            ${imgHtml}
            <div class="tour-info">
                <h3>${tour.title}</h3>
                <p><strong>Страна:</strong> ${tour.country}</p>
                <p style="font-size: 0.9em; color: #555;">${tour.description}</p>
                <p style="font-size: 0.85em;"><strong>Даты:</strong> ${tour.start_date} - ${tour.end_date}</p>
                <p style="font-size: 0.85em;">Мест: ${tour.capacity}</p>
                <p class="price">$${tour.price}</p>
                <button class="aero-btn primary" onclick='openBookingModal(${tour.id})'>Забронировать</button>
            </div>
        `;
        container.appendChild(card);
    });
}

function filterTours() {
    const query = document.getElementById('countryFilter').value.toLowerCase();
    const filtered = allTours.filter(tour => 
        tour.country.toLowerCase().includes(query) || 
        tour.title.toLowerCase().includes(query)
    );
    renderTours(filtered);
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
            if (!ordersHtml) ordersHtml = "Нет заказов";
            html += `<tr>
                <td>${u.full_name}</td>
                <td>${u.email}</td>
                <td>${u.role}</td>
                <td style="font-size:0.85em;">${ordersHtml}</td>
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

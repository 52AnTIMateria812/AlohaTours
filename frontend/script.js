const API_URL = 'http://127.0.0.1:8000/api';
let token = localStorage.getItem('token');
let allTours = []; // Для клиентской фильтрации

function updateAuthUI() {
    if (token) {
        document.getElementById('auth-section').style.display = 'none';
        document.getElementById('user-section').style.display = 'flex';
        document.getElementById('user-name').innerText = "Вы вошли";
    } else {
        document.getElementById('auth-section').style.display = 'block';
        document.getElementById('user-section').style.display = 'none';
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
        container.innerHTML = '<p style="padding: 20px;">Туров не найдено. Попробуйте изменить фильтр.</p>';
        return;
    }

    tours.forEach(tour => {
        const card = document.createElement('div');
        card.className = 'tour-card aero-glass-light';
        card.innerHTML = `
            <h3>${tour.title}</h3>
            <p><strong>Страна:</strong> ${tour.country}</p>
            <p style="font-size: 0.9em; color: #555; flex: 1;">${tour.description}</p>
            <p style="font-size: 0.85em;"><strong>Даты:</strong> ${tour.start_date} - ${tour.end_date}</p>
            <p style="font-size: 0.85em;">Осталось мест: ${tour.capacity}</p>
            <p class="price">$${tour.price}</p>
            <button class="aero-btn primary" onclick="bookTour(${tour.id})" ${!token ? 'disabled title="Войдите для бронирования"' : ''}>Забронировать</button>
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
    document.getElementById('loginModal').style.display = 'none'; 
    document.getElementById('registerModal').style.display = 'none'; 
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
        loadTours(); // обновляем туры для активации кнопок
        alert("Успешный вход!");
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
        alert("Регистрация успешна! Теперь вы можете войти.");
        closeModals();
        showLogin();
    } else {
        alert("Ошибка регистрации!");
    }
}

function logout() {
    token = null;
    localStorage.removeItem('token');
    updateAuthUI();
    loadTours();
}

async function bookTour(tourId) {
    if (!token) return alert("Пожалуйста, авторизуйтесь");
    
    const res = await fetch(`${API_URL}/orders/`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ tour_id: tourId })
    });

    if (res.ok) {
        alert("Тур успешно забронирован! Спасибо.");
    } else {
        alert("Ошибка бронирования");
    }
}

// Инициализация
updateAuthUI();
loadTours();

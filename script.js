// --- БАЗА ДАННЫХ (LOCALSTORAGE) ---
let movies = JSON.parse(localStorage.getItem('myMovies')) || [];
let genres = JSON.parse(localStorage.getItem('myGenres')) || ['Фантастика', 'Комедия', 'Драма', 'Боевик', 'Триллеры'];

// --- ТЕКУЩЕЕ СОСТОЯНИЕ ---
let currentFilter = 'Все';
let searchQuery = '';

// --- СОХРАНЕНИЕ ---
function saveData() {
    localStorage.setItem('myMovies', JSON.stringify(movies));
    localStorage.setItem('myGenres', JSON.stringify(genres));
}

// --- ОТОБРАЖЕНИЕ КАТЕГОРИЙ (ЖАНРОВ) ---
function renderGenres() {
    const container = document.getElementById('categories-container');
    const select = document.getElementById('movie-genre-select');
    const genreList = document.getElementById('genre-list');

    // 1. Верхнее меню фильтров
    container.innerHTML = `<button class="${currentFilter === 'Все' ? 'active' : ''}" onclick="setFilter('Все')">Все</button>`;
    genres.forEach(genre => {
        container.innerHTML += `<button class="${currentFilter === genre ? 'active' : ''}" onclick="setFilter('${genre}')">${genre}</button>`;
    });

    // 2. Выпадающий список в модалке добавления фильма
    select.innerHTML = genres.map(g => `<option value="${g}">${g}</option>`).join('');

    // 3. Список в настройках (управление жанрами)
    genreList.innerHTML = genres.map((g, index) => `
        <div class="genre-item">
            <span>${g}</span>
            <button class="genre-del-btn" onclick="deleteGenre(${index})">Удалить</button>
        </div>
    `).join('');
}

// --- ОТОБРАЖЕНИЕ ФИЛЬМОВ (С ПОИСКОМ И ФИЛЬТРОМ) ---
function renderMovies() {
    const grid = document.getElementById('movie-grid');
    grid.innerHTML = '';

    // Фильтруем массив: сначала по жанру, потом по тексту поиска
    const filteredMovies = movies.filter(movie => {
        const matchGenre = currentFilter === 'Все' || movie.genre === currentFilter;
        const matchSearch = movie.title.toLowerCase().includes(searchQuery.toLowerCase());
        return matchGenre && matchSearch;
    });

    if (filteredMovies.length === 0) {
        grid.innerHTML = `<p style="grid-column: span 2; text-align: center; color: #8e8e93; margin-top: 20px;">Фильмы не найдены 🤷‍♂️</p>`;
        return;
    }

    filteredMovies.forEach(movie => {
        const card = document.createElement('div');
        card.className = 'movie-card';
        
        // Генерация случайного эмодзи на основе названия (чтобы картинка была постоянной для одного фильма)
        const emojis = ['🎬', '🍿', '👽', '🧛‍♂️', '🕵️', '🚀', '🎭', '🦖', '🧙‍♂️', '🧟‍♂️'];
        const emojiIndex = movie.title.length % emojis.length;

        card.innerHTML = `
            <button class="delete-btn" onclick="deleteMovie(${movie.id})">✕</button>
            <div class="movie-poster">${emojis[emojiIndex]}</div>
            <div class="movie-info">
                <div class="movie-title">${movie.title}</div>
                <div class="movie-genre">${movie.genre}</div>
            </div>
        `;
        grid.appendChild(card);
    });
}

// --- ДОБАВЛЕНИЕ / УДАЛЕНИЕ ФИЛЬМОВ ---
function addMovie() {
    const titleInput = document.getElementById('movie-name');
    const genreInput = document.getElementById('movie-genre-select');
    
    if (titleInput.value.trim() === '') {
        alert('Введите название фильма!');
        return;
    }

    movies.push({
        id: Date.now(), // Уникальный ID фильма
        title: titleInput.value.trim(),
        genre: genreInput.value
    });

    saveData();
    titleInput.value = '';
    closeAllModals();
    renderMovies();
}

function deleteMovie(id) {
    movies = movies.filter(movie => movie.id !== id);
    saveData();
    renderMovies();
}

// --- УПРАВЛЕНИЕ ЖАНРАМИ ---
function addGenre() {
    const input = document.getElementById('new-genre-name');
    const newGenre = input.value.trim();
    
    if (newGenre && !genres.includes(newGenre)) {
        genres.push(newGenre);
        saveData();
        input.value = '';
        renderGenres();
    }
}

function deleteGenre(index) {
    if(confirm('Точно удалить этот жанр?')) {
        // Если текущий фильтр был на этом жанре, сбрасываем на "Все"
        if(currentFilter === genres[index]) setFilter('Все'); 
        genres.splice(index, 1);
        saveData();
        renderGenres();
    }
}

// --- ПОИСК И ФИЛЬТРЫ ---
function setFilter(genre) {
    currentFilter = genre;
    renderGenres(); // Обновляем активную кнопку
    renderMovies(); // Перерисовываем сетку
}

function handleSearch() {
    searchQuery = document.getElementById('search-input').value;
    renderMovies();
}

// --- УПРАВЛЕНИЕ МОДАЛЬНЫМИ ОКНАМИ ---
function openModal(modalId) {
    document.getElementById('overlay').classList.add('active');
    document.getElementById(modalId).classList.add('active');
}

function closeAllModals() {
    document.getElementById('overlay').classList.remove('active');
    document.querySelectorAll('.modal').forEach(m => m.classList.remove('active'));
}

// --- ИНИЦИАЛИЗАЦИЯ ПРИ ЗАПУСКЕ ---
renderGenres();
renderMovies();
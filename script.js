const API_KEY = '8ea205db'; // Ключ OMDb API

let movies = JSON.parse(localStorage.getItem('myMovies')) || [];
let genres = JSON.parse(localStorage.getItem('myGenres')) || ['Фантастика', 'Комедия', 'Драма', 'Боевик', 'Аниме'];

let currentFilter = 'Все';
let searchQuery = '';
let editingMovieId = null; // Переменная для режима редактирования

function saveData() {
    localStorage.setItem('myMovies', JSON.stringify(movies));
    localStorage.setItem('myGenres', JSON.stringify(genres));
}

function renderGenres() {
    const container = document.getElementById('categories-container');
    const select = document.getElementById('movie-genre-select');
    const genreList = document.getElementById('genre-list');

    container.innerHTML = `<button class="${currentFilter === 'Все' ? 'active' : ''}" onclick="setFilter('Все')">Все</button>`;
    genres.forEach(genre => {
        container.innerHTML += `<button class="${currentFilter === genre ? 'active' : ''}" onclick="setFilter('${genre}')">${genre}</button>`;
    });

    select.innerHTML = genres.map(g => `<option value="${g}">${g}</option>`).join('');
    genreList.innerHTML = genres.map((g, index) => `
        <div class="genre-item">
            <span>${g}</span>
            <button class="genre-del-btn" onclick="deleteGenre(${index})">Удалить</button>
        </div>
    `).join('');
}

function renderMovies() {
    const grid = document.getElementById('movie-grid');
    grid.innerHTML = '';

    const filteredMovies = movies.filter(movie => {
        const matchGenre = currentFilter === 'Все' || movie.genre === currentFilter;
        const matchSearch = movie.title.toLowerCase().includes(searchQuery.toLowerCase());
        return matchGenre && matchSearch;
    });

    if (filteredMovies.length === 0) {
        grid.innerHTML = `<p style="grid-column: span 2; text-align: center; color: #8e8e93; margin-top: 20px;">Ничего не найдено 🤷‍♂️</p>`;
        return;
    }

    filteredMovies.forEach(movie => {
        const card = document.createElement('div');
        card.className = 'movie-card';
        
        const itemType = movie.type || 'Фильм';
        const typeIcon = itemType === 'Сериал' ? '📺' : '🎬';

        let posterHTML = '';
        if (movie.poster && movie.poster !== 'N/A') {
            posterHTML = `<img src="${movie.poster}" alt="Постер">`;
        } else {
            const emojis = ['🎬', '🍿', '👽', '🧛‍♂️', '🕵️', '🚀', '🎭'];
            const emojiIndex = movie.title.length % emojis.length;
            posterHTML = `${emojis[emojiIndex]}`;
        }

        const yearHTML = movie.year ? `<div class="movie-year">${movie.year}</div>` : '';
        const noteHTML = movie.note ? `<div class="movie-note">"${movie.note}"</div>` : '';
        const playBtnHTML = movie.videoLink ? `<button class="play-btn" onclick="openVideoModal('${movie.videoLink}')">▶ Смотреть отрывок</button>` : '';

        // Добавили кнопку редактирования (✏️)
        card.innerHTML = `
            <div class="item-badge">${typeIcon} ${itemType}</div>
            <button class="edit-btn" onclick="openEditModal(${movie.id})">✏️</button>
            <button class="delete-btn" onclick="deleteMovie(${movie.id})">✕</button>
            <div class="movie-poster">${posterHTML}</div>
            <div class="movie-info">
                ${yearHTML}
                <div class="movie-title">${movie.title}</div>
                <div class="movie-genre">${movie.genre}</div>
                ${noteHTML}
                ${playBtnHTML}
            </div>
        `;
        grid.appendChild(card);
    });
}

// Извлекаем ID видео
function getYouTubeID(url) {
    if (!url) return null;
    const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=|shorts\/)|youtu\.be\/)([^"&?\/\s]{11})/i;
    const match = url.match(regExp);
    return (match && match[1]) ? match[1] : null;
}

// Открытие окна для ДОБАВЛЕНИЯ нового фильма
function openAddModal() {
    editingMovieId = null; // Сбрасываем ID редактирования
    document.getElementById('modal-main-title').innerText = 'Добавить в список';
    document.getElementById('save-btn').innerText = 'Найти постер и сохранить';
    
    // Очищаем поля
    document.getElementById('movie-name').value = '';
    document.getElementById('movie-link').value = '';
    document.getElementById('movie-note').value = '';
    
    openModal('add-movie-modal');
}

// Открытие окна для РЕДАКТИРОВАНИЯ существующего фильма
function openEditModal(id) {
    editingMovieId = id; // Запоминаем, что мы редактируем
    const movie = movies.find(m => m.id === id);
    
    document.getElementById('modal-main-title').innerText = 'Редактировать';
    document.getElementById('save-btn').innerText = 'Сохранить изменения';
    
    // Заполняем поля старыми данными
    document.getElementById('item-type').value = movie.type || 'Фильм';
    document.getElementById('movie-name').value = movie.title;
    document.getElementById('movie-genre-select').value = movie.genre;
    
    // Превращаем ID видео обратно в ссылку, чтобы юзер мог её видеть
    document.getElementById('movie-link').value = movie.videoLink ? `https://youtu.be/${movie.videoLink}` : '';
    document.getElementById('movie-note').value = movie.note || '';
    
    openModal('add-movie-modal');
}

// Универсальная функция СОХРАНЕНИЯ (и для новых, и для редактируемых)
async function saveMovie() {
    const typeInput = document.getElementById('item-type');
    const titleInput = document.getElementById('movie-name');
    const genreInput = document.getElementById('movie-genre-select');
    const linkInput = document.getElementById('movie-link');
    const noteInput = document.getElementById('movie-note');
    const saveBtn = document.getElementById('save-btn');
    
    const query = titleInput.value.trim();
    if (query === '') {
        alert('Введите название!');
        return;
    }

    const rawLink = linkInput.value.trim();
    const videoID = getYouTubeID(rawLink);
    if (rawLink !== '' && !videoID) {
        alert('Не удалось распознать ссылку YouTube.');
        return;
    }

    // Ищем фильм, если мы в режиме редактирования
    let existingMovie = null;
    if (editingMovieId) {
        existingMovie = movies.find(m => m.id === editingMovieId);
    }

    // Параметры по умолчанию (берутся старые, если это редактирование)
    let posterUrl = existingMovie ? existingMovie.poster : '';
    let releaseYear = existingMovie ? existingMovie.year : '';
    let finalTitle = existingMovie ? existingMovie.title : query;

    // Умная проверка: Идем в API за постером только если:
    // 1. Это новый фильм (existingMovie = null)
    // 2. Юзер изменил название (query отличается от старого)
    if (!existingMovie || query.toLowerCase() !== existingMovie.title.toLowerCase()) {
        saveBtn.innerText = 'Ищем информацию... ⏳';
        saveBtn.disabled = true;

        try {
            const searchType = typeInput.value === 'Сериал' ? 'series' : 'movie';
            const url = `https://www.omdbapi.com/?t=${encodeURIComponent(query)}&type=${searchType}&apikey=${API_KEY}`;
            const response = await fetch(url);
            const data = await response.json();

            if (data.Response === "True") {
                posterUrl = data.Poster;
                releaseYear = data.Year;
                finalTitle = data.Title;
            } else if (!existingMovie) {
                // Если новый и не найден
                alert('Не нашли постер, сохраняем без него.');
                finalTitle = query;
            }
        } catch (error) {
            console.error('Ошибка API:', error);
        }
    }

    // Сохраняем данные
    if (editingMovieId && existingMovie) {
        // Обновляем существующий
        existingMovie.type = typeInput.value;
        existingMovie.title = finalTitle;
        existingMovie.genre = genreInput.value;
        existingMovie.poster = posterUrl;
        existingMovie.year = releaseYear;
        existingMovie.note = noteInput.value.trim();
        existingMovie.videoLink = videoID;
    } else {
        // Добавляем новый
        movies.push({
            id: Date.now(),
            type: typeInput.value,
            title: finalTitle,
            genre: genreInput.value,
            poster: posterUrl,
            year: releaseYear,
            note: noteInput.value.trim(),
            videoLink: videoID
        });
    }

    saveData();
    
    saveBtn.innerText = 'Найти постер и сохранить';
    saveBtn.disabled = false;
    
    closeAllModals();
    renderMovies();
}

function deleteMovie(id) {
    if(confirm('Удалить из списка?')) {
        movies = movies.filter(movie => movie.id !== id);
        saveData();
        renderMovies();
    }
}

// Плеер
function openVideoModal(videoID) {
    const player = document.getElementById('youtube-player');
    player.src = `https://www.youtube.com/embed/${videoID}?autoplay=1`;
    document.getElementById('overlay').classList.add('active');
    document.getElementById('video-modal').classList.add('active');
}

function closeVideoModal() {
    document.getElementById('youtube-player').src = ''; 
    document.getElementById('video-modal').classList.remove('active');
    if(!document.querySelector('.modal.active')) {
        document.getElementById('overlay').classList.remove('active');
    }
}

// Жанры и интерфейс
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
        if(currentFilter === genres[index]) setFilter('Все'); 
        genres.splice(index, 1);
        saveData();
        renderGenres();
    }
}

function setFilter(genre) {
    currentFilter = genre;
    renderGenres(); 
    renderMovies(); 
}

function handleSearch() {
    searchQuery = document.getElementById('search-input').value;
    renderMovies();
}

function openModal(modalId) {
    document.getElementById('overlay').classList.add('active');
    document.getElementById(modalId).classList.add('active');
}

function closeAllModals() {
    document.getElementById('overlay').classList.remove('active');
    document.querySelectorAll('.modal').forEach(m => m.classList.remove('active'));
    closeVideoModal();
}

renderGenres();
renderMovies();
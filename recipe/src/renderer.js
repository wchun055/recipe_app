import './index.css';
const { ipcRenderer } = window.require('electron');

let recipes = JSON.parse(localStorage.getItem('my-recipes')) || [];
let activeId = null;
let currentImageData = '';

// Helper to turn URL strings into clickable links
function linkify(text) {
    if (!text) return "";
    const urlPattern = /(\b(https?):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
    return text.replace(urlPattern, '<a href="$1" class="recipe-link" target="_blank">$1</a>');
}

function showView(view, readOnly = false) {
    const gridView = document.getElementById('grid-view');
    const editorView = document.getElementById('editor-view');
    const aboutText = document.getElementById('txt-about');
    const aboutPreview = document.getElementById('about-preview');
    const card = document.querySelector('.recipe-card');

    gridView.style.display = view === 'grid' ? 'block' : 'none';
    editorView.style.display = view === 'editor' ? 'flex' : 'none';

    if (view === 'editor') {
        if (readOnly) {
            card.classList.add('view-mode-only');
            document.getElementById('edit-mode-btn').style.display = 'block';
            document.getElementById('save-btn').style.display = 'none';
            
            // Linkify the About text and show preview
            aboutText.style.display = 'none';
            aboutPreview.style.display = 'block';
            aboutPreview.innerHTML = linkify(aboutText.value).replace(/\n/g, '<br>');
            
            toggleInputs(true);
        } else {
            card.classList.remove('view-mode-only');
            document.getElementById('edit-mode-btn').style.display = 'none';
            document.getElementById('save-btn').style.display = 'block';
            
            // Show raw text for editing
            aboutText.style.display = 'block';
            aboutPreview.style.display = 'none';
            
            toggleInputs(false);
        }
    }
}

function toggleInputs(disabled) {
    const inputs = document.querySelectorAll('.recipe-card input, .recipe-card textarea');
    inputs.forEach(input => input.disabled = disabled);
}

function createIngredientRow(name = '', qty = '') {
    const div = document.createElement('div');
    div.className = 'list-row';
    div.innerHTML = `
        <input type="text" placeholder="Ingredient" class="ing-name" value="${name}">
        <input type="text" placeholder="Qty" class="ing-qty" value="${qty}">
        <button class="remove-btn">×</button>
    `;
    div.querySelector('.remove-btn').onclick = () => div.remove();
    document.getElementById('ingredients-list').appendChild(div);
}

function createStepRow(text = '') {
    const div = document.createElement('div');
    div.className = 'list-row step-row';
    div.innerHTML = `
        <div class="step-number"></div>
        <textarea class="step-text" placeholder="Step instructions...">${text}</textarea>
        <button class="remove-btn">×</button>
    `;
    div.querySelector('.remove-btn').onclick = () => div.remove();
    document.getElementById('instructions-list').appendChild(div);
}

function renderGrid() {
    const recipeGrid = document.getElementById('recipe-grid');
    recipeGrid.innerHTML = '';
    recipes.forEach(r => {
        const item = document.createElement('div');
        item.className = 'grid-item';
        item.innerHTML = `
            <img src="${r.img || 'https://via.placeholder.com/150'}">
            <h3>${r.title}</h3>
            <div class="grid-item-actions">
                <button class="view-btn btn-s">View</button>
                <button class="edit-btn btn-p">Edit</button>
            </div>
        `;
        item.querySelector('.view-btn').onclick = () => loadRecipe(r.id, true);
        item.querySelector('.edit-btn').onclick = () => loadRecipe(r.id, false);
        recipeGrid.appendChild(item);
    });
}

function loadRecipe(id, readOnly) {
    const r = recipes.find(item => item.id === id);
    if (!r) return;
    activeId = id;
    document.getElementById('title').value = r.title;
    document.getElementById('prev-img').src = r.img || 'https://via.placeholder.com/150';
    currentImageData = r.img || '';
    document.getElementById('txt-about').value = r.about || '';
    
    document.getElementById('ingredients-list').innerHTML = '';
    document.getElementById('instructions-list').innerHTML = '';
    if (r.ingredients) r.ingredients.forEach(i => createIngredientRow(i.name, i.qty));
    if (r.instructions) r.instructions.forEach(s => createStepRow(s));

    switchTab('about');
    showView('editor', readOnly);
}

function switchTab(tabId) {
    document.querySelectorAll('.tab, .content').forEach(el => el.classList.remove('active'));
    document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');
    document.getElementById(tabId).classList.add('active');
}

document.querySelectorAll('.tab').forEach(t => {
    t.onclick = () => switchTab(t.getAttribute('data-tab'));
});

// Sidebar buttons
document.getElementById('add-btn').onclick = () => {
    activeId = Date.now();
    currentImageData = '';
    document.getElementById('title').value = '';
    document.getElementById('txt-about').value = '';
    document.getElementById('ingredients-list').innerHTML = '';
    document.getElementById('instructions-list').innerHTML = '';
    document.getElementById('prev-img').src = 'https://via.placeholder.com/150';
    createIngredientRow(); 
    createStepRow();
    switchTab('about');
    showView('editor', false);
};

document.getElementById('view-all-btn').onclick = () => {
    renderGrid();
    showView('grid');
};

// Editor buttons
document.getElementById('edit-mode-btn').onclick = () => showView('editor', false);
document.getElementById('add-ingredient-btn').onclick = () => createIngredientRow();
document.getElementById('add-step-btn').onclick = () => createStepRow();

document.getElementById('upload-btn').onclick = async () => {
    const base = await ipcRenderer.invoke('upload-image');
    if (base) {
        currentImageData = base;
        document.getElementById('prev-img').src = base;
    }
};

document.getElementById('save-btn').onclick = () => {
    const ings = Array.from(document.querySelectorAll('#ingredients-list .list-row')).map(row => ({
        name: row.querySelector('.ing-name').value,
        qty: row.querySelector('.ing-qty').value
    }));
    const steps = Array.from(document.querySelectorAll('.step-text')).map(s => s.value);
    const data = {
        id: activeId,
        title: document.getElementById('title').value || 'Untitled',
        img: currentImageData,
        about: document.getElementById('txt-about').value,
        ingredients: ings,
        instructions: steps
    };
    const idx = recipes.findIndex(r => r.id === activeId);
    if (idx > -1) recipes[idx] = data; else recipes.push(data);
    localStorage.setItem('my-recipes', JSON.stringify(recipes));
    renderGrid();
    showView('grid');
};

document.getElementById('delete-btn').onclick = () => {
    if(confirm("Delete recipe?")) {
        recipes = recipes.filter(r => r.id !== activeId);
        localStorage.setItem('my-recipes', JSON.stringify(recipes));
        renderGrid();
        showView('grid');
    }
};

renderGrid();
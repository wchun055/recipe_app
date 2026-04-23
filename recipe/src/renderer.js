import './index.css';
const { ipcRenderer } = window.require('electron');

let recipes = JSON.parse(localStorage.getItem('my-recipes')) || [];
let activeId = null;
let currentImageData = '';

// DOM Elements
const gridView = document.getElementById('grid-view');
const editorView = document.getElementById('editor-view');
const recipeGrid = document.getElementById('recipe-grid');
const editModeBtn = document.getElementById('edit-mode-btn');
const saveBtn = document.getElementById('save-btn');
const card = document.querySelector('.recipe-card');

/**
 * Navigation & Mode Handling
 * @param {string} view - 'grid' or 'editor'
 * @param {boolean} readOnly - If true, locks inputs and hides edit UI
 */
function showView(view, readOnly = false) {
    gridView.style.display = view === 'grid' ? 'block' : 'none';
    editorView.style.display = view === 'editor' ? 'flex' : 'none';

    if (view === 'editor') {
        if (readOnly) {
            card.classList.add('view-mode-only');
            editModeBtn.style.display = 'block';
            saveBtn.style.display = 'none';
            toggleInputs(true);
        } else {
            card.classList.remove('view-mode-only');
            editModeBtn.style.display = 'none';
            saveBtn.style.display = 'block';
            toggleInputs(false);
        }
    }
}

function toggleInputs(disabled) {
    const inputs = document.querySelectorAll('.recipe-card input, .recipe-card textarea');
    inputs.forEach(input => {
        input.disabled = disabled;
    });
}

// --- Dynamic Row Creation ---

function createIngredientRow(name = '', qty = '') {
    const div = document.createElement('div');
    div.className = 'list-row';
    div.innerHTML = `
        <input type="text" placeholder="Ingredient" class="ing-name" value="${name}">
        <input type="text" placeholder="Qty" class="ing-qty" value="${qty}">
        <button class="remove-btn" title="Remove">×</button>
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
        <button class="remove-btn" title="Remove">×</button>
    `;
    div.querySelector('.remove-btn').onclick = () => div.remove();
    document.getElementById('instructions-list').appendChild(div);
}

// --- Grid & Data Loading ---

function renderGrid() {
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
    activeId = id;
    
    // Populate Card
    document.getElementById('title').value = r.title;
    currentImageData = r.img || '';
    document.getElementById('prev-img').src = r.img || 'https://via.placeholder.com/150';
    document.getElementById('txt-about').value = r.about || '';
    
    // Populate Dynamic Lists
    document.getElementById('ingredients-list').innerHTML = '';
    document.getElementById('instructions-list').innerHTML = '';
    
    if (r.ingredients && r.ingredients.length > 0) {
        r.ingredients.forEach(i => createIngredientRow(i.name, i.qty));
    }
    if (r.instructions && r.instructions.length > 0) {
        r.instructions.forEach(s => createStepRow(s));
    }

    switchTab('about');
    showView('editor', readOnly);
}

// --- Tab Logic ---

function switchTab(tabId) {
    document.querySelectorAll('.tab, .content').forEach(el => el.classList.remove('active'));
    const targetTab = document.querySelector(`[data-tab="${tabId}"]`);
    const targetContent = document.getElementById(tabId);
    
    if (targetTab) targetTab.classList.add('active');
    if (targetContent) targetContent.classList.add('active');
}

document.querySelectorAll('.tab').forEach(t => {
    t.onclick = () => switchTab(t.getAttribute('data-tab'));
});

// --- Button Event Listeners ---

// Sidebar Actions
document.getElementById('add-btn').onclick = () => {
    activeId = Date.now();
    currentImageData = '';
    document.getElementById('title').value = '';
    document.getElementById('txt-about').value = '';
    document.getElementById('ingredients-list').innerHTML = '';
    document.getElementById('instructions-list').innerHTML = '';
    document.getElementById('prev-img').src = 'https://via.placeholder.com/150';
    
    // Start with one blank row each
    createIngredientRow(); 
    createStepRow();
    
    switchTab('about');
    showView('editor', false); // New recipes start in Edit mode
};

document.getElementById('view-all-btn').onclick = () => {
    renderGrid();
    showView('grid');
};

// Editor Actions
editModeBtn.onclick = () => showView('editor', false);

document.getElementById('add-ingredient-btn').onclick = () => createIngredientRow();
document.getElementById('add-step-btn').onclick = () => createStepRow();

document.getElementById('upload-btn').onclick = async () => {
    const base64 = await ipcRenderer.invoke('upload-image');
    if (base64) {
        currentImageData = base64;
        document.getElementById('prev-img').src = base64;
    }
};

saveBtn.onclick = () => {
    // Collect Ingredients
    const ings = Array.from(document.querySelectorAll('#ingredients-list .list-row')).map(row => ({
        name: row.querySelector('.ing-name').value,
        qty: row.querySelector('.ing-qty').value
    }));

    // Collect Instructions
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
    if(confirm("Are you sure you want to delete this recipe?")) {
        recipes = recipes.filter(r => r.id !== activeId);
        localStorage.setItem('my-recipes', JSON.stringify(recipes));
        renderGrid();
        showView('grid');
    }
};

// Initial Start
renderGrid();
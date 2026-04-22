import './index.css'; // Tells Webpack to use your CSS

let recipes = JSON.parse(localStorage.getItem('my-recipes')) || [];
let activeId = null;

const listEl = document.getElementById('recipe-list');
const editor = document.getElementById('editor');

function updateSidebar() {
  listEl.innerHTML = '';
  recipes.forEach(r => {
    const li = document.createElement('li');
    li.textContent = r.title;
    li.onclick = () => loadRecipe(r.id);
    listEl.appendChild(li);
  });
}

function loadRecipe(id) {
  const r = recipes.find(item => item.id === id);
  activeId = id;
  document.getElementById('title').value = r.title;
  document.getElementById('img-url').value = r.img;
  document.getElementById('prev-img').src = r.img || 'https://via.placeholder.com/150';
  document.getElementById('txt-about').value = r.about;
  document.getElementById('txt-ingredients').value = r.ingredients;
  document.getElementById('txt-instructions').value = r.instructions;
  editor.style.display = 'block';
}

document.getElementById('add-btn').onclick = () => {
  activeId = Date.now(); // Generate a unique ID
  editor.style.display = 'block';
  document.querySelectorAll('input, textarea').forEach(el => el.value = '');
  document.getElementById('prev-img').src = 'https://via.placeholder.com/150';
};

document.getElementById('save-btn').onclick = () => {
  const data = {
    id: activeId,
    title: document.getElementById('title').value || 'Untitled',
    img: document.getElementById('img-url').value,
    about: document.getElementById('txt-about').value,
    ingredients: document.getElementById('txt-ingredients').value,
    instructions: document.getElementById('txt-instructions').value
  };
  const index = recipes.findIndex(r => r.id === activeId);
  if (index > -1) recipes[index] = data; else recipes.push(data);
  localStorage.setItem('my-recipes', JSON.stringify(recipes));
  updateSidebar();
};

document.getElementById('delete-btn').onclick = () => {
  recipes = recipes.filter(r => r.id !== activeId);
  localStorage.setItem('my-recipes', JSON.stringify(recipes));
  editor.style.display = 'none';
  updateSidebar();
};

// Tab Switching Logic
document.querySelectorAll('.tab').forEach(tab => {
  tab.onclick = () => {
    document.querySelectorAll('.tab, .content').forEach(el => el.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById(tab.dataset.tab).classList.add('active');
  };
});

// Update the live preview image when the URL is pasted
document.getElementById('img-url').addEventListener('input', (e) => {
    document.getElementById('prev-img').src = e.target.value || 'https://via.placeholder.com/150';
});

updateSidebar();
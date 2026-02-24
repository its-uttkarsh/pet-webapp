/* app.js
   Frontend logic: navigation, fetch calls, register pet upload, auth, reset flow
*/

const API_BASE = '/petapp/api';

const views = document.querySelectorAll('.view');

function showView(name) {
  views.forEach(v => v.style.display = v.id === name ? '' : 'none');
  document.querySelectorAll('[data-nav]').forEach(a => {
    a.classList.toggle('active', a.getAttribute('data-nav') === name);
  });
}

// initial view
showView('home');

// nav link handlers
document.querySelectorAll('[data-nav]').forEach(a => {
  a.addEventListener('click', e => {
    e.preventDefault();
    const nav = a.getAttribute('data-nav');
    showView(nav);
    if (nav === 'adopt') loadPets();
  });
});

// Bootstrap modal instances
const loginModal = new bootstrap.Modal(document.getElementById('loginModal'));
const signupModal = new bootstrap.Modal(document.getElementById('signupModal'));
const resetModal = new bootstrap.Modal(document.getElementById('resetModal'));
const petModalEl = document.getElementById('petModal');
const petModal = new bootstrap.Modal(petModalEl);

document.getElementById('btn-show-login').onclick = () => loginModal.show();
document.getElementById('btn-show-register-user').onclick = () => signupModal.show();
document.getElementById('open-reset').onclick = (e) => { e.preventDefault(); loginModal.hide(); resetModal.show(); };

// Utility
const $ = sel => document.querySelector(sel);
const val = id => (typeof id === 'string' ? document.getElementById(id).value.trim() : id.value.trim());

// ======= SIGNUP =======
document.getElementById('btn-signup-submit').onclick = async () => {
  const username = val('su-username');
  const email = val('su-email');
  const password = val('su-password');
  const question = document.getElementById('su-question').value;
  const answer = val('su-answer');

  if (!username || !email || !password) return alert('Fill required fields.');

  try {
    const res = await fetch(`${API_BASE}/register.php`, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({username, email, password, question, answer})
    });
    const data = await res.json();
    if (data.success) {
      alert('Account created');
      signupModal.hide();
      await checkSessionAndLoad();
    } else {
      alert(data.error || 'Registration failed');
    }
  } catch (err) {
    alert('Network error');
  }
};

// ======= LOGIN =======
document.getElementById('btn-login-submit').onclick = async () => {
  const ue = val('lg-username');
  const password = val('lg-password');
  if (!ue || !password) return alert('Enter credentials');

  try {
    const res = await fetch(`${API_BASE}/login.php`, {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({username: ue, password})
    });
    const data = await res.json();
    if (data.success) {
      alert('Login successful');
      loginModal.hide();
      await checkSessionAndLoad();
    } else {
      alert(data.error || 'Login failed');
    }
  } catch (err) {
    alert('Network error');
  }
};

// ======= LOGOUT =======
async function logout() {
  await fetch(`${API_BASE}/logout.php`);
  location.reload();
}

// ======= CHECK SESSION =======
async function checkSessionAndLoad() {
  try {
    const res = await fetch(`${API_BASE}/check_session.php`);
    const status = await res.json();
    if (status.logged_in) {
      document.getElementById('btn-show-login').textContent = 'Logged in';
      document.getElementById('btn-show-login').disabled = true;
      document.getElementById('btn-show-register-user').textContent = 'Logout';
      document.getElementById('btn-show-register-user').onclick = logout;
    } else {
      document.getElementById('btn-show-login').textContent = 'Login';
      document.getElementById('btn-show-login').disabled = false;
      document.getElementById('btn-show-register-user').textContent = 'Create Account';
      document.getElementById('btn-show-register-user').onclick = () => signupModal.show();
    }
  } catch (err) {
    console.error('session check failed', err);
  }
}
document.addEventListener('DOMContentLoaded', checkSessionAndLoad);

// ======= REGISTER PET (multipart FormData) =======
const regForm = document.getElementById('pet-register-form');
regForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = new FormData(regForm);
  const btn = document.getElementById('btn-register-pet');
  btn.disabled = true;
  btn.textContent = 'Uploading...';
  try {
    const res = await fetch(`${API_BASE}/register_pet.php`, {
      method: 'POST',
      body: form
    });
    const data = await res.json();
    if (data.success) {
      $('#pet-register-msg').innerHTML = `<div class="alert alert-success">Registered pet #${data.pet_id}</div>`;
      regForm.reset();
    } else {
      $('#pet-register-msg').innerHTML = `<div class="alert alert-danger">${data.error || 'Register failed'}</div>`;
    }
  } catch (err) {
    $('#pet-register-msg').innerHTML = `<div class="alert alert-danger">Network error</div>`;
  } finally {
    btn.disabled = false;
    btn.textContent = 'Register Pet';
  }
});

// ======= LOAD PETS =======
let allPets = [];
async function loadPets() {
  const grid = document.getElementById('pet-grid');
  grid.innerHTML = '<div class="text-muted">Loading...</div>';
  try {
    const res = await fetch(`${API_BASE}/get_pets.php`);
    const data = await res.json();
    allPets = data.pets || [];
    renderPetGrid(allPets);
  } catch (err) {
    grid.innerHTML = '<div class="text-danger">Failed to load pets.</div>';
  }
}

function renderPetGrid(pets) {
  const grid = document.getElementById('pet-grid');
  if (!pets.length) {
    grid.innerHTML = '<div class="col-12"><div class="alert alert-info">No pets listed yet.</div></div>';
    return;
  }
  grid.innerHTML = '';
  pets.forEach(p => {
    const col = document.createElement('div');
    col.className = 'col-sm-6 col-md-4';
    col.innerHTML = `
      <div class="card h-100">
        <img src="${p.image_url}" class="card-img-top" style="height:200px; object-fit:cover;">
        <div class="card-body d-flex flex-column">
          <h5 class="card-title">${escapeHtml(p.name)}</h5>
          <p class="card-text">${escapeHtml(p.species)} · ${escapeHtml(p.breed || '')} · ${escapeHtml(p.color || '')}</p>
          <p class="card-text text-truncate">${escapeHtml(p.description || '')}</p>
          <div class="mt-auto d-flex gap-2">
            <button class="btn btn-primary btn-sm btn-view" data-id="${p.id}">View</button>
            <button class="btn btn-success btn-sm btn-adopt" data-id="${p.id}">Adopt</button>
          </div>
        </div>
      </div>
    `;
    grid.appendChild(col);
  });

  document.querySelectorAll('.btn-view').forEach(btn => {
    btn.addEventListener('click', () => openPetModal(btn.getAttribute('data-id')));
  });
  document.querySelectorAll('.btn-adopt').forEach(btn => {
    btn.addEventListener('click', async () => adoptPet(btn.getAttribute('data-id'), btn));
  });
}

// ======= PET MODAL =======
async function openPetModal(id) {
  try {
    const res = await fetch(`${API_BASE}/get_pet.php?id=${encodeURIComponent(id)}`);
    const data = await res.json();
    if (!data.pet) return alert('Pet not found');
    const p = data.pet;
    document.getElementById('petModalTitle').textContent = p.name;
    document.getElementById('petModalImg').src = p.image_url;
    document.getElementById('m-name').textContent = p.name;
    document.getElementById('m-species').textContent = `${p.species} / ${p.breed || '-'}`;
    document.getElementById('m-color').textContent = p.color || '-';
    document.getElementById('m-age').textContent = p.age || '-';
    document.getElementById('m-agg').textContent = p.aggressive ? 'Yes' : 'No';
    document.getElementById('m-desc').textContent = p.description || '-';
    document.getElementById('modal-adopt-btn').onclick = async () => {
      await adoptPet(p.id);
      petModal.hide();
    };
    petModal.show();
  } catch (err) {
    alert('Failed to load pet details');
  }
}

// ======= ADOPT =======
async function adoptPet(id, btnElement = null) {
  if (!confirm('Are you sure you want to request adoption of this pet?')) return;
  try {
    const res = await fetch(`${API_BASE}/adopt.php`, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({pet_id: id})
    });
    const data = await res.json();
    if (data.success) {
      alert('Adoption requested!');
      if (btnElement) {
        btnElement.textContent = 'Requested';
        btnElement.disabled = true;
      }
      loadPets();
    } else if (data.error === 'not_logged_in') {
      alert('Please log in to adopt.');
    } else {
      alert(data.error || 'Adoption failed');
    }
  } catch (err) {
    alert('Network error');
  }
}

// ======= SEARCH FILTER =======
document.getElementById('search-pet').addEventListener('input', (e) => {
  const q = e.target.value.trim().toLowerCase();
  if (!q) return renderPetGrid(allPets);
  const filtered = allPets.filter(p => {
    return (p.name || '').toLowerCase().includes(q) ||
           (p.species || '').toLowerCase().includes(q) ||
           (p.color || '').toLowerCase().includes(q);
  });
  renderPetGrid(filtered);
});

// ======= RESET FLOW =======
let resetUserId = null;
function step(hide, show){
  document.getElementById(`reset-step${hide}`).style.display = "none";
  document.getElementById(`reset-step${show}`).style.display = "";
}

document.getElementById('rp-btn-continue').onclick = async () => {
  const ue = val('rp-ue');
  if (!ue) return alert('Enter username or email');
  try {
    const res = await fetch(`${API_BASE}/reset_request.php`, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ue})
    });
    const data = await res.json();
    if (data.success) {
      resetUserId = data.user_id;
      document.getElementById('rp-question').innerText = data.question || 'Security question';
      step(1,2);
    } else {
      alert(data.error || 'User not found');
    }
  } catch (err) {
    alert('Network error');
  }
};

document.getElementById('rp-btn-verify').onclick = async () => {
  const answer = val('rp-answer');
  if (!answer) return alert('Enter answer');
  try {
    const res = await fetch(`${API_BASE}/reset_verify.php`, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({user_id: resetUserId, answer})
    });
    const data = await res.json();
    if (data.success) step(2,3); else alert(data.error || 'Incorrect answer');
  } catch (err) {
    alert('Network error');
  }
};

document.getElementById('rp-btn-update').onclick = async () => {
  const pass = val('rp-newpass');
  if (!pass) return alert('Enter new password');
  try {
    const res = await fetch(`${API_BASE}/reset_update.php`, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({user_id: resetUserId, password: pass})
    });
    const data = await res.json();
    if (data.success) {
      alert('Password updated');
      resetModal.hide();
    } else alert(data.error || 'Failed to update');
  } catch (err) {
    alert('Network error');
  }
};

// ======= UTIL =======
function escapeHtml(s) {
  if (!s) return '';
  return s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
}

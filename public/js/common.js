const DIVISIONS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'];

function initTheme() {
  if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

function toggleDarkMode() {
  if (document.documentElement.classList.contains('dark')) {
    document.documentElement.classList.remove('dark');
    localStorage.theme = 'light';
  } else {
    document.documentElement.classList.add('dark');
    localStorage.theme = 'dark';
  }
}

function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  const mainContent = document.getElementById('mainContent');
  const openBtn = document.getElementById('openSidebarBtn');
  if (!sidebar || !mainContent || !openBtn) return;

  const isClosed = sidebar.classList.contains('-translate-x-full');

  if (isClosed) {
    sidebar.classList.remove('-translate-x-full');
    if (window.innerWidth >= 768) {
      mainContent.classList.add('md:ml-64');
    }
    openBtn.classList.add('hidden');
  } else {
    sidebar.classList.add('-translate-x-full');
    mainContent.classList.remove('md:ml-64');
    openBtn.classList.remove('hidden');
  }
}

function fillDivisiOptions(selectEl, selectedVal = '') {
  if (!selectEl) return;
  selectEl.innerHTML = '<option value="">-- Pilih Divisi --</option>';
  DIVISIONS.forEach(div => {
    const opt = document.createElement('option');
    opt.value = div;
    opt.textContent = div;
    if (div === selectedVal) opt.selected = true;
    selectEl.appendChild(opt);
  });
}

// Master mapel (diambil dari GET /api/mapel, di-cache di memori).
let MAPEL_CACHE = null;

async function loadMapelList(force = false) {
  if (MAPEL_CACHE && !force) return MAPEL_CACHE;
  try {
    const res = await fetch('/api/mapel');
    const list = await res.json();
    MAPEL_CACHE = Array.isArray(list) ? list : [];
  } catch (err) {
    console.error('Gagal memuat daftar mapel:', err);
    MAPEL_CACHE = MAPEL_CACHE || [];
  }
  return MAPEL_CACHE;
}

async function fillMapelOptions(selectEl, selectedVal = '') {
  if (!selectEl) return;
  const placeholder = selectEl.querySelector('option[value=""]');
  selectEl.innerHTML = '';
  const emptyOpt = document.createElement('option');
  emptyOpt.value = '';
  emptyOpt.textContent = placeholder ? placeholder.textContent : '-- Pilih Mapel --';
  selectEl.appendChild(emptyOpt);

  const list = await loadMapelList();
  const names = list.map(m => m.nama);
  // Nilai lama (misal data sebelum ada master mapel) tetap ditampilkan agar tidak hilang.
  if (selectedVal && !names.includes(selectedVal)) names.unshift(selectedVal);
  names.forEach(nama => {
    const opt = document.createElement('option');
    opt.value = nama;
    opt.textContent = nama;
    if (nama === selectedVal) opt.selected = true;
    selectEl.appendChild(opt);
  });

  const addOpt = document.createElement('option');
  addOpt.value = '__baru__';
  addOpt.textContent = '＋ Mapel baru...';
  selectEl.appendChild(addOpt);
}

// Dipanggil saat dropdown mapel memilih "＋ Mapel baru...".
// prompt() sengaja dipakai agar tetap konsisten dengan confirm() yang sudah ada.
async function handleMapelBaru(selectEl) {
  if (!selectEl || selectEl.value !== '__baru__') return;
  const nama = (prompt('Nama mapel baru:') || '').trim();
  if (!nama) {
    selectEl.value = '';
    return;
  }
  try {
    const res = await fetch('/api/mapel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nama })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Gagal menambah mapel');
    showToast('Mapel ditambahkan');
    await refreshMapelSelects(nama, selectEl);
  } catch (err) {
    alert('Gagal: ' + err.message);
    selectEl.value = '';
  }
}

// Muat ulang semua dropdown mapel yang sedang tampil (baris jadwal + modal tugas)
// sambil menjaga nilai masing-masing; select pemicu diisi nilai baru.
async function refreshMapelSelects(selectVal = null, targetSel = null) {
  await loadMapelList(true);
  const selects = [...document.querySelectorAll('select.subject-input')];
  const tugasSel = document.getElementById('inputTugasMapel');
  if (tugasSel) selects.push(tugasSel);
  for (const sel of selects) {
    let keep = sel.value;
    if (keep === '__baru__') keep = (sel === targetSel && selectVal) ? selectVal : '';
    await fillMapelOptions(sel, keep);
  }
}


function showToast(message = 'URL Copied') {
  const toast = document.getElementById('toastNotification');
  if (!toast) return;

  const span = toast.querySelector('span');
  if (span) span.textContent = message;

  toast.classList.remove('opacity-0', 'scale-95');
  toast.classList.add('opacity-100', 'scale-100');

  setTimeout(() => {
    toast.classList.remove('opacity-100', 'scale-100');
    toast.classList.add('opacity-0', 'scale-95');
  }, 2000);
}

function copyToClipboard(inputId) {
  const input = document.getElementById(inputId);
  if (!input || !input.value) return;
  input.focus();
  input.select();
  try {
    document.execCommand('copy');
    showToast('URL Copied');
  } catch (err) {
    navigator.clipboard.writeText(input.value).then(() => {
      showToast('URL Copied');
    }).catch(() => {
      alert('Gagal menyalin URL');
    });
  }
}

function escapeHtml(str) {
  return String(str == null ? '' : str).replace(/[&<>"']/g, match => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[match]));
}

// Ganti <span data-icon="nama" data-cls="..."> jadi SVG dari icons.js.
// Lihat docs/ICON_HELPER.md untuk daftar nama ikon.
function hydrateIcons(root = document) {
  if (typeof icon !== 'function') return;
  root.querySelectorAll('[data-icon]').forEach(el => {
    const name = el.getAttribute('data-icon');
    const cls = el.getAttribute('data-cls') || 'w-4 h-4';
    el.innerHTML = icon(name, cls);
    el.removeAttribute('data-icon');
    el.removeAttribute('data-cls');
  });
}

document.addEventListener('DOMContentLoaded', () => hydrateIcons());

async function updateTugasBadge() {
  try {
    const res = await fetch('/api/tugas');
    const rows = await res.json();
    const list = Array.isArray(rows) ? rows : [];
    const now = Date.now();
    const limit24h = now + 24 * 60 * 60 * 1000;
    let belum = 0, proses = 0, urgent = false;
    list.forEach(t => {
      if (t.status === 'belum') {
        belum++;
        const dl = new Date(t.deadline).getTime();
        if (!isNaN(dl) && dl > now && dl <= limit24h) urgent = true;
      } else if (t.status === 'proses') {
        proses++;
      }
    });
    const badge = document.getElementById('tugasBadge');
    if (!badge) return;
    const total = belum + proses;
    badge.textContent = total;
    badge.classList.toggle('animate-pulse', urgent);
    badge.title = `${belum} belum, ${proses} proses`;
    badge.classList.toggle('hidden', total === 0);
  } catch (err) {
    console.error('Gagal memuat badge tugas:', err);
  }
}

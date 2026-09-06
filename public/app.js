const DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];
const DIVISIONS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'];
const TUGAS_STATUS = ['belum', 'proses', 'selesai'];
let currentClasses = [];
let selectedClass = null; // { kelas: 'XII', divisi: 'C' }
let allSchedules = [];
let allTugas = [];

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  loadClasses();
  initApiPageOptions();
});

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

// Sidebar Navigation
function setNavActive(activeBtn, ...inactiveBtns) {
  if (!activeBtn) return;
  activeBtn.classList.add('bg-slate-700', 'text-white', 'dark:bg-slate-700');
  activeBtn.classList.remove('text-slate-400');
  inactiveBtns.forEach(btn => {
    if (!btn) return;
    btn.classList.remove('bg-slate-700', 'text-white', 'dark:bg-slate-700');
    btn.classList.add('text-slate-400');
  });
}

function showSection(section) {
  const homeSection = document.getElementById('homeSection');
  const apiSection = document.getElementById('apiSection');
  const tugasSection = document.getElementById('tugasSection');
  const homeFilterWrapper = document.getElementById('homeFilterWrapper');
  const tugasFilterWrapper = document.getElementById('tugasFilterWrapper');
  const btnHome = document.getElementById('navHome');
  const btnApi = document.getElementById('navApi');
  const btnTugas = document.getElementById('navTugas');
  const btnAddJadwal = document.getElementById('btnAddJadwal');
  const btnAddTugas = document.getElementById('btnAddTugas');
  const pageTitle = document.getElementById('pageTitle');
  const pageSubtitle = document.getElementById('pageSubtitle');

  if (section === 'home') {
    homeSection.classList.remove('hidden');
    apiSection.classList.add('hidden');
    if (tugasSection) tugasSection.classList.add('hidden');
    if (homeFilterWrapper) homeFilterWrapper.classList.remove('hidden');
    if (tugasFilterWrapper) tugasFilterWrapper.classList.add('hidden');
    if (btnAddJadwal) btnAddJadwal.classList.remove('hidden');
    if (btnAddTugas) btnAddTugas.classList.add('hidden');
    if (pageTitle) pageTitle.textContent = 'Manajemen Jadwal';
    if (pageSubtitle) pageSubtitle.textContent = 'Pusat pengaturan jadwal pelajaran dan export API n8n.';
    setNavActive(btnHome, btnApi, btnTugas);
  } else if (section === 'api') {
    homeSection.classList.add('hidden');
    apiSection.classList.remove('hidden');
    if (tugasSection) tugasSection.classList.add('hidden');
    if (homeFilterWrapper) homeFilterWrapper.classList.add('hidden');
    if (tugasFilterWrapper) tugasFilterWrapper.classList.add('hidden');
    if (btnAddJadwal) btnAddJadwal.classList.add('hidden');
    if (btnAddTugas) btnAddTugas.classList.add('hidden');
    if (pageTitle) pageTitle.textContent = 'API Generator';
    if (pageSubtitle) pageSubtitle.textContent = 'Buat URL endpoint JSON untuk n8n atau scraping.';
    setNavActive(btnApi, btnHome, btnTugas);
  } else if (section === 'tugas') {
    homeSection.classList.add('hidden');
    apiSection.classList.add('hidden');
    if (tugasSection) tugasSection.classList.remove('hidden');
    if (homeFilterWrapper) homeFilterWrapper.classList.add('hidden');
    if (tugasFilterWrapper) tugasFilterWrapper.classList.remove('hidden');
    if (btnAddJadwal) btnAddJadwal.classList.add('hidden');
    if (btnAddTugas) btnAddTugas.classList.remove('hidden');
    if (pageTitle) pageTitle.textContent = 'Manajemen Tugas';
    if (pageSubtitle) pageSubtitle.textContent = 'Pantau dan kelola tugas sekolah berdasarkan deadline.';
    setNavActive(btnTugas, btnHome, btnApi);
    loadTugas();
  }
}

// Inisialisasi Opsi di Halaman API
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

function initApiPageOptions() {
  fillDivisiOptions(document.getElementById('apiDivisi'));
  fillDivisiOptions(document.getElementById('apiTugasDivisi'));
}

function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  const mainContent = document.getElementById('mainContent');
  const openBtn = document.getElementById('openSidebarBtn');
  
  const isClosed = sidebar.classList.contains('-translate-x-full');
  
  if (isClosed) {
    // Buka sidebar
    sidebar.classList.remove('-translate-x-full');
    if (window.innerWidth >= 768) {
      mainContent.classList.add('md:ml-64');
    }
    openBtn.classList.add('hidden');
  } else {
    // Tutup sidebar
    sidebar.classList.add('-translate-x-full');
    mainContent.classList.remove('md:ml-64');
    openBtn.classList.remove('hidden');
  }
}

function generateAPIURL() {
  const kelas = document.getElementById('apiKelas').value;
  const divisi = document.getElementById('apiDivisi').value;
  const hari = document.getElementById('apiHari').value;

  if (!kelas || !divisi) {
    alert('Harap pilih Kelas dan Divisi terlebih dahulu.');
    return;
  }

  const host = window.location.origin;
  let url = `${host}/api/jadwal/export?kelas=${encodeURIComponent(kelas)}&divisi=${encodeURIComponent(divisi)}`;
  
  if (hari && hari.trim() !== '') {
    url += `&hari=${encodeURIComponent(hari)}`;
  }
  
  const urlInput = document.getElementById('apiURLInput');
  urlInput.value = url;
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
  if (!input.value) return;
  input.focus();
  input.select();
  try {
    document.execCommand('copy');
    showToast('URL Copied');
  } catch (err) {
    navigator.clipboard.writeText(input.value).then(() => {
      showToast('URL Copied');
    }).catch(e => {
      alert('Gagal menyalin URL');
    });
  }
}

// Ambil daftar kelas untuk dropdown utama
async function loadClasses() {
  try {
    const res = await fetch('/api/kelas');
    currentClasses = await res.json();
    const select = document.getElementById('classSelect');
    select.innerHTML = '<option value="">-- Pilih Kelas --</option>';

    currentClasses.forEach(item => {
      const option = document.createElement('option');
      option.value = JSON.stringify({ kelas: item.kelas, divisi: item.divisi });
      option.textContent = `${item.kelas}-${item.divisi}`;
      select.appendChild(option);
    });

    const tugasSelect = document.getElementById('tugasClassSelect');
    if (tugasSelect) {
      const prevVal = tugasSelect.value;
      tugasSelect.innerHTML = '<option value="">Semua Kelas</option>';
      currentClasses.forEach(item => {
        const option = document.createElement('option');
        option.value = JSON.stringify({ kelas: item.kelas, divisi: item.divisi });
        option.textContent = `${item.kelas}-${item.divisi}`;
        tugasSelect.appendChild(option);
      });
      if (prevVal) tugasSelect.value = prevVal;
    }
    updateTugasBadge();

    if (!selectedClass && currentClasses.length > 0) {
      selectedClass = { kelas: currentClasses[0].kelas, divisi: currentClasses[0].divisi };
      select.value = JSON.stringify(selectedClass);
      loadSchedule();
    } else if (selectedClass) {
      select.value = JSON.stringify(selectedClass);
      loadSchedule();
    } else {
      renderEmptyView();
    }
  } catch (err) {
    console.error('Gagal mengambil daftar kelas:', err);
  }
}

function onClassChange() {
  const select = document.getElementById('classSelect');
  if (select.value) {
    selectedClass = JSON.parse(select.value);
    loadSchedule();
  } else {
    selectedClass = null;
    renderEmptyView();
  }
}

async function loadSchedule() {
  if (!selectedClass) {
    renderEmptyView();
    return;
  }
  try {
    const res = await fetch(`/api/jadwal?kelas=${encodeURIComponent(selectedClass.kelas)}&divisi=${encodeURIComponent(selectedClass.divisi)}`);
    allSchedules = await res.json();
    renderSchedule();
  } catch (err) {
    console.error('Gagal memuat jadwal:', err);
  }
}

function renderSchedule() {
  const container = document.getElementById('scheduleContainer');
  container.innerHTML = '';

  DAYS.forEach(day => {
    const daySchedules = allSchedules.filter(s => s.hari === day);
    const dayCard = document.createElement('div');
    dayCard.className = 'bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col h-full transition-all duration-300 hover:-translate-y-1 hover:shadow-lg';

    let contentHtml = '';
    if (daySchedules.length === 0) {
      contentHtml = `
        <div class="flex-1 flex items-center justify-center py-8">
          <p class="text-sm text-slate-400 dark:text-slate-500 italic">Belum ada jadwal</p>
        </div>
      `;
    } else {
      contentHtml = `
        <ul class="space-y-3 flex-1">
          ${daySchedules.map((item, idx) => `
            <li class="bg-slate-50 dark:bg-slate-700/50 border border-slate-100 dark:border-slate-700 p-3 rounded-xl flex items-center justify-between group hover:border-slate-400 dark:hover:border-slate-500 hover:shadow transition">
              <div class="text-sm font-medium text-slate-700 dark:text-slate-200 leading-snug">
                <span class="font-bold text-slate-900 dark:text-white">${idx + 1}.</span> ${escapeHtml(item.mapel)} <span class="text-xs text-indigo-600 dark:text-indigo-400 font-semibold">(${item.jp}JP)</span>
              </div>
              <div class="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onclick="openEditModal(${item.id})" title="Edit" class="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 p-1">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                </button>
                <button onclick="deleteSchedule(${item.id})" title="Hapus" class="text-slate-400 hover:text-red-600 dark:hover:text-red-400 p-1">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                </button>
              </div>
            </li>
          `).join('')}
        </ul>
      `;
    }

    dayCard.innerHTML = `
      <div class="flex justify-between items-center mb-4 pb-2 border-b border-slate-100 dark:border-slate-700">
        <div>
          <h2 class="font-bold text-base text-slate-800 dark:text-white">${day}</h2>
          <span class="text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-semibold px-2 py-0.5 rounded-full">${daySchedules.length} Mapel</span>
        </div>
        <button onclick="openAddModalForDay('${day}')" class="text-xs bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 font-bold px-2.5 py-1.5 rounded-lg transition" title="Tambah Mapel di hari ${day}">
          + Tambah
        </button>
      </div>
      ${contentHtml}
    `;

    container.appendChild(dayCard);
  });
}

function renderEmptyView() {
  const container = document.getElementById('scheduleContainer');
  container.innerHTML = `
    <div class="col-span-full bg-white dark:bg-slate-800 rounded-2xl p-12 text-center border border-slate-200 dark:border-slate-700 shadow-sm transition-colors">
      <p class="text-slate-400 dark:text-slate-400 font-medium text-base mb-2">Pilih kelas di atas atau tambahkan jadwal baru.</p>
      <button onclick="openAddModal()" class="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-semibold text-sm underline">
        + Buat Jadwal Pertama
      </button>
    </div>
  `;
}

function onModalClassChange(selectedDivisiVal = '') {
  const kelasSelect = document.getElementById('inputKelas');
  const divisiSelect = document.getElementById('inputDivisi');
  const val = kelasSelect.value;

  divisiSelect.innerHTML = '<option value="">-- Pilih Divisi --</option>';

  if (!val) {
    divisiSelect.disabled = true;
    divisiSelect.classList.add('bg-slate-100', 'dark:bg-slate-700/50', 'disabled:opacity-60');
    divisiSelect.classList.remove('bg-white', 'dark:bg-slate-700');
  } else {
    divisiSelect.disabled = false;
    divisiSelect.classList.remove('bg-slate-100', 'dark:bg-slate-700/50', 'disabled:opacity-60');
    divisiSelect.classList.add('bg-white', 'dark:bg-slate-700');

    DIVISIONS.forEach(div => {
      const opt = document.createElement('option');
      opt.value = div;
      opt.textContent = div;
      if (div === selectedDivisiVal) opt.selected = true;
      divisiSelect.appendChild(opt);
    });
  }
}

function addSubjectRow(mapelVal = '', jpVal = '') {
  const container = document.getElementById('subjectRowsContainer');
  const rowId = 'row_' + Math.random().toString(36).substr(2, 9);
  const rowDiv = document.createElement('div');
  rowDiv.className = 'flex items-center gap-2 bg-slate-50 dark:bg-slate-700/50 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700';
  rowDiv.id = rowId;

  rowDiv.innerHTML = `
    <div class="flex-1">
      <input type="text" placeholder="Nama Mata Pelajaran" value="${mapelVal}" required class="subject-input w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500">
    </div>
    <div class="w-24">
      <input type="number" min="1" max="2" placeholder="JP" value="${jpVal}" required class="jp-input w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500">
    </div>
    <button type="button" onclick="document.getElementById('${rowId}').remove()" class="text-slate-400 hover:text-red-600 dark:hover:text-red-400 p-1 font-bold">
      &times;
    </button>
  `;
  container.appendChild(rowDiv);
}

function openAddModal() {
  document.getElementById('modalTitle').textContent = 'Tambah Jadwal Pelajaran';
  document.getElementById('editId').value = '';

  // Form kosong: tidak auto-fill dari kelas yang sedang dipilih
  document.getElementById('inputKelas').value = '';
  onModalClassChange('');
  document.getElementById('inputHari').value = 'Senin';

  document.getElementById('subjectRowsContainer').innerHTML = '';
  addSubjectRow();

  document.getElementById('scheduleModal').classList.remove('hidden');
  document.getElementById('scheduleModal').classList.add('flex');
}

function openAddModalForDay(day) {
  document.getElementById('modalTitle').textContent = 'Tambah Jadwal Pelajaran';
  document.getElementById('editId').value = '';

  // Auto-fill dari kelas/divisi yang sedang dipilih + hari dari card
  const initialKelas = selectedClass ? selectedClass.kelas : '';
  const initialDivisi = selectedClass ? selectedClass.divisi : '';

  document.getElementById('inputKelas').value = initialKelas;
  onModalClassChange(initialDivisi);
  document.getElementById('inputHari').value = day;

  document.getElementById('subjectRowsContainer').innerHTML = '';
  addSubjectRow();

  document.getElementById('scheduleModal').classList.remove('hidden');
  document.getElementById('scheduleModal').classList.add('flex');
}

function openEditModal(id) {
  const schedule = allSchedules.find(s => s.id === id);
  if (!schedule) return;

  document.getElementById('modalTitle').textContent = 'Edit Jadwal Pelajaran';
  document.getElementById('editId').value = schedule.id;
  document.getElementById('inputKelas').value = schedule.kelas;
  onModalClassChange(schedule.divisi);
  document.getElementById('inputHari').value = schedule.hari;

  document.getElementById('subjectRowsContainer').innerHTML = '';
  addSubjectRow(schedule.mapel, schedule.jp);

  document.getElementById('scheduleModal').classList.remove('hidden');
  document.getElementById('scheduleModal').classList.add('flex');
}

function closeModal() {
  document.getElementById('scheduleModal').classList.remove('flex');
  document.getElementById('scheduleModal').classList.add('hidden');
}

async function handleFormSubmit(event) {
  event.preventDefault();
  const id = document.getElementById('editId').value;
  const kelas = document.getElementById('inputKelas').value;
  const divisi = document.getElementById('inputDivisi').value;
  const hari = document.getElementById('inputHari').value;

  const subjectRows = document.querySelectorAll('#subjectRowsContainer > div');
  if (subjectRows.length === 0) {
    alert('Minimal masukkan 1 mata pelajaran.');
    return;
  }

  try {
    if (id) {
      const mapelInput = subjectRows[0].querySelector('.subject-input').value;
      const jpInput = subjectRows[0].querySelector('.jp-input').value;
      const data = { kelas, divisi, hari, mapel: mapelInput, jp: parseInt(jpInput) };

      await fetch(`/api/jadwal/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
    } else {
      const payload = [];
      subjectRows.forEach(row => {
        const mapel = row.querySelector('.subject-input').value;
        const jp = row.querySelector('.jp-input').value;
        if (mapel && jp) {
          payload.push({ kelas, divisi, hari, mapel, jp: parseInt(jp) });
        }
      });

      await fetch('/api/jadwal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    }

    selectedClass = { kelas, divisi };
    closeModal();
    await loadClasses();
  } catch (err) {
    alert('Gagal menyimpan data: ' + err.message);
  }
}

async function deleteSchedule(id) {
  if (!confirm('Hapus jadwal pelajaran ini?')) return;
  try {
    await fetch(`/api/jadwal/${id}`, { method: 'DELETE' });
    await loadClasses();
  } catch (err) {
    alert('Gagal menghapus: ' + err.message);
  }
}

function escapeHtml(str) {
  return str.replace(/[&<>"']/g, match => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[match]));
}

// ============ TUGAS TRACKER ============

function statusBadgeClass(status) {
  if (status === 'selesai') return 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800';
  if (status === 'proses') return 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800';
  return 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800';
}

function statusLabel(status) {
  if (!status) return '-';
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function formatDeadline(val) {
  if (!val) return '-';
  const d = new Date(val);
  if (isNaN(d.getTime())) return escapeHtml(String(val));
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

function deadlineCountdown(val) {
  if (!val) return null;
  const d = new Date(val);
  if (isNaN(d.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const days = Math.round((target - today) / (24 * 60 * 60 * 1000));
  if (days < 0) return { text: `Terlambat ${-days} hari`, late: true };
  if (days === 0) return { text: 'Hari ini', late: false };
  if (days === 1) return { text: 'Besok', late: false };
  return { text: `${days} hari lagi`, late: false };
}

function toDatetimeLocalValue(val) {
  if (!val) return '';
  const d = new Date(val);
  if (isNaN(d.getTime())) return '';
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function getTugasFilter() {
  const classSel = document.getElementById('tugasClassSelect');
  const statusSel = document.getElementById('tugasStatusSelect');
  let kelas = '', divisi = '';
  if (classSel && classSel.value) {
    try {
      const parsed = JSON.parse(classSel.value);
      kelas = parsed.kelas || '';
      divisi = parsed.divisi || '';
    } catch (e) { /* abaikan */ }
  }
  return { kelas, divisi, status: statusSel ? statusSel.value : '' };
}

function onTugasFilterChange() {
  loadTugas();
}

async function loadTugas() {
  const { kelas, divisi, status } = getTugasFilter();
  const params = new URLSearchParams();
  if (kelas) params.append('kelas', kelas);
  if (divisi) params.append('divisi', divisi);
  if (status) params.append('status', status);
  try {
    const res = await fetch(`/api/tugas?${params.toString()}`);
    allTugas = await res.json();
    allTugas.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
    renderTugas();
  } catch (err) {
    console.error('Gagal memuat tugas:', err);
  }
  updateTugasBadge();
}

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

function renderTugas() {
  const container = document.getElementById('tugasContainer');
  if (!container) return;
  container.innerHTML = '';

  if (allTugas.length === 0) {
    container.innerHTML = `
      <div class="col-span-full bg-white dark:bg-slate-800 rounded-2xl p-12 text-center border border-slate-200 dark:border-slate-700 shadow-sm transition-colors">
        <p class="text-slate-400 dark:text-slate-400 font-medium text-base mb-2">Belum ada tugas. Tambahkan tugas pertama untuk kelas ini.</p>
        <button onclick="openTugasModal()" class="text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 font-semibold text-sm underline">
          + Buat Tugas Pertama
        </button>
      </div>
    `;
    return;
  }

  // Kelompokkan tugas per mapel (urut kemunculan = urut deadline terdekat)
  const groups = [];
  const groupMap = {};
  allTugas.forEach(item => {
    const key = (item.mapel && item.mapel.trim() !== '') ? item.mapel : 'Tanpa mapel';
    if (!groupMap[key]) {
      groupMap[key] = [];
      groups.push(key);
    }
    groupMap[key].push(item);
  });

  groups.forEach(mapel => {
    const items = groupMap[mapel];
    const section = document.createElement('div');
    section.className = 'col-span-full';
    section.innerHTML = `
      <div class="flex items-center gap-3 mb-4 mt-2">
        <h2 class="font-bold text-base text-slate-800 dark:text-white">${escapeHtml(mapel)}</h2>
        <span class="text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-semibold px-2 py-0.5 rounded-full">${items.length} Tugas</span>
        <div class="flex-1 border-t border-slate-200 dark:border-slate-700"></div>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        ${items.map(tugasCardHtml).join('')}
      </div>
    `;
    container.appendChild(section);
  });
}

function tugasCardHtml(item) {
  const nextStatus = item.status === 'belum' ? 'proses' : (item.status === 'proses' ? 'selesai' : null);
  return `
    <div class="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col h-full transition-all duration-300 hover:-translate-y-1 hover:shadow-lg group">
      <div class="flex justify-between items-start gap-2 mb-3">
        <span class="text-xs font-bold px-2.5 py-1 rounded-full ${statusBadgeClass(item.status)}">${escapeHtml(statusLabel(item.status))}</span>
        <div class="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          ${nextStatus ? `<button onclick="advanceTugasStatus(${item.id}, '${nextStatus}')" title="Ubah ke ${statusLabel(nextStatus)}" class="text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 p-1">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 9l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          </button>` : ''}
          <button onclick="openEditTugasModal(${item.id})" title="Edit" class="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 p-1">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
          </button>
          <button onclick="deleteTugas(${item.id})" title="Hapus" class="text-slate-400 hover:text-red-600 dark:hover:text-red-400 p-1">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
          </button>
        </div>
      </div>
      <h3 class="font-bold text-base text-slate-900 dark:text-white leading-snug mb-1">${escapeHtml(item.judul || '-')}</h3>
      <p class="text-xs text-indigo-600 dark:text-indigo-400 font-semibold mb-2">${escapeHtml(item.mapel || 'Tanpa mapel')}${item.kelas ? ` &bull; ${escapeHtml(item.kelas)}-${escapeHtml(item.divisi || '')}` : ''}</p>
      ${item.deskripsi ? `<p class="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-3">${escapeHtml(item.deskripsi)}</p>` : ''}
      <div class="mt-auto pt-3 border-t border-slate-100 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400">
        Deadline: <span class="font-semibold text-slate-700 dark:text-slate-200">${formatDeadline(item.deadline)}</span>
        ${(() => { const cd = deadlineCountdown(item.deadline); return cd ? `<span class="ml-1 font-semibold ${cd.late ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}">&bull; ${cd.text}</span>` : ''; })()}
      </div>
    </div>
  `;
}

function onTugasModalClassChange(selectedDivisiVal = '') {
  const kelasSelect = document.getElementById('inputTugasKelas');
  const divisiSelect = document.getElementById('inputTugasDivisi');
  if (!kelasSelect || !divisiSelect) return;
  const val = kelasSelect.value;

  divisiSelect.innerHTML = '<option value="">-- Pilih Divisi --</option>';

  if (!val) {
    divisiSelect.disabled = true;
    divisiSelect.classList.add('bg-slate-100', 'dark:bg-slate-700/50', 'disabled:opacity-60');
    divisiSelect.classList.remove('bg-white', 'dark:bg-slate-700');
  } else {
    divisiSelect.disabled = false;
    divisiSelect.classList.remove('bg-slate-100', 'dark:bg-slate-700/50', 'disabled:opacity-60');
    divisiSelect.classList.add('bg-white', 'dark:bg-slate-700');
    DIVISIONS.forEach(div => {
      const opt = document.createElement('option');
      opt.value = div;
      opt.textContent = div;
      if (div === selectedDivisiVal) opt.selected = true;
      divisiSelect.appendChild(opt);
    });
  }
}

function openTugasModal() {
  document.getElementById('tugasModalTitle').textContent = 'Tambah Tugas';
  document.getElementById('editTugasId').value = '';
  document.getElementById('inputTugasKelas').value = '';
  onTugasModalClassChange('');
  document.getElementById('inputTugasMapel').value = '';
  document.getElementById('inputTugasJudul').value = '';
  document.getElementById('inputTugasDeskripsi').value = '';
  document.getElementById('inputTugasDeadline').value = '';
  document.getElementById('inputTugasStatus').value = 'belum';
  document.getElementById('tugasModal').classList.remove('hidden');
  document.getElementById('tugasModal').classList.add('flex');
}

function openEditTugasModal(id) {
  const tugas = allTugas.find(t => t.id === id);
  if (!tugas) return;
  document.getElementById('tugasModalTitle').textContent = 'Edit Tugas';
  document.getElementById('editTugasId').value = tugas.id;
  document.getElementById('inputTugasKelas').value = tugas.kelas || '';
  onTugasModalClassChange(tugas.divisi || '');
  document.getElementById('inputTugasMapel').value = tugas.mapel || '';
  document.getElementById('inputTugasJudul').value = tugas.judul || '';
  document.getElementById('inputTugasDeskripsi').value = tugas.deskripsi || '';
  document.getElementById('inputTugasDeadline').value = toDatetimeLocalValue(tugas.deadline);
  document.getElementById('inputTugasStatus').value = tugas.status || 'belum';
  document.getElementById('tugasModal').classList.remove('hidden');
  document.getElementById('tugasModal').classList.add('flex');
}

function closeTugasModal() {
  document.getElementById('tugasModal').classList.remove('flex');
  document.getElementById('tugasModal').classList.add('hidden');
}

async function handleTugasFormSubmit(event) {
  event.preventDefault();
  const id = document.getElementById('editTugasId').value;
  const data = {
    kelas: document.getElementById('inputTugasKelas').value,
    divisi: document.getElementById('inputTugasDivisi').value,
    mapel: document.getElementById('inputTugasMapel').value,
    judul: document.getElementById('inputTugasJudul').value,
    deskripsi: document.getElementById('inputTugasDeskripsi').value,
    deadline: document.getElementById('inputTugasDeadline').value,
    status: document.getElementById('inputTugasStatus').value
  };
  try {
    if (id) {
      await fetch(`/api/tugas/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
    } else {
      await fetch('/api/tugas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
    }
    closeTugasModal();
    await loadClasses();
    await loadTugas();
  } catch (err) {
    alert('Gagal menyimpan tugas: ' + err.message);
  }
}

async function advanceTugasStatus(id, nextStatus) {
  try {
    await fetch(`/api/tugas/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: nextStatus })
    });
    await loadTugas();
  } catch (err) {
    alert('Gagal mengubah status: ' + err.message);
  }
}

async function deleteTugas(id) {
  if (!confirm('Hapus tugas ini?')) return;
  try {
    await fetch(`/api/tugas/${id}`, { method: 'DELETE' });
    await loadTugas();
  } catch (err) {
    alert('Gagal menghapus tugas: ' + err.message);
  }
}

function generateTugasAPIURL() {
  const kelas = document.getElementById('apiTugasKelas').value;
  const divisi = document.getElementById('apiTugasDivisi').value;
  const h = document.getElementById('apiTugasH').value;

  const host = window.location.origin;
  const params = new URLSearchParams();
  if (kelas) params.append('kelas', kelas);
  if (divisi) params.append('divisi', divisi);
  if (h && String(h).trim() !== '') params.append('h', String(h).trim());

  const url = `${host}/api/tugas/export${params.toString() ? '?' + params.toString() : ''}`;
  document.getElementById('apiTugasURLInput').value = url;
}

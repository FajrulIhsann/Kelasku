const DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];
let currentClasses = [];
let selectedClass = null; // { kelas: 'XII', divisi: 'C' }
let allSchedules = [];

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  loadClasses();
});

async function loadClasses() {
  try {
    const res = await fetch('/api/kelas');
    currentClasses = await res.json();
    const select = document.getElementById('classSelect');
    if (!select) return;
    select.innerHTML = '<option value="">-- Pilih Kelas --</option>';

    currentClasses.forEach(item => {
      const option = document.createElement('option');
      option.value = JSON.stringify({ kelas: item.kelas, divisi: item.divisi });
      option.textContent = `${item.kelas}-${item.divisi}`;
      select.appendChild(option);
    });
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
  if (!container) return;
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
  if (!container) return;
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

function addSubjectRow(mapelVal = '', jpVal = '') {
  const container = document.getElementById('subjectRowsContainer');
  if (!container) return;
  const rowId = 'row_' + Math.random().toString(36).substr(2, 9);
  const rowDiv = document.createElement('div');
  rowDiv.className = 'flex items-center gap-2 bg-slate-50 dark:bg-slate-700/50 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700';
  rowDiv.id = rowId;

  rowDiv.innerHTML = `
    <div class="flex-1">
      <input type="text" placeholder="Nama Mata Pelajaran" value="${escapeHtml(mapelVal)}" required class="subject-input w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500">
    </div>
    <div class="w-24">
      <input type="number" min="1" max="2" placeholder="JP" value="${escapeHtml(String(jpVal))}" required class="jp-input w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500">
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

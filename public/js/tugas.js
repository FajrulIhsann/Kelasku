const TUGAS_STATUS_ORDER = { belum: 0, proses: 1, selesai: 2 };
let allTugas = [];

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  loadTugasClasses();
});

function sortTugas(list) {
  list.sort((a, b) => {
    const wa = TUGAS_STATUS_ORDER[a.status] ?? 99;
    const wb = TUGAS_STATUS_ORDER[b.status] ?? 99;
    if (wa !== wb) return wa - wb;
    return new Date(a.deadline) - new Date(b.deadline);
  });
}

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

async function loadTugasClasses() {
  try {
    const res = await fetch('/api/kelas');
    const currentClasses = await res.json();
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
  } catch (err) {
    console.error('Gagal mengambil daftar kelas:', err);
  }
  loadTugas();
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
    sortTugas(allTugas);
    renderTugas();
  } catch (err) {
    console.error('Gagal memuat tugas:', err);
  }
  updateTugasBadge();
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

  // Kelompokkan tugas per mapel (urut kemunculan = urut status belum > proses > selesai, lalu deadline)
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
    await loadTugasClasses();
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

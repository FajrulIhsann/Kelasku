let dashClass = null;

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  startLiveClock();
  loadDashClasses();
});

function startLiveClock() {
  const el = document.getElementById('liveClock');
  if (!el) return;
  function tick() {
    try {
      const now = new Date();
      const datePart = new Intl.DateTimeFormat('id-ID', { timeZone: 'Asia/Jakarta', weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' }).format(now);
      const timePart = new Intl.DateTimeFormat('id-ID', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).format(now).replace(/\./g, ':');
      el.textContent = `${datePart} • ${timePart} WIB`;
    } catch (e) {
      el.textContent = new Date().toLocaleString('id-ID');
    }
  }
  tick();
  setInterval(tick, 1000);
}

async function loadDashClasses() {
  try {
    const res = await fetch('/api/kelas');
    const list = await res.json();
    const select = document.getElementById('dashClassSelect');
    select.innerHTML = '<option value="">-- Pilih Kelas --</option>';
    list.forEach(item => {
      const opt = document.createElement('option');
      opt.value = JSON.stringify({ kelas: item.kelas, divisi: item.divisi });
      opt.textContent = `${item.kelas}-${item.divisi}`;
      select.appendChild(opt);
    });

    // Pulihkan favorit dari browser (dibagi dengan halaman lain jika ada)
    try {
      const saved = localStorage.getItem('kelasku_kelas');
      if (saved) {
        dashClass = JSON.parse(saved);
        select.value = saved;
      } else if (list.length > 0) {
        dashClass = { kelas: list[0].kelas, divisi: list[0].divisi };
        select.value = JSON.stringify(dashClass);
      }
    } catch (e) {
      if (list.length > 0) dashClass = { kelas: list[0].kelas, divisi: list[0].divisi };
    }

    if (dashClass) loadDashboard();
    else renderEmptyState();
  } catch (err) {
    console.error('Gagal memuat kelas:', err);
  }
  updateTugasBadge();
}

function onDashClassChange() {
  const select = document.getElementById('dashClassSelect');
  if (!select.value) {
    dashClass = null;
    localStorage.removeItem('kelasku_kelas');
    renderEmptyState();
    return;
  }
  dashClass = JSON.parse(select.value);
  localStorage.setItem('kelasku_kelas', select.value);
  loadDashboard();
}

async function loadDashboard(force) {
  if (!dashClass) { renderEmptyState(); return; }
  setSubtitle('Memuat data ' + dashClass.kelas + '-' + dashClass.divisi + '...');
  try {
    const res = await fetch(`/api/dashboard?kelas=${encodeURIComponent(dashClass.kelas)}&divisi=${encodeURIComponent(dashClass.divisi)}`);
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    renderDashboard(data);
    if (force) showToast('Dashboard diperbarui');
  } catch (err) {
    setSubtitle('Gagal memuat: ' + err.message);
  }
  updateTugasBadge();
}

function setSubtitle(t) {
  const el = document.getElementById('dashboardSubtitle');
  if (el) el.textContent = t;
}

function renderEmptyState() {
  setSubtitle('Pilih kelas dulu untuk melihat ringkasan harian.');
  document.getElementById('statCards').innerHTML = '';
  const ft = document.getElementById('fokusTitle');
  if (ft) ft.textContent = 'Jadwal';
  const fb = document.getElementById('fokusBadge');
  if (fb) fb.innerHTML = '<span>HARI INI</span>';
  document.getElementById('fokusSchedule').innerHTML = emptyBox('Pilih kelas di atas.');
  document.getElementById('todayTasks').innerHTML = '';
  document.getElementById('upcomingTasks').innerHTML = '';
}

function emptyBox(msg) {
  return `<div class="py-8 text-center"><p class="text-sm text-slate-400 italic">${escapeHtml(msg)}</p></div>`;
}

function renderDashboard(d) {
  const label = `${d.kelas} • ${d.server_time_wib}`;
  setSubtitle(label);

  // Tentukan fokus: pakai dari backend, fallback hitung di frontend (cutoff 15:00 WIB)
  let fokus = d.fokus;
  if (!fokus || !fokus.hari) {
    try {
      const wibHour = parseInt(new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Jakarta', hour: 'numeric', hour12: false }).format(new Date()), 10);
      const isBesok = d.today.libur || wibHour >= 15;
      fokus = isBesok
        ? { hari: d.tomorrow.hari, label: 'besok', jadwal: d.tomorrow.jadwal, libur: false }
        : { hari: d.today.hari, label: 'hari ini', jadwal: d.today.jadwal, libur: false };
    } catch (e) {
      fokus = { hari: d.today.hari || d.tomorrow.hari, label: 'hari ini', jadwal: d.today.jadwal, libur: !!d.today.libur };
    }
  }

  const isBesok = fokus.label === 'besok';
  const fokusTitle = document.getElementById('fokusTitle');
  if (fokusTitle) fokusTitle.textContent = isBesok ? `Jadwal Hari ${fokus.hari}` : `Jadwal Hari Ini ${fokus.hari}`;
  const fokusBadge = document.getElementById('fokusBadge');
  if (fokusBadge) {
    fokusBadge.innerHTML = isBesok
      ? icon('logo', 'w-3 h-3') + '<span>BESOK</span>'
      : '<span>HARI INI</span>';
    fokusBadge.className = 'inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ' + (isBesok
      ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'
      : 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300');
  }

  // Stat cards
  const stats = [
    { label: 'Mapel Hari Ini', value: d.stats.jadwal_hari_ini, accent: 'indigo' },
    { label: 'Tugas Deadline Hari Ini', value: d.stats.tugas_hari_ini, accent: 'emerald' },
    { label: 'Tugas Terlambat', value: d.stats.tugas_terlambat, accent: 'red' },
    { label: 'Belum Selesai', value: d.stats.belum_selesai, accent: 'amber' },
  ];
  document.getElementById('statCards').innerHTML = stats.map(s => `
    <div class="rounded-2xl p-5 border shadow-sm bg-white dark:bg-slate-800 ${accentBorder(s.accent)}">
      <p class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">${s.label}</p>
      <p class="text-3xl font-bold mt-1 ${accentText(s.accent)}">${s.value}</p>
    </div>
  `).join('');

  // Jadwal fokus (1 kartu)
  document.getElementById('fokusSchedule').innerHTML = scheduleListHtml(fokus.jadwal);

  // Tugas hari ini = overdue + today
  const urgent = [...d.tugas.overdue.map(t => ({ ...t, _flag: 'terlambat' })), ...d.tugas.today.map(t => ({ ...t, _flag: 'hari ini' }))];
  const box = document.getElementById('todayTasks');
  if (urgent.length === 0) {
    box.innerHTML = `<div class="col-span-full py-8 text-center"><p class="text-2xl mb-1">✅</p><p class="text-sm text-slate-500">Tidak ada tugas jatuh tempo hari ini. Aman!</p></div>`;
  } else {
    box.innerHTML = urgent.map(taskCardHtml).join('');
  }

  // Mendesak berikutnya
  const next = [...d.tugas.tomorrow.map(t => ({ ...t, _flag: 'besok' })), ...d.tugas.upcoming_3hari.map(t => ({ ...t, _flag: '≤3 hari' }))];
  const up = document.getElementById('upcomingTasks');
  up.innerHTML = next.length === 0
    ? `<p class="text-sm text-slate-400 italic py-4 text-center">Tidak ada tugas dalam 3 hari ke depan. 🎉</p>`
    : next.slice(0, 6).map(t => `
      <div class="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-100 dark:border-slate-700">
        <div class="min-w-0">
          <p class="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">${escapeHtml(t.judul || '-')}</p>
          <p class="text-xs text-slate-500 dark:text-slate-400">${escapeHtml(t.mapel || 'Tanpa mapel')} • ${formatDateID(t.deadline)} • <span class="font-semibold">${escapeHtml(t._flag)}</span></p>
        </div>
        <button onclick="quickDone(${t.id})" title="Tandai selesai" class="shrink-0 text-xs font-bold px-3 py-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-900/60 transition">✓</button>
      </div>`).join('');
}

function accentBorder(a) {
  return { indigo: 'border-indigo-200 dark:border-indigo-900', emerald: 'border-emerald-200 dark:border-emerald-900', red: 'border-red-200 dark:border-red-900', amber: 'border-amber-200 dark:border-amber-900' }[a] || 'border-slate-200 dark:border-slate-700';
}
function accentText(a) {
  return { indigo: 'text-indigo-600 dark:text-indigo-400', emerald: 'text-emerald-600 dark:text-emerald-400', red: 'text-red-600 dark:text-red-400', amber: 'text-amber-600 dark:text-amber-400' }[a] || '';
}

function scheduleListHtml(list) {
  if (!list || list.length === 0) return emptyBox('Belum ada jadwal.');
  return `<ul class="space-y-3">` + list.map((s, i) => `
    <li class="bg-slate-50 dark:bg-slate-700/50 border border-slate-100 dark:border-slate-700 p-3 rounded-xl flex items-center justify-between">
      <span class="text-sm font-medium text-slate-700 dark:text-slate-200"><span class="font-bold text-slate-900 dark:text-white">${i + 1}.</span> ${escapeHtml(s.mapel)}</span>
      <span class="text-xs text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50 dark:bg-indigo-900/40 px-2 py-1 rounded-lg">${s.jp} JP</span>
    </li>`).join('') + `</ul>`;
}

function taskCardHtml(t) {
  const late = t._flag === 'terlambat';
  return `
    <div class="p-4 rounded-2xl border shadow-sm bg-white dark:bg-slate-800 ${late ? 'border-red-300 dark:border-red-800' : 'border-slate-200 dark:border-slate-700'}">
      <div class="flex items-center gap-2 mb-2">
        <span class="text-[11px] font-bold px-2 py-0.5 rounded-full ${late ? 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300' : 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'}">${late ? 'TERLAMBAT' : 'HARI INI'}</span>
        <span class="text-[11px] text-slate-400">${escapeHtml(t.status || '')}</span>
      </div>
      <p class="text-sm font-bold text-slate-900 dark:text-white leading-snug">${escapeHtml(t.judul || '-')}</p>
      <p class="text-xs text-indigo-600 dark:text-indigo-400 font-semibold mb-1">${escapeHtml(t.mapel || 'Tanpa mapel')}</p>
      ${t.deskripsi ? `<p class="text-xs text-slate-500 dark:text-slate-400 mb-2 line-clamp-2">${escapeHtml(t.deskripsi)}</p>` : ''}
      <div class="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 dark:border-slate-700">
        <span class="text-xs text-slate-500">⏰ ${formatDateID(t.deadline)}</span>
        <button onclick="quickDone(${t.id})" class="text-xs font-bold px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition">Selesai ✓</button>
      </div>
    </div>`;
}

function formatDateID(v) {
  if (!v) return '-';
  const d = new Date(v);
  if (isNaN(d.getTime())) return String(v);
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'long' });
}

async function quickDone(id) {
  try {
    await fetch(`/api/tugas/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'selesai' }) });
    showToast('Tugas selesai 🎉');
    loadDashboard();
  } catch (err) {
    alert('Gagal: ' + err.message);
  }
}

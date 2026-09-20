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

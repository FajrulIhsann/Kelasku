document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initApiPageOptions();
  updateTugasBadge();
});

function initApiPageOptions() {
  fillDivisiOptions(document.getElementById('apiDivisi'));
  fillDivisiOptions(document.getElementById('apiTugasDivisi'));
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

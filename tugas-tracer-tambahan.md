Saya sudah membuat halaman "Tugas" di project jadwal-pelajaran (Express.js + MySQL 
+ Tailwind CSS), lengkap dengan:
- Tabel `tugas` di database
- Endpoint /api/tugas (GET, POST, PUT, DELETE) dan /api/tugas/export
- Menu "Tugas" di sidebar navigasi
- Halaman list tugas dengan card per tugas

Sebelum lanjut, tolong cek dulu isi app.js dan index.html yang sudah ada, 
khususnya bagian:
- Sidebar navigasi (menu Beranda / Tugas / API)
- Fungsi fetch data tugas yang sudah berjalan
- Struktur badge/indikator yang mungkin sudah ada di menu Tugas

Setelah itu, tolong UPDATE (bukan buat ulang dari nol) tampilan badge di menu 
"Tugas" pada sidebar, dengan spesifikasi:

1. BADGE SPLIT DUA WARNA
   - Dua angka berdampingan dalam satu pill:
     - Merah = jumlah tugas status 'belum'
     - Kuning = jumlah tugas status 'proses'
   - Status 'selesai' tidak dihitung
   - Kalau kedua angka 0, badge disembunyikan total

2. INDIKATOR URGENSI
   - Cek tugas status 'belum' dengan deadline dalam 24 jam ke depan
   - Kalau ada, badge merah dikasih animasi pulse pelan (durasi ~2s, jangan 
     terlalu mencolok)
   - Kalau tidak ada yang mendesak, badge statis tanpa animasi

3. INTEGRASI DENGAN KODE YANG SUDAH ADA
   - Manfaatkan fungsi fetch tugas yang sudah ada, jangan bikin fetch terpisah 
     baru kalau tidak perlu
   - Refresh badge otomatis tiap kali data tugas berubah (tambah/edit/hapus/
     ubah status) — sambungkan ke fungsi render/update yang sudah berjalan
   - Ikuti struktur styling dan penamaan class yang sudah dipakai di project ini
   - Pastikan tampilan tetap konsisten di light mode dan dark mode

Tunjukkan diff/perubahan spesifik pada bagian app.js dan index.html yang relevan, 
tidak perlu tulis ulang seluruh file.

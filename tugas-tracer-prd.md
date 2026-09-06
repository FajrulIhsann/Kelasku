Saya punya project Express.js + MySQL + Tailwind CSS bernama "jadwal-pelajaran" 
dengan struktur berikut:
- server.js: Express API + koneksi MySQL, auto-create DB & tabel jika belum ada
- public/index.html: UI dengan sidebar navigasi (Beranda / API), dark mode, modal
- public/app.js: fetch API, render data, modal tambah/edit/hapus, toast notifikasi

Tabel yang sudah ada:
CREATE TABLE jadwal (
  id INT AUTO_INCREMENT PRIMARY KEY,
  kelas VARCHAR(20),
  divisi VARCHAR(20),
  hari ENUM('Senin','Selasa','Rabu','Kamis','Jumat'),
  mapel VARCHAR(100),
  jp INT
);

Tolong tambahkan fitur "Tugas Tracker" ke project ini, dengan spesifikasi:

1. TABEL BARU (tambahkan ke logic auto-init CREATE TABLE IF NOT EXISTS di server.js):
CREATE TABLE tugas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  kelas VARCHAR(20),
  divisi VARCHAR(20),
  mapel VARCHAR(100),
  judul VARCHAR(200),
  deskripsi TEXT,
  deadline DATETIME,
  status ENUM('belum','proses','selesai') DEFAULT 'belum',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

2. ENDPOINT API BARU (ikuti pola endpoint /api/jadwal yang sudah ada):
- GET  /api/tugas?kelas=&divisi=&status=        -> list tugas, filter opsional
- GET  /api/tugas/export?kelas=&divisi=&h=1     -> untuk kebutuhan n8n:
    parameter h = jumlah hari sebelum deadline (h=1 berarti deadline besok,
    h=3 berarti deadline dalam 3 hari ke depan). Jika h tidak diisi, 
    kembalikan semua tugas dengan status != 'selesai', diurutkan deadline ASC.
    Response digrup per mapel, format mirip /api/jadwal/export.
- POST   /api/tugas       -> tambah tugas baru (single atau batch)
- PUT    /api/tugas/:id   -> update tugas (termasuk update status saja)
- DELETE /api/tugas/:id   -> hapus tugas

3. FRONTEND:
- Tambahkan menu "Tugas" di sidebar navigasi, sejajar dengan "Beranda" dan "API"
- Halaman Tugas: list card per tugas, tampilkan judul, mapel, deadline, badge status
  (belum = merah, proses = kuning, selesai = hijau)
- Urutkan otomatis berdasarkan deadline terdekat
- Badge jumlah tugas belum selesai di sidebar (dekat menu Tugas)
- Modal tambah/edit tugas: input kelas, divisi, mapel, judul, deskripsi, deadline, status
- Tombol ubah status cepat (belum -> proses -> selesai) tanpa buka modal, mirip 
  pola edit/hapus per mapel yang sudah ada di jadwal (muncul saat hover)
- Tambahkan generator URL export tugas di halaman API, mirip generator export jadwal
  yang sudah ada, dengan opsi isi parameter h

4. KONSISTENSI:
- Ikuti gaya penamaan variabel dan struktur kode yang sudah ada di server.js dan app.js
- Gunakan dark mode class yang sama seperti komponen jadwal
- Toast notifikasi pakai komponen yang sama dengan "URL Copied"

Tolong tunjukkan perubahan pada server.js, app.js, dan index.html yang diperlukan.

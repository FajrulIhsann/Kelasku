# Aplikasi Manajemen Jadwal Pelajaran

Aplikasi web sederhana untuk mengelola daftar jadwal pelajaran sekolah dari hari Senin sampai Jumat, berbasis **Express.js** dan **MySQL**, serta antarmuka modern menggunakan **Tailwind CSS**.

---

## Fitur Utama
1. **Pilih Kelas**: Filter jadwal berdasarkan jenjang (X, XI, XII) dan divisi/bagian (A sampai I).
2. **Tampilan Harian (Senin - Jumat)**: Menampilkan daftar mata pelajaran secara terstruktur per hari dengan format `1. Mata Pelajaran (X JP)`.
3. **Pesan Kosong Otomatis**: Menampilkan *"Belum ada jadwal"* jika belum ada mata pelajaran di hari tersebut.
4. **Multi-Tambah Mapel**: Fitur tambah jadwal mendukung pengisian banyak mata pelajaran sekaligus dalam satu hari.
5. **Tombol Tambah per Hari**: Tombol cepat di setiap kartu hari untuk langsung menambah jadwal di hari tersebut dengan kelas/divisi yang otomatis terisi.
6. **Validasi JP**: Batasan Jam Pelajaran (JP) maksimal 2.
7. **Interaksi & Animasi**: Efek hover mengangkat kartu (*elevation*) serta tombol edit/aksi yang tersembunyi hingga kursor diarahkan ke item mapel.
8. **Dark Mode**: Fitur mode gelap/terang dengan tombol toggle di header dan penyimpanan preferensi otomatis.
9. **Koneksi Database Otomatis**: Aplikasi otomatis membuat database di MySQL jika belum tersedia saat pertama kali dijalankan.
10. **Tugas Tracker**: Menu Tugas di sidebar — list card per tugas (judul, mapel, deadline, badge status merah/kuning/hijau), urut deadline terdekat, badge jumlah belum selesai di sidebar, tombol ubah status cepat saat hover, modal tambah/edit, generator URL export tugas di halaman API.

---

## Prasyarat
- Node.js terinstal di komputer.
- MySQL server (XAMPP / MySQL Service) aktif.

---

## Cara Instalasi & Menjalankan

1. **Clone / Buka direktori proyek** di terminal.
2. **Installdependencies**:
   ```bash
   npm install
   ```
3. **Konfigurasi Database (`.env`)**:
   Salin file `.env.example` menjadi `.env` (atau buat baru) lalu sesuaikan dengan kredensial MySQL Anda:
   ```env
   PORT=3000
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=
   DB_NAME=jadwal_db
   ```
4. **Jalankan Aplikasi**:
   ```bash
   npm start
   ```
   Atau mode development dengan nodemon:
   ```bash
   npm run dev
   ```
5. Buka browser dan akses: `http://localhost:3000`

---

## Dokumentasi

- [Referensi REST API](docs/API.md) — endpoint jadwal, tugas, dan export untuk n8n.
- [Icon Helper](docs/ICON_HELPER.md) — cara pakai dan menambah ikon.
- [Theme](docs/THEME.md) — palet warna dan aturan UI.

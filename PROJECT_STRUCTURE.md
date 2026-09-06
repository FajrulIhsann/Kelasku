# Jadwal Pelajaran - Project Structure

Aplikasi web manajemen jadwal pelajaran berbasis **Express.js** + **MySQL** + **Tailwind CSS**.

---

## 📁 Struktur Direktori Utama (Root Level)

```
jadwal-pelajaran/
├── package.json          # Dependencies: express, mysql2, dotenv, tailwind
├── server.js             # Express API server & koneksi MySQL (otominit DB & tabel)
├── .env                # Konfigurasi kredensial database (isi sendiri)
├── .env.example        # Contoh konfigurasi .env
├── README.md             # Dokumentasi lengkap: fitur, instalasi, endpoint API
└── PROJECT_STRUCTURE.md # File ini (ringkasan struktur project)
└── public/
    ├── index.html        # Halaman UI lengkap (Tailwind CSS via CDN)
    └── app.js            # Logika frontend: fetch API, render jadwal, modal, dark mode, toast copy
```

---

## 📂 Struktur Direktori `public/`

```
public/
├── index.html            # Susunan halaman:
│   - Header dengan toggel dark mode & sidebar
│ - Filter kelas (dropdown X/XI/XII + divisi A-I)
│ - Grid jadwal Senin - Jumat (kartu + badge jumlah mapel)
│ - Tombol +Tambah Jadwal & +Tambah Mapel per hari
│ - Modal edit/tambah jadwal (multi-subject rows)
│ - Halaman API Generator (n8n export URL jadwal + tugas)
│ - Halaman Tugas (list card, filter kelas/status, badge, modal, status cepat)
│ - Sidebar navigasi (Beranda / Tugas / API)
│ - Toast notifikasi "URL Copied"
│ - Dark mode support + animasi hover
│ - Sidebar collapse/expand di mobile
└── app.js                # Logika JavaScript:
│   - fetch API ke server Express
│   - render jadwal per hari (filter kelas/divisi)
│   - fungsi modal tambah/edit/hapus
│   - fungsi multi-mapel per hari
│   - toggle sidebar & navigate section
│   - generate & copy URL API ke clipboard (jadwal + tugas)
│   - halaman Tugas: filter, render card, badge, modal, status cepat
│   - toast notifikasi muncul di tengah layar
│   - init theme (localStorage)
│   - validasi JP max 2
│   - ekspor data ke format grouped per hari
└────────────────────────────────────────────────────────────────────────────
```

---

## 🗄️ Database (MySQL)

Tabel `jadwal` (dibuat otomatis oleh server.js jika belum ada):

| Kolom | Tipe | Keterangan |
|-------|------|------------|
| `id` | INT AUTO_INCREMENT PRIMARY KEY | ID unik |
| `kelas` | VARCHAR(20) | Jenjang (X, XI, XII) |
| `divisi` | VARCHAR(20) | Bagian (A sampai I) |
| `hari` | ENUM('Senin','Selasa','Rabu','Kamis','Jumat') | Hari pelajaran |
| `mapel` | VARCHAR(100) | Nama mata pelajaran |
| `jp` | INT | Banyak Jam Pelajaran (1-2) |

Tabel `tugas` (dibuat otomatis oleh server.js jika belum ada):

| Kolom | Tipe | Keterangan |
|-------|------|------------|
| `id` | INT AUTO_INCREMENT PRIMARY KEY | ID unik |
| `kelas` | VARCHAR(20) | Jenjang (X, XI, XII) |
| `divisi` | VARCHAR(20) | Bagian (A sampai I) |
| `mapel` | VARCHAR(100) | Mata pelajaran terkait |
| `judul` | VARCHAR(200) | Judul tugas (wajib) |
| `deskripsi` | TEXT | Detail tugas (opsional) |
| `deadline` | DATETIME | Batas waktu (wajib) |
| `status` | ENUM('belum','proses','selesai') DEFAULT 'belum' | Status pengerjaan |
| `created_at` | TIMESTAMP DEFAULT CURRENT_TIMESTAMP | Waktu dibuat |

---

## 🔌 REST API Endpoints

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| `GET` | `/api/kelas` | Daftar kelas & divisi unik |
| `GET` | `/api/jadwal?kelas=XII&divisi=C` | Ambil jadwal berdasarkan kelas/divisi |
| `GET` | `/api/jadwal/export?kelas=XII&divisi=C` (opsional `&hari=Senin`) | Export untuk n8n/scraping — jika hari kosong → semua hari ter-grup |
| `POST` | `/api/jadwal` | Tambah jadwal (single atau batch multi-mapel) |
| `PUT` | `/api/jadwal/:id` | Update jadwal berdasarkan ID |
| `DELETE` | `/api/jadwal/:id` | Hapus jadwal berdasarkan ID |
| `GET` | `/api/tugas?kelas=&divisi=&status=` | List tugas, semua filter opsional, urut deadline ASC |
| `GET` | `/api/tugas/export?kelas=&divisi=&h=` | Export n8n, grup per mapel, status != selesai (h = hari sebelum deadline, opsional) |
| `POST` | `/api/tugas` | Tambah tugas (single atau batch) |
| `PUT` | `/api/tugas/:id` | Update tugas (field parsial, mis. status saja) |
| `DELETE` | `/api/tugas/:id` | Hapus tugas berdasarkan ID |

---

## 🚀 Cara Menjalankan

```bash
# 1. Install dependensi
npm install

# 2. Konfigurasi database
# Salin .env.example menjadi .env, isi DB_HOST, DB_USER, DB_PASSWORD, DB_NAME

# 3. Jalankan server
npm start       # atau: npm run dev (pakai nodemon)
```

Akses di browser: `http://localhost:3000`

---

## ✨ Fitur Utama

1. **Filter Kelas & Divisi** → Dropdown jenjang (X/XI/XII) + divisi (A-I) → format `KELAS-DIVISI` (seperti `XII-C`)
2. **Tampilan Harian Senin-Jumat** → Grid kartu, format `1. Matematika (2JP)`, empty state "Belum ada jadwal"
3. **Tambah Jadwal** → Input kelas, divisi, hari, mata pelajaran, JP (max 2)
4. **Multi-Mapel per Hari** → Bisa input banyak mapel sekaligus dalam submit satu form
5. **Tombol Tambah per Hari** → Di tiap kartu hari, langsung isi mapel tanpa buka modal
6. **Edit/Hapus per Mapel** → Tombol muncul saat hover
7. **Dark Mode** → Toggle di header, disimpan ke `localStorage`
8. **Efek Hover** → Kartu naik sedikit + shadow, tombol edit/hapus muncul saat hover
9. **Sidebar Navigasi** → Menu Beranda, Tugas & Halaman API, bisa collapse/expand
10. **API Export for n8n** → Generate URL jadwal (kelas/divisi/hari opsional) + tugas (kelas/divisi/h opsional)
11. **Toast Notifikasi** → Muncul di tengah layar "URL Copied" saat copy berhasil
11. **Auto DB Init** → Server otomatis `CREATE DATABASE IF NOT EXISTS` & `CREATE TABLE IF NOT EXISTS`
12. **Tugas Tracker** → Card per tugas + badge status (merah/kuning/hijau), urut deadline terdekat, badge belum-selesai di sidebar, ubah status cepat saat hover, modal tambah/edit, generator URL export tugas
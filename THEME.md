# Theme — Kelasku

Dokumentasi sistem visual agar semua halaman konsisten.
Stack: Tailwind CSS (via CDN) + dark mode berbasis class.

## 1. Color palette

Warna dasar: **slate** (netral). Warna aksen per area (jangan campur):

| Token            | Nilai Tailwind                              | Pemakaian                                  |
|------------------|---------------------------------------------|--------------------------------------------|
| Background page  | `bg-white` / `dark:bg-slate-900`            | Latar semua halaman                        |
| Surface / kartu  | `bg-white` / `dark:bg-slate-800`            | Card, panel filter, modal                  |
| Surface lembut   | `bg-slate-50` / `dark:bg-slate-700/50`      | Item list di dalam kartu                   |
| Border           | `border-slate-200` / `dark:border-slate-700`| Semua kartu & input                        |
| Teks utama       | `text-slate-900` / `dark:text-white`        | Judul (`text-3xl font-bold`)               |
| Teks sekunder    | `text-slate-500` / `dark:text-slate-400`    | Subtitle, hint (`text-sm` / `text-xs`)     |
| Sidebar          | `bg-slate-900` / `dark:bg-slate-950`        | Selalu gelap di kedua mode                 |
| Aksen Jadwal/API | `indigo-600` (tombol), `indigo-50` (chip)   | Halaman Jadwal, Dashboard, API Generator   |
| Aksen Tugas      | `emerald-600` (tombol), `emerald-100` (chip)| Halaman Tugas                              |
| Aksen Refresh    | `bg-slate-900` / `dark:bg-indigo-600`       | Tombol Refresh dashboard                   |

### Warna status tugas (selalu sama di semua halaman)

| Status    | Badge                                              |
|-----------|----------------------------------------------------|
| `belum`   | merah — `bg-red-100 text-red-700` (+`dark:` `-900/40`/`-300`) |
| `proses`  | kuning — `bg-amber-100 text-amber-700` (varian dark sama)      |
| `selesai` | hijau — `bg-emerald-100 text-emerald-700` (varian dark sama)   |

Badge jadwal fokus: `HARI INI` = hijau (emerald), `BESOK` = kuning (amber).
Setiap badge dark-mode wajib punya pasangan `dark:` (contoh:
`bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300`).

## 2. Dark mode

* Strategi: `darkMode: 'class'` pada `document.documentElement`.
* Preferensi tersimpan di `localStorage.theme` (`dark`/`light`), fallback
  `prefers-color-scheme`. Fungsi: `initTheme()` / `toggleDarkMode()` di `js/common.js`.
* Snippet anti-flash wajib ada di `<head>` setiap halaman (sudah ada di 4 halaman).
* Ikon toggle: `sun` saat gelap (`text-amber-400`), `moon` saat terang.

## 3. Layout

* Sidebar fixed `w-64`, konten `md:ml-64` (`#mainContent`). Toggle via `toggleSidebar()`.
* Konten: `max-w-7xl mx-auto px-6`, header `pt-8 pb-6`, body `py-6 space-y-6`.
* Struktur header tiap halaman: judul + subtitle (+ `#liveClock` di dashboard)
  di kiri, tombol aksi (dark mode + tombol utama) di kanan.
* Panel filter/kelas: kartu `p-5` berisi label + `select` (`sm:w-64/72`).

## 4. Komponen

* **Kartu**: `rounded-2xl p-5 border shadow-sm`, header kartu
  `font-bold text-base` + garis bawah `border-b border-slate-100 dark:border-slate-700`.
  Kartu yang bisa diklik/hover: tambah `hover:-translate-y-1 hover:shadow-lg transition-all duration-300`.
* **Badge/chip**: `text-[11px]` atau `text-xs font-bold px-2 py-0.5 rounded-full`.
* **Tombol utama**: `font-medium px-5 py-2.5 rounded-xl shadow text-sm text-white`
  (indigo untuk Jadwal/API, emerald untuk Tugas).
* **Tombol ikon aksi** (edit/hapus/advance): `text-slate-400 p-1`,
  hover sesuai makna (`hover:text-indigo-600`, `hover:text-red-600`,
  `hover:text-emerald-600`), di dalam grup `opacity-0 group-hover:opacity-100`.
* **Input/select**: `border rounded-xl px-3/4 py-2/2.5 text-sm`,
  fokus `focus:ring-2` warna aksen halaman (`indigo-500` / `emerald-500`).
* **Modal**: overlay `bg-slate-900/60 backdrop-blur-sm`, panel
  `rounded-2xl max-w-lg max-h-[90vh]`; tutup via `hidden` ↔ `flex`.
* **Toast** (`#toastNotification`): fixed atas-tengah, `rounded-2xl`,
  tampil 2 detik via `showToast(pesan)`.
* **Ikon**: selalu via icon helper — lihat `ICON_HELPER.md`.
  Ukuran: `w-4 h-4` (nav/aksi), `w-5 h-5` (logo/header/toast), `w-3 h-3` (badge kecil).

## 5. Tipografi & radius

* Judul halaman: `text-3xl font-bold`. Judul kartu: `font-bold text-base`.
  Label form: `text-xs font-semibold`. Hint: `text-xs text-slate-400`.
* Tabular numbers untuk jam: `tabular-nums` (dipakai `#liveClock`).
* Radius: kartu/modal `rounded-2xl`, input/button `rounded-xl`,
  badge/chip `rounded-full`/`rounded-lg`.
* Bahasa UI: Indonesia. Format tanggal/waktu: locale `id-ID`, zona `Asia/Jakarta`.

## 6. Checklist saat tambah UI baru

1. Pakai kartu/badge/tombol sesuai seksi 4 (jangan bikin varian baru).
2. Setiap warna terang wajib ada pasangan `dark:`-nya.
3. Aksen mengikuti halaman (Jadwal = indigo, Tugas = emerald).
4. Ikon lewat helper (`ICON_HELPER.md`), bukan SVG manual atau emoji.
5. Status tugas selalu merah/kuning/hijau sesuai tabel seksi 1.

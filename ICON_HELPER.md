# Icon Helper — Kelasku

Semua ikon terpusat di `public/js/icons.js` (gaya Heroicons outline).
Tidak ada lagi path SVG panjang yang ditulis manual di HTML/JS.

## Cara pakai

### 1. Di HTML statis — pakai `data-icon`

```html
<span data-icon="book" data-cls="w-4 h-4"></span>
```

* `data-icon`: nama ikon (lihat katalog di bawah).
* `data-cls`: class Tailwind untuk ukuran/warna (default `w-4 h-4`).
* Saat halaman dimuat, `hydrateIcons()` di `public/js/common.js`
  otomatis menggantinya menjadi SVG. Atribut `data-*` lalu dihapus.

Pengecualian: elemen yang butuh `id` (misal toggle dark mode)
tetap memakai `id` seperti biasa — hanya isi SVG-nya yang dari helper:

```html
<span id="sunIcon" data-icon="sun" data-cls="w-5 h-5 hidden dark:block text-amber-400"></span>
```

### 2. Di JS dinamis (template string) — pakai `icon()`

```js
// di dalam template literal:
`${icon('edit', 'w-4 h-4')}`

// string biasa (concatenation):
icon('logo', 'w-3 h-3') + '<span>BESOK</span>'
```

### 3. Urutan script (wajib)

`icons.js` harus dimuat **sebelum** `common.js` di setiap halaman:

```html
<script src="js/icons.js"></script>
<script src="js/common.js"></script>
<script src="js/dashboard.js"></script>
```

Sudah terpasang di: `dashboard.html`, `jadwal.html`, `tugas.html`, `generate-api.html`.

## Katalog ikon

| Nama      | Dipakai di                                      |
|-----------|-------------------------------------------------|
| `logo`    | Logo Kelasku sidebar, badge BESOK dashboard     |
| `close`   | Tombol tutup sidebar                            |
| `home`    | Nav Dashboard                                   |
| `book`    | Nav Jadwal Pelajaran                            |
| `task`    | Nav Tugas                                       |
| `code`    | Nav API Generator                               |
| `check`   | Ikon toast notifikasi                           |
| `menu`    | Tombol buka sidebar (hamburger)                 |
| `sun`     | Toggle dark mode (mode gelap aktif)             |
| `moon`    | Toggle dark mode (mode terang aktif)            |
| `advance` | Tombol naikkan status tugas (`tugas.js`)        |
| `edit`    | Tombol edit jadwal/tugas                        |
| `trash`   | Tombol hapus jadwal/tugas                       |
| `copy`    | Tombol copy URL (`generate-api.html`)           |

## Tambah ikon baru

1. Ambil path Heroicons outline (24x24, `stroke-width="2"`),
   salin **hanya isi** atribut `d`.
2. Tambahkan satu baris di `ICON_PATHS` dalam `public/js/icons.js`:

```js
archive: 'M...path baru...',
```

3. Pakai seperti biasa: `<span data-icon="archive" data-cls="w-4 h-4"></span>`
   atau `${icon('archive', 'w-4 h-4')}`.
4. Daftarkan di tabel katalog di atas.

## Aturan

* Jangan tulis `<svg ...><path d="...">` manual di HTML/JS lagi —
  selalu lewat helper agar konsisten dan mudah dibaca.
* Ukuran standar: `w-4 h-4` (nav, tombol aksi), `w-5 h-5` (logo, header, toast),
  `w-3 h-3` (di dalam badge kecil).
* Warna mengikuti teks induk via `stroke="currentColor"` — cukup atur
  class warna Tailwind pada `data-cls`.

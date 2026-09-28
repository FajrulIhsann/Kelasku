# Dokumentasi REST API — Kelasku

Basis URL: `http://localhost:3000` (atau sesuai `PORT` di `.env`).

Backend menyediakan beberapa endpoint REST API yang dapat digunakan:

- **GET /api/kelas**
  - **Deskripsi**: Mengambil daftar kombinasi kelas dan divisi unik yang tersedia di database.
  - **Contoh Response**:
    ```json
    [
      { "kelas": "XII", "divisi": "C" },
      { "kelas": "XI", "divisi": "A" }
    ]
    ```

- **GET /api/jadwal?kelas=XII&divisi=C**
  - **Deskripsi**: Mengambil daftar jadwal pelajaran berdasarkan kelas dan divisi tertentu.
  - **Query Parameters**:
    - `kelas`: Jenjang kelas (misal: `XII`)
    - `divisi`: Bagian kelas (misal: `C`)
  - **Contoh Response**:
    ```json
    [
      { "id": 1, "kelas": "XII", "divisi": "C", "hari": "Senin", "mapel": "Matematika", "jp": 2 },
      { "id": 2, "kelas": "XII", "divisi": "C", "hari": "Senin", "mapel": "Fisika", "jp": 2 }
    ]
    ```

- **POST /api/jadwal**
  - **Deskripsi**: Menambah satu atau banyak jadwal pelajaran sekaligus.
  - **Body (Single)**:
    ```json
    { "kelas": "XII", "divisi": "C", "hari": "Senin", "mapel": "Kimia", "jp": 2 }
    ```
  - **Body (Batch / Banyak sekaligus)**:
    ```json
    [
      { "kelas": "XII", "divisi": "C", "hari": "Selasa", "mapel": "Biologi", "jp": 2 },
      { "kelas": "XII", "divisi": "C", "hari": "Selasa", "mapel": "Sejarah", "jp": 2 }
    ]
    ```

- **GET /api/jadwal/export?kelas=XII&divisi=C&hari=Senin** (Parameter `hari` opsional)
  - **Deskripsi**: Endpoint khusus untuk n8n / scraping guna mengambil jadwal kelas dan divisi. Jika parameter `hari` tidak disertakan, akan mengembalikan seluruh jadwal dari Senin sampai Jumat.
  - **Query Parameters**:
    - `kelas`: Jenjang kelas (misal: `XII`)
    - `divisi`: Bagian kelas (misal: `C`)
    - `hari` *(Opsional)*: Hari sekolah (misal: `Senin`)
  - **Contoh Response (Dengan `hari=Senin`)**:
    ```json
    {
      "kelas": "XII-C",
      "hari": "Senin",
      "total_mapel": 2,
      "jadwal": [
        { "mata_pelajaran": "Matematika", "jp": 2 },
        { "mata_pelajaran": "Fisika", "jp": 2 }
      ]
    }
    ```
  - **Contoh Response (Tanpa parameter `hari`)**:
    ```json
    {
      "kelas": "XII-C",
      "total_mapel": 5,
      "jadwal": {
        "Senin": [{ "mata_pelajaran": "Matematika", "jp": 2 }],
        "Selasa": [],
        "Rabu": [],
        "Kamis": [],
        "Jumat": []
      }
    }
    ```

- **PUT /api/jadwal/:id**
  - **Deskripsi**: Memperbarui data jadwal pelajaran berdasarkan ID.
  - **Body**:
    ```json
    { "kelas": "XII", "divisi": "C", "hari": "Senin", "mapel": "Matematika Lanjut", "jp": 2 }
    ```

- **DELETE /api/jadwal/:id**
  - **Deskripsi**: Menghapus data jadwal berdasarkan ID.

- **GET /api/tugas?kelas=XII&divisi=C&status=belum**
  - **Deskripsi**: Mengambil daftar tugas. Semua filter (`kelas`, `divisi`, `status`) opsional. Diurutkan deadline terdekat (ASC).

- **GET /api/tugas/export?kelas=XII&divisi=C&h=3** (semua parameter opsional)
  - **Deskripsi**: Endpoint khusus untuk n8n — mengambil tugas dengan status != `selesai`, diurutkan deadline ASC, digrup per mapel (mirip `/api/jadwal/export`).
  - **Query Parameters**:
    - `kelas` *(Opsional)*: Jenjang kelas (misal: `XII`)
    - `divisi` *(Opsional)*: Bagian kelas (misal: `C`)
    - `h` *(Opsional)*: Jumlah hari sebelum deadline (`h=1` = deadline besok, `h=3` = dalam 3 hari ke depan). Jika kosong, kembalikan semua tugas belum selesai.
  - **Contoh Response**:
    ```json
    {
      "kelas": "XII-C",
      "total_tugas": 2,
      "tugas": {
        "Matematika": [{ "judul": "Kerjakan hal 42", "deskripsi": null, "deadline": "2026-09-10T23:59:00.000Z", "status": "belum" }]
      }
    }
    ```

- **POST /api/tugas**
  - **Deskripsi**: Menambah tugas baru (single atau batch).
  - **Body**:
    ```json
    { "kelas": "XII", "divisi": "C", "mapel": "Matematika", "judul": "Kerjakan hal 42", "deskripsi": "No 1-10", "deadline": "2026-09-10 23:59:00", "status": "belum" }
    ```

- **PUT /api/tugas/:id**
  - **Deskripsi**: Memperbarui tugas (semua field opsional — bisa update status saja).
  - **Body**:
    ```json
    { "status": "proses" }
    ```

- **DELETE /api/tugas/:id**
  - **Deskripsi**: Menghapus data tugas berdasarkan ID.

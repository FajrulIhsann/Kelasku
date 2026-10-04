// Pool koneksi awal (tanpa database spesifik) untuk membuat DB jika belum ada
const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config();

const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public'), { index: false }));

let pool;

async function initDB() {
  try {
    // 1. Koneksi awal ke MySQL server saja untuk membuat database jika belum ada
    const tempConnection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || ''
    });

    const dbName = process.env.DB_NAME || 'jadwal_db';
    await tempConnection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    await tempConnection.end();

    // 2. Buat pool koneksi ke database yang dituju
    pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: dbName,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });

    // 3. Buat tabel jadwal & tugas jika belum ada
    const connection = await pool.getConnection();
    await connection.query(`
      CREATE TABLE IF NOT EXISTS jadwal (
        id INT AUTO_INCREMENT PRIMARY KEY,
        kelas VARCHAR(20) NOT NULL,
        divisi VARCHAR(20) NOT NULL,
        hari ENUM('Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat') NOT NULL,
        mapel VARCHAR(100) NOT NULL,
        jp INT NOT NULL
      )
    `);
    await connection.query(`
      CREATE TABLE IF NOT EXISTS tugas (
        id INT AUTO_INCREMENT PRIMARY KEY,
        kelas VARCHAR(20),
        divisi VARCHAR(20),
        mapel VARCHAR(100),
        judul VARCHAR(200),
        deskripsi TEXT,
        deadline DATETIME,
        status ENUM('belum','proses','selesai') DEFAULT 'belum',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await connection.query(`
      CREATE TABLE IF NOT EXISTS mapel (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nama VARCHAR(100) NOT NULL UNIQUE
      )
    `);

    // Seed daftar mapel standar SMA hanya jika tabel masih kosong
    // (daftar buatan pengguna tidak akan pernah tertimpa).
    const [[{ c }]] = await connection.query('SELECT COUNT(*) AS c FROM mapel');
    if (c === 0) {
      const seed = ['Matematika', 'Fisika', 'Kimia', 'Biologi', 'Bahasa Indonesia', 'Bahasa Inggris', 'Sejarah', 'Geografi', 'Ekonomi', 'Sosiologi', 'PPKn', 'Pendidikan Agama', 'PJOK', 'Seni Budaya', 'Informatika', 'Prakarya'];
      await connection.query('INSERT INTO mapel (nama) VALUES ?', [seed.map(n => [n])]);
    }
    connection.release();
    console.log(`Database '${dbName}' & tabel 'jadwal', 'tugas', 'mapel' siap.`);
  } catch (err) {
    console.error('Gagal inisialisasi database:', err.message);
  }
}

initDB();

// 1. Ambil daftar kelas unik (kombinasi kelas + divisi)
app.get('/api/kelas', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT DISTINCT kelas, divisi 
      FROM jadwal 
      ORDER BY kelas ASC, divisi ASC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Ambil jadwal berdasarkan kelas & divisi
app.get('/api/jadwal', async (req, res) => {
  const { kelas, divisi } = req.query;
  try {
    let sql = 'SELECT * FROM jadwal';
    const params = [];
    if (kelas && divisi) {
      sql += ' WHERE kelas = ? AND divisi = ?';
      params.push(kelas, divisi);
    }
    sql += ' ORDER BY id ASC';
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2.1. Endpoint khusus Export / Scraping untuk n8n (opsional filter hari)
app.get('/api/jadwal/export', async (req, res) => {
  const { kelas, divisi, hari } = req.query;
  if (!kelas || !divisi) {
    return res.status(400).json({ error: 'Parameter kelas dan divisi wajib diisi' });
  }

  try {
    let sql = 'SELECT hari, mapel AS mata_pelajaran, jp FROM jadwal WHERE kelas = ? AND divisi = ?';
    const params = [kelas.trim(), divisi.trim()];

    if (hari && hari.trim() !== '') {
      sql += ' AND hari = ?';
      params.push(hari.trim());
    }

    sql += ' ORDER BY FIELD(hari, "Senin", "Selasa", "Rabu", "Kamis", "Jumat"), id ASC';

    const [rows] = await pool.query(sql, params);

    if (hari && hari.trim() !== '') {
      return res.json({
        kelas: `${kelas}-${divisi}`,
        hari: hari.trim(),
        total_mapel: rows.length,
        jadwal: rows.map(r => ({ mata_pelajaran: r.mata_pelajaran, jp: r.jp }))
      });
    }

    // Jika hari kosong / tidak diset: kelompokkan per hari atau daftar semua hari
    const grouped = {
      Senin: [],
      Selasa: [],
      Rabu: [],
      Kamis: [],
      Jumat: []
    };

    rows.forEach(r => {
      if (grouped[r.hari]) {
        grouped[r.hari].push({ mata_pelajaran: r.mata_pelajaran, jp: r.jp });
      }
    });

    res.json({
      kelas: `${kelas}-${divisi}`,
      total_mapel: rows.length,
      jadwal: grouped
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Tambah jadwal baru (bisa single atau array/batch)
app.post('/api/jadwal', async (req, res) => {
  const payload = req.body;
  
  try {
    if (Array.isArray(payload)) {
      if (payload.length === 0) return res.status(400).json({ error: 'Data kosong' });
      const values = payload.map(item => [
        item.kelas.trim(),
        item.divisi.trim(),
        item.hari,
        item.mapel.trim(),
        parseInt(item.jp)
      ]);
      await pool.query(
        'INSERT INTO jadwal (kelas, divisi, hari, mapel, jp) VALUES ?',
        [values]
      );
      return res.status(201).json({ message: `${payload.length} Jadwal berhasil ditambahkan` });
    }

    const { kelas, divisi, hari, mapel, jp } = payload;
    if (!kelas || !divisi || !hari || !mapel || !jp) {
      return res.status(400).json({ error: 'Semua field wajib diisi' });
    }
    const [result] = await pool.query(
      'INSERT INTO jadwal (kelas, divisi, hari, mapel, jp) VALUES (?, ?, ?, ?, ?)',
      [kelas.trim(), divisi.trim(), hari, mapel.trim(), parseInt(jp)]
    );
    res.status(201).json({ id: result.insertId, message: 'Jadwal berhasil ditambahkan' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Update jadwal
app.put('/api/jadwal/:id', async (req, res) => {
  const { id } = req.params;
  const { kelas, divisi, hari, mapel, jp } = req.body;
  try {
    const [result] = await pool.query(
      'UPDATE jadwal SET kelas = ?, divisi = ?, hari = ?, mapel = ?, jp = ? WHERE id = ?',
      [kelas.trim(), divisi.trim(), hari, mapel.trim(), parseInt(jp), id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Jadwal tidak ditemukan' });
    }
    res.json({ message: 'Jadwal berhasil diperbarui' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Hapus jadwal
app.delete('/api/jadwal/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query('DELETE FROM jadwal WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Jadwal tidak ditemukan' });
    }
    res.json({ message: 'Jadwal berhasil dihapus' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Ambil daftar tugas (filter opsional: kelas, divisi, status)
app.get('/api/tugas', async (req, res) => {
  const { kelas, divisi, status } = req.query;
  try {
    let sql = 'SELECT * FROM tugas';
    const params = [];
    const conds = [];
    if (kelas && kelas.trim() !== '') {
      conds.push('kelas = ?');
      params.push(kelas.trim());
    }
    if (divisi && divisi.trim() !== '') {
      conds.push('divisi = ?');
      params.push(divisi.trim());
    }
    if (status && status.trim() !== '') {
      conds.push('status = ?');
      params.push(status.trim());
    }
    if (conds.length > 0) {
      sql += ' WHERE ' + conds.join(' AND ');
    }
    sql += ` ORDER BY FIELD(status, 'belum', 'proses', 'selesai'), deadline ASC`;
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6.1. Endpoint khusus Export tugas untuk n8n (opsional filter h = hari sebelum deadline)
app.get('/api/tugas/export', async (req, res) => {
  const { kelas, divisi, h } = req.query;
  try {
    let sql = 'SELECT * FROM tugas WHERE status != ?';
    const params = ['selesai'];
    if (kelas && kelas.trim() !== '') {
      sql += ' AND kelas = ?';
      params.push(kelas.trim());
    }
    if (divisi && divisi.trim() !== '') {
      sql += ' AND divisi = ?';
      params.push(divisi.trim());
    }
    if (h && h.trim() !== '' && !isNaN(parseInt(h))) {
      sql += ' AND deadline <= DATE_ADD(NOW(), INTERVAL ? DAY)';
      params.push(parseInt(h));
    }
    sql += ' ORDER BY deadline ASC';
    const [rows] = await pool.query(sql, params);

    const grouped = {};
    rows.forEach(r => {
      const key = r.mapel || 'Lainnya';
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push({
        judul: r.judul,
        deskripsi: r.deskripsi,
        deadline: r.deadline,
        status: r.status
      });
    });

    res.json({
      kelas: (kelas && divisi) ? `${kelas}-${divisi}` : null,
      total_tugas: rows.length,
      tugas: grouped
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 7. Tambah tugas baru (bisa single atau array/batch)
app.post('/api/tugas', async (req, res) => {
  const payload = req.body;

  try {
    if (Array.isArray(payload)) {
      if (payload.length === 0) return res.status(400).json({ error: 'Data kosong' });
      const values = payload.map(item => [
        (item.kelas || '').trim(),
        (item.divisi || '').trim(),
        (item.mapel || '').trim(),
        (item.judul || '').trim(),
        item.deskripsi || null,
        item.deadline,
        item.status || 'belum'
      ]);
      await pool.query(
        'INSERT INTO tugas (kelas, divisi, mapel, judul, deskripsi, deadline, status) VALUES ?',
        [values]
      );
      return res.status(201).json({ message: `${payload.length} Tugas berhasil ditambahkan` });
    }

    const { kelas, divisi, mapel, judul, deskripsi, deadline, status } = payload;
    if (!judul || !deadline) {
      return res.status(400).json({ error: 'Judul dan deadline wajib diisi' });
    }
    const [result] = await pool.query(
      'INSERT INTO tugas (kelas, divisi, mapel, judul, deskripsi, deadline, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [(kelas || '').trim(), (divisi || '').trim(), (mapel || '').trim(), judul.trim(), deskripsi || null, deadline, status || 'belum']
    );
    res.status(201).json({ id: result.insertId, message: 'Tugas berhasil ditambahkan' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 8. Update tugas (termasuk update status saja)
app.put('/api/tugas/:id', async (req, res) => {
  const { id } = req.params;
  const { kelas, divisi, mapel, judul, deskripsi, deadline, status } = req.body;
  try {
    const fields = [];
    const params = [];
    if (kelas !== undefined) { fields.push('kelas = ?'); params.push((kelas || '').trim()); }
    if (divisi !== undefined) { fields.push('divisi = ?'); params.push((divisi || '').trim()); }
    if (mapel !== undefined) { fields.push('mapel = ?'); params.push((mapel || '').trim()); }
    if (judul !== undefined) { fields.push('judul = ?'); params.push((judul || '').trim()); }
    if (deskripsi !== undefined) { fields.push('deskripsi = ?'); params.push(deskripsi || null); }
    if (deadline !== undefined) { fields.push('deadline = ?'); params.push(deadline); }
    if (status !== undefined) { fields.push('status = ?'); params.push(status); }
    if (fields.length === 0) {
      return res.status(400).json({ error: 'Tidak ada field untuk diperbarui' });
    }
    params.push(id);
    const [result] = await pool.query(
      `UPDATE tugas SET ${fields.join(', ')} WHERE id = ?`,
      params
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Tugas tidak ditemukan' });
    }
    res.json({ message: 'Tugas berhasil diperbarui' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 9. Hapus tugas
app.delete('/api/tugas/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query('DELETE FROM tugas WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Tugas tidak ditemukan' });
    }
    res.json({ message: 'Tugas berhasil dihapus' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 9.1. Master mapel: daftar untuk dropdown + kelola sendiri
app.get('/api/mapel', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, nama FROM mapel ORDER BY nama ASC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 9.2. Tambah mapel baru (tolak duplikat)
app.post('/api/mapel', async (req, res) => {
  const nama = (req.body.nama || '').trim();
  if (!nama) {
    return res.status(400).json({ error: 'Nama mapel wajib diisi' });
  }
  try {
    const [result] = await pool.query('INSERT INTO mapel (nama) VALUES (?)', [nama]);
    res.status(201).json({ id: result.insertId, nama, message: 'Mapel berhasil ditambahkan' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Mapel sudah ada' });
    }
    res.status(500).json({ error: err.message });
  }
});

// 9.3. Hapus mapel (data jadwal/tugas lama yang memakai nama ini tidak ikut terhapus)
app.delete('/api/mapel/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query('DELETE FROM mapel WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Mapel tidak ditemukan' });
    }
    res.json({ message: 'Mapel berhasil dihapus' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 10. Dashboard harian agregat (WIB): jadwal hari ini & besok + tugas hari ini/mendesak
app.get('/api/dashboard', async (req, res) => {
  const { kelas, divisi } = req.query;
  if (!kelas || !divisi) {
    return res.status(400).json({ error: 'Parameter kelas dan divisi wajib diisi' });
  }
  try {
    const k = kelas.trim();
    const d = divisi.trim();

    // Tanggal & jam WIB (Asia/Jakarta) dari server
    const fmt = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit' });
    const parts = Object.fromEntries(fmt.formatToParts(new Date()).map(p => [p.type, p.value]));
    const todayStr = `${parts.year}-${parts.month}-${parts.day}`;
    const weekdayFmt = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Jakarta', weekday: 'short' });
    const jsDay = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }[weekdayFmt.format(new Date())];
    const SEKOLAH = [null, 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];

    // Jam WIB untuk cutoff: >= CUTOFF_HOUR tampilkan jadwal besok
    const CUTOFF_HOUR = 15;
    const hourFmt = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Jakarta', hour: 'numeric', hour12: false });
    const wibHour = parseInt(hourFmt.format(new Date()), 10);

    // Cari hari sekolah berikutnya (skip Sabtu/Minggu). Jumat -> Senin.
    function nextSchoolDay(fromJsDay) {
      for (let i = 1; i <= 3; i++) {
        const cand = (fromJsDay + i) % 7;
        if (cand >= 1 && cand <= 5) return { jsDay: cand, hari: SEKOLAH[cand], plusDays: i };
      }
      return { jsDay: 1, hari: 'Senin', plusDays: 1 };
    }

    const isSchoolDay = jsDay >= 1 && jsDay <= 5;
    const todayHari = isSchoolDay ? SEKOLAH[jsDay] : null;
    const nxt = nextSchoolDay(jsDay);
    const tomorrowHari = nxt.hari;
    const tomorrowStr = new Date(new Date(`${todayStr}T00:00:00+07:00`).getTime() + nxt.plusDays * 86400000);

    const [jadwalRows] = await pool.query(
      'SELECT hari, mapel, jp FROM jadwal WHERE kelas = ? AND divisi = ? ORDER BY FIELD(hari, "Senin","Selasa","Rabu","Kamis","Jumat"), id ASC',
      [k, d]
    );
    const [tugasRows] = await pool.query(
      "SELECT id, mapel, judul, deskripsi, deadline, status FROM tugas WHERE kelas = ? AND divisi = ? AND status != 'selesai' ORDER BY deadline ASC",
      [k, d]
    );

    const week = { Senin: 0, Selasa: 0, Rabu: 0, Kamis: 0, Jumat: 0 };
    jadwalRows.forEach(r => { if (week[r.hari] !== undefined) week[r.hari]++; });

    const startOfDay = dstr => new Date(`${dstr}T00:00:00+07:00`).getTime();
    const endOfDay = dstr => new Date(`${dstr}T23:59:59+07:00`).getTime();
    const t0 = startOfDay(todayStr);
    const t1 = endOfDay(todayStr);

    const overdue = [], today = [], tomorrowTugas = [], upcoming = [];
    tugasRows.forEach(t => {
      const dl = new Date(t.deadline).getTime();
      if (isNaN(dl)) { upcoming.push(t); return; }
      if (dl < t0) overdue.push(t);
      else if (dl <= t1) today.push(t);
      else if (dl <= t1 + 86400000) tomorrowTugas.push(t);
      else if (dl <= t1 + 3 * 86400000) upcoming.push(t);
    });

    const jadwalHariIni = todayHari ? jadwalRows.filter(r => r.hari === todayHari) : [];
    const jadwalBesok = jadwalRows.filter(r => r.hari === tomorrowHari);

    // Fokus 1 kartu: sebelum cutoff tampil hari ini, sesudah cutoff (>=15:00) tampil besok.
    // Akhir pekan (libur) selalu fokus ke hari sekolah berikutnya.
    const isSchoolDayNow = isSchoolDay;
    const cutoffApplied = isSchoolDayNow && wibHour >= CUTOFF_HOUR;
    const fokusIsBesok = !isSchoolDayNow || cutoffApplied;
    const fokus = {
      hari: fokusIsBesok ? tomorrowHari : todayHari,
      label: fokusIsBesok ? 'besok' : 'hari ini',
      jadwal: fokusIsBesok ? jadwalBesok : jadwalHariIni,
      libur: false
    };

    res.json({
      kelas: `${k}-${d}`,
      server_time_wib: new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }),
      wib_hour: wibHour,
      cutoff_hour: CUTOFF_HOUR,
      cutoff_applied: cutoffApplied,
      fokus,
      today: { date: todayStr, hari: todayHari, libur: !isSchoolDay, jadwal: jadwalHariIni },
      tomorrow: { hari: tomorrowHari, jadwal: jadwalBesok },
      tugas: { overdue, today, tomorrow: tomorrowTugas, upcoming_3hari: upcoming },
      stats: {
        jadwal_hari_ini: jadwalHariIni.length,
        jadwal_besok: jadwalBesok.length,
        tugas_terlambat: overdue.length,
        tugas_hari_ini: today.length,
        tugas_besok: tomorrowTugas.length,
        belum_selesai: tugasRows.length,
        week
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Halaman terpisah: / (dashboard), /jadwal, /tugas, /generate-api
app.get('/', (req, res) => res.redirect('/dashboard'));
app.get('/dashboard', (req, res) => res.sendFile(path.join(__dirname, 'public', 'dashboard.html')));
app.get('/jadwal', (req, res) => res.sendFile(path.join(__dirname, 'public', 'jadwal.html')));
app.get('/tugas', (req, res) => res.sendFile(path.join(__dirname, 'public', 'tugas.html')));
app.get('/generate-api', (req, res) => res.sendFile(path.join(__dirname, 'public', 'generate-api.html')));

app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});

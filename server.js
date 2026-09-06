// Pool koneksi awal (tanpa database spesifik) untuk membuat DB jika belum ada
const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config();

const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

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
    connection.release();
    console.log(`Database '${dbName}' & tabel 'jadwal', 'tugas' siap.`);
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
    sql += ' ORDER BY deadline ASC';
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

app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});

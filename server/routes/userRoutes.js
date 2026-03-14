const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const pool = require('../database/db');
const auth = require('../middleware/auth');

// Get all users
router.get('/', auth, async (req, res) => {
  try {
    const [users] = await pool.query(
      'SELECT id, username, nama_lengkap, no_hp, role, isAuth, last_login, created_at, updated_at FROM bidan ORDER BY created_at DESC'
    );
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Add new user (automatically verified with isAuth = 1)
router.post('/', auth, async (req, res) => {
  try {
    const { username, password, nama_lengkap, no_hp, role } = req.body;

    // Validate required fields
    if (!username || !password || !nama_lengkap) {
      return res.status(400).json({ message: 'Username, password, dan nama lengkap wajib diisi' });
    }

    // Check if username exists
    const [existing] = await pool.query(
      'SELECT * FROM bidan WHERE username = ?',
      [username]
    );

    if (existing.length > 0) {
      return res.status(400).json({ message: 'Username sudah digunakan' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Insert new user with isAuth = 1 (automatically verified)
    const [result] = await pool.query(
      'INSERT INTO bidan (username, password, nama_lengkap, no_hp, role, isAuth) VALUES (?, ?, ?, ?, ?, ?)',
      [username, hashedPassword, nama_lengkap, no_hp || null, role || 'Bidan', 1]
    );

    res.status(201).json({
      message: 'User berhasil ditambahkan',
      userId: result.insertId
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { username, password, nama_lengkap, no_hp, role } = req.body;

    // Check if user exists
    const [existing] = await pool.query(
      'SELECT * FROM bidan WHERE id = ?',
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({ message: 'User tidak ditemukan' });
    }

    // Check if username is taken by another user
    const [usernameCheck] = await pool.query(
      'SELECT * FROM bidan WHERE username = ? AND id != ?',
      [username, id]
    );

    if (usernameCheck.length > 0) {
      return res.status(400).json({ message: 'Username sudah digunakan' });
    }

    // Build update query
    let updateQuery = 'UPDATE bidan SET username = ?, nama_lengkap = ?, no_hp = ?, role = ?';
    let params = [username, nama_lengkap, no_hp || null, role || 'Bidan'];

    // If password is provided, hash and update it
    if (password && password.trim() !== '') {
      const hashedPassword = await bcrypt.hash(password, 12);
      updateQuery += ', password = ?';
      params.push(hashedPassword);
    }

    updateQuery += ' WHERE id = ?';
    params.push(id);

    await pool.query(updateQuery, params);

    res.json({ message: 'User berhasil diupdate' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Change password
router.put('/:id/password', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    if (!password || password.trim() === '') {
      return res.status(400).json({ message: 'Password tidak boleh kosong' });
    }

    // Check if user exists
    const [existing] = await pool.query(
      'SELECT * FROM bidan WHERE id = ?',
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({ message: 'User tidak ditemukan' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Update password
    await pool.query(
      'UPDATE bidan SET password = ? WHERE id = ?',
      [hashedPassword, id]
    );

    res.json({ message: 'Password berhasil diubah' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Verify user (set isAuth = 1)
router.put('/:id/verify', auth, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user exists
    const [existing] = await pool.query(
      'SELECT * FROM bidan WHERE id = ?',
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({ message: 'User tidak ditemukan' });
    }

    // Verify user
    await pool.query(
      'UPDATE bidan SET isAuth = 1 WHERE id = ?',
      [id]
    );

    res.json({ message: 'User berhasil diverifikasi' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete user
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user exists
    const [existing] = await pool.query(
      'SELECT * FROM bidan WHERE id = ?',
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({ message: 'User tidak ditemukan' });
    }

    // Delete user
    await pool.query(
      'DELETE FROM bidan WHERE id = ?',
      [id]
    );

    res.json({ message: 'User berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

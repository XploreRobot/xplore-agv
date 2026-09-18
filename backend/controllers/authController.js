import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { sql } from "../config/db.js";

/* =========================================================
   REGISTER
========================================================= */

export const register = async (req, res) => {
  try {
    const {
      fullname,
      email,
      username,
      password
    } = req.body;

    // Validasi input
    if (!fullname || !email || !username || !password) {
      return res.status(400).json({
        message: "Semua field wajib diisi",
      });
    }

    // Cek apakah username atau email sudah digunakan
    const checkUser = await sql.query`
      SELECT *
      FROM users
      WHERE username = ${username}
         OR email = ${email}
    `;

    if (checkUser.recordset.length > 0) {
      return res.status(400).json({
        message: "Username atau Email sudah digunakan",
      });
    }

    // Hash password
    const hashPassword = await bcrypt.hash(password, 10);

    // Simpan user
    // User yang register otomatis menjadi operator
    await sql.query`
      INSERT INTO users
      (
        fullname,
        email,
        username,
        password,
        role,
        status
      )
      VALUES
      (
        ${fullname},
        ${email},
        ${username},
        ${hashPassword},
        'operator',
        'ACTIVE'
      )
    `;

    return res.status(201).json({
      message: "Register berhasil",
    });

  } catch (err) {
    console.error("REGISTER ERROR:", err);

    return res.status(500).json({
      message: "Server Error",
    });
  }
};


/* =========================================================
   LOGIN
========================================================= */

export const login = async (req, res) => {
  try {
    const {
      username,
      password
    } = req.body;

    // Validasi input
    if (!username || !password) {
      return res.status(400).json({
        message: "Username dan password wajib diisi",
      });
    }

    // Cari user berdasarkan username
    const result = await sql.query`
      SELECT *
      FROM users
      WHERE username = ${username}
    `;

    // User tidak ditemukan
    if (result.recordset.length === 0) {
      return res.status(401).json({
        message: "Username tidak ditemukan",
      });
    }

    // Ambil data user
    // INI YANG TADI HILANG
    const user = result.recordset[0];

    // Cek status akun
    if (user.status !== "ACTIVE") {
      return res.status(403).json({
        message: "Akun tidak aktif",
      });
    }

    // Bandingkan password dengan bcrypt
    const match = await bcrypt.compare(
      password,
      user.password
    );

    // Password salah
    if (!match) {
      return res.status(401).json({
        message: "Password salah",
      });
    }

    // Buat JWT Token
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      }
    );

    // Login berhasil
    return res.status(200).json({
      message: "Login berhasil",

      token,

      user: {
        id: user.id,
        fullname: user.fullname,
        email: user.email,
        username: user.username,
        role: user.role,
        status: user.status,
      },
    });

  } catch (err) {
    console.error("LOGIN ERROR:", err);

    return res.status(500).json({
      message: "Server Error",
    });
  }
};
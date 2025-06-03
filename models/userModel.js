const pool = require("../config/db");
const bcrypt = require("bcryptjs");
const saltRounds = 10;

module.exports = {
  createUser: async (
    username,
    email,
    password,
    role = "user",
    createdBy = null
  ) => {
    const hash = await bcrypt.hash(password, saltRounds);
    const result = await pool.query(
      `INSERT INTO user_details
       (username, email, password_hash, role, created_by) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING id, username, email, role, created_at`,
      [username, email, hash, role, createdBy]
    );
    return result.rows[0];
  },

  findUserByUsername: async (username) => {
    const result = await pool.query(
      "SELECT * FROM user_details WHERE username = $1",
      [username]
    );
    return result.rows[0];
  },

  findUserByEmail: async (email) => {
    const result = await pool.query(
      "SELECT * FROM user_details WHERE email = $1",
      [email]
    );
    return result.rows[0];
  },

  findUserById: async (id) => {
    const result = await pool.query(
      "SELECT * FROM user_details WHERE id = $1",
      [id]
    );
    return result.rows[0];
  },

  userExists: async (username, email) => {
    const result = await pool.query(
      "SELECT * FROM user_details WHERE username = $1 OR email = $2",
      [username, email]
    );
    return result.rows.length > 0;
  },

  getAllUsers: async () => {
    const result = await pool.query(
      "SELECT id, username, email, role, created_at FROM user_details ORDER BY created_at DESC"
    );
    return result.rows;
  },

  updateUserRole: async (userId, newRole) => {
    const result = await pool.query(
      `UPDATE user_details 
       SET role = $1 
       WHERE id = $2 
       RETURNING id, username, role`,
      [newRole, userId]
    );
    return result.rows[0];
  },

  deleteUser: async (userId, requestingUserId) => {
    if (parseInt(userId) === parseInt(requestingUserId)) {
      throw new Error("Admins cannot delete themselves");
    }

    const result = await pool.query("DELETE FROM user_details WHERE id = $1 RETURNING *", [userId]);
    return result.rows[0];
  },

  isAdmin: async (userId) => {
    const result = await pool.query(
      "SELECT role FROM user_details WHERE id = $1",
      [userId]
    );
    return result.rows[0]?.role === "admin";
  },

  createSession: async (userId, token) => {
    const result = await pool.query(
      `INSERT INTO user_sessions 
       (user_id, token, expires_at) 
       VALUES ($1, $2, NOW() + INTERVAL '1 hour') 
       RETURNING *`,
      [userId, token]
    );
    return result.rows[0];
  },

  endSession: async (userId, token) => {
    await pool.query(
      `UPDATE user_sessions 
       SET is_active = false 
       WHERE user_id = $1 AND token = $2`,
      [userId, token]
    );
  },

  getActiveSession: async (userId, token) => {
    const result = await pool.query(
      `SELECT * FROM user_sessions 
       WHERE user_id = $1 AND token = $2 
       AND is_active = true AND expires_at > NOW()`,
      [userId, token]
    );
    return result.rows[0];
  },
};
const pool = require("../config/db");
const bcrypt = require("bcryptjs");
const saltRounds = 10;

module.exports = {
  createUser: async (
    username,
    email,
    password,
    role = "user",
    createdBy = null,
    teamId = null
  ) => {
    // Auto-assign team based on role if teamId not provided
    if (!teamId) {
      teamId = role === 'admin' ? 0 : 1; // Admin gets team 0, users get team 1 by default
    }
    
    const hash = await bcrypt.hash(password, saltRounds);
    const result = await pool.query(
      `INSERT INTO user_details
       (username, email, password_hash, role, created_by, team_id) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING id, username, email, role, team_id, created_at`,
      [username, email, hash, role, createdBy, teamId]
    );
    
    return result.rows[0];
  },

  findUserByUsername: async (username) => {
    const result = await pool.query(
      `SELECT u.*, t.name as team_name 
       FROM user_details u 
       LEFT JOIN teams t ON u.team_id = t.id 
       WHERE u.username = $1`,
      [username]
    );
    return result.rows[0];
  },

  findUserByEmail: async (email) => {
    const result = await pool.query(
      `SELECT u.*, t.name as team_name 
       FROM user_details u 
       LEFT JOIN teams t ON u.team_id = t.id 
       WHERE u.email = $1`,
      [email]
    );
    return result.rows[0];
  },

  findUserById: async (id) => {
    const result = await pool.query(
      `SELECT u.*, t.name as team_name 
       FROM user_details u 
       LEFT JOIN teams t ON u.team_id = t.id 
       WHERE u.id = $1`,
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
      `SELECT u.id, u.username, u.email, u.role, u.team_id, u.created_at, t.name as name
       FROM user_details u 
       LEFT JOIN teams t ON u.team_id = t.id 
       ORDER BY u.created_at DESC`
    );
    return result.rows;
  },

  getUsersByTeam: async (teamId) => {
    const result = await pool.query(
      `SELECT u.id, u.username, u.email, u.role, u.team_id, u.created_at, t.name as team_name
       FROM user_details u 
       LEFT JOIN teams t ON u.team_id = t.id 
       WHERE u.team_id = $1
       ORDER BY u.created_at DESC`,
      [teamId]
    );
    return result.rows;
  },

updateUser: async (userId, { username, email, newRole, teamId }) => {
  const result = await pool.query(
    `UPDATE user_details
     SET
       username = COALESCE($1, username),
       email = COALESCE($2, email),
       role = COALESCE($3, role),
       team_id = COALESCE($4, team_id),
       created_at = NOW()
     WHERE id = $5
     RETURNING id, username, email, role, team_id`,
    [username, email, newRole, teamId, userId]
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

  // Team management functions
  createTeam: async (name, description) => {
    const result = await pool.query(
      `INSERT INTO teams (name, description) 
       VALUES ($1, $2) 
       RETURNING *`,
      [name, description]
    );
    return result.rows[0];
  },

getAllTeams: async () => {
  try {
    console.log('Testing basic query...');
    const result = await pool.query('SELECT * FROM teams');
    console.log('Basic query result:', result.rows);
    console.log('Basic row count:', result.rowCount);
    return result.rows;
  } catch (error) {
    console.error('Basic query error:', error);
    throw error;
  }
},

  getTeamById: async (teamId) => {
    const result = await pool.query(
      `SELECT t.*, COUNT(u.id) as member_count
       FROM teams t
       LEFT JOIN user_details u ON t.id = u.team_id
       WHERE t.id = $1
       GROUP BY t.id, t.name, t.description, t.created_at`,
      [teamId]
    );
    return result.rows[0];
  },

  updateTeam: async (teamId, name, description) => {
    const result = await pool.query(
      `UPDATE teams 
       SET name = $1, description = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3 
       RETURNING *`,
      [name, description, teamId]
    );
    return result.rows[0];
  },

  deleteTeam: async (teamId) => {
    // Don't allow deletion of team 0 (admin team)
    if (parseInt(teamId) === 0) {
      throw new Error("Cannot delete admin team");
    }
    
    // Move users from deleted team to team 1 (default team)
    await pool.query(
      `UPDATE user_details SET team_id = 1 WHERE team_id = $1`,
      [teamId]
    );
    
    const result = await pool.query(
      `DELETE FROM teams WHERE id = $1 RETURNING *`,
      [teamId]
    );
    return result.rows[0];
  },

  getTeamMembers: async (teamId) => {
    const result = await pool.query(
      `SELECT u.id, u.username, u.email, u.role, u.created_at
       FROM user_details u
       WHERE u.team_id = $1
       ORDER BY u.role DESC, u.created_at DESC`,
      [teamId]
    );
    return result.rows;
  },

  // Get teams that a user can access (for non-admin users)
  getAccessibleTeams: async (userId) => {
    const user = await this.findUserById(userId);
    
    if (user.role === 'admin') {
      // Admins can see all teams
      return await this.getAllTeams();
    } else {
      // Regular users can only see their own team
      const result = await pool.query(
        `SELECT t.*, COUNT(u.id) as member_count
         FROM teams t
         LEFT JOIN user_details u ON t.id = u.team_id
         WHERE t.id = $1
         GROUP BY t.id, t.name, t.description, t.created_at`,
        [user.team_id]
      );
      return result.rows;
    }
  }
};
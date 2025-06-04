const attemptCatch = new Map();

const adminOnly = (req, res, next) => {
  const userId = req.user?.userId;
  const role = req.user?.role;

  if (!userId) return res.status(401).json({ error: "Not Logged In" });
  const attemptData = attemptCatch.get(userId) || {
    count: 0,
    blockedUntil: null,
  };
  const now = Date.now();

  if (attemptData.blockedUntil && now < attemptData.blockedUntil) {
    return res.status(403).json({ error: "Access blocked 10 minutes" });
  }

  if (role === "admin") {
    return next();
  }

  if (attemptData.count === 0) {
    attemptCache.set(userId, { count: 1, blockedUntil: null });
    return res.status(403).json({ error: "Admins only (warning issued)" });
  } else {
    attemptCache.set(userId, { count: 2, blockedUntil: now + 10 * 60 * 1000 });
    return res
      .status(403)
      .json({ error: "Blocked for 10 minutes due to repeated access attempt" });
  }
};

module.exports = adminOnly;

// server/middleware/shield.js
const blacklist = new Set(["192.168.1.1", "203.0.113.5"]);
const fs = require('fs');
const path = require('path');

const logBlockedRequest = (ip, reason) => {
  const logLine = `[${new Date().toISOString()}] Blocked ${ip} — ${reason}\n`;
  fs.appendFileSync(path.join(__dirname, '../logs/shield.log'), logLine);
};

module.exports = function (req, res, next) {
  const ip = req.ip;

  if (blacklist.has(ip)) {
    logBlockedRequest(ip, 'Blacklisted IP');
    return res.status(403).send("Forbidden");
  }

  const suspiciousPatterns = [/\b(select|union|insert|drop|script|onerror|onload)\b/i, /\.\.\//];
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(req.url) || pattern.test(JSON.stringify(req.body))) {
      logBlockedRequest(ip, 'Malicious payload');
      return res.status(403).send("Malicious activity detected");
    }
  }

  next();
};
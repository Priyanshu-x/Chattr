// backend/middleware/getIp.js
module.exports = function getIp(req) {
  // IMPORTANT: If running behind a reverse proxy (e.g., Nginx, Cloudflare, AWS ALB),
  // ensure that 'x-forwarded-for' is correctly set by the proxy and that
  // the application trusts this header ONLY from trusted proxy IPs.
  // Otherwise, 'x-forwarded-for' can be easily spoofed by malicious clients.
  const forwardedFor = req.headers['x-forwarded-for']?.split(',')[0]?.trim();
  
  return (
    forwardedFor ||
    req.socket?.remoteAddress || // More reliable than req.connection.remoteAddress in some Node.js versions
    req.ip // Express's proxy-aware IP address
  );
};

let app;
let initError = null;

try {
  app = require('../server');
} catch (err) {
  initError = err;
  console.error('CRITICAL VERCEL INIT ERROR:', err);
}

module.exports = (req, res) => {
  if (initError) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({
      error: 'Backend Initialization Failed on Vercel',
      message: initError.message,
      stack: initError.stack
    }, null, 2));
  }
  return app(req, res);
};

const providerManager = require('../ai-response-engine/providerManager');

function providerStatus(req, res) {
  // Never exposes API keys — only configuration state and health.
  res.json(providerManager.getStatus());
}

module.exports = { providerStatus };

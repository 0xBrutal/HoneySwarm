const scenarioRunner = require('../services/scenarioRunner');

function startScenario(req, res) {
  const result = scenarioRunner.start(req.app);
  if (result.error) return res.status(409).json({ message: result.error });
  res.status(201).json(result);
}

function pauseScenario(req, res) {
  const result = scenarioRunner.pause();
  if (result.error) return res.status(409).json({ message: result.error });
  res.json(result);
}

function resumeScenario(req, res) {
  const result = scenarioRunner.resume();
  if (result.error) return res.status(409).json({ message: result.error });
  res.json(result);
}

function stopScenario(req, res) {
  const result = scenarioRunner.stop();
  if (result.error) return res.status(409).json({ message: result.error });
  res.json(result);
}

function scenarioStatus(req, res) {
  res.json(scenarioRunner.getStatus());
}

module.exports = { startScenario, pauseScenario, resumeScenario, stopScenario, scenarioStatus };

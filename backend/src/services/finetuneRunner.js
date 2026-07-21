'use strict';

// Training is intentionally not simulated. An approved provider adapter must
// execute outside the API process; its signed/verified result is then recorded
// through /api/governed-lifecycle. This prevents random metrics from being
// mistaken for successful training.
function startRunner() {
  throw new Error('No approved training-provider adapter is configured');
}

module.exports = { startRunner };

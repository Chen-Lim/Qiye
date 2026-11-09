import { run } from './testUtil.js';
import './formatDuration.test.js';
import './hostname.test.js';
import './groupingView.test.js';

const resultsEl = document.getElementById('results');
resultsEl.classList.remove('info');
run(resultsEl).then(({ pass, fail }) => {
  console.log(`[栖页 test] ${pass} passed, ${fail} failed`);
});

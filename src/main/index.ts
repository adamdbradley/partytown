import { debug, logMain } from '../utils';
import { bootstrapMain } from './main-bootstrap';
import { createWorker } from './create-worker';

requestAnimationFrame(() => {
  const startTime = debug ? performance.now() : 0;
  bootstrapMain(window, document, createWorker);
  debug && logMain(`startup: ${(performance.now() - startTime).toFixed(1)}ms`);
});

import type { InitWebWorkerData } from '../types';
import { initMainScriptsInWebWorker } from './worker-script';
import { initWebWorkerData } from './worker-proxy';
import { initWebWorkerGlobal } from './worker-global';

export const initWebWorker = (self: Worker, initData: InitWebWorkerData) => {
  Object.assign(initWebWorkerData, initData);
  initWebWorkerGlobal(self);
  initMainScriptsInWebWorker(initData.$initializeScripts$);
};

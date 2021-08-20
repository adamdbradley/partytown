import type { InitWebWorkerData } from '../types';
import { initMainScriptsInWebWorker } from './worker-script';
import { initWebWorkerGlobal } from './worker-global';
import { methodNames } from './worker-proxy';

export const initWebWorker = (self: Worker, initWebWorkerData: InitWebWorkerData) => {
  methodNames.push(...initWebWorkerData.$methodNames$);
  initWebWorkerGlobal(self);
  initMainScriptsInWebWorker(initWebWorkerData.$initializeScripts$);
};

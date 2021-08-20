import type { InitWebWorkerData } from '../types';
import { initMainScriptsInWebWorker } from './worker-script';
import { initWebWorkerGlobal } from './worker-global';
import { webWorkerContext } from './worker-proxy';

export const initWebWorker = (self: Worker, initWebWorkerData: InitWebWorkerData) => {
  Object.assign(webWorkerContext, initWebWorkerData);
  initWebWorkerGlobal(self);
  initMainScriptsInWebWorker(webWorkerContext.$initializeScripts$);
};

import type { CreateWorker } from '../types';
import { debug, logMain } from '../utils';

export const createWorker: CreateWorker = (workerName?: string) => {
  const worker = new Worker(
    debug
      ? getDebugUrl()
      : URL.createObjectURL(
          new Blob([(globalThis as any).WORKER_BLOB], {
            type: 'text/javascript',
          })
        ),
    { name: 'Party Town' + (workerName ? ' (' + workerName + ')' : '') }
  );

  worker.onmessage = (evFromWorker) => {
    logMain(`from worker: ${evFromWorker.data}`);
  };

  return worker;
};

const getDebugUrl = () => {
  const allScripts = document.getElementsByTagName('script');
  const scriptElm =
    document.querySelector<HTMLScriptElement>('[src-partytown-worker]') ||
    allScripts[allScripts.length - 1];
  const workerAttr = scriptElm.getAttribute('src-partytown-worker') || 'partytown.debug.worker.js';
  return new URL(workerAttr, scriptElm.src + '/..');
};

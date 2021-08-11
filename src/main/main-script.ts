import { BootstrapWorkerData, CreateWorker, InitializeScriptData, MessageType } from '../types';
import { logMain } from '../utils';
import { sendToWorker } from './main-send';

export const initializeMainScripts = (
  doc: Document,
  workerData: BootstrapWorkerData,
  createWorker: CreateWorker
) => {
  const workers: Worker[] = [];
  const initializeScripts: { [workerName: string]: InitializeScriptData[] } = {};
  const partyScripts = doc.querySelectorAll<HTMLScriptElement>('script[type=partytown]');

  partyScripts.forEach((elm, $id$) => {
    const workerName = elm.getAttribute('worker') || '';
    const scriptData: InitializeScriptData = {
      $id$,
    };

    if (elm.hasAttribute('src')) {
      logMain(`send script url (${$id$})`);
      scriptData.$url$ = elm.src;
    } else {
      logMain(`send script content (${$id$})`);
      scriptData.$content$ = elm.innerHTML;
    }

    (initializeScripts[workerName] = initializeScripts[workerName] || []).push(scriptData);

    // change the attribute so it doesn't try to initialize again
    elm.setAttribute('type', 'partytown-script-' + $id$);
  });

  Object.keys(initializeScripts).forEach((workerName) => {
    const worker = createWorker(workerName);
    const workerInstanceData: BootstrapWorkerData = {
      ...workerData,
      $initializeScripts$: initializeScripts[workerName],
    };
    sendToWorker(worker, MessageType.BootstrapWorker, workerInstanceData);
    workers.push(worker);
  });

  return workers;
};

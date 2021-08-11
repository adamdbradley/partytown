import type { CreateWorker, BootstrapWorkerData } from '../types';
import { debug, logMain } from '../utils';
import { initializeMainScripts } from './main-script';
import { inspectMainInterfaces } from './inspect-interface';

export const bootstrapMain = (win: Window, doc: Document, createWorker: CreateWorker) => {
  logMain(`bootstrap main thread`);

  const workerData: BootstrapWorkerData = {
    $currentUrl$: win.location.href,
    $interfaces$: [],
    $memberNames$: [],
    $title$: doc.title,
  };

  if (debug) {
    // Included in debug only
    const debugAttrs = [
      'debug-define-methods',
      'debug-define-properties',
      'debug-method-calls',
      'debug-property-getters',
      'debug-property-setters',
    ];
    debugAttrs.forEach((attrName) => {
      if (doc.querySelector(`script[${attrName}]`)) {
        let propName = attrName
          .split('-')
          .map((a) => a.substr(0, 1).toUpperCase() + a.substr(1))
          .join('');
        propName = propName.substr(0, 1).toLowerCase() + propName.substr(1);
        (workerData as any)[propName] = true;
      }
    });
  }

  inspectMainInterfaces(win, doc, workerData);

  initializeMainScripts(doc, workerData, createWorker);
};

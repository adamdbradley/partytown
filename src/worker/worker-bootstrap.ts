import type { BootstrapWorkerData, WorkerGlobal } from '../types';
import { createDocument } from './dom';
import { initializeScript } from './worker-script';
import { debug, logWorker } from '../utils';
import { replicateInterfaces } from './replicate-interface';

export const bootstrapWorker = (self: WorkerGlobal, bootstrapWorkerData: BootstrapWorkerData) => {
  Object.assign(self, bootstrapWorkerData);

  const loc = new URL(self.$currentUrl$);

  debug && logWorker(`bootstrap worker for ${loc.pathname}`);

  self.window = self.parent = self.self = self.top = self;
  self.location = loc;

  replicateInterfaces(self);

  const doc = (self.document = createDocument());
  doc.location = loc;

  bootstrapWorkerData.$initializeScripts$!.map((data) => initializeScript(self, data));
};

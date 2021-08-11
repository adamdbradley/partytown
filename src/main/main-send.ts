import type { MessageType } from '../types';

export const sendToWorker = (worker: Worker, type: MessageType, data: any) =>
  worker.postMessage([type, data]);

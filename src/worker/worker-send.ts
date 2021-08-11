import type { MessageType } from '../types';

export const sendToMain = (self: Worker, type: MessageType, data: any) =>
  self.postMessage([type, data]);

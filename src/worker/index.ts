import { MessageType, TransferMessage } from '../types';
import { logWorker } from '../utils';
import { bootstrapWorker } from './worker-bootstrap';

logWorker(`loaded worker thread`);

self.onmessage = (evFromMain: MessageEvent<TransferMessage>) => {
  const transferMessageType = evFromMain.data[0];
  const transferMessageData = evFromMain.data[1];

  switch (transferMessageType) {
    case MessageType.BootstrapWorker: {
      bootstrapWorker(self as any, transferMessageData);
      break;
    }
  }
};

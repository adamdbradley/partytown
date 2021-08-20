import { PT_WEB_WORKER_URL } from '../constants';
import { debug } from '../utils';

export const createWebWorker = () =>
  new Worker(
    debug
      ? PT_WEB_WORKER_URL
      : URL.createObjectURL(
          new Blob([(globalThis as any).WEB_WORKER_BLOB], {
            type: 'text/javascript',
          })
        )
  );

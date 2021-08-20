import { createSandboxIframe } from './create-sandbox-iframe';
import { PT_SERVICE_WORKER_URL } from '../utils';

export const registerServiceWorker = async (
  mainDocument: Document,
  serviceWorker: ServiceWorkerContainer
) => {
  try {
    const scopePath = new URL(import.meta.url + '/..').pathname;
    const swRegistration = await serviceWorker.register(scopePath + PT_SERVICE_WORKER_URL, {
      scope: scopePath,
    });

    if (swRegistration.active) {
      createSandboxIframe(mainDocument, scopePath);
    } else if (swRegistration.installing) {
      swRegistration.installing.addEventListener('statechange', (ev) => {
        const swActivated = ev.target as any as ServiceWorker;
        if (swActivated.state === 'activated') {
          createSandboxIframe(mainDocument, scopePath);
        }
      });
    }
  } catch (e) {
    console.error('registerServiceWorker', e);
  }
};

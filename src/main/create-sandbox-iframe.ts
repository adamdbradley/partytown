import { PT_SANDBOX_URL } from '../utils';

export const createSandboxIframe = (mainDocument: Document, scopePath: string) => {
  const sandbox = mainDocument.createElement('iframe');
  sandbox.setAttribute('style', 'display:block;width:0;height:0;border:0;visibility:hidden');
  sandbox.setAttribute('aria-hidden', 'true');
  sandbox.src = scopePath + PT_SANDBOX_URL;
  mainDocument.body.appendChild(sandbox);
};

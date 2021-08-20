import type { InitializeScriptData } from '../types';

export const readMainScripts = (doc: Document) =>
  Array.from(
    doc.querySelectorAll<HTMLScriptElement>('script[data-partytown][type="text/plain"]')
  ).map((elm, $id$) => {
    const scriptData: InitializeScriptData = {
      $id$,
      $workerName$: elm.dataset.worker || '',
    };

    if (elm.hasAttribute('src')) {
      scriptData.$url$ = elm.src;
    } else {
      scriptData.$content$ = elm.innerHTML;
    }

    elm.dataset.partytown = $id$ as any;

    return scriptData;
  });

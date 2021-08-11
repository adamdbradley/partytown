import { logWorker } from '../utils';
import type { InitializeScriptData, WorkerGlobal } from '../types';
import type { Document } from './dom';

export const initializeScript = (self: WorkerGlobal, data: InitializeScriptData) => {
  if (data.$url$) {
    initializeScriptUrl(self, data.$id$, data.$url$);
  } else if (data.$content$) {
    initializeScriptContent(self, data.$id$, data.$content$);
  }
};

const initializeScriptContent = (self: WorkerGlobal, id: number, content: string) => {
  try {
    logWorker(`initialize script content (${id})`);
    const runScript = new Function(content);
    runScript();
  } catch (e) {
    console.error(`party foul, script content (${id}):`, e);
    console.error(content);
  }
};

const initializeScriptUrl = (self: WorkerGlobal, id: number, url: string) => {
  try {
    logWorker(`initialize script url (${id}): ${url}`);
  } catch (e) {
    console.error(`party foul, script url (${id}):`, e);
    console.error(`Script Url: ${url}`);
  }
};

export const importScriptUrl = (doc: Document, scriptUrl: string) => {
  doc.currentScript = scriptUrl;
  importScripts(scriptUrl);
  doc.currentScript = undefined;
};

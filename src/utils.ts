export const debug = (globalThis as any).partyTownDebug;

export const toLower = (str: string) => str.toLowerCase();

export const toUpper = (str: string) => str.toUpperCase();

export const logMain = (msg: string) =>
  debug && console.debug.apply(console, log('Main Thread 🌎', '#717171', msg));

export const logWorker = (msg: string) =>
  debug && console.debug.apply(console, log(self.name, '#3498db', msg));

const log = (prefix: string, color: string, msg: string) => [
  `%c${prefix}`,
  `background: ${color}; color: white; padding: 2px 3px; border-radius: 2px; font-size: 0.8em;`,
  msg,
];

export const startsWith = (str: string, searchString: string) => str.startsWith(searchString);

export const enum NodeType {
  ELEMENT_NODE = 1,
  TEXT_NODE = 3,
  COMMENT_NODE = 8,
  DOCUMENT_NODE = 9,
  DOCUMENT_TYPE_NODE = 10,
  DOCUMENT_FRAGMENT_NODE = 11,
}

export const enum NodeName {
  Comment = '#comment',
  Document = '#document',
  DocumentFragment = '#document-fragment',
  Text = '#text',
}

export const SVG_NS = 'http://www.w3.org/2000/svg';

export const HTML_NS = 'http://www.w3.org/1999/xhtml';

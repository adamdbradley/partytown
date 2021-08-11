import type { WorkerGlobal } from '../types';

import { debug, logWorker, NodeName, NodeType, toLower, toUpper } from '../utils';
import { proxy } from './proxy';
import { importScriptUrl } from './worker-script';

export const isElement = (n: Node): n is Element => n && n.$nodeType$ === NodeType.ELEMENT_NODE;

export const getElement = (n: Node | null): Element | null => (isElement(n!) ? n : null);

export const objOrNull = (obj: any) => obj || null;

const getLength = (arr: any[]) => arr.length;

const getFirst = (arr: any[]) => objOrNull(arr[0]);

const getLast = (arr: any[]) => objOrNull(arr[getLength(arr) - 1]);

const resolveHref = (url: string | undefined, node: Node) =>
  new URL(url || '/', node.$ownerDocument$.baseURI).href;

const insertBefore = (parentNode: Node, newNode: Node, referenceNode?: Node | null) => {
  if (newNode && newNode !== referenceNode) {
    const childNodes = parentNode.$childNodes$;
    newNode.remove();
    newNode.$parentNode$ = parentNode;
    if (parentNode.$ownerDocument$) newNode.$ownerDocument$ = parentNode.$ownerDocument$;

    if (referenceNode) {
      const index = childNodes.indexOf(referenceNode);
      if (index > -1) {
        childNodes.splice(index, 0, newNode);
      }
    } else {
      childNodes.push(newNode);
    }
  }
  return newNode;
};

const children = (n: Node): Element[] => n.$childNodes$.filter(isElement);

const getElementsByTagName = (
  host: Element,
  findTagName: string,
  foundElements: Element[] = []
) => {
  children(host).map((childElement) => {
    if (toUpper(childElement.$nodeName$) === toUpper(findTagName)) {
      foundElements.push(childElement);
    }
    getElementsByTagName(childElement, findTagName, foundElements);
  });
  return foundElements;
};

export class Node {
  $ownerDocument$: Document;
  $childNodes$: Node[];
  $nodeType$: NodeType;
  $nodeName$: string;
  $parentNode$: Node | null;

  constructor(ownerDocument: Document, nodeType: NodeType, nodeName: string) {
    this.$childNodes$ = [];
    this.$parentNode$ = null;
    this.$ownerDocument$ = ownerDocument;
    this.$nodeType$ = nodeType;
    this.$nodeName$ = nodeName;
  }

  appendChild(node: Node) {
    return insertBefore(this, node);
  }
  get childNodes() {
    return this.$childNodes$;
  }
  get firstChild() {
    return getFirst(this.$childNodes$);
  }
  insertBefore(newNode: Node, refNode: Node | null) {
    return insertBefore(this, newNode, refNode);
  }
  get lastChild() {
    return getLast(this.$childNodes$);
  }
  get nodeName() {
    return this.$nodeName$;
  }
  get nodeType() {
    return this.$nodeType$;
  }
  get ownerDocument() {
    return this.$ownerDocument$;
  }
  get parentNode(): Node | null {
    return objOrNull(this.$parentNode$);
  }
  removeChild(childNode: Node) {
    const nodes = this.$childNodes$;
    const index = nodes.indexOf(childNode);
    if (index > -1) nodes.splice(index, 1);
    return childNode;
  }
  remove() {
    const parentNode = this.$parentNode$;
    parentNode && parentNode.removeChild(this);
  }
}

export class Element extends Node {
  get children() {
    return children(this);
  }
  get childElementCount() {
    return getLength(children(this));
  }
  get firstElementChild(): Element | null {
    return getElement(this.firstChild);
  }
  get lastElementChild(): Element | null {
    return getElement(this.lastChild);
  }
  setAttribute(attrName: string, attrValue: string) {
    if (debug && self.debugMethodCalls) {
      logWorker(`${toUpper(this.$nodeName$)}.setAttribute("${attrName}", "${attrValue}")`);
    }
  }
  get parentElement() {
    return getElement(this.$parentNode$);
  }
  get localName() {
    return toLower(this.$nodeName$);
  }
  get tagName() {
    return this.$nodeName$;
  }
}

const elements: { [tagName: string]: any } = {
  SCRIPT: class extends Element {
    $src$?: string;
    get src() {
      return this.$src$;
    }
    set src(value) {
      const _this = this;
      _this.$src$ = resolveHref(value, _this);
      importScriptUrl(_this.$ownerDocument$, _this.$src$);
    }
  },
};

export const SVGElement = class SVGElement extends Element {};

export class Document extends Element {
  baseURI?: string;
  currentScript?: string;
  location?: URL;

  get body() {
    return getFirst(getElementsByTagName(this, 'BODY'));
  }
  createElement(tagName: string) {
    if (debug && self.debugMethodCalls) {
      logWorker(`document.createElement("${tagName}")`);
    }
    return createElement(this, tagName);
  }
  createElementNS(ns: string, tagName: string) {
    if (debug && self.debugMethodCalls) {
      logWorker(`document.createElementNS("${ns}", "${tagName}")`);
    }
    return new SVGElement(this, NodeType.ELEMENT_NODE, toUpper(tagName));
  }
  get documentElement() {
    return this.lastElementChild;
  }
  getElementsByTagName(tagName: string) {
    if (debug && self.debugMethodCalls) {
      logWorker(`document.getElementsByTagName("${tagName}")`);
    }
    return getElementsByTagName(this, tagName);
  }
  get head() {
    return getFirst(getElementsByTagName(this, 'HEAD'));
  }
}

export const createElement = (ownerDocument: Document, tagName: string) => {
  tagName = toUpper(tagName);
  const ElementCstr = elements[tagName] || Element;
  return proxy(new ElementCstr(ownerDocument, NodeType.ELEMENT_NODE, tagName));
};

export const createDocument = (): Document => {
  const doc = proxy(new Document(null!, NodeType.DOCUMENT_NODE, NodeName.Document));

  const documentElement = createElement(doc, 'HTML');
  const head = createElement(doc, 'HEAD');
  const title = createElement(doc, 'TITLE');
  const script = createElement(doc, 'SCRIPT');
  const body = createElement(doc, 'BODY');

  documentElement.$ownerDocument$ = doc;

  insertBefore(doc, documentElement);
  insertBefore(documentElement, head);
  insertBefore(head, title);
  insertBefore(head, script);
  insertBefore(documentElement, body);

  return doc;
};

declare const self: WorkerGlobal;

type DefineElementProps = {
  [propName: string]:
    | ((instance: Element) => any)
    | [(instance: Element) => any, (instance: Element, value: any) => any];
};

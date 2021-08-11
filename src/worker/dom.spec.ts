import type { WorkerGlobal } from '../types';
import { createDocument, createElement, getElement, isElement, Document } from './dom';

describe('dom', () => {
  let self: WorkerGlobal;
  let doc: Document;

  beforeEach(() => {
    self = {} as any;
    doc = {} as any;
  });

  it('insertBefore, null', () => {
    const parent = createElement(doc, 'parent');
    expect(parent.childNodes).toHaveLength(0);
    const child = createElement(doc, 'child');
    const inserted = parent.insertBefore(child, null);
    expect(child).toBe(inserted);
    expect(parent.childNodes).toHaveLength(1);
  });

  it('appendChild', () => {
    const parent = createElement(doc, 'parent');
    expect(parent.childNodes).toHaveLength(0);
    const child = createElement(doc, 'child');
    const inserted = parent.appendChild(child);
    expect(child).toBe(inserted);
    expect(parent.childNodes).toHaveLength(1);
  });

  it('firstChild/firstElementChild', () => {
    const parent = createElement(doc, 'parent');
    const child = createElement(doc, 'child');
    const childA = createElement(doc, 'child-a');
    const childB = createElement(doc, 'child-b');
    parent.insertBefore(childA, null);
    parent.insertBefore(childB, null);
    expect(parent.firstChild).toBe(childA);
    expect(parent.firstElementChild).toBe(childA);
  });

  it('lastChild/lastElementChild', () => {
    const parent = createElement(doc, 'parent');
    const childA = createElement(doc, 'child-a');
    const childB = createElement(doc, 'child-b');
    parent.insertBefore(childA, null);
    parent.insertBefore(childB, null);
    expect(parent.lastChild).toBe(childB);
    expect(parent.lastElementChild).toBe(childB);
  });

  it('create element', () => {
    const elm = createElement(doc, 'HTML');
    expect(elm.nodeName).toBe('HTML');
    expect(elm.tagName).toBe('HTML');
    expect(elm.localName).toBe('html');
    expect(elm.childNodes).toHaveLength(0);
    expect(elm.children).toHaveLength(0);
    expect(elm.childElementCount).toBe(0);
    expect(elm.parentNode).toBe(null);
    expect(elm.ownerDocument).toBe(doc);
    expect(elm.parentElement).toBe(null);
  });

  it('create document', () => {
    const doc = createDocument();
    expect(doc.nodeName).toBe('#document');
    expect(doc.nodeType).toBe(9);
    expect(doc.ownerDocument).toBe(null);
    expect(doc.parentNode).toBe(null);
    expect(doc.parentElement).toBe(null);
    expect(doc.childNodes).toHaveLength(1);
    expect(doc.documentElement).toBe(doc.childNodes[0]);
    expect(doc.documentElement?.ownerDocument).toBe(doc);
    expect(doc.childNodes[0].nodeName).toBe('HTML');
    expect(doc.childNodes[0].childNodes).toHaveLength(2);
    expect(doc.childNodes[0].childNodes[0].nodeName).toBe('HEAD');
    expect(doc.childNodes[0].childNodes[1].nodeName).toBe('BODY');
    expect(doc.head.tagName).toBe('HEAD');
    expect(doc.head.ownerDocument).toBe(doc);
    expect(doc.body.tagName).toBe('BODY');
    expect(doc.body.ownerDocument).toBe(doc);
    expect(doc.head.firstElementChild!.nodeName).toBe('TITLE');
    expect(doc.head.lastChild!.nodeName).toBe('SCRIPT');
    expect(doc.head.lastChild!.ownerDocument).toBe(doc);
  });

  it('getElement', () => {
    expect(getElement(null as any)).toBe(null);
    expect(getElement({} as any)).toBe(null);
    expect(getElement({ $nodeType$: 3 } as any)).toBe(null);
    expect(getElement({ $nodeType$: 1 } as any)!.$nodeType$).toBe(1);
  });

  it('isElement', () => {
    expect(isElement(null as any)).toBeFalsy();
    expect(isElement({} as any)).toBeFalsy();
    expect(isElement({ $nodeType$: 3 } as any)).toBeFalsy();
    expect(isElement(createElement(doc, 'div'))).toBe(true);
  });
});

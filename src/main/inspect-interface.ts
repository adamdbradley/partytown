import {
  InterfaceData,
  InterfaceId,
  Interface,
  MainInterface,
  BootstrapWorkerData,
} from '../types';
import { startsWith, SVG_NS } from '../utils';

export const inspectMainInterfaces = (
  win: Window,
  doc: Document,
  workerData: BootstrapWorkerData
) => {
  const docImp = doc.implementation.createHTMLDocument();

  const mainInterfaces: MainInterface[] = [
    [InterfaceId.Document, 'Document', docImp],
    [InterfaceId.Node, 'Node', docImp.createTextNode('')],
    [InterfaceId.Element, 'Element', docImp.createElement('i')],
    [InterfaceId.SVGElement, 'SVGElement', docImp.createElementNS(SVG_NS, 'svg')],
    [InterfaceId.window, 'window', win],
  ];

  mainInterfaces.forEach((mainInterface) =>
    inspectMainInterface(
      workerData.$memberNames$,
      workerData.$interfaces$,
      mainInterface[0],
      mainInterface[1],
      mainInterface[2]
    )
  );
};

const inspectMainInterface = (
  memberNames: string[],
  interfaces: InterfaceData[],
  interfaceId: number,
  interfaceName: string,
  instanceOrInterface: any
) => {
  let interfaceData: InterfaceData;
  let memberNameId: number;
  let memberName: string;
  let value: any;
  let type: string;

  interfaces[interfaceId] = interfaceData = [
    interfaceName,
    [
      /* methods */
    ],
    [
      /* getter/setter props */
    ],
    {
      /* interface props */
    },
    {
      /* instance values */
    },
  ];

  for (memberName in instanceOrInterface) {
    if (isValidMemberName(memberName)) {
      memberNameId = memberNames.indexOf(memberName);
      if (memberNameId < 0) {
        memberNameId = memberNames.push(memberName) - 1;
      }

      value = instanceOrInterface[memberName];
      type = typeof value;

      if (type === 'function') {
        // methods
        interfaceData[Interface.Method].push(memberNameId);
      } else if (type === 'object' && value != null) {
        // objects
        if (value.nodeType) {
          // property value is a text node or element
          interfaceData[Interface.GetterSetter].push(memberNameId);
        } else {
          // propertyInterfaceName = value.constructor.name;
          // if (INTERFACE_WHITELIST[propertyInterfaceName]) {
          //   interfaceData[InterfaceKey.Prop][memberNameId] = readMainInterface(
          //     ctx,
          //     propertyInterfaceName,
          //     value
          //   );
          // }
        }
      } else {
        // properties
        interfaceData[Interface.GetterSetter].push(memberNameId);
        if (type === 'string' || type === 'boolean' || type === 'number') {
          interfaceData[Interface.InstanceValues][memberNameId] = value;
        }
      }
    }
  }

  return interfaceId;
};

const isValidMemberName = (memberName: string) =>
  !(
    startsWith(memberName, 'on') ||
    startsWith(memberName, 'webkit') ||
    startsWith(memberName, 'moz') ||
    startsWith(memberName, 'aria') ||
    memberName[0].toUpperCase() === memberName[0]
  );

const INTERFACE_WHITELIST: { [k: string]: number } = {
  DOMStringMap: 1,
  DOMTokenList: 1,
  HTMLCollection: 1,
  NamedNodeMap: 1,
  NodeList: 1,
};

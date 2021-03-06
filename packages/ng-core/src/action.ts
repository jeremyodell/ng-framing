let controllers: any[] = [];
const devTools: any = _createReduxDevtoolsExtension();
/* tslint:disable */
export function Action(description: string = null, log: boolean = true): Function {
  return function (target: Function, propertyKey: string, descriptor: PropertyDescriptor): PropertyDescriptor {
    if (descriptor === undefined) {
      descriptor = Object.getOwnPropertyDescriptor(target, propertyKey);
    }

    let originalMethod = descriptor.value;

    descriptor.value = function (): void {
      let args = [];
      let controller: any = this;
      let controllerIndex: number;

      if (controllers.indexOf(controller) <= -1) {
        controllers.push(controller);
        controllerIndex = controllers.length - 1;
      } else {
        controllerIndex = controllers.indexOf(controller);
      }

      for (let _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
      }

      listenForChanges();

      originalMethod.apply(controller, args);

      // Need to log after the method has been ran and state is updated
      if (log) {
        let state = {
          controllerIndex: controllerIndex,
          value: controller.model,
        }
        devTools.send((description || propertyKey), state);
      }
      controller.markForCheck();
    };

    return descriptor;
  };
}

/**
 * Listen for message events being broadcast from the redux devTools
 * Changes state on the correct controller to match the state changes broadcast
 */
function listenForChanges(): void {
  let connection = devTools.connect();
  connection.subscribe(
    (message: any) => {
      if (!!message.state) {
        let messageState: any = JSON.parse(message.state);
        let messageController: any = controllers[messageState.controllerIndex]

        for (let prop in messageController.model) {
          messageController.model[prop] = messageState.value[prop];
        }

        messageController.markForCheck();
      }
    }
  )
}

/**
 * Returns correct instance of redux dev tools installed
 * 
 * @export
 * @returns 
 */
export function _createReduxDevtoolsExtension() {
  const legacyExtensionKey = 'devToolsExtension';
  const extensionKey = '__REDUX_DEVTOOLS_EXTENSION__';

  if (typeof window === 'object' && typeof (window as any)[legacyExtensionKey] !== 'undefined') {
    return (window as any)[legacyExtensionKey];
  }
  else if (typeof window === 'object' && typeof (window as any)[extensionKey] !== 'undefined') {
    return (window as any)[extensionKey];
  }
  else {
    return null;
  }
}

export type SupportedType<T> = { new (...args: any[]): T } | Function;

export interface UseContainerOptions {
  fallback?: boolean;
  fallbackOnErrors?: boolean;
}

class DefaultContainer {
  private instances: Array<{ type: Function; object: any }> = [];

  get<T>(someClass: SupportedType<T>): T {
    let instance = this.instances.find(it => it.type === someClass);
    if (!instance) {
      instance = { type: someClass, object: new (someClass as any)() };
      this.instances.push(instance);
    }

    return instance.object;
  }
}

export abstract class IOCContainer {
  static userContainer?: { get<T>(someClass: SupportedType<T>): T };
  static userContainerOptions: UseContainerOptions;
  private static defaultContainer = new DefaultContainer();

  static restoreDefault() {
    this.userContainer = undefined;
    this.userContainerOptions = {};
  }

  static useContainer(
    iocContainer: { get(someClass: any): any },
    options: UseContainerOptions = {},
  ) {
    this.userContainer = iocContainer;
    this.userContainerOptions = options;
  }

  static getInstance<T = any>(someClass: SupportedType<T>): T {
    if (this.userContainer) {
      try {
        const instance = this.userContainer.get(someClass);
        if (instance) {
          return instance;
        }

        if (!this.userContainerOptions || !this.userContainerOptions.fallback) {
          return instance;
        }
      } catch (error) {
        if (!this.userContainerOptions || !this.userContainerOptions.fallbackOnErrors) {
          throw error;
        }
      }
    }
    return this.defaultContainer.get<T>(someClass);
  }
}

export function useContainer(
  iocContainer: { get(someClass: any): any },
  options: UseContainerOptions = {},
) {
  IOCContainer.useContainer(iocContainer, options);
}

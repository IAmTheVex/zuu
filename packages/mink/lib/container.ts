export interface UseContainerOptions {
    fallback?: boolean;

    fallbackOnErrors?: boolean;

}

const defaultContainer: { get<T>(someClass: { new (...args: any[]): T }|Function): T } = new (class {
    private instances: { type: Function, object: any }[] = [];
    get<T>(someClass: { new (...args: any[]): T }): T {
        let instance = this.instances.find(instance => instance.type === someClass);
        if (!instance) {
            instance = { type: someClass, object: new someClass() };
            this.instances.push(instance);
        }

        return instance.object;
    }
})();

let userContainer: { get<T>(someClass: { new (...args: any[]): T }|Function): T };
let userContainerOptions: UseContainerOptions;

export function useContainer(iocContainer: { get(someClass: any): any }, options?: UseContainerOptions) {
    userContainer = iocContainer;
    userContainerOptions = options;
}

export function getFromContainer<T>(someClass: { new (...args: any[]): T }|Function): T {
    if (userContainer) {
        try {
            const instance = userContainer.get(someClass);
            if (instance)
                return instance;

            if (!userContainerOptions || !userContainerOptions.fallback)
                return instance;

        } catch (error) {
            if (!userContainerOptions || !userContainerOptions.fallbackOnErrors)
                throw error;
        }
    }
    return defaultContainer.get<T>(someClass);
}

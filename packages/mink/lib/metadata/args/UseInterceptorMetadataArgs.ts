export interface UseInterceptorMetadataArgs {
    target: Function;
    method?: string;
    interceptor: Function;
    global?: boolean;
    priority?: number;

}
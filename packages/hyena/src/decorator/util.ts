export type Class<T> = { new(...agrs: any[]): T };

export function camelToDashes(s: string) {
    return (s.replace(/\.?([A-Z]+)/g, function (x,y){return "-" + y.toLowerCase()}).replace(/^-/, ""));
}
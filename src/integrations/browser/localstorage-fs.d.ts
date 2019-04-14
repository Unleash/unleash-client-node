declare module "localstorage-fs" {
    function readFile(path: string, encoding: string, callback: (err: any, data: any) => void): void;
    
    function writeFile(path: string, data: any, callback: (err: any) => void): void;
}

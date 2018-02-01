declare interface Parser {
    parseToJSON(pngData: string, cb?: Function): Object;
    loadFile();
}
import * as fs from 'fs'

export interface IParseLog {
  msec: number;
  timeLocal: string;
  remoteAddr: string;
  argUrl: string;
  argUser: string;
}

export class FileParser {
  private readonly _filePath1: string = './counter (1).log';
  private readonly _filePath2: string = './counter.log.1';
  private readonly _text: string = '';

  private _log: IParseLog[] = [];

  constructor(filePath1?: string, filePath2?: string) {
    this._filePath2 = filePath2 || this._filePath2;
    let buffer = fs.readFileSync(this._filePath2);
    this._text = buffer.toString();

    this._filePath1 = filePath1 || this._filePath1;
    buffer = fs.readFileSync(this._filePath1);
    this._text += "\n" + buffer.toString();
  }

  public parse() {
    const lines = this.text.split("\n");
    lines.forEach(line => this.parseLine(line));
  }

  private parseLine(logLine: string) {
    if (!logLine) { return; }
    const [ msec, timeLocal, UTS, remoteAddr, argUrl, argUser ] = logLine.split(" ");
    this._log.push({ msec: +msec, timeLocal, remoteAddr, argUrl, argUser });
  }

  get text() {
    return this._text;
  }

  get log() {
    return this._log;
  }
}

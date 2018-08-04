import * as fs from 'fs'

export interface IParseLog {
  msec: string;
  timeLocal: string;
  remoteAddr: string;
  argUrl: string;
  argUser: string;
}

export class FileParser {
  private readonly _filePath: string = './counter.log';
  private readonly _text: string = '';

  private _log: Map<string, IParseLog> = new Map<string, IParseLog>();

  constructor(filePath?: string) {
    this._filePath = filePath || this._filePath;
    const buffer = fs.readFileSync(this._filePath);
    this._text = buffer.toString();
  }

  public parse() {
    const lines = this.text.split("\n");
    lines.forEach(line => this.parseLine(line));
  }

  private parseLine(logLine: string) {
    if (!logLine) { return; }
    const [ msec, timeLocal, UTS, remoteAddr, argUrl, argUser ] = logLine.split(" ");
    this._log.set(argUser, { msec, timeLocal, remoteAddr, argUrl, argUser });
  }

  get text() {
    return this._text;
  }

  get log() {
    return this._log;
  }
}

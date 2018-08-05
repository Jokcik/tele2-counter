import {IParseLog} from './parser';
import {LogType} from './mongoose';

export interface IData {
  date: Date;
  count: number;
  avg: number;

  type: LogType;
}

export interface IResultData {
  videos: IData[];
  streams: IData[];
}

export class Utils {
  public static getSumValue(obj: Object) {
    const keys = Object.keys(obj);
    const value = +keys.reduce((previousValue, currentValue) => previousValue + obj[currentValue], 0);

    return [value, keys.length];
  }

  public static transformFromMinutesToHour(data: IResultData): IResultData {
    const resultStream: IData[] = [];
    const resultVideo: IData[] = [];
    const oneHour = 60 * 60 * 1000;
    console.log(data);
    let lastDate = 0;
    let count = 0;
    let avg = 0;
    for (let value of data.streams) {
      if (+value.date - oneHour > lastDate && count && avg) {
        resultStream.push({ date: value.date, count: count, avg: avg, type: LogType.STREAM });
        count = 0;
        avg = 0;
        lastDate = +value.date;
      }

      count += value.count;
      avg += value.avg;
    }

    lastDate = 0;
    count = 0;
    for (let value of data.videos) {
      if (+value.date - oneHour > lastDate && count && avg) {
        resultVideo.push({ date: value.date, count, avg, type: LogType.VIDEO });
        count = 0;
        avg = 0;
        lastDate = +value.date;
      }

      count += value.count;
      avg += value.avg;
    }

    return { videos: resultVideo, streams: resultStream };
  }

  public static transformToVideosAndStreamMinutes(logs: IParseLog[], startDate?: number): IResultData {
    const resultStream: IData[] = [];
    const resultVideo: IData[] = [];

    console.log(startDate);
    let lastDate = startDate || 0;
    let lastStreamUsers: Object = {}; let lastNicknameStreamer = {};
    let lastVideoUsers: Object = {}; let lastNicknameVideo = {};
    const msec1Min = 5 * 60; // счиитаем, что 1 просмотр в 5 минут

    let i = 0;
    console.log('ALL', logs.length);
    for (let log of logs) {
      i += 1;
      // console.log(i, log.msec, log.msec - msec1Min, lastDate, log.msec - msec1Min >= lastDate);
      if (log.msec - msec1Min > lastDate) {
        lastDate = log.msec;
        const [countStream] = Utils.getSumValue(lastStreamUsers); const streamUsers = Object.keys(lastNicknameStreamer).length;
        const [countVideo] = Utils.getSumValue(lastVideoUsers); const videoUsers = Object.keys(lastNicknameVideo).length;

        if (countStream) {
          resultStream.push({ date: new Date(lastDate * 1000), count: countStream, avg: Math.round(countStream / streamUsers), type: LogType.STREAM });
          lastStreamUsers = {};
          lastNicknameStreamer = {};
        }

        if (countVideo) {
          resultVideo.push({ date: new Date(lastDate * 1000), count: countVideo, avg: Math.round(countVideo / videoUsers), type: LogType.VIDEO  });
          lastVideoUsers = {};
          lastNicknameVideo = {};
        }
      }

      if (log.argUrl.startsWith('/stream/')) {
        let value = log.argUrl.split("/")[2];
        lastStreamUsers[log.argUser] = lastStreamUsers[log.argUser] || 0;
        lastStreamUsers[log.argUser] = 1;
        lastNicknameStreamer[value] = 1;
      }

      if (log.argUrl.startsWith('/videos/')) {
        let value = log.argUrl.split("/")[2];
        lastVideoUsers[log.argUser] = lastVideoUsers[log.argUser] || 0;
        lastVideoUsers[log.argUser] = 1;
        lastNicknameVideo[value] = 1;
      }
    }

    console.log(lastStreamUsers, lastVideoUsers);

    return { videos: resultVideo, streams: resultStream };
  }
}
import {IParseLog} from './parser';
import {LogType} from './mongoose';

export interface IData {
  date: Date;
  count: number;
  type: LogType;

  avg?: number;
  nickname?: string;
  user?: string;
}

export interface IResultData {
  videos: IData[];
  users: IData[];
  streams: IData[];
  streamer: IData[];
}

export class Utils {
  private static readonly msecNewViewers = 5 * 60; // считаем, что через 5 минут новый просмотр

  public static getSumValue(obj: Object) {
    const keys = Object.keys(obj);
    const value = +keys.reduce((previousValue, currentValue) => previousValue + obj[currentValue], 0);

    return [value, keys.length];
  }

  public static transformFromMinutesToHour(data: IResultData): IResultData {
    const resultStream: IData[] = [];
    const resultVideo: IData[] = [];
    const resultStreamer: IData[] = [];
    const resultUsers: IData[] = [];
    const oneHour = 60 * 60 * 1000;

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
    avg = 0;
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

    lastDate = 0;
    count = 0;
    for (let value of data.streamer) {
      if (+value.date - oneHour > lastDate && count ) {
        resultStreamer.push({ date: value.date, count, type: LogType.STREAMER, nickname: value.nickname });
        count = 0;
        lastDate = +value.date;
      }

      count += value.count;
    }

    const array = data.users.sort((a, b) => a.user.localeCompare(b.user) || (+a.date - +b.date));
    lastDate = 0;
    count = 0;
    let lastUser = array[0] ? array[0].user : 0;
    for (let value of array) {
      if (value.user != lastUser) {
        lastDate = +value.date;
      }

      lastUser = value.user;
      if (+value.date - oneHour > lastDate && count ) {
        resultUsers.push({ date: value.date, count, type: LogType.USERS, user: value.user });
        count = 0;
        lastDate = +value.date;
      }

      count += value.count;
    }

    return { videos: resultVideo, streams: resultStream, streamer: resultStreamer, users: resultUsers };
  }

  public static transformToVideosAndStreamMinutes(logs: IParseLog[], startDate?: any): IResultData {
    let resultStream: IData[];
    let resultVideo: IData[];
    let resultStreamer: IData[];
    let resultUsers: IData[];

    let lastDateVideo = (+startDate.video / 1000) || 0;
    let lastDateStream = (+startDate.stream / 1000) || 0;
    let lastDateStreamer = (+startDate.streamer / 1000) || 0;
    let lastDateUsers = (+startDate.users / 1000) || 0;

    resultStream = this.getStream(logs, lastDateStream);
    resultVideo = this.getVideo(logs, lastDateVideo);
    resultStreamer = this.getStreamer(logs, lastDateStreamer);
    resultUsers = this.getUsers(logs, lastDateUsers);

    return { videos: resultVideo, streams: resultStream, streamer: resultStreamer, users: resultUsers };
  }

  private static getArgName(log: IParseLog, url: string) {
    if (!log.argUrl.startsWith(url)) { return null; }
    return log.argUrl.split("/")[2];
  }

  private static getStreamer(logs: IParseLog[], lastDate: number) {
    const result: IData[] = [];
    const patternStreamer = "/stream/";

    let nicknameUsers = {};

    for (let log of logs) {
      if (log.msec - Utils.msecNewViewers > lastDate) {
        const streamUsers = Object.keys(nicknameUsers).length;

        lastDate = log.msec;
        const date = new Date(lastDate * 1000);

        if (streamUsers) {
          Object.keys(nicknameUsers).forEach(key => {
            result.push({ date, count:  nicknameUsers[key], type: LogType.STREAMER, nickname: key })
          });

          nicknameUsers = {};
        }
      }

      const nickname = this.getArgName(log, patternStreamer);
      if (!nickname) { continue; }

      nicknameUsers[nickname] = (nicknameUsers[nickname] || 0) + 1;
    }

    return result;
  }

  private static getUsers(logs: IParseLog[], lastDate: number) {
    const result: IData[] = [];

    let activeUsers: Object = {};

    for (let log of logs) {
      if (log.msec - Utils.msecNewViewers > lastDate) {
        const countUsers = Object.keys(activeUsers).length;

        lastDate = log.msec;
        const date = new Date(lastDate * 1000);

        if (countUsers) {
          Object.keys(activeUsers).forEach(key => {
            result.push({ date, count: activeUsers[key], type: LogType.USERS, user: key });
          });
          activeUsers = {};
        }
      }

      if (!!parseInt(log.argUser)) {
        activeUsers[log.argUser] = (activeUsers[log.argUser] || 0) + 1;
      }
    }

    return result;
  }

  private static getVideo(logs: IParseLog[], lastDate: number) {
    const result: IData[] = [];
    const patternVideo = "/videos/";

    let viewerUsers: Object = {};
    let videoIds = {};

    for (let log of logs) {
      if (log.msec - Utils.msecNewViewers > lastDate) {
        const countVideo = Object.keys(viewerUsers).length;
        const videoUsers = Object.keys(videoIds).length;

        lastDate = log.msec;
        const date = new Date(lastDate * 1000);

        if (countVideo) {
          result.push({ date, count: countVideo, avg: Math.round(countVideo / videoUsers), type: LogType.VIDEO  });
          viewerUsers = {};
          videoIds = {};
        }
      }

      const id = this.getArgName(log, patternVideo);
      if (!id) { continue; }

      viewerUsers[log.argUser] = (viewerUsers[log.argUser] || 0) + 1;
      videoIds[id] = (videoIds[id] || 0) + 1;
    }

    return result;
  }

  private static getStream(logs: IParseLog[], lastDate: number) {
    const result: IData[] = [];
    const patternStream = "/stream/";

    let viewerUsers: Object = {};
    let nicknameUsers = {};

    for (let log of logs) {
      if (log.msec - Utils.msecNewViewers > lastDate) {
        const countStream = Object.keys(viewerUsers).length;
        const streamUsers = Object.keys(nicknameUsers).length;

        lastDate = log.msec;
        const date = new Date(lastDate * 1000);

        if (countStream) {
          result.push({ date, count: countStream, avg: Math.round(countStream / streamUsers), type: LogType.STREAM });

          viewerUsers = {};
          nicknameUsers = {};
        }
      }

      const nickname = this.getArgName(log, patternStream);
      if (!nickname) { continue; }

      viewerUsers[log.argUser] = (viewerUsers[log.argUser] || 0) + 1;
      nicknameUsers[nickname] = (nicknameUsers[nickname] || 0) + 1;
    }

    return result;
  }
}
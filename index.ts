import {FileParser} from './parser';
import {MongoDb} from './mongoose';
import {Utils} from './utils';

async function start() {
  const parser = new FileParser();
  parser.parse();

  const db = new MongoDb();
  const conn = await db.connect();

  const lastDate = await db.getOneLastDate();

  const logs = parser.log;
  let result = Utils.transformToVideosAndStreamMinutes(logs, lastDate);
  result = Utils.transformFromMinutesToHour(result);

  if (result.streams.length && result.streams.length === 1 && +result.streams[0].date - +lastDate.stream <= 3600 * 1000) {
    result.streams = [];
  }


  if (result.videos.length && result.videos.length === 1 && +result.videos[0].date - +lastDate.video <= 3600 * 1000) {
    result.videos = [];
  }

  if (result.streamer.length && result.streamer.length === 1 && +result.streamer[0].date - +lastDate.streamer <= 3600 * 1000) {
    result.streamer = [];
  }

  await db.saveVideos(result.videos);
  await db.saveChannels(result.streams);
  await db.saveStreamers(result.streamer);

  conn.disconnect();
}

start();
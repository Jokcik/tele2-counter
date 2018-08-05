import * as mongoose from 'mongoose';
import {IData} from './utils';

const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;

export enum LogType {
  STREAM = "Stream",
  VIDEO = "Video",
  USERS = "Users",
  STREAMER = "Streamer",
}

const logInfoSchema = new Schema({
  _id: ObjectId,
  date: {
    type: Date,
  },
  type: {
    type: String,
    enum:  ["Stream", "Video", "Streamer", "Users"],
    required: true
  },
  user: ObjectId,
  nickname: String,
  count: Number,
  avg: Number
});

export class MongoDb {
  private readonly logInfoModel = mongoose.model('LogInfo', logInfoSchema);

  public async connect() {
    mongoose.set('debug', true);
    return await mongoose.connect('mongodb://localhost:27017/cw-dev',   {useNewUrlParser: true });
  }

  public async getOneLastDate(): Promise<any> {
    const videoObjDate: any = await this.logInfoModel.findOne({type: LogType.VIDEO}, { date: 1 }).sort({date: "DESC"});
    const streamObjDate: any = await this.logInfoModel.findOne({type: LogType.STREAM}, { date: 1 }).sort({date: "DESC"});
    const streamerObjDate: any = await this.logInfoModel.findOne({type: LogType.STREAMER}, { date: 1 }).sort({date: "DESC"});
    const usersObjDate: any = await this.logInfoModel.findOne({type: LogType.USERS}, { date: 1 }).sort({date: "DESC"});

    return {
      video: videoObjDate && videoObjDate.date,
      users: usersObjDate && usersObjDate.date,
      stream: streamObjDate && streamObjDate.date,
      streamer: streamerObjDate && streamerObjDate.date,
    };
  }

  public async saveVideos(videos: IData[]) {
    const log = await this.logInfoModel.insertMany(videos);
    return log;
  }

  public async saveChannels(channels: IData[]) {
    const log = await this.logInfoModel.insertMany(channels);
    return log;
  }

  public async saveStreamers(streamers: IData[]) {
    const log = await this.logInfoModel.insertMany(streamers);
    return log;
  }

  public async saveUsers(users: IData[]) {
    const log = await this.logInfoModel.insertMany(users);
    return log;
  }
}


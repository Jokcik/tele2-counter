import * as mongoose from 'mongoose';
import {IData} from './utils';

const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;

export enum LogType {
  STREAM = "Stream",
  VIDEO = "Video",
}

const logInfoSchema = new Schema({
  _id: ObjectId,
  date: {
    type: Date,
  },
  type: {
    type: String,
    enum:  ["Stream", "Video"],
    required: true
  },
  count: Number,
  avg: Number
});

export class MongoDb {
  private readonly logInfoModel = mongoose.model('LogInfo', logInfoSchema);

  public async connect() {
    mongoose.set('debug', true);
    return await mongoose.connect('mongodb://localhost:27017/cw-dev',   {useNewUrlParser: true });
  }

  public async getOneLastDate(): Promise<Date> {
    const videoOne = await this.logInfoModel.findOne({type: LogType.VIDEO}, { date: 1 }).sort({date: "DESC"});
    const streamOne = await this.logInfoModel.findOne({type: LogType.STREAM}, { date: 1 }).sort({date: "DESC"});


    const videoDate = videoOne ? videoOne.toObject().date : {};
    const streamDate = streamOne ? streamOne.toObject().date : {};
    
    console.log(videoDate, streamDate, +videoDate >= streamDate.date ? videoDate : streamDate);

    return +videoDate >= streamDate.date ? videoDate : streamDate;
  }

  public async saveVideos(videos: IData[]) {
    const log = await this.logInfoModel.insertMany(videos);
    return log;
  }

  public async saveChannels(channels: IData[]) {
    const log = await this.logInfoModel.insertMany(channels);
    return log;
  }
}


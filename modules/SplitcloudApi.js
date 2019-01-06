import axios from 'axios';
import CacheDecorator from '../helpers/cacheDecorator';
import SoundCloudApi from './SoundcloudApi';

class SplitCloud {

  constructor(opts){
    this.endpoint = 'www.splitcloud-app.com/charts';
    this.scApi = new SoundCloudApi(opts);
    this.timeout = 4*1e3;
    this.extendedTimeout = 10*1e3;
    
    this.initializeCacheDecorators();
  }
  initializeCacheDecorators(){

    this.getWeeklyPopular = CacheDecorator.withCache(
      this.getWeeklyPopular.bind(this),
      'getWeeklyPopular',
      3600*1e3
    );
  }
  request(...args){
    let requestObj = this._buildRequestObject(...args);
    console.log('splitcloud api request object',requestObj);
    return axios(requestObj);
  }
  _toQueryString(paramObj){
    return Object.keys(paramObj)
      .filter((key) => paramObj[key] != undefined)
      .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(paramObj[key])}`)
      .join('&');
  }
  _buildRequestObject(route,params = {},method = SplitCloud.methods.GET,cancelToken,timeout){
    let urlParams = method === SplitCloud.methods.GET && Object.keys(params).length ?
       '?' + this._toQueryString(params) : '';
    
    let reqObj = {
      method : method ,
      url : `http://${this.endpoint}/${route}${urlParams}`,
      timeout : timeout || this.timeout,
      cancelToken
    };
    if (method !== SplitCloud.methods.GET) {
      reqObj.data = params;
    }
    return reqObj;
  }
  _extractCancelToken(opts){
    opts = {...opts};
    if(typeof opts != 'object' || !('cancelToken' in opts) ){
      return [undefined,opts];
    }
    let cancelToken;
    if(typeof opts == 'object' && opts.cancelToken){
      cancelToken = opts.cancelToken;
      delete opts.cancelToken;
    }
    return [cancelToken,opts];
  }
  
  getWeeklyPopular(opts){
    let [cancelToken,queryOpts] = this._extractCancelToken(opts);
    return this.request('weekly_popular.json', queryOpts, SplitCloud.methods.GET ,cancelToken).then(resp => {
      return resp.data
        .map(this.scApi.normalizeStreamUrlProperty)
        .map(this.scApi.transformTrackPayload);
    });
  }

  getWeeklyTrending(opts){
    let [cancelToken,queryOpts] = this._extractCancelToken(opts);
    return this.request('weekly_trending.json', queryOpts, SplitCloud.methods.GET ,cancelToken).then(resp => {
      return resp.data
        .map(this.scApi.normalizeStreamUrlProperty)
        .map(this.scApi.transformTrackPayload);
    });
  }
}
SplitCloud.methods = {
  GET:'get',
  POST:'post',
}
SplitCloud.chartType = {
  TOP:'top',
  TRENDING:'trending'
}
SplitCloud.selectionChart = {
  TOP:'splitcloud:charts-top',
  TRENDING:'splitcloud:charts-trending'
}
export default SplitCloud;
import * as AV from 'leancloud-storage';
import moment from 'moment';
import 'moment/locale/zh-cn';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import 'ant-design-pro/dist/ant-design-pro.css';
moment.locale('zh-cn');

export const dva = {
  config: {
    onError(err) {
      err.preventDefault();
      console.error(err.message);
    },
  },
};

AV.init({
  appId: 'dJaCYd8eoaDHrQ8ydgCWKFt9-gzGzoHsz',
  appKey: 'jrxq0xAag2Ag7cpg80hIuuhq',
  serverURLs: {
    api: 'https://redeemapi.zong-fu.com'
  }
});

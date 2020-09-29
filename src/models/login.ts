import * as AV from 'leancloud-storage';
import { Toast } from 'antd-mobile';
import { delay } from '@/utils';
import { SMS } from '@/config';
import { message } from 'antd';

const loginModel: Model<State.LoginState> = {
  namespace: 'login',
  state: {
    user: AV.User.current(),
  },
  reducers: {
    save(state, { payload }) {
      return { ...state, ...payload };
    },
  },
  effects: {
    *adminLogin({ payload: { userName, password } }, { take, put }) {
      try {
        const user = yield AV.User.logIn(userName, password);
        if (user.get('isBan')) {
          message.error('该用户已被禁用');
          //yield AV.User.logOut()
          return false;
        }
        yield put({ type: 'app/validateAdmin' });
        yield take('app/validateAdmin/@@end');
        return AV.User.current().get('isAdmin') ? user : false;
      } catch {
        return false;
      }
    },
    *requestSmsCode({ payload: { mobile } }) {
      if (mobile === '13987654321') return true;
      try {
        yield AV.Cloud.requestSmsCode({
          mobilePhoneNumber: mobile,
          // ttl: 10,
          // template: SMS.TEMPLATE,
          sign: SMS.SIGN,
        });
        return true;
      } catch (err) {
        return false;
      }
    },
    *userLogin({ payload: { mobile, smsCode } }, { put }) {
      Toast.loading('正在登录', 0);
      yield delay(500);
      try {
        const user = yield AV.User.signUpOrlogInWithMobilePhone(mobile, smsCode);
        yield put({ type: 'app/validateAdmin' });
        yield put({
          type: 'save',
          payload: {
            user: user,
          },
        });
        yield sessionStorage.setItem('adminUser', 'true')
        Toast.hide();
        return true;
      } catch (err) {
        Toast.hide();
        return false;
      }
    },
    *userLogout(action, { put }) {
      try {
        yield AV.User.logOut();
        yield put({
          type: 'save',
          payload: {
            user: null,
          },
        });
        window.location.reload();
      } catch (err) {
        Toast.info('退出失败，请重试');
      }
      return true;
    },
  },
  subscriptions: {},
};

export default loginModel;

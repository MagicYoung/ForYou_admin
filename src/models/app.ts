import enquire from 'enquire.js';
import * as AV from 'leancloud-storage';
import { Setting } from '@/AVObjects';
import { ADMIN_ROLE } from '@/config';
import $ from 'jquery';
import moment from 'moment'

const appModel: Model<State.AppState> = {
  namespace: 'app',
  state: {
    isMobile: document.documentElement.clientWidth <= 767,
    // admin的menu是否收起
    menuCollapsed: false,
    setting: new Setting(),
    adminRole: null,
    //
    shopSelectedKeys: null,
  },
  reducers: {
    save(state, { payload }) {
      return { ...state, ...payload };
    },
  },
  effects: {
    *getSetting(action, { put }) {
      const query = new AV.Query('Setting');
      const ret = yield query.find();
      yield put({
        type: 'save',
        payload: {
          setting: ret[0],
        },
      });
    },
    *validateAdmin(action, { put }) {
      if (AV.User.current()) {
        AV.User.current().set('lastLogin', moment().format('YYYY-MM-DD HH:mm'))
        yield AV.User.current().save()

        const roles: AV.Role[] = yield AV.User.current().getRoles();
        // current user is admin
        if (roles.some(i => i.getName() === ADMIN_ROLE)) {
          yield put({
            type: 'save',
            payload: {
              adminRole: roles.find(i => i.getName() === ADMIN_ROLE),
            },
          });
          return true;
        } else {
          // current user is not admin，Additionally，we have to query admin role
          const query = new AV.Query(AV.Role);
          query.equalTo('name', ADMIN_ROLE);
          const ret = yield query.find();
          yield put({
            type: 'save',
            payload: {
              adminRole: ret[0],
            },
          });
          return false;
        }
      }
    },
    *saveSetting({ payload }, { put, select }) {
      const setting = yield select(state => state.app.setting);
      for (let key in payload) {
        setting.set(key, payload[key]);
      }
      const nSetting = yield setting.save();
      yield put({
        type: 'save',
        payload: {
          setting,
          nSetting,
        },
      });
      return true;
    },
  },
  subscriptions: {
    setup({ dispatch }) {
      dispatch({ type: 'getSetting' });
      dispatch({ type: 'validateAdmin' });
      if (document.readyState === 'complete') {
        $("#load-progress-bar").addClass("foreground-closing");
        $('#loading').fadeOut();
      } else {
        document.onreadystatechange = function () {
          if (document.readyState === 'complete') {
            $("#load-progress-bar").addClass("foreground-closing");
            $('#loading').fadeOut();
          }
        };
      }

      enquire.register('only screen and (min-width: 320px) and (max-width: 767px)', {
        match: () => {
          dispatch({ type: 'save', payload: { isMobile: true } });
        },
        unmatch: () => {
          dispatch({ type: 'save', payload: { isMobile: false } });
        },
      });
    },
  },
};

export default appModel;

import * as AV from 'leancloud-storage';
import { getTree } from '@/utils';
import { isEqual } from 'lodash';
import { Toast } from 'antd-mobile';
import { Address } from '@/AVObjects';
import { BannerType } from '@/constants';

const homeModel: Model<State.HomeState> = {
  namespace: 'home',
  state: {
    banners: [],
    designs: [],
    categories: [],
    AVCategories: [],
    products: [],
    addresses: [],
    drawerVisible: false,
    item: null,
    cartNum: 0,
    selectedPhoneCard: null,
    openid: '',//当前微信用户的openid
  },
  reducers: {
    save(state, { payload }) {
      return { ...state, ...payload };
    },
  },
  effects: {
    *getHomeData(action, { put }) {
      const bannerQuery = new AV.Query('Banner');
      bannerQuery.include('product');
      bannerQuery.ascending('no');
      const designQuery = new AV.Query('Design');
      designQuery.ascending('no');
      designQuery.include('products');
      designQuery.include('category');
      const banners = yield bannerQuery.find();
      const designs = yield designQuery.find();
      yield put({
        type: 'save',
        payload: {
          banners: banners.filter(
            i =>
              (i.get('type') === BannerType.Product && i.get('product')) ||
              i.get('type') !== BannerType.Product
          ),
          designs,
        },
      });
    },
    *getCategories(action, { put }) {
      const query = new AV.Query('Category');
      query.include('pNode');
      const categories = yield query.find();
      yield put({
        type: 'save',
        payload: {
          categories: getTree(categories),
          AVCategories: categories,
        },
      });
    },
    *queryProductsbyQuery({ payload: { condition } }, { put, select }) {
      const query = new AV.Query('Product');
      query.include('tags');
      query.equalTo('active', true);
      query.ascending('no');
      if (condition.tags) {
        // category search
        const tagsQuery = new AV.Query('Category');
        const tags = yield tagsQuery.find();
        const tagRes = tags.filter((item: any) => { return item.id === condition.tags })[0];
        const tagsQueryArr = tags.filter((item: any) => { return item.get('pNode') && item.get('pNode').id === condition.tags });
        tagsQueryArr.push(tagRes)
        query.containedIn('tags', tagRes.get('pNode') ? [tagRes] : tagsQueryArr);
      }
      if (condition.name) {
        // text search
        query.contains('name', condition.name);
      }
      if (condition.usableCards) {
        const cardCouponCategoryQuery = new AV.Query('CardCouponCategory');
        cardCouponCategoryQuery.equalTo('objectId', condition.usableCards);
        const cardCouponCategoryRes = yield cardCouponCategoryQuery.find();
        query.containedIn('usableCards', cardCouponCategoryRes);
      }
      if (condition.isNew) {
        query.limit(20)
      }
      if (condition.isHot) {
        query.equalTo('isHot', true)
      }
      if (condition.isRecommend) {
        query.equalTo('isRecommend', true)
      }
      // if item is nochanged, stop request and return
      //if (isEqual(item, oItem)) return;

      Toast.loading('正在加载', 0);
      const ret = yield query.find();
      Toast.hide();
      yield put({
        type: 'save',
        payload: {
          products: ret,
        },
      });
    },
    *queryProducts({ payload: item }, { put, select }) {
      const { item: oItem } = yield select(state => state.home);
      const query = new AV.Query('Product');
      query.include('tags');
      query.equalTo('active', true);
      query.ascending('no');
      if (typeof item === 'object') {
        // category search
        query.containedIn('tags', item.children || [item]);
      } else if (typeof item === 'string') {
        // text search
        query.contains('name', item);
      }
      // if item is nochanged, stop request and return
      if (isEqual(item, oItem)) return;

      Toast.loading('正在加载', 0);
      const ret = yield query.find();
      Toast.hide();
      yield put({
        type: 'save',
        payload: {
          products: ret.filter(
            i =>
              (!item &&
                !i
                  .get('tags')
                  .filter(i => i)
                  .some(j => j.get('name') === '数字蛋糕')) ||
              item
          ),
          item,
        },
      });
    },
    *queryAddresses({ payload: { isCake } }, { put }) {
      const query = new AV.Query('Address');
      query.equalTo('user', AV.User.current());
      if (isCake !== null) {
        query.equalTo('isCake', isCake);
      }
      query.ascending('createdAt');
      const addresses = yield query.find();
      // yield put({
      //   type: 'save',
      //   payload: {
      //     addresses,
      //   },
      // });
      return addresses;
    },
    *queryCartNum(action, { put }) {
      if (AV.User.current()) {
        const query = new AV.Query('Cart');
        query.include('product');
        query.equalTo('user', AV.User.current())
        const ret = yield query.find();
        const carts = ret.filter((item) => item.get('product')).map(i => i.get('num'));
        yield put({
          type: 'save',
          payload: {
            cartNum:
              carts.length > 0
                ? carts.reduce((pre, cur) => {
                  return pre + cur;
                })
                : 0,
          },
        });
      }
      else {
        yield put({
          type: 'save',
          payload: {
            cartNum: 0,
          },
        });
      }
    },
    *validateCardCoupon({ payload: no }) {
      const query = new AV.Query('CardCoupon');
      query.equalTo('no', no);
      const ret = yield query.find();
      return ret[0];
    },
    *saveAddress({ payload: { oAddress, mobile, name, addr, district, isDefault,isCake } }, { put, select }) {
      try {
        // if (isDefault) {

        //   const { addresses } = yield select(state => state.home);
        //   addresses.map(i => {
        //     i.set('isDefault', false);
        //   });
        //   yield AV.Object.saveAll(addresses);
        // }
        const address: AV.Object = oAddress || new Address();
        address.set('name', name);
        address.set('mobile', mobile);
        address.set('addr', addr);
        //address.set('city', district);
        address.set('district', district);
        address.set('isDefault', isDefault);
        address.set('user', AV.User.current());
        address.set('isCake', isCake);
        Toast.loading('正在保存', 0);
        yield address.save();
        // if (!oAddress) {
        //   const { addresses } = yield select(state => state.home);
        //   yield put({
        //     type: 'save',
        //     payload: {
        //       addresses: [ret, ...addresses],
        //     },
        //   });
        // }
        Toast.hide();
        return true;
      } catch (err) {
        console.log(err);
        Toast.fail('保存失败');
        return false;
      }
    },
    *saveCardCoupon({ payload: { no, pwd } }, { put }) {
      try {
        const query = new AV.Query('CardCoupon');
        query.equalTo('no', no);
        query.equalTo('pwd', pwd);
        const ret = yield query.find();
        if (ret.length < 1) return Toast.fail('卡号或者卡密错误');
        const cardCoupon = ret[0];
        if (cardCoupon.get('user')) return Toast.fail('该卡已经被绑定过了');
        cardCoupon.set('user', AV.User.current());
        Toast.loading('正在保存', 0);
        const res= yield cardCoupon.save();
        Toast.hide();
        return res;
      } catch (err) {
        console.log(err);
        Toast.fail('保存失败');
        return false;
      }
    },
    *deleteAddress({ payload }, { put, select }) {
      const item: AV.Object = payload;
      if (!item) return;
      try {
        yield item.destroy();
        // const { addresses } = yield select(state => state.home);
        // yield put({
        //   type: 'save',
        //   payload: {
        //     addresses: addresses.filter(i => i !== item),
        //   },
        // });
        Toast.info('删除成功', 1.5);
        return true;
      } catch {
        Toast.fail('删除失败');
        return false;
      }
    },
  },
};

export default homeModel;

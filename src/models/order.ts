import * as AV from 'leancloud-storage';
import { Cart, Order } from '@/AVObjects';
import { Toast } from 'antd-mobile';
import { cloneDeep } from 'lodash';
import { OrderStatus } from '@/constants';
import moment from 'moment';
import { ADMIN_EMAIL } from '@/config';

const OrderModel: Model<State.OrderState> = {
  namespace: 'order',
  state: {
    cart: [],
    cartChecked: [],
    selectedAddress: null,
    orders: [],
    selectedCardCoupon: [],
  },
  reducers: {
    save(state, { payload }) {
      return { ...state, ...payload };
    },
  },
  effects: {
    *queryOrders({ payload }, { put }) {
      const query = new AV.Query('Order');
      query.descending('no');
      if (payload === 0) {
        query.notEqualTo('status', OrderStatus.Finished);
      } else if (payload === 1) {
        query.equalTo('status', OrderStatus.Finished);
      }
      query.equalTo('user', AV.User.current());
      query.notEqualTo('isDelete', true);
      const orders = yield query.find();
      yield put({
        type: 'save',
        payload: {
          orders,
        },
      });
      return orders;
    },
    *queryCart(action, { put }) {
      const query = new AV.Query('Cart');
      query.ascending('createdAt');
      query.include('product');
      query.include('product.usableCards');
      query.equalTo('user', AV.User.current());
      const cart = yield query.find();
      yield put({
        type: 'save',
        payload: {
          cart: cart.filter(i => i.get('product')),
          cartChecked: cart.filter(i => i.get('product')),
        },
      });
    },
    *addToCart({ payload: product }, { put, select }) {
      try {
        product = cloneDeep(product);
        const { cart } = yield select(state => state.order);
        // find same spec cartItem firstly. If not, create a new one
        const item: AV.Object =
          cart.find((i: AV.Object) => {
            const specsName = product.spec ? product.spec.specsName : product.get('specs')[0].specsName;
            return product.id === i.get('product').id && specsName === i.get('spec').specsName;
          }) || new Cart();

        // accumulate cart num
        product.cartNum = (product.cartNum || 1) + (item.get('num') || 0);
        item.set('product', product);
        item.set('num', product.cartNum);
        item.set('spec', product.spec || product.get('specs')[0]);
        item.set('user', AV.User.current());
        Toast.loading('正在添加...', 0);
        yield item.save();

        yield put({
          type: 'queryCart',
        });
        // get cart num
        yield put({
          type: 'home/queryCartNum',
        });
        Toast.hide();
        Toast.info('成功加入到购物车', 1.5);
        return true;
      } catch (err) {
        console.log(err);
        Toast.fail('添加失败', 1.5);
      }
    },
    *deleteCartItems(action, { put, select }) {
      const { cart, cartChecked } = yield select(state => state.order);
      yield AV.Object.destroyAll(cartChecked);
      yield put({
        type: 'save',
        payload: {
          cartChecked: [],
          cart: cart.filter(i => !cartChecked.some(j => j === i)),
        },
      });
      // get cart num
      yield put({
        type: 'home/queryCartNum',
      });
    },
    *deleteCartItem({ payload: item }, { put, select }) {
      const { cart, cartChecked } = yield select(state => state.order);
      yield item.destroy();
      yield put({
        type: 'save',
        payload: {
          cartChecked: cartChecked.filter(i => i !== item),
          cart: cart.filter(i => i !== item),
        },
      });
      // get cart num
      yield put({
        type: 'home/queryCartNum',
      });
    },
    *submitOrder(
      { payload: { date: dDate, time: dTime, extraCultery, extraCandle, nameCard, note, currCard, isCakesItem } },
      { put, select }
    ) {
      const { cartChecked, selectedAddress, selectedCardCoupon, cart } = yield select(
        state => ({ ...state.order, ...state.home })
      );
      try {

        Toast.loading('正在提交', 0);
        const order = new Order();
        const prices = cartChecked.map(i => i.get('spec').price * i.get('num'));
        const count =
          prices.length > 0
            ? prices.reduce((pre, cur) => {
              return pre + cur;
            })
            : 0;
        order.set('count', count);
        const date = moment(Date.now())
          .valueOf()
          .toString();
        order.set(
          'no',
          moment().format('YYYYMMDDHHmm') + date.slice(date.length - 4, date.length - 1)
        );

        order.set('deliverTime', isCakesItem > 0 ? `${moment(dDate).format('YYYY-MM-DD')} ${dTime}` : null);
        order.set('extraCultery', isCakesItem > 0 ? extraCultery : null);
        order.set('extraCandle', isCakesItem > 0 ? extraCandle : null);
        order.set('nameCard', isCakesItem > 0 ? nameCard : null);
        order.set('note', note);
        order.set('phone', AV.User.current().getMobilePhoneNumber());
        order.set('carts', cartChecked.map(i => i.toJSON()));

        order.set(
          'cardCouponCarts',
          selectedCardCoupon
        );
        order.set(
          'usedCardCoupon', selectedCardCoupon.map((item) => {
            return item.cardCoupon
          })
        );
        order.set('address', selectedAddress.toJSON());
        order.set('status', OrderStatus.Unverified);
        order.set('user', AV.User.current());
        console.log(order)
        return
        const ret = yield order.save();
        //console.log(ret)
        if(ret)
        // delete cart num
        yield AV.Object.destroyAll(cartChecked);
        // get cart num
        yield put({
          type: 'home/queryCartNum',
        });
        //change cardCoupon to used status
        yield AV.Object.saveAll(currCard);
        // send email
        AV.User.requestEmailVerify(ADMIN_EMAIL);
        yield put({
          type: 'save',
          payload: {
            selectedAddress: null,
            cartChecked: [],
            selectedCardCoupon: [],
            cart: cart.filter(i => !cartChecked.some(j => j === i)),
          },
        });
        Toast.hide();
        return ret;
      } catch (err) {
        console.log(err);
        Toast.info('提交订单失败，请重试', 1.5);
        return false;
      }
    },
  },
  subscriptions: {
    setup({ dispatch }) {
      dispatch({ type: 'queryCart' });
    },
  },
};

export default OrderModel;

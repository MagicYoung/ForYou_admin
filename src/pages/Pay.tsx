import * as React from 'react';
import { connect } from 'react-redux';
import styles from './Pay.less';
import { Icon, Spin, List as AntList, message } from 'antd';
import CartItem from '@/components/CartItem';
import Button from '@/components/Button';
import router from 'umi/router';
import { Toast, WhiteSpace, List, Modal, Picker, Calendar, Stepper } from 'antd-mobile';
import withScrollTop from '@/utils/withScrollTop';
import moment from 'moment';
import * as AV from 'leancloud-storage';
import { ORDER_TIMES, extraCulteryPrice } from '@/config';
import zhCN from 'antd-mobile/lib/calendar/locale/zh_CN';
import Check from '@/components/Check';
import classNames from 'classnames';
import { isWechat } from '@/utils'
const getMinDate: () => Date = () => {
  if (moment().hour() >= 20) {
    return moment()
      .add(2, 'days')
      .toDate();
  } else {
    return moment()
      .add(1, 'days')
      .toDate();
  }
};
interface PayProps extends ReduxComponentProps, State.HomeState, State.OrderState { }

@(withScrollTop('pay-container') as any)
class Pay extends React.Component<PayProps> {
  static mState = null;
  state = {
    date: getMinDate(),
    time: '',
    visible: false,
    extraCultery: 0,
    extraCandle: 0,
    nameCard: '',
    nameCardActive: false,
    note: '',
    modalVisible: false,
    loading: false,
  };

  input: HTMLElement;

  async componentDidMount() {
    this.setState({ loading: true })
    const cartIds = this.props.location.query.cartIds.split('-');
    if (!cartIds || !cartIds.length) {
      Toast.info('请选择商品后结算', 1.5, () => {
        router.goBack();
      });
    }
    else {
      let currCartData: any[] = [];
      await this.props.dispatch({ type: 'order/queryCart' });
      this.props.cartChecked.map((c) => {
        if (cartIds.indexOf(c.id) > -1) {
          currCartData.push(c);
        }
      })
      await this.props.dispatch({ type: 'order/save', payload: { cartChecked: currCartData } });
    }
    const { selectedCardCoupon } = this.props;
    const selectedCardCouponDefaut = this.props.cartChecked.map((item) => {
      const cardCoupon = selectedCardCoupon.find((i) => i.cartId === item.id)
      return {
        cartId: item.id,
        cardCoupon: (cardCoupon && cardCoupon.cardCoupon) ? cardCoupon.cardCoupon : null
      }
    })
    this.props.dispatch({ type: 'order/save', payload: { selectedCardCoupon: selectedCardCouponDefaut } });
    Pay.mState && this.setState(Pay.mState);
    this.setState({ loading: false })
  }

  componentWillUnmount() {
    Pay.mState = this.state;
  }

  onAddressClick = () => {
    const { selectedAddress } = this.props;
    router.push({
      pathname: '/me/address',
      search: (selectedAddress ? `?id=${selectedAddress.id}` : '?id=') + '&isCake=' + (this.getIsCakes() > 0 ? 'true' : 'false'),
    });
  };

  getCount = () => {
    const prices = this.props.cartChecked.map(i => i.get('spec').price * i.get('num'));
    const res = prices.length > 0
      ? prices.reduce((pre, cur) => {
        return pre + cur;
      })
      : 0;
    return parseFloat((res + extraCulteryPrice * this.state.extraCultery).toFixed(2));
  };

  renderItem = item => {
    if (!item) return null;
    const cardCouponCategory = item.get('cardCouponCategory').attributes;
    return (
      <AntList.Item style={{ paddingLeft: 12 }}>
        <AntList.Item.Meta
          title={
            <div className={styles.cashcard}>
              <span>
                <Icon type="credit-card" style={{ marginRight: 4 }} />¥{' '}
                <span >{cardCouponCategory.cardName}<span style={{ fontSize: 14 }}>{`(No:${item.get('no')}${cardCouponCategory.type !== 'F' && cardCouponCategory.type !== 'D' ? `/余额:￥${item.get('value')}` : ''})`}</span></span>
              </span>
            </div>}
          description={cardCouponCategory.cardDescription}
        />
      </AntList.Item>
    );
  };

  onAddCardCoupon = (item) => {
    router.push({
      pathname: '/userCardCoupon',
      search: `?cartId=${item.id}&produId=${item.get('product').id}`,
    });
  };
  getRandomArrayElements = (arr, count) => {
    let shuffled = arr.slice(0), i = arr.length, min = i - count, temp, index;
    while (i-- > min) {
      index = Math.floor((i + 1) * Math.random());
      temp = shuffled[index];
      shuffled[index] = shuffled[i];
      shuffled[i] = temp;
    }
    return shuffled.slice(min);
  }

  onPay = async () => {
    if (!this.props.selectedAddress) return Toast.info('请选择收货地址', 1.5);
    const { cartChecked } = this.props;
    const isCakesItem = this.getIsCakes();
    if (isCakesItem > 0) {

      if (!this.state.time) return Toast.info('请选择具体时间', 1.5);
      if (this.state.nameCard.replace(/[^\x00-\xff]/g, '01').length > 16)
        return Toast.info('生日牌不能超过8个中文或者16个英文', 1.5);
    }

    const mobileNum = this.props.selectedAddress.get('mobile').replace(/\s+/g, "");
    let errmssg = '';

    let ElectronicCodeList = [];
    for (var i = 0; i < cartChecked.length; i++) {
      var usableCards = cartChecked[i].get('product').get('usableCards')
      if (usableCards.some((u: any) => u.get('type') === 'A')) {
        const query = new AV.Query('ElectronicCodeList');
        query.include('product')
        query.notEqualTo('isDelete', true);
        query.equalTo('user', null);
        query.equalTo('product', cartChecked[i].get('product'));
        const eRes = await query.find();
        if (!eRes.length) {
          errmssg = `${cartChecked[i].get('product').get('name')}已售完，请联系客服`
        } else {
          ElectronicCodeList.push(...this.getRandomArrayElements(eRes, cartChecked[i].get('num')))
        }
      }
    }
    if (errmssg) {
      Toast.info(errmssg, 1.5);
      return;
    }
    const selectedCardCoupon = this.props.selectedCardCoupon

    cartChecked.map((item) => {
      const cItem = selectedCardCoupon.find((i) => { return i.cartId === item.id })
      if (!cItem.cardCoupon) {
        //Toast.info(`请选择商品：“${item.get('product').get('name')}”的兑换卡券`, 1.5);
        errmssg = `请选择商品：“${item.get('product').get('name')}”的兑换卡券`;

      }
    })
    if (errmssg) {
      Toast.info(errmssg, 1.5);
      return;
    }
    const currCard: any[] = [];
    selectedCardCoupon.map((sc) => {
      if (!currCard.some((c) => c.id === sc.cardCoupon.id)) {
        currCard.push(sc.cardCoupon);
      }
    })
    currCard.map((cc, index) => {
      let currCardTotal = 0;
      const ccProduct: any[] = [];
      selectedCardCoupon.filter((sc) => sc.cardCoupon.id === cc.id).map((scc) => {
        const currCart = cartChecked.find((cartCheckedItem) => cartCheckedItem.id === scc.cartId);
        currCardTotal += currCart?.get('spec').price * currCart?.get('num');
        ccProduct.push(currCart?.get('product'))
      })
      console.log(ccProduct)
      if (index === currCard.length - 1) {
        currCardTotal += extraCulteryPrice * this.state.extraCultery;
      }
      if (currCardTotal > cc.get('value') && cc.get('cardCouponCategory').get('type') !== 'F' && cc.get('cardCouponCategory').get('type') !== 'D') {
        errmssg = `卡券${cc.get('cardCouponCategory').get('cardName')}(卡号：${cc.get('no')})余额不足`;
        Modal.alert('提示', `卡券${cc.get('cardCouponCategory').get('cardName')}(卡号：${cc.get('no')})余额不足是否充值？`, [
          { text: '取消', onPress: () => console.log('cancel pay') },
          {
            text: 'Ok', onPress: () => {
              if (!isWechat()) {
                message.error('支付功能请在微信浏览器中打开');
                return
              }
              router.push({
                pathname: '/userCardCoupon/Recharge',
                query: {
                  id: cc.id,
                }
              })
            }
          },
        ])
        return

      } else {
        if (cc.get('cardCouponCategory').get('type') === 'F' || cc.get('cardCouponCategory').get('type') === 'D') {
          cc.set('value', -1)
        }
        else {
          cc.set('value', cc.get('value') - currCardTotal)
        }
        cc.set('used', true);
        cc.set('convertTime', cc.get('convertTime') ? [...cc.get('convertTime'), moment().format('YYYY-MM-DD HH:mm')] : [moment().format('YYYY-MM-DD HH:mm')]);
        cc.set('address', this.props.selectedAddress.toJSON())
        cc.set('convertProducts', cc.get('convertProducts') ? [...cc.get('convertProducts'), ...ccProduct] : ccProduct);
      }
    })
    if (errmssg) {
      if (errmssg.indexOf('余额不足') < 0)
        Toast.info(errmssg, 1.5);
      return;
    }
    this.setState({ loading: true })
    const ret = await this.props.dispatch({ type: 'order/submitOrder', payload: { ...this.state, currCard, isCakesItem } });
    return
    let resE = null;
    if (ret) {
      if (ElectronicCodeList.length) {
        ElectronicCodeList.map((item: any) => {
          item.set('user', AV.User.current());
          item.set('convertTime', moment().format('YYYY-MM-DD HH:mm'));
          item.set('used', true);
          item.set('order', ret);
        })
        resE = await AV.Object.saveAll(ElectronicCodeList);
        let sendSmsId = '';
        resE.map(async (item: any) => {
          sendSmsId += !sendSmsId ? item.id : ',' + item.id
        })
        await AV.Cloud.requestSmsCode({
          productName: ElectronicCodeList.length === 1 ? ElectronicCodeList[0].get('product').get('name') : `${ElectronicCodeList.length}张电子券`,
          mobilePhoneNumber: mobileNum,
          template: 'ElectronicCode',
          elecId: sendSmsId,
          sign: '宗福',
        });
      }
      Toast.success('提交成功!', 1.5);
      Pay.mState = null;
      router.replace({
        pathname: '/orders/detail',
        state: { orderId: ret.id },
      });
    }
    this.setState({ loading: false });
  };
  onDateSelect = date => {
    this.setState({
      visible: false,
      date,
    });
  };

  getCardCouponCount = () => {
    let values = 0;
    let ccr: any[] = []
    this.props.selectedCardCoupon.map(i => {
      if (!ccr.find((j) => j.id === i.id)) {
        ccr.push(i)
      }
    });
    ccr.map(i => {
      if (i.cardCoupon)
        values += i.cardCoupon.get('value')
    });
    return values.toFixed(2)
  };

  getIsCakes = () => {
    return this.props.cartChecked.filter((item) => { return item.get('product').get('isCakes') }).length;
  }

  render() {
    const { cartChecked, selectedAddress, selectedCardCoupon } = this.props;
    const isCakesItem = this.getIsCakes();
    return (
      <div id="pay-container" className={styles.container}>
        <Spin tip="处理中.." spinning={this.state.loading}>
          <div className={styles.address}>
            <List>
              <List.Item
                arrow="horizontal"
                multipleLine
                onClick={this.onAddressClick}
                platform="android"
              >
                {
                  selectedAddress ? (
                    <div style={{ color: '#000000' }}>
                      <span>{selectedAddress.get('name')}</span>
                      <span style={{ marginLeft: 4 }}>{selectedAddress.get('mobile')}</span>
                    </div>
                  ) : (
                      '请添加地址'
                    )
                }
                <List.Item.Brief>
                  {
                    selectedAddress ? (
                      <div>
                        <div>{selectedAddress.get('district')}</div>
                        <div>{selectedAddress.get('addr')}</div>
                      </div>
                    ) : (
                        '新增一个收货地址'
                      )
                  }
                </List.Item.Brief>
              </List.Item>
            </List>
          </div>
          {
            isCakesItem > 0 &&
            <React.Fragment>

              <div className={styles.header}>
                <Icon type="clock-circle" style={{ marginRight: 6, fontSize: 18 }} />
                蛋糕配送时间
              <Icon
                  onClick={() => this.setState({ modalVisible: true })}
                  type="question-circle"
                  style={{ marginLeft: 12, color: 'black', fontSize: 18 }}
                />
              </div>

              <div className={styles.time}>
                <div className={styles.item} onClick={() => this.setState({ visible: true })}>
                  <div className={styles.icon}>
                    <Icon type="calendar" />
                  </div>
                  <div className={styles.content}>
                    {moment(this.state.date).format('YYYY-MM-DD') || '请选择'}
                  </div>
                  <div className={styles.right}>
                    <Icon type="right" />
                  </div>
                </div>
                <Picker
                  value={[this.state.time]}
                  onChange={value => this.setState({ time: value[0] })}
                  data={ORDER_TIMES.map(i => ({ label: i, value: i }))}
                  cols={1}>
                  <div className={styles.item}>
                    <div className={styles.icon}>
                      <Icon type="clock-circle" />
                    </div>

                    <div className={styles.content}>{this.state.time || '请选择时间'}</div>
                    <div className={styles.right}>
                      <Icon type="right" />
                    </div>
                  </div>
                </Picker>
              </div>
              <WhiteSpace size="lg" />
            </React.Fragment>
          }
          <div className={styles.content}>
            {cartChecked.map((i, index) => {
              return (
                <div key={index} className={styles.cartBox}>
                  <CartItem data={i} style={{ borderBottom: 'none' }} />
                  <div >
                    <div className={styles.header}>
                      <div className={styles.cashcard}>
                        <Icon type="credit-card" style={{ marginRight: 6, fontSize: 18 }} />
                        <span>
                          可用卡券
                        </span>
                        <Button
                          onClick={() => { this.onAddCardCoupon(i) }}
                          style={{ width: 80, marginRight: 12, height: 30, fontSize: 13 }}>
                          去选择
                    <Icon type="right" style={{ marginLeft: 2, fontSize: 12 }} />
                        </Button>
                      </div>
                    </div>
                    {
                      selectedCardCoupon.find((sc) => sc.cartId === i.id) ? this.renderItem(selectedCardCoupon.find((sc) => sc.cartId === i.id).cardCoupon) : null
                    }
                  </div>
                  <WhiteSpace size="lg" />
                </div>
              );
            })}
          </div>
          {
            isCakesItem > 0 &&
            <React.Fragment>
              <WhiteSpace size="lg" />
              <div className={styles.row}>
                <Check
                  checked={this.state.extraCultery > 0}
                  onClick={() => this.setState({ extraCultery: this.state.extraCultery > 0 ? 0 : 1 })}
                />
                <div className={styles.content}>额外餐具(一盒五份/3元)</div>
                <Stepper
                  min={0}
                  showNumber
                  value={this.state.extraCultery}
                  onChange={value => this.setState({ extraCultery: value })}
                />
              </div>

              <div className={styles.header}>
                <Icon type="gift" style={{ marginRight: 6, fontSize: 18 }} />
                赠送配件
          </div>
              <div className={styles.time}>
                <div
                  className={styles.item}
                  onClick={() => this.setState({ nameCardActive: !this.state.nameCardActive })}>
                  <div
                    className={classNames(styles.icon, {
                      [styles.inactive]: !this.state.nameCardActive,
                    })}>
                    <Icon
                      type="check"
                      style={{ color: this.state.nameCardActive ? '#ffffff' : 'gray' }}
                    />
                  </div>
                  <div className={styles.content}>生日牌</div>
                </div>
                <div
                  className={styles.item}
                  onClick={() => this.setState({ extraCandle: this.state.extraCandle ? 0 : 1 })}>
                  <div
                    className={classNames(styles.icon, {
                      [styles.inactive]: !this.state.extraCandle,
                    })}>
                    <Icon type="check" style={{ color: this.state.extraCandle ? '#ffffff' : 'gray' }} />
                  </div>
                  <div className={styles.content}>生日蜡烛</div>
                </div>
              </div>
              {this.state.nameCardActive && (
                <div className={styles.nameCardInput}>
                  <input
                    placeholder="生日牌：8个汉字或16个英文字母"
                    ref={o => (this.input = o)}
                    className={styles.nameCard}
                    value={this.state.nameCard}
                    onChange={e => {
                      this.setState({ nameCard: e.target.value });
                    }}
                  />
                </div>
              )}
            </React.Fragment>
          }
          <div className={styles.note}>
            <Icon type="form" style={{ marginRight: 6, fontSize: 18 }} />
            订单留言
          </div>
          <div className={styles.row}>
            <textarea
              onChange={e => this.setState({ note: e.target.value })}
              className={styles.textarea}
              placeholder="请填写你的订单留言"
            />
          </div>
          <div className={styles.bar}>
            <div className={styles.count}>
              需支付¥：{' '}
              <span>
                {Math.max(
                  this.getCount(),
                  0
                )}
              </span>
              <span style={{ fontSize: 14, marginLeft: 10 }}>/卡券抵扣:¥{this.getCardCouponCount() > this.getCount() ? this.getCount() : this.getCardCouponCount()}</span>
            </div>
            <Button onClick={this.onPay} style={{ width: 100 }}>
              提交订单
            </Button>
          </div>
        </Spin>
        {
          isCakesItem > 0 &&
          <React.Fragment>

            <Calendar
              locale={zhCN}
              type="one"
              visible={this.state.visible}
              onCancel={() => this.setState({ visible: false })}
              onConfirm={date => this.setState({ date, visible: false })}
              defaultValue={[this.state.date]}
              minDate={getMinDate()}
              onSelect={this.onDateSelect}
            />
            <Modal
              visible={this.state.modalVisible}
              transparent
              maskClosable={false}
              onClose={() => this.setState({ modalVisible: false })}
              title="配送说明"
              footer={[
                {
                  text: 'Ok',
                  onPress: () => this.setState({ modalVisible: false }),
                },
              ]}>
              <div style={{ height: 100 }}>
                1，配送时间为10:00-20:00
            <br />
                2. 我们将优先根据您选择的时间配送，实际配送时间可能会有前后30分钟的误差，敬请谅解
          </div>
            </Modal>

          </React.Fragment>

        }
      </div>
    );
  }
}

export default connect(state => ({
  cartChecked: state.order.cartChecked,
  addresses: state.home.addresses,
  selectedAddress: state.order.selectedAddress,
  selectedCardCoupon: state.order.selectedCardCoupon,
}))(Pay);

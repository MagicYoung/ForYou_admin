import * as React from 'react';
import styles from './Detail.less';
import { List, Icon, Divider } from 'antd';
import { OrderStatus } from '@/constants';
import router from 'umi/router';
import CartItem from '@/components/CartItem';
import { Steps, Toast } from 'antd-mobile';
import * as AV from 'leancloud-storage';
import { ADMIN_EMAIL } from '@/config';

const Step = Steps.Step;

interface OrderDetailProps {
  location: any;
}

class OrderDetail extends React.Component<OrderDetailProps> {
  state = {
    dataOrder: null,
  }
  async componentDidMount() {
    if (!this.props.location.state && !this.props.location.state.orderId) return router.goBack();
    else {
      const query = new AV.Query('Order');
      query.include('order_product');
      query.include('order_cardCoupon');
      query.equalTo('objectId', this.props.location.state.orderId);
      const orders = await query.find();
      this.setState({ dataOrder: orders[0] })
    }
  }

  renderItem = item => {
    return (
      <List.Item style={{ paddingLeft: 12 }}>
        <List.Item.Meta
          title={
            <div className={styles.cashcard}>
              <span>
                <Icon type="credit-card" style={{ marginRight: 4 }} />
                卡号：{item.cardNo}
              </span>
            </div>}
          description={
            <span>
              <Icon type="lock" style={{ marginRight: 4 }} />
              卡密：{item.cardPwd}
            </span>
          }
        />
      </List.Item>
    );
  };

  onCancelOrder = () => {
    const { dataOrder } = this.state;
    dataOrder.set('status', OrderStatus.Canceled);
    dataOrder.save();
    AV.User.requestPasswordReset(ADMIN_EMAIL);
    Toast.info('已提交取消申请', 1.5);
    this.forceUpdate();
  };

  render() {
    const { dataOrder } = this.state;
    if (!dataOrder || !dataOrder.get) return null;
    const address = dataOrder.get('address');
    const order_product = dataOrder.get('order_product');
    let label,
      color,
      current,
      description = '';
    switch (dataOrder.get('status')) {
      case OrderStatus.Unverified:
        label = '未确认';
        color = '#d9d9d9';
        current = 0;
        break;
      case OrderStatus.Ordered:
        label = '已处理';
        color = '#108ee9';
        description = '审核通过，正在为您精心准备美味';
        current = 1;
        break;
      case OrderStatus.Shipped:
        label = '配送中';
        color = '#fa8c16';
        current = 2;
        description = '做好了，有一大波快递小哥正向您驶去';
        break;
      case OrderStatus.Finished:
        label = '已完成';
        color = '#1AC194';
        current = 3;
        description = '感谢您的品尝，期待再次为您服务';
        break;
      default:
        label = '取消中';
        color = '#13c2c2';
        current = -1;
        description = '已提交取消申请，请等待';
    }
    return (
      <div className={styles.container}>
        {current !== -1 && (
          <div className={styles.steps}>
            <Steps current={current} direction="horizontal" size="small">
              <Step title="未确认" icon={<Icon type="shopping-cart" />} />
              <Step title="已处理" icon={<Icon type="audit" />} />
              <Step title="配送中" icon={<Icon type="car" />} />
              <Step title="已完成" icon={<Icon type="check-circle" />} />
            </Steps>
          </div>
        )}
        {description && <div className={styles.desp}>{description}</div>}
        <div className={styles.row}>
          <List.Item>
            <List.Item.Meta
              title={`订单号: ${dataOrder.get('no')}`}
              description={
                <span>
                  <span className={styles.label} style={{ background: color }}>
                    {label}
                  </span>
                  {`总金额：¥ ${dataOrder.get('order_price')}`}
                </span>
              }
            />
            {current !== -1 && <a onClick={this.onCancelOrder}>取消订单</a>}
          </List.Item>
        </div>
        <div className={styles.row}>
          <List.Item>
            <List.Item.Meta
              title={
                <span>
                  <Icon type="user" style={{ marginRight: 4 }} />
                  {address.name} <Icon type="mobile" style={{ marginLeft: 8, marginRight: 4 }} />
                  {address.mobile}
                </span>
              }
              description={
                <span>
                  <Icon type="environment" style={{ marginRight: 4 }} />
                  {address.district + address.addr}
                </span>
              }
            />
          </List.Item>
        </div>
        <div className={styles.content}>
          <div className={styles.product_item}>
            <div className={styles.cover}>
              <img src={order_product.get('carouselImgs')[0].url + '?imageView/2/w/512/h/512/q/100/format/png'} />
            </div>
            <div className={styles.content}>
              <div className={styles.titleEN}>{order_product.get('fName')}</div>
              <div className={styles.title}>{order_product.get('name')}</div>
              <div className={styles.price}>
                <span style={{ fontSize: 16, fontWeight: 'bold' }}>规格：{dataOrder.get('order_product_spec')}</span>
              </div>
              {/* <div className={styles.cart} onClick={onCartClick}>
          <img src={require('../../assets/cart.png')} />
        </div> */}
            </div>
          </div>
        </div>
        {
          dataOrder.get('deliverTime') &&
          <div className={styles.time}>
            <Icon type="clock-circle" style={{ marginRight: 6, fontSize: 18 }} />
            配送时间：{dataOrder.get('deliverTime')}
          </div>
        }
        {
          dataOrder.get('extraCultery') &&
          <div className={styles.extra}>
            <Icon type="gift" style={{ marginRight: 6, fontSize: 18 }} />
            额外配件：
            <span>{dataOrder.get('extraCultery') ? `餐具 x ${dataOrder.get('extraCultery')}` : ''}</span>
            <span>{dataOrder.get('extraCandle') ? `生日蜡烛 x ${dataOrder.get('extraCandle')}` : ''}</span>
          </div>
        }

        {dataOrder.get('nameCard') && (
          <div className={styles.header}>
            <Icon type="gift" style={{ marginRight: 6, fontSize: 18 }} />
            生日卡：
            <span>{dataOrder.get('nameCard')}</span>
          </div>
        )}
        {
          dataOrder.get('note') &&
          <React.Fragment>
            <div className={styles.note}>
              <Icon type="form" style={{ marginRight: 6, fontSize: 18 }} />
              备注
          </div>
            <div className={styles.row}>{dataOrder.get('note')}</div>
          </React.Fragment>
        }

        {
          dataOrder.get('modifyContent') &&
          <React.Fragment>
            <div className={styles.note} style={{ marginTop: 20 }}>
              <Icon type="snippets" style={{ marginRight: 6, fontSize: 18 }} />
              订单修改内容
          </div>
            <div className={styles.row} style={{ color: '#1890ff' }}>{dataOrder.get('modifyContent')}</div>
          </React.Fragment>
        }
      </div>
    );
  }
}

export default OrderDetail;

import * as React from 'react';
import { connect } from 'react-redux';
import styles from './index.less';
import { List, Icon, Avatar, Divider } from 'antd';
import { OrderStatus } from '@/constants';
import router from 'umi/router';
import classNames from 'classnames';
import { Toast } from 'antd-mobile';

interface OrderProps extends ReduxComponentProps, State.HomeState, State.OrderState { }

class Order extends React.Component<OrderProps> {
  componentDidMount() {
    this.onQuery();
  }

  onQuery = async () => {
    Toast.loading('正在加载...', 0);
    await this.props.dispatch({ type: 'order/queryOrders', payload: this.state.currentTab });
    Toast.hide();
  };

  state = {
    currentTab: 0,
  };

  renderItem = (item: AV.Object) => {
    let label,
      color = '';
    switch (item.get('status')) {
      case OrderStatus.Unverified:
        label = '未确认';
        color = '#d9d9d9';
        break;
      case OrderStatus.Ordered:
        label = '已处理';
        color = '#108ee9';
        break;
      case OrderStatus.Shipped:
        label = '配送中';
        color = '#fa8c16';
        break;
      case OrderStatus.Finished:
        label = '已完成';
        color = '#1AC194';
        break;
      default:
        label = '取消中';
        color = '#13c2c2';
    }
    const cover = item.get('carts')[0].product.carouselImgs[0].thumbUrl;
    const onClick = () => {
      router.replace({
        pathname: '/orders/detail',
        state: { orderId: item.id },
      });
    };
    return (
      <List.Item onClick={onClick} actions={[<Icon type="right" />]}>
        <List.Item.Meta
          avatar={<Avatar src={cover} size="large" shape="square" />}
          title={`订单号: ${item.get('no')}`}
          description={
            <span>
              <span className={styles.label} style={{ background: color }}>
                {label}
              </span>
              {`共${item.get('carts').length}件商品 总金额：¥ ${item.get('count')}`}
            </span>
          }
        />
      </List.Item>
    );
  };

  onSwitch = currentTab => {
    this.setState({ currentTab }, this.onQuery);
  };

  render() {
    const { orders } = this.props;
    const { currentTab } = this.state;
    return (
      <div className={styles.container}>
        <div className={styles.tabs}>
          <div
            onClick={this.onSwitch.bind(this, 0)}
            className={classNames(styles.tab, { [styles.active]: currentTab === 0 })}>
            未完成
            </div>
          <div
            onClick={this.onSwitch.bind(this, 1)}
            className={classNames(styles.tab, { [styles.active]: currentTab === 1 })}>
            已完成
            </div>
          <div
            onClick={this.onSwitch.bind(this, 2)}
            className={classNames(styles.tab, { [styles.active]: currentTab === 2 })}>
            全部订单
            </div>
        </div>
        <List size="large" dataSource={orders} renderItem={this.renderItem} />
        <Divider style={{ margin: 0 }} />
      </div>
    );
  }
}

export default connect(state => ({ orders: state.order.orders }))(Order);

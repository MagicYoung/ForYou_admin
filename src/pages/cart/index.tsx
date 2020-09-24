import * as React from 'react';
import { connect } from 'react-redux';
import styles from './index.less';
import Check from '@/components/Check';
import Button from '@/components/Button';
import { Modal, Toast, SwipeAction } from 'antd-mobile';
import { Empty } from 'antd';
import * as AV from 'leancloud-storage';
import router from 'umi/router';
import CartItem from '@/components/CartItem';
import CakeItem from '@/components/CakeItem';

interface CartProps extends ReduxComponentProps, State.OrderState { }

class Cart extends React.Component<CartProps> {
  state = {
    addVisible: false,
    currentProduct: null,
    isEdit: false,
  };

  tempNum: any = [];

  onCheckClick = () => {
    const { cart, cartChecked } = this.props;
    const allChecked = cart.length === cartChecked.length && cart.length > 0;
    this.props.dispatch({
      type: 'order/save',
      payload: {
        cartChecked: allChecked ? [] : cart,
      },
    });
  };

  getCount = () => {
    const prices = this.props.cartChecked.map(i => i.get('spec').price * i.get('num'));
    return prices.length > 0
      ? prices.reduce((pre, cur) => {
        return pre + cur;
      })
      : 0;
  };

  onDelete = () => {
    if (this.props.cartChecked.length === 0) return Toast.info('请选择要删除的商品', 1.5);
    Modal.alert('删除商品', '是否删除选中的商品？', [
      { text: '取消', onPress: () => { } },
      {
        text: '确定',
        onPress: () => this.props.dispatch({ type: 'order/deleteCartItems' }),
      },
    ]);
  };

  onNumChange = (value: number, id: string) => {
    var item = this.tempNum.find((item) => {
      return item.id === id
    });
    if (item) {
      item.set('num', value)
    } else {
      let itemCatr = this.props.cart?.find((c) => { return c.id === id });
      itemCatr.set('num', value);
      this.tempNum.push(itemCatr);
    }
  };

  onConfirm = async () => {
    await AV.Object.saveAll(this.tempNum);
    this.setState({ isEdit: false });
    this.props.dispatch({ type: 'home/queryCartNum' });
    this.tempNum = [];
  };

  renderLogin() {
    return (
      <div className={styles.empty}>
        <div className={styles.tip}>当前未登录</div>
        <div className={styles.tip}>无法查看购物车</div>
        <Button onClick={this.toLogin} style={{ width: 120, marginTop: 10 }}>
          立即登录
        </Button>
      </div>
    );
  }

  toLogin() {
    router.push({
      pathname: '/signin',
      state: {
        tip: '登陆后查看购物车',
      },
    });
  }

  onCartClick = () => {
    const { cartChecked } = this.props;
    const isCakesItem = cartChecked.filter((item) => { return item.get('product').get('isCakes') });
    const isNoCakesItem = cartChecked.filter((item) => { return !item.get('product').get('isCakes') })
    if (isCakesItem.length > 0 && isNoCakesItem.length > 0) {
      return Toast.info('蛋糕类商品请单独结算', 2);
    }
    if (this.props.cartChecked.length === 0) return Toast.info('请选择商品后结算', 1.5);
    let cartIds = '';
    this.props.cartChecked.map((item) => {
      cartIds += cartIds ? ('-' + item.id) : item.id;
    })
    router.push({
      pathname: '/pay',
      query: {
        cartIds: cartIds.trimEnd(),
      }
    });
  };

  onProductClick(item: AV.Object) {
    router.push({
      pathname: `/product/${item.id}`,
    });
  }

  onAddCart = async item => {
    const ret = await this.props.dispatch({
      type: 'order/addToCart',
      payload: item,
    });
    if (ret) {
      Toast.success('添加成功', 1.5);
    }
  };

  render() {
    const { cart, cartChecked } = this.props;
    const { isEdit } = this.state;
    const allChecked = cart.length === cartChecked.length && cart.length > 0;
    if (!AV.User.current()) {
      return this.renderLogin();
    }
    return (
      <div className={styles.container}>
        <div className={styles.edit} onClick={() => {
          if (isEdit) {
            this.onConfirm()
          } else {
            this.setState({ isEdit: true })
          }
        }}>
          <span >{this.state.isEdit ? '完成' : '编辑'}</span>
        </div>
        {
          !isEdit &&
          <div className={styles.header}>
            <div onClick={this.onCheckClick} className={styles.check}>
              <Check checked={allChecked} />
              全选
                </div>
          </div>
        }
        <div className={styles.content}>
          {cart.length > 0 ? (
            cart.map((i, index) => {
              const checked = cartChecked.some(j => j === i);
              const onCheck = () => {
                this.props.dispatch({
                  type: 'order/save',
                  payload: {
                    cartChecked: checked ? cartChecked.filter(j => j !== i) : [...cartChecked, i],
                  },
                });
              };
              return (
                <SwipeAction
                  key={index}
                  style={{ backgroundColor: 'gray' }}
                  autoClose={true}
                  right={[
                    {
                      text: '删除',
                      onPress: () =>
                        this.props.dispatch({ type: 'order/deleteCartItem', payload: i }),
                      style: { backgroundColor: '#F4333C', color: 'white' },
                    },
                  ]}>
                  <CartItem checked={checked} data={i} onCheck={onCheck} isEdit={this.state.isEdit} onNumChange={this.onNumChange} />
                </SwipeAction>
              );
            })
          ) : (
              <React.Fragment>
                <Empty
                  className={styles.empty}
                  description={
                    <span>
                      您的购物车还是空的，<a onClick={() => router.replace('/cakes')}>赶紧行动吧</a>
                    </span>
                  }
                />
                <div className={styles.rTip}>你可能喜欢</div>
                <div className={styles.recommend}>
                  {this.props.products.slice(0, 4).map((item, index) => (
                    <CakeItem
                      key={index}
                      item={item}
                      onClick={this.onProductClick.bind(this, item)}
                      onCartClick={this.onAddCart.bind(this, item)}
                    />
                  ))}
                </div>
              </React.Fragment>
            )}
        </div>
        {cart.length > 0 ? (
          <div className={styles.bar}>
            {
              isEdit &&
              <div onClick={this.onCheckClick} className={styles.check}>
                <Check checked={allChecked} />
                全选
                </div>
            }
            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', flex: '1' }}>
              {
                isEdit ?
                  <Button onClick={this.onDelete} style={{ width: 100, backgroundColor: 'red', opacity: this.props.cartChecked.length > 0 ? 1 : 0.3 }}>
                    删除
                </Button>
                  :
                  <React.Fragment>
                    <div className={styles.count}>
                      合计: ¥ <span>{this.getCount().toFixed(1)}</span>
                    </div>
                    <Button onClick={this.onCartClick} style={{ width: 100, opacity: this.props.cartChecked.length > 0 ? 1 : 0.3 }}>
                      结算
                    </Button>
                  </React.Fragment>
              }
            </div>
          </div>
        ) : (
            <div className={styles.bar}>
              <Button onClick={() => router.replace('/cakes')}>再逛逛</Button>
            </div>
          )}
      </div>
    );
  }
}

export default connect(state => ({
  cart: state.order.cart,
  products: state.home.products,
  cartChecked: state.order.cartChecked,
}))(Cart);

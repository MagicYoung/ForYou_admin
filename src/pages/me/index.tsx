import * as React from 'react';
import styles from './index.less';
import { connect } from 'react-redux';
import { Row, Col, Divider, Icon } from 'antd';
import classNames from 'classnames';
import router from 'umi/router';
import * as AV from 'leancloud-storage';
import { Modal, Toast } from 'antd-mobile';
import CakeItem from '@/components/CakeItem';

interface MePageProps extends ReduxComponentProps, State.LoginState { }

class MePage extends React.Component<MePageProps> {
  state = {
    cardCoupon: [],
    product: [],
  }
  async componentDidMount() {
    if (AV.User.current()) {
      const query = new AV.Query('CardCoupon');
      query.equalTo('user', AV.User.current());
      query.equalTo('isActivation', true);
      query.equalTo('isDelete', false);
      query.notEqualTo('value', 0);
      query.include('cardCouponCategory')
      const dataSource = await query.find();
      this.setState({ cardCoupon: dataSource })
    }

    const queryProduct = new AV.Query('Product');
    queryProduct.limit(6);
    const dataProduct = await queryProduct.find();
    this.setState({ product: dataProduct })
  }
  onLogout = () => {
    Modal.alert('提示', '是否退出登录？', [
      { text: '取消', onPress: () => { } },
      {
        text: '确定',
        onPress: async () => {
          await this.props.dispatch({ type: 'login/userLogout' })
        },
      },
    ]);
  };

  onSignin = () => {
    router.push('/signin');
  };

  onBindCard = () => {
    router.push('/userCardCoupon');
  };

  onEdit = () => {
    router.push('/me/edit');
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
    const user = AV.User.current();
    let balance = 0;
    this.state.cardCoupon.map((item: any) => {
      if (item.get('cardCouponCategory').get('type') !== 'F' && item.get('cardCouponCategory').get('type') !== 'D') {
        balance += item.get('value')
      }
    })
    return (
      <div className={styles.container}>
        <div className={styles.bg} >
          <div className={styles.idCard}>
            {
              user ?
                <React.Fragment>
                  <div style={{ flex: 1 }}>
                    <div onClick={this.onEdit}>
                      <span style={{ fontWeight: 'bold' }}> {user.get('nickname') || user.get('mobilePhoneNumber')} </span>
                      <Icon type="edit" style={{ marginLeft: 5 }}></Icon>
                    </div>
                    <div style={{ marginTop: 10, fontSize: 12 }}>您已经是我们的会员了</div>
                    <div style={{ marginTop: 20, fontSize: 12 }}>目前卡券余额：￥{<span style={{ fontSize: 26, fontWeight: 'bolder' }}>{balance.toFixed(2)}</span>}</div>
                    <div style={{ marginTop: 20, fontSize: 12 }}>
                      <div style={{ fontWeight: 'bolder' }} onClick={() => {
                        router.push('/userCardCoupon/AddCard');
                      }} >我要兑换！></div>
                      <div >绑定新的卡券即可开始兑换</div>
                    </div>
                  </div>
                  <div>
                    <div className={styles.avatar} >
                      <img
                        src={
                          user && user.get('avatar')
                            ? user.get('avatar').url
                            : require('../../assets/user.svg')
                        }
                      />
                    </div>
                  </div>
                </React.Fragment> :
                <div className={styles.noAuth}>
                  <div>会员中心</div>
                  <div className={styles.loginBtn} >
                    <div onClick={this.onSignin} className={styles.btn}>立即加入 解锁权益</div>
                  </div>
                </div>
            }
          </div>
        </div>
        <div className={styles.contentWrapper}>
          <div className={styles.content}>
            <div className={styles.userInfo}>
              <div className={styles.content}>
                <Row gutter={24}>
                  <Col span={8} className={styles.col} onClick={() => { user ? router.push('/orders') : this.onSignin() }}>
                    <div className={styles.iconDiv}><img className={styles.icon} src={require('../../assets/order.png')} /></div>

                    <div>全部订单</div>
                  </Col>
                  <Col
                    span={8}
                    className={styles.col}
                    onClick={() => { user ? router.push('/me/address') : this.onSignin() }}>
                    <div className={styles.iconDiv}><img
                      className={classNames(styles.icon, styles.small)}
                      src={require('../../assets/address.png')}
                    /></div>

                    <div>收货地址</div>
                  </Col>
                  <Col span={8} className={styles.col} onClick={() => {
                    user ? this.onBindCard() : this.onSignin()
                  }}>
                    <div className={styles.iconDiv}><img
                      className={classNames(styles.icon, styles.small)}
                      src={require('../../assets/card.png')}
                    /></div>
                    <div>我的卡券</div>
                  </Col>
                  {!user && <Col
                    span={8}
                    className={styles.col}
                    onClick={() => { user ? router.push('/me/feedback') : this.onSignin() }}>
                    <div className={styles.iconDiv}>
                      <img className={styles.icon} src={require('../../assets/feedback.png')} />
                    </div>

                    <div>意见反馈</div>
                  </Col>}
                </Row>
                <Divider />
                <Row gutter={24}>
                  {user && <Col
                    span={8}
                    className={styles.col}
                    onClick={() => { user ? router.push('/me/feedback') : this.onSignin() }}>
                    <div className={styles.iconDiv}>
                      <img className={styles.icon} src={require('../../assets/feedback.png')} />
                    </div>

                    <div>意见反馈</div>
                  </Col>}
                  {
                    user &&
                    <Col span={8} className={styles.col} onClick={this.onLogout}>
                      <div className={styles.iconDiv}><img
                        className={classNames(styles.icon, styles.small)}
                        src={require('../../assets/logout.png')}
                      /></div>
                      <div>退出登录</div>
                    </Col>
                  }
                </Row>
              </div>
            </div>
            <div style={{ marginTop: 20 }}>
              <div className={styles.rTip}>猜你喜欢</div>
              <div className={styles.recommend}>
                {this.state.product.map((item, index) => (
                  <CakeItem
                    key={index}
                    item={item}
                    onClick={this.onProductClick.bind(this, item)}
                    onCartClick={this.onAddCart.bind(this, item)}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
export default connect()(MePage);

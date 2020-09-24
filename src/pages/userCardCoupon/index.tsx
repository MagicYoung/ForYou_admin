import * as React from 'react';
import styles from './index.less';
import { connect } from 'react-redux';
import Button from '@/components/Button';
import { Empty, Icon, message } from 'antd';
import router from 'umi/router';
import { Toast, List, Modal } from 'antd-mobile';
import moment from 'moment'
import * as AV from 'leancloud-storage';
import { Redirect } from 'react-router';
import { isWechat } from '@/utils'
const Item = List.Item;
interface AddressProps extends ReduxComponentProps, State.HomeState {
    onSelect: (address: {}) => void;
}

class UserCardCouponPage extends React.Component<AddressProps> {
    state = {
        cardCouponArr: [],
        SMSChecked: false,
        isRecharge: false,
        isUnbind: false,
    };
    componentDidMount() {
        this.onSearch();
    }

    onSearch = async () => {
        Toast.loading('正在加载..');
        const query = new AV.Query('CardCoupon');
        query.equalTo('user', AV.User.current());
        query.equalTo('isActivation', true);
        query.equalTo('isDelete', false);
        query.notEqualTo('userUnBind', true);
        query.include('cardCouponCategory');
        query.greaterThan('value', 0);

        const ret = await query.find();
        let cardCouponArr: any[] = [];
        if (this.props.location.query.produId) {
            const queryPro = new AV.Query('Product');
            queryPro.include('usableCards');
            const product = await queryPro.get(this.props.location.query.produId);
            ret.map((r) => {
                if (product.get('usableCards').find((u) => u.id === r.get('cardCouponCategory').id)) {
                    cardCouponArr.push(r);
                }
            })
        } else {
            cardCouponArr = [...ret]
        }
        this.setState({ cardCouponArr: cardCouponArr })

        Toast.hide();
    }

    cardClick = (i) => {
        if (i.get('value')) {
            if (!this.props.location.query.cartId) {
                if (this.state.isRecharge) {
                    if (!isWechat()) {
                        message.error('请在微信浏览器中打开');
                        return
                    }
                    router.push({
                        pathname: '/userCardCoupon/Recharge',
                        query: {
                            id: i.id,
                        }
                    })
                } else if (this.state.isUnbind) {
                    Modal.alert('操作提醒', `确定要解除绑定该卡吗？`, [
                        {
                            text: '取消', onPress: () => { return }
                        },
                        {
                            text: '确定', onPress: async () => {
                                i.set('isActivation', false);
                                i.set('userUnBind', true);
                                await i.save();
                                await this.onSearch();
                                this.setState({ isUnbind: false })
                                Toast.info('已解除绑定', 1000)
                            }
                        },
                    ]);
                } else {
                    router.push({
                        pathname: '/productMall',
                        query: {
                            usableCards: i.get('cardCouponCategory').id,
                        }
                    })
                }
            }
            else {
                const { selectedCardCoupon } = this.props;
                if (selectedCardCoupon.length === 0) {
                    selectedCardCoupon.push({
                        cartId: this.props.location.query.cartId,
                        cardCoupon: i
                    })
                } else {
                    selectedCardCoupon.find((sc: any) => sc.cartId === this.props.location.query.cartId).cardCoupon = i;
                }
                this.props.dispatch({
                    type: 'order/save',
                    payload: {
                        selectedCardCoupon: selectedCardCoupon
                    },
                });
                router.goBack()
            }
        }
    }
    renderItem = (data) => {
        return (
            data.map((i: any) => {
                return (<div className={styles.cardItem} key={i.id} onClick={() => {
                    this.cardClick(i);
                }}>
                    <div className={styles.cardItemLeft}>
                        <img src={i.get("cardImage") ? i.get("cardImage").url : i.get("cardCouponCategory").get('cardImage')[0].url} />
                    </div>
                    <div className={styles.cardItemRight}>
                        {/* <div style={{ fontSize: 12 }}>
                            <span>{i.get('cardCouponCategory').get('cardName')}</span>
                            <span style={{ fontSize: 12, color: '#888', marginLeft: 5 }}>No:{i.get('no')}</span>
                        </div> */}
                        {/* <div className={styles.text1}>{i.get('cardCouponCategory').get('cardDescription')}</div> */}
                        <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: "center", padding: '0 5px' }}>
                            {(i.get('value') && i.get('cardCouponCategory').get('type') !== 'F' && i.get('cardCouponCategory').get('type') !== 'D') &&
                                <div >
                                    <div>余额</div>
                                    <div style={{ fontSize: 17 }}>￥{i.get('value').toFixed(2)}</div>
                                </div>}
                            <div className={styles.text1}>
                                <div>{i.get('no')}</div>
                                <div>有效日期至{i.get('cardCouponCategory').get('effectiveEndDate')}</div>
                            </div>
                        </div>

                    </div>
                </div>)
            })
        );
    };

    getCanUseCard = () => {
        return this.state.cardCouponArr.filter((i) => {
            //&& moment().isAfter(i.get('cardCouponCategory').get('effectiveStartDate'))
            if (i.get('value') && moment().isBefore(i.get('cardCouponCategory').get('effectiveEndDate'))) {
                return true
            }
        })
    }
    unBind = () => {
        this.setState({ isUnbind: true })
    }
    render() {
        if (!AV.User.current()) {
            return <Redirect to="/signin" />;
        }
        const tabs = [
            { title: !this.props.location.query.cartId ? '可使用' : '该商品可使用（点击卡券选择）' },
        ];
        !this.props.location.query.cartId && tabs.push({ title: '已使用' })
        return (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', alignItems: 'center' }}>
                <div className={styles.container}>
                    <div className={styles.cardCon}>

                        <div className={styles.tabItem} >
                            {
                                this.getCanUseCard().length ?
                                    this.renderItem(this.getCanUseCard()) :
                                    <Empty
                                        style={{
                                            width: '100%',
                                            height: 400,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            flexDirection: 'column',
                                        }}
                                    />
                            }

                        </div>
                    </div>
                    {
                        (this.state.isRecharge || this.props.location.query.cartId || this.state.isUnbind) &&
                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                            <div style={{ width: '80%', padding: '10px 0' }}>
                                <Button onClick={() => {
                                    this.setState({ isRecharge: false, isUnbind: false })
                                    if (this.props.location.query.cartId) {
                                        router.goBack();
                                    }
                                }} className={styles.cancel}>取消<span style={{ fontSize: 12 }}>(点击卡片确定)</span></Button>
                            </div>
                        </div>
                    }

                    {
                        (!this.state.isRecharge && !this.props.location.query.cartId && !this.state.isUnbind) &&
                        <React.Fragment>
                            <div className={styles.action}>
                                <div className={styles.item}
                                    onClick={() => {
                                        this.setState({ isRecharge: true })
                                    }}
                                >
                                    <Icon type="money-collect" theme="filled" style={{ color: '#6495ED', fontSize: 20 }} />
                                    <div>充值</div>
                                </div>
                                <a href={`tel:${this.props.setting.get('customerPhone')}`} style={{ display: 'contents' }}>
                                    <div className={styles.item} >
                                        <Icon type="phone" style={{ color: '#6495ED', fontSize: 20 }} />
                                        <div>客服</div>
                                    </div>
                                </a>
                                <div className={styles.item}
                                    onClick={() => { router.push('/orders') }}
                                >
                                    <Icon type="compass" style={{ color: '#6495ED', fontSize: 20 }} />
                                    <div>订单查询</div>
                                </div>
                            </div>

                            <div style={{ marginTop: 20 }}>
                                <List>
                                    {/* <Item
                                        extra={<Switch checked={this.state.SMSChecked} onChange={() => {
                                            this.setState({ SMSChecked: !this.state.SMSChecked })
                                        }} />}
                                        thumb={<Icon type="credit-card" />}
                                    >消费短信提醒</Item> */}
                                    <Item thumb={<Icon type="container" />}
                                        onClick={() => {
                                            router.push('/userCardCoupon/RechargRecord')
                                        }}
                                    >充值记录</Item>
                                    <Item thumb={<Icon type="minus-circle" />} onClick={() => {
                                        this.unBind()
                                    }}>解除绑定</Item>
                                </List>
                            </div>
                        </React.Fragment>
                    }
                </div>
                {
                    (!this.state.isRecharge && !this.state.isUnbind) &&

                    <div style={{ width: '80%', padding: '10px 0' }}>
                        <Button onClick={() => {
                            router.push('/userCardCoupon/AddCard');
                        }}>绑定新福利</Button>
                    </div>
                }
            </div>
        )
    }
}

export default connect(state => ({
    ...state.home,
    selectedCardCoupon: state.order.selectedCardCoupon,
    setting: state.app.setting
}))(UserCardCouponPage);

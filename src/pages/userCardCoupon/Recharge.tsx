import * as React from 'react';
import styles from './Recharge.less';
import { connect } from 'react-redux';
import classNames from 'classnames';
import Button from '@/components/Button';
import { Icon } from 'antd';
import router from 'umi/router';
import { Toast, Modal } from 'antd-mobile';
import moment from 'moment'
import * as AV from 'leancloud-storage';
import { wechatId } from '@/config'
import { Recharge } from '@/AVObjects';
import md5 from 'md5'
const prompt = Modal.prompt;

const rechargePrice = [10, 20, 30, 40, 50, 100, 200, 300, 500]


interface AddressProps extends ReduxComponentProps, State.HomeState {
    onSelect: (address: {}) => void;
}
@connect(state => ({
    ...state.home,
}))
export default class RechargePage extends React.Component<AddressProps> {
    state = {
        currCard: null,
        selectedPrice: null,
    };
    async componentDidMount() {
        Toast.loading('正在加载..');
        const query = new AV.Query('CardCoupon');
        query.include('cardCouponCategory');

        const ret = await query.get(this.props.location.query.id);
        this.setState({ currCard: ret })

        Toast.hide();
        if (typeof window.WeixinJSBridge == "undefined") {
            if (document.addEventListener) {
                document.addEventListener('WeixinJSBridgeReady', this.onBridgeReady, false);
            } else if (document.attachEvent) {
                document.attachEvent('WeixinJSBridgeReady', this.onBridgeReady);
                document.attachEvent('onWeixinJSBridgeReady', this.onBridgeReady);
            }
        }
    }

    onBridgeReady = () => {
        window.WeixinJSBridge.call('hideOptionMenu');
    }
    clickCard = (val) => {
        const { currCard } = this.state;
        this.setState({ selectedPrice: val });
        Modal.alert('充值提醒', `确定充值${val}元？`, [
            {
                text: '取消', onPress: () => {
                    this.setState({ selectedPrice: null })
                }
            },
            {
                text: '确定', onPress: async () => {
                    try {
                        //向payjs 获取数据
                        const toQueryString = (obj) => Object.keys(obj)
                            .filter(key => key !== 'sign' && obj[key] !== undefined && obj[key] !== '')
                            .sort()
                            .map(key => {
                                if (/^http(s)?:\/\//.test(obj[key])) { return key + '=' + encodeURI(obj[key]) } else { return key + '=' + obj[key] }
                            })
                            .join('&')

                        Toast.loading('正在发起支付..');

                        //生成订单号
                        const date = moment(Date.now())
                            .valueOf()
                            .toString();
                        const no = moment().format('YYYYMMDDHHmm') + date.slice(date.length - 4, date.length - 1)
                        //数据参数
                        const attach = `${currCard.get('cardCouponCategory').get('cardName')}:${currCard.get('no')}`;
                        let params: any = {
                            "mchid": wechatId.mchid,
                            "total_fee": val * 100,
                            "out_trade_no": no,
                            "body": '卡券充值',
                            "attach": attach,
                            "notify_url": 'http://zong-fu.com/me',
                            "openid": this.props.openid,
                            //"sign": getPaySign(val, no),
                        }
                        params = toQueryString(params)
                        //生成请求url
                        let url = '/wxpay?' + params
                        params += '&key=T2qQgMBUhq8S3Wli';
                        const sign = md5(params).toUpperCase();
                        url += '&sign=' + sign;
                        this.setState({ sign: sign })
                        const recharge = new Recharge();
                        //在后端保存一条充值数据
                        recharge.set('name', attach);
                        recharge.set('no', no);
                        recharge.set('card', currCard);
                        recharge.set('money', val);
                        recharge.set('user', AV.User.current());
                        recharge.set('status', 0);
                        fetch(url)
                            .then((response) => {
                                return response.json();
                            })
                            .then((res) => {
                                if (res.return_code && res.return_code === 1) {
                                    const jsapi = res.jsapi;
                                    //发起微信支付
                                    window.WeixinJSBridge.invoke(
                                        'getBrandWCPayRequest', {
                                        // **************************
                                        "appId": jsapi.appId,
                                        "timeStamp": jsapi.timeStamp,
                                        "nonceStr": jsapi.nonceStr,
                                        "package": jsapi.package,
                                        "signType": jsapi.signType,
                                        "paySign": jsapi.paySign,
                                    }, async (payRes: any) => {
                                        if (payRes.err_msg === "get_brand_wcpay_request:ok") {
                                            Toast.loading('充值成功，正在返回..');
                                            recharge.set('status', 1);
                                            currCard.set('value', currCard.get('value') + val);
                                            await currCard.save();
                                            await recharge.save();
                                            router.goBack();

                                        } else {
                                            this.setState({ selectedPrice: null })
                                            Toast.fail('充值交易失败', 1);
                                        }
                                        Toast.hide();
                                    }
                                    );
                                } else {
                                    this.setState({ selectedPrice: null })
                                    Toast.fail(res.return_msg ? res.return_msg : '支付失败')
                                    Toast.hide();
                                }
                            }).catch((err) => {
                                Toast.hide();
                                alert(err)
                            });;
                    } catch (err) {
                        Toast.info(err, 5000)
                    }
                }
            },
        ]);

    }
    render() {
        const { currCard, selectedPrice } = this.state
        return (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', alignItems: 'center' }}>
                <div className={styles.container}>
                    {
                        currCard &&
                        <div className={styles.header}>
                            <div className={styles.title}>{currCard.get('cardCouponCategory').get('cardName')}(当前余额{currCard.get('value').toFixed(2)})</div>
                            <div className={styles.cardNo}>
                                <div>{currCard.get('no')}</div>
                                <Icon type="credit-card" />
                            </div>
                        </div>
                    }
                    <div className={styles.recharge}>
                        {
                            rechargePrice.map((item) => {
                                return <div
                                    key={item}
                                    className={classNames(styles.item, selectedPrice === item ? styles.itemSelected : styles.itemNoSelected)}
                                    onClick={() => {
                                        this.clickCard(item)
                                    }}
                                >
                                    <div><span style={{ fontSize: 21, fontWeight: 'bolder' }}>{item}</span>元</div>
                                </div>
                            })
                        }
                        <div
                            key="other"
                            className={classNames(styles.item, selectedPrice === 'other' ? styles.itemSelected : styles.itemNoSelected)}
                            onClick={() => {
                                this.setState({ selectedPrice: 'other' })
                                prompt('自定义金额', '请输入自定义金额', [
                                    { text: '取消' },
                                    { text: '确定', onPress: value => {
                                        this.clickCard(value)
                                    } },
                                ])
                            }}
                        >
                            <div>自定义金额</div>
                        </div>
                    </div>
                </div>
                <div style={{ width: '80%', padding: '10px 0' }}>
                    <Button onClick={() => {
                        router.goBack();
                    }}>返回</Button>
                </div>
            </div>
        )
    }
}


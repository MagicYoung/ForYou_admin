import * as React from 'react';
import { connect } from 'react-redux';
import * as AV from 'leancloud-storage';
import { Spin } from 'antd';
import { Result, Icon } from 'antd-mobile';
import router from 'umi/router';
import styles from './index.less';
import Button from '@/components/Button';

interface ProductProps
    extends State.HomeState,
    ReduxComponentProps,
    RouteComponentProps<{ id?: string }> { }

class Redirect extends React.Component<ProductProps> {
    state = {
        loading: false,
        data: [],
    };

    async componentDidMount() {
        this.setState({ loading: true })
        const id = this.props.location.query.id
        const query = new AV.Query('ElectronicCodeList');
        query.containedIn('objectId', id.split(','));
        query.include('product');
        query.notEqualTo('isDelete', true);
        query.notEqualTo('user', null);
        const eRes = await query.find();
        this.setState({ loading: false, data: eRes })
        if (eRes.length === 1 && AV.User.current()) {
            window.location.href = eRes[0].get('no');
        }

    }
    renderLogin() {
        return (
            <div className={styles.empty}>
                <div className={styles.tip}>当前未登录</div>
                <div className={styles.tip}>无法查看电子券</div>
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
                tip: '登陆后查信息',
            },
        });
    }

    render() {
        const { loading, data } = this.state;
        if (!AV.User.current()) {
            return this.renderLogin();
        }
        return (
            <Spin tip="正在跳转" spinning={loading}>
                {
                    loading ?
                        <Result
                            title="请等待..."
                            message="正在跳转，请等待"
                        /> :
                        !this.state.data.length ?
                            <Result
                                img={<Icon type="cross-circle-o" className="spe" style={{ fill: '#F13642' }} />}
                                title="跳转失败"
                                message={<div>
                                    <div>当前卡券不存在或不能使用...</div>
                                    <div style={{ color: '#1F90E6' }}
                                        onClick={() => {
                                            router.replace('/')
                                        }}
                                    >去逛逛..</div>
                                </div>}
                            /> : <Result
                                img={<Icon type="check-circle" style={{ fill: '#1F90E6', width: 50, height: 50 }} />}
                                title="验证成功"
                                message={
                                    data.length > 1 ?
                                        <div style={{ width: '100%' }}>
                                            <div> 电子券({data.length}张) </div>
                                            <div >
                                                {
                                                    data.map((item: any) => {
                                                        return (
                                                            <div
                                                                key={item.id}
                                                                style={{ marginTop: 10, color: '#1890ff', fontWeight: 'bolder' }}
                                                                onClick={() => {
                                                                    window.location.href = item.attributes.no
                                                                }}
                                                            >
                                                                <Icon type="money-collect" style={{ marginRight: 6, fontSize: 18 }} />
                                                                {item.attributes.product.get('name')}->
                                                                {/* {item.attributes.no}  */}
                                                                点击使用
                                                             </div>
                                                        )
                                                    })
                                                }

                                            </div>
                                        </div> : <div>'正在准备跳转'</div>
                                }
                            />

                }

            </Spin>
        );
    }
}

export default connect(state => ({ AVCategories: state.home.AVCategories }))(Redirect);

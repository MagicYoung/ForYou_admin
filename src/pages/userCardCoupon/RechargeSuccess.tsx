import * as React from 'react';
import { Icon } from 'antd';
import router from 'umi/router';
import {  Result } from 'antd-mobile';
import Button from '@/components/Button';

interface AddressProps extends ReduxComponentProps, State.HomeState {
    onSelect: (address: {}) => void;
}
export default class RechargeSuccess extends React.Component<AddressProps> {
    state = {
        time: 5,
    }
    timeer = null;
    async componentDidMount() {

        this.timeer = window.setInterval(() => {
            this.setState({ time: this.state.time - 1 })
            if (this.state.time === 0) {
                window.clearInterval(this.timeer);
                router.replace('/userCardCoupon');
            }
        }, 1000)
    }


    render() {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
                <Result
                    img={<Icon type="wechat" style={{ color: 'green', fontSize: 50 }} />}
                    title="充值成功"
                    message={<div>{this.state.time}秒后自动返回...</div>}
                />
                <div style={{ width: '80%', padding: '10px 0' }}>
                    <Button onClick={() => { 
                        window.clearInterval(this.timeer);
                        router.replace('/userCardCoupon');
                    }}>返回</Button>
                </div>
            </div>
        )
    }
}


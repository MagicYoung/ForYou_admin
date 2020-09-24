import * as React from 'react';
import styles from './index.less';
import {Alert } from 'antd';
import Button from '@/components/Button';
import { connect } from 'react-redux';
import router from 'umi/router';
import { Toast } from 'antd-mobile';
import * as AV from 'leancloud-storage';
import moment from 'moment'

interface PageProps extends ReduxComponentProps {
  location: ReactLocation;
}

class SignUpPage extends React.Component<PageProps> {
  smsCode: string;
  timer: NodeJS.Timeout;

  state = {
    error: '',
    tip: '',
    countDown: 0,
    mobile: '',
  };

  componentDidMount() {
    if (this.props.location.state) {
      this.setState({ tip: this.props.location.state.tip });
    }
  }

  onMobileChange = e => {
    this.state.error && this.setState({ error: '' });
    this.setState({ mobile: e.target.value })
  };

  onSmsCodeChange = e => {
    this.state.error && this.setState({ error: '' });
    this.smsCode = e.target.value;
  };

  startCountDown = () => {
    this.timer = setTimeout(() => {
      this.setState({ countDown: this.state.countDown - 1 }, () => {
        if (this.state.countDown > 0) {
          this.startCountDown();
        }
      });
    }, 1000);
  };

  onSendSmsCode = async () => {
    if (!this.validateMobile()) return this.setState({ error: '请输入正确的手机号码' });
    if (this.state.countDown > 0) return;
    const ret = await this.props.dispatch({
      type: 'login/requestSmsCode',
      payload: { mobile: this.state.mobile },
    });
    if (ret) {
      this.setState({ countDown: 60 }, this.startCountDown);
    }
  };

  validateMobile = () => {
    return /^1[34578]\d{9}$/.test(this.state.mobile);
  };

  validateSmsCode = () => {
    return this.smsCode.length === 6;
  };

  onLogin = async () => {
    if (!this.validateMobile()) return this.setState({ error: '手机号码格式不正确!' });
    if (!this.validateSmsCode()) return this.setState({ error: '验证码不正确!' });
    const ret = await this.props.dispatch({
      type: 'login/userLogin',
      payload: {
        mobile: this.state.mobile,
        smsCode: this.smsCode,
      },
    });
    if (ret) {
      Toast.success('登录成功', 1, async () => {
        //保存第一次登陆时间和第二次登陆时间
        if (!AV.User.current().get('firstLogin')) {
          AV.User.current().set('firstLogin', moment().format('YYYY-MM-DD HH:mm'))
          await AV.User.current().save()
        }
        this.props.dispatch({ type: 'home/queryCartNum' });
        if (this.props.location.query.origin === 'userCardCoupon') {
          router.replace({
            pathname: '/userCardCoupon/AddCard',
            query: {
              no: this.props.location.query.no,
              pwd: this.props.location.query.pwd,
              qrmode: true,
            },
          });
        } else {
          router.replace('/')
        }
      });
    } else {
      this.setState({ error: '输入的验证码错误!' });
    }
  };

  render() {
    return (
      <div className={styles.container}>
        <div style={{ fontSize: 24, color: '#000000', fontWeight: 'bolder' }}>快捷注册登录</div>
        <div className={styles.row}>
          <div className={styles.item}>
            <span style={{ padding: '0 10px', borderRight: '1px solid #c1b9b2' }}>+86</span>
            <input onChange={this.onMobileChange} placeholder="请输入手机号码" />
          </div>
        </div>
        <div className={styles.row}>
          <div className={styles.item}>
            <input
              onChange={this.onSmsCodeChange}
              style={{ width: 100 }}
              placeholder="请输入验证码"
            />
          </div>
          <div className={styles.sms} onClick={this.onSendSmsCode}
            style={{ backgroundColor: !this.state.mobile ? '#c1b9b2' : '#dd4f14' }}
          >
            {this.state.countDown > 0 ? `${this.state.countDown}s后再试` : '发送验证码'}
          </div>
        </div>
        <div className={styles.row} style={{ marginTop: 50 }} >
          <Button onClick={this.onLogin} style={{ height: 53 }}>立即登录</Button>
        </div>
        {this.state.error && (
          <div className={styles.row}>
            <Alert style={{ width: '100%' }} message={this.state.error} type="error" showIcon={true} />
          </div>
        )}
        {this.state.tip && (
          <div className={styles.row}>
            <Alert style={{ width: '100%' }} message={this.state.tip} type="info" showIcon={true} />
          </div>
        )}
        {
          this.props.setting.get('loginBg') &&
          <div className={styles.bg}><img src={this.props.setting.get('loginBg').url} /></div>
        }
      </div>
    );
  }
}

export default connect(state => ({
  setting: state.app.setting,
}))(SignUpPage);

import * as React from 'react';
import { connect } from 'react-redux';
import { Alert } from 'antd';
import { Login } from 'ant-design-pro';
import styles from './Login.less';
import { CheckboxChangeEvent } from 'antd/lib/checkbox';
import router from 'umi/router';
import { validateMobile } from '@/utils'

const { Tab, Submit, Mobile, Captcha } = Login;

interface LoginPageProps extends ReduxComponentProps {
  submitting: boolean;
}

interface LoginPageStates {
  type: string;
  autoLogin: boolean;
  error: string;
}

@connect(state => ({
  submitting: state.loading.effects['login/login'],
}))
class LoginPage extends React.Component<LoginPageProps, LoginPageStates> {
  loginForm: any;
  smsCode: string;
  timer: NodeJS.Timeout;

  state = {
    type: 'mobile',
    autoLogin: true,
    error: '',
  };

  onTabChange = (type: string) => {
    this.setState({ type });
  };

  handleSubmit = async (err: any, values: any) => {
    const { type } = this.state;
    if (!err) {
      const { dispatch } = this.props;
      const user: AV.User = await dispatch({
        type: 'login/adminLogin',
        payload: {
          ...values,
          type,
        },
      });
      if (user) {
        router.push('/admin');
      } else {
        this.setState({ error: '用户名或者密码错误！' });
      }
    }
  };

  changeAutoLogin = (e: CheckboxChangeEvent) => {
    this.setState({
      autoLogin: e.target.checked,
    });
  };

  renderMessage = (content: string) => (
    <Alert style={{ marginBottom: 24 }} message={content} type="error" showIcon={true} />
  );

  onSendSmsCode = async () => {
    const mobile = this.loginForm.getFieldValue('mobile');
    if (!validateMobile(mobile)) {
      return this.setState({ error: '请输入正确的手机号码' });
    }

    await this.props.dispatch({
      type: 'login/requestSmsCode',
      payload: { mobile: mobile },
    });
  };

  onLogin = async () => {
    const fieldValue = this.loginForm.getFieldsValue();
    if (!validateMobile(fieldValue.mobile)) return this.setState({ error: '手机号码格式不正确!' });
    if (!fieldValue.captcha.length === 6) return this.setState({ error: '验证码不正确!' });
    const ret = await this.props.dispatch({
      type: 'login/userLogin',
      payload: {
        mobile: fieldValue.mobile,
        smsCode: fieldValue.captcha,
      },
    });
    if (ret) {
      router.push('/admin');
    } else {
      this.setState({ error: '输入的验证码错误!' });
    }
  };



  render() {
    const { submitting } = this.props;
    const { type, error } = this.state;
    return (
      <div className={styles.main}>
        <Login
          defaultActiveKey={type}
          onTabChange={this.onTabChange}
          onSubmit={this.onLogin}
          ref={form => (this.loginForm = form)}>

          <Tab key="mobile" tab="验证码登录">
            {error && this.renderMessage(error)}
            {/* 
              // @ts-ignore */}
            <Mobile
              name="mobile"
              placeholder="输入手机号"
              type="number"
              rules={[
                {
                  required: true,
                  message: '请输入手机号',
                },
              ]}
            />
            {/* 
              // @ts-ignore */}
            <Captcha
              name="captcha"
              placeholder="输入验证码"
              getCaptchaButtonText="获取验证码"
              rules={[
                {
                  required: true,
                  message: '请输入输入验证码',
                },
              ]}
              onGetCaptcha={() => { this.onSendSmsCode() }}
            />
          </Tab>
          <Submit loading={submitting}>登录</Submit>
        </Login>
      </div>
    );
  }
}

export default LoginPage;

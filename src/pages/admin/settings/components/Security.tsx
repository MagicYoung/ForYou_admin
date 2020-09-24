import * as React from 'react';
import { Form, List, Modal, Input, message } from 'antd';
import { connect } from 'react-redux';
import { FormComponentProps } from 'antd/lib/form';

interface SecurityProps extends State.AppState, ReduxComponentProps, FormComponentProps {}

const formLayoutProps = {
  labelCol: {
    span: 6,
  },
  wrapperCol: {
    span: 18,
  },
};

@connect(state => ({ setting: state.app.setting }))
class Security extends React.Component<SecurityProps> {
  state = {
    visible: false,
  };
  onCancel = () => this.setState({ visible: false });

  onOk = () => {
    this.props.form.validateFields(async (err, values) => {
      if (err) return;
      const ret = this.props.dispatch({
        type: 'app/changePwd',
        payload: {
          oPwd: values['oPwd'],
          pwd: values['pwd'],
        },
      });
      if (ret) message.success('修改成功!');
      else message.error('修改失败，可能是原密码错误！');
    });
  };

  renderItem = () => {
    return (
      <List.Item
        actions={[
          <a
            onClick={() => {
              this.setState({ visible: true });
            }}>
            修改
          </a>,
        ]}>
        <List.Item.Meta title="账户密码" description="修改当前密码" />
      </List.Item>
    );
  };

  render() {
    const {
      form: { getFieldDecorator, getFieldValue },
    } = this.props;
    const { visible } = this.state;
    return (
      <div style={{ width: 500 }}>
        <List dataSource={['password']} renderItem={this.renderItem} />
        <Modal visible={visible} title="修改密码" onOk={this.onOk} onCancel={this.onCancel}>
          <Form layout="horizontal">
            <Form.Item label="原密码" {...formLayoutProps}>
              {getFieldDecorator('oPwd', {
                rules: [
                  {
                    required: true,
                    message: '请输入原密码',
                  },
                ],
              })(<Input.Password />)}
            </Form.Item>
            <Form.Item label="新密码" {...formLayoutProps}>
              {getFieldDecorator('pwd', {
                rules: [
                  {
                    required: true,
                    message: '请输入新密码',
                  },
                ],
              })(<Input.Password />)}
            </Form.Item>
            <Form.Item label="重复新密码" {...formLayoutProps}>
              {getFieldDecorator('pwd2', {
                rules: [
                  {
                    required: true,
                    message: '重复输入新密码',
                  },
                  {
                    validator(rule, value, cb) {
                      if (getFieldValue('pwd') !== value) {
                        return cb(false);
                      }
                      cb();
                    },
                    message: '两次输入结果不一样',
                  },
                ],
              })(<Input.Password security=" " />)}
            </Form.Item>
          </Form>
        </Modal>
      </div>
    );
  }
}

export default Form.create()(Security);

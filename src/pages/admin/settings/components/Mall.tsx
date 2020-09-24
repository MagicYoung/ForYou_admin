import * as React from 'react';
import { Form, Input, Switch, Button, message } from 'antd';
import { FormComponentProps } from 'antd/lib/form';
import { connect } from 'react-redux';
import { renderUploadItem, getUploadListItem, uploadFiles } from '@/utils';

const FormItem = Form.Item;

interface MallProps extends State.AppState, FormComponentProps, ReduxComponentProps {}

const formLayoutProps = {
  labelCol: {
    span: 6,
  },
  wrapperCol: {
    span: 18,
  },
};

@connect(state => ({
  setting: state.app.setting,
}))
class Mall extends React.Component<MallProps> {
  onSubmit = e => {
    e.preventDefault();
    const { form } = this.props;
    form.validateFields(async (err, values) => {
      if (err) return;
      const wechatQR = await uploadFiles(values['wechatQR']);
      const logo = await uploadFiles(values['logo']);
      const loginBg=await uploadFiles(values['loginBg']);
      const ret = await this.props.dispatch({
        type: 'app/saveSetting',
        payload: {
          ...values,
          wechatQR: wechatQR[0] || null,
          logo: logo[0] || null,
          loginBg:loginBg[0] || null,
        },
      });
      if (ret) return message.success('保存成功！');
    });
  };
  render() {
    const {
      form: { getFieldDecorator, getFieldValue },
      setting,
    } = this.props;
    return (
      <Form layout="horizontal" onSubmit={this.onSubmit} style={{ width: 500 }}>
        <FormItem {...formLayoutProps} label="商城名称">
          {getFieldDecorator('name', {
            initialValue: setting.get('name'),
            rules: [
              {
                required: true,
                message: '请输入商城名称',
              },
            ],
          })(<Input />)}
        </FormItem>
        <FormItem {...formLayoutProps} label="商城描述">
          {getFieldDecorator('description', {
            initialValue: setting.get('description'),
          })(<Input />)}
        </FormItem>
        <FormItem {...formLayoutProps} label="版权信息">
          {getFieldDecorator('copyright', {
            initialValue: setting.get('copyright'),
          })(<Input />)}
        </FormItem>
        <FormItem {...formLayoutProps} label="营业">
          {getFieldDecorator('opened', {
            initialValue: setting.get('opened'),
            valuePropName: 'checked',
          })(<Switch checkedChildren="开" unCheckedChildren="关" />)}
        </FormItem>
        <FormItem {...formLayoutProps} label="微信公众号" extra="链接跳转到微信公众号">
          {getFieldDecorator('weixin', {
            initialValue: setting.get('weixin'),
          })(<Input />)}
        </FormItem>
        <FormItem {...formLayoutProps} label="微博链接" extra="链接跳转到微博">
          {getFieldDecorator('weibo', {
            initialValue: setting.get('weibo'),
          })(<Input />)}
        </FormItem>
        <FormItem {...formLayoutProps} label="客服电话" extra="">
          {getFieldDecorator('customerPhone', {
            initialValue: setting.get('customerPhone'),
          })(<Input />)}
        </FormItem>
        {renderUploadItem({
          name: 'logo',
          label: '店铺logo',
          getFieldDecorator,
          // rules: [
          //   {
          //     required: true,
          //     message: '请上传logo',
          //   },
          // ],
          getFieldValue,
          formLayoutProps,
          initialValue: setting.get('logo') ? [getUploadListItem(setting.get('logo'), 1)] : [],
        })}
        {renderUploadItem({
          name: 'wechatQR',
          label: '公众号二维码',
          getFieldDecorator,
          getFieldValue,
          formLayoutProps,
          initialValue: setting.get('wechatQR')
            ? [getUploadListItem(setting.get('wechatQR'), 1)]
            : [],
        })}
        {renderUploadItem({
          name: 'loginBg',
          label: '用户登录背景图',
          getFieldDecorator,
          getFieldValue,
          formLayoutProps,
          initialValue: setting.get('loginBg') ? [getUploadListItem(setting.get('loginBg'), 1)] : [],
        })}
        <FormItem wrapperCol={{ span: 24, offset: 6 }}>
          <Button type="primary" htmlType="submit">
            保存设置
          </Button>
        </FormItem>
      </Form>
    );
  }
}

export default Form.create()(Mall);

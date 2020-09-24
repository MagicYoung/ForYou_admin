import * as React from 'react';
import styles from './AddCard.less';
import { connect } from 'react-redux';
import { List, InputItem, WingBlank, WhiteSpace, Toast } from 'antd-mobile';
import { createForm } from 'rc-form';
import Button from '@/components/Button';
import router from 'umi/router';
import * as AV from 'leancloud-storage';

interface EditProps extends ReduxComponentProps {
  location: ReactLocation;
}

class UserAddCardPage extends React.Component<EditProps> {
  async componentDidMount() {
    // 处理扫码绑定
    if (!AV.User.current()) {
      router.replace({
        pathname: '/signin',
        query: {
          origin: 'CardCoupon',
          ...this.props.location.query,
        },
      });
    }
    if (this.props.location.search) {
      const CardCoupon = this.props.location.query;
      if (!await this.validateCardCoupon(CardCoupon.no)) {
        return false;
      }
      this.props.form.setFieldsValue({
        no: CardCoupon.no,
        pwd: CardCoupon.pwd,
      });
    }
  }
  validateCardCoupon = async (no) => {
    const ret = await this.props.dispatch({
      type: 'home/validateCardCoupon',
      payload: no,
    });
    if(!ret) return Toast.info('卡号或密码错误，卡不存在', 1.5);
    if (ret.get('user')) {
      if (this.props.location.search) {
        return Toast.info('该卡已经被绑定过了', 1.5, () => {
          router.replace('/');
        });
      } else {
        Toast.info('该卡已经被绑定过了', 1.5);
        return false
      }
    }
    if (!ret.get('isActivation')) {
      Toast.info('该卡已被冻结或者未激活', 1.5);
      return false;
    }
    return true;
  }
  onSave = () => {
    this.props.form.validateFields(async (err, values) => {
      if (!await this.validateCardCoupon(values.no)) {
        return false;
      }

      if (err) {
        for (let key in err) {
          return Toast.info(err[key].errors[0].message, 1.5);
        }
      }
      const ret = await this.props.dispatch({
        type: 'home/saveCardCoupon',
        payload: { ...values },
      });
      if (ret) {

        Toast.success('保存成功!', 1.5, () => {
          router.push({
            pathname: '/productMall',
            query: {
              usableCards: ret.get('cardCouponCategory').id,
            }
          })
          // if (this.props.location.query.qrmode) {
          //   router.replace('/CardCoupon');
          // } else {
          //   router.goBack();
          // }
        });
      }
    });
  };

  render() {
    const { getFieldProps } = this.props.form;
    return (
      <div className={styles.container}>
        <List style={{ display: 'block' }}>
          <InputItem
            type="number"
            {...getFieldProps('no', {
              rules: [
                {
                  required: true,
                  message: '请输入卡号',
                },
              ],
            })}
            clear={true}
            placeholder="请输入卡号">
            卡号
            </InputItem>
          <InputItem
            {...getFieldProps('pwd', {
              rules: [
                {
                  required: true,
                  message: '请输入卡密',
                },
              ],
            })}
            clear={true}
            placeholder="请输入卡密">
            卡密
            </InputItem>
        </List>
        <WhiteSpace size="lg" />
        <WingBlank>
          <Button onClick={this.onSave}>绑定</Button>
        </WingBlank>
      </div>
    );
  }
}

export default createForm()(connect()(UserAddCardPage));
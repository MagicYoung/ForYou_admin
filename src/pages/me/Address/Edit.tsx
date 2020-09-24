import * as React from 'react';
import styles from './Edit.less';
import { connect } from 'react-redux';
import { List, InputItem, TextareaItem, WhiteSpace, Toast,Picker } from 'antd-mobile';
import { createForm } from 'rc-form';
import Button from '@/components/Button';
import router from 'umi/router';
import CITIES from '@/config/city';
import * as AV from 'leancloud-storage';

interface EditProps extends ReduxComponentProps {
  location: ReactLocation;
}

class EditPage extends React.Component<EditProps> {
  state = {
    isDefaultAddr: false,
    currAddress: null
  }
  async componentDidMount() {
    if (this.props.location.query.id) {
      Toast.loading('加载数据..')
      const query = new AV.Query('Address');
      const address = await query.get(this.props.location.query.id);
      address.get =
        address.get ||
        function (key: string) {
          return address.attributes[key];
        };
      const districtArr = address.get('district').split(',');
      const province = CITIES.find((item) => { return item.label === districtArr[0] });
      const city = province?.children.find((item) => { return item.label === districtArr[1] });
      const area = city?.children.find((item) => { return item.label === districtArr[2] });
      this.props.form.setFieldsValue({
        name: address.get('name'),
        mobile: address.get('mobile'),
        addr: address.get('addr'),
        district: [province?.value, city?.value, area?.value],
      });
      this.setState({ isDefaultAddr: address.get('isDefault'), currAddress: address,isCake:false })
      Toast.hide();
    }
  }

  onSave = () => {
    this.props.form.validateFields(async (err, values) => {
      const province = CITIES.find((item) => { return item.value === values.district[0] });
      const city = province?.children.find((item) => { return item.value === values.district[1] });
      const area = city?.children.find((item) => { return item.value === values.district[2] });
      const district = `${province?.label},${city?.label},${area?.label}`;
      if (err) {
        for (let key in err) {
          return Toast.info(err[key].errors[0].message, 1.5);
        }
      }
      if (!values.district || !values.district[0]) {
        return Toast.info('请选择行政区', 1.5);
      }
      values.district = district;
      values.isDefault = this.state.isDefaultAddr;
      const ret = await this.props.dispatch({
        type: 'home/saveAddress',
        payload: { ...values, oAddress: this.state.currAddress },
      });
      ret && Toast.success('保存成功!', 1.5, router.goBack);
    });
  };

  render() {
    const { getFieldProps } = this.props.form;
    return (
      <div className={styles.container}>
        <List>
          <InputItem
            {...getFieldProps('name', {
              rules: [
                {
                  required: true,
                  message: '请输入姓名',
                },
              ],
            })}
            clear={true}
            placeholder="请输入收货人姓名">
            姓名
          </InputItem>
          <InputItem
            {...getFieldProps('mobile', {
              rules: [
                {
                  required: true,
                  type: 'string',
                  len: 13,
                  message: '请输入正确的手机号码',
                },
              ],
            })}
            type="phone"
            clear={true}
            placeholder="请输入手机号码">
            手机号码
          </InputItem>

        </List>

        <WhiteSpace size="lg" />
        <List>
          <Picker
            extra={null}
            data={CITIES}
            cols={3}
            title="选择行政区"
            {...getFieldProps('district')}>
            <List.Item arrow="horizontal">
              所在地区
            </List.Item>
          </Picker>
          <TextareaItem
            {...getFieldProps('addr', {
              rules: [
                {
                  required: true,
                  message: '请输入收货地址',
                },
              ],
            })}
            title={'详细地址'}
            placeholder="请输入详细地址"
            rows={5}
          />
          {/* <List.Item
            extra={<Switch
              checked={this.state.isDefaultAddr}
              onChange={() => {
                this.setState({
                  isDefaultAddr: !this.state.isDefaultAddr,
                });
              }}
            />}
          >设为默认地址</List.Item> */}
        </List>
        <WhiteSpace size="lg" />
        <div className={styles.button}>
          <Button onClick={this.onSave} style={{ backgroundColor: '#022c27', height: 53 }}>保存并使用</Button>
        </div>
      </div>
    );
  }
}

export default createForm()(connect(state => ({ ...state.app }))(EditPage));

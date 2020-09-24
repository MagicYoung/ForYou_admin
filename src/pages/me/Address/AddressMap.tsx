import * as React from 'react';
import styles from './Edit.less';
import { connect } from 'react-redux';
import { List, InputItem, TextareaItem, WhiteSpace, Toast, Accordion } from 'antd-mobile';
import { createForm } from 'rc-form';
import Button from '@/components/Button';
import router from 'umi/router';
import * as AV from 'leancloud-storage';
import Amap from '@/components/Map'

interface EditProps extends ReduxComponentProps {
    location: ReactLocation;
}

class AddressMap extends React.Component<EditProps> {
    state = {
        addressDeatil: null,
        currAddress: null,
        locs: '',
        accKey: '',
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
            //   const districtArr = address.get('district').split(',');
            //   const province = CITIES.find((item) => { return item.label === districtArr[0] });
            //   const city = province?.children.find((item) => { return item.label === districtArr[1] });
            //   const area = city?.children.find((item) => { return item.label === districtArr[2] });
            const locs = address.get('addr').split(',');
            this.props.form.setFieldsValue({
                name: address.get('name'),
                mobile: address.get('mobile'),
                addr: locs[locs.length - 1],
                // district: [province?.value, city?.value, area?.value],
            });
            this.setState({ currAddress: address, locs: locs[1] || '', accKey: 'acc' })
            Toast.hide();
        }
    }

    onSave = () => {
        const { addressDeatil } = this.state;
        if (!addressDeatil) {

            this.setState({ accKey: 'acc' })
            return Toast.info('请选择正确的地址', 1.5);
        }
        this.props.form.validateFields(async (err, values) => {
            if (err) {
                for (let key in err) {
                    return Toast.info(err[key].errors[0].message, 1.5);
                }
            }
            values.district = addressDeatil.district;
            values.addr = (addressDeatil.address.length > 0 ? addressDeatil.address + ',' : '') + (addressDeatil.name + ',' + values.addr)
            values.isDefault = false;
            values.isCake = true;
            const ret = await this.props.dispatch({
                type: 'home/saveAddress',
                payload: { ...values, oAddress: this.state.currAddress },
            });
            ret && Toast.success('保存成功!', 1.5, router.goBack);
        });
    };

    onSearch = (info) => {
        this.setState({ addressDeatil: info })
    }
    render() {
        const { getFieldProps } = this.props.form;
        const { addressDeatil, locs } = this.state;
        return (
            <div style={{ height: '100%', width: '100%', position: 'relative' }}>
                {
                    this.props.location.query.id ?
                        (locs ? <Amap onSearch={this.onSearch} locs={locs}></Amap> : null) :
                        <Amap onSearch={this.onSearch} locs={locs}></Amap>
                }
                <div className={styles.button} style={{ position: 'absolute', bottom: 0, width: '100%', zIndex: 999 }}>
                    <Accordion activeKey={this.state.accKey} onChange={(key) => {
                        this.setState({ accKey: key })
                    }}>
                        <Accordion.Panel header="更多信息" key="acc">
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
                                <InputItem
                                    editable={false}
                                    value={addressDeatil ? `${addressDeatil.address.length > 0 ? addressDeatil.address + ',' : ''}${addressDeatil.name} ` : ''}
                                >
                                    定位地址
                                    </InputItem>

                            </List>

                            <WhiteSpace size="lg" />
                            <List>
                                <TextareaItem
                                    {...getFieldProps('addr', {
                                        rules: [
                                            {
                                                required: true,
                                                message: '请输入详细地址',
                                            },
                                        ],
                                    })}
                                    title={'详细地址'}
                                    placeholder="请输入详细地址(门牌号等)"
                                    rows={5}
                                />
                            </List>
                            <Button onClick={this.onSave} style={{ backgroundColor: '#022c27', height: 53 }}>确定</Button>
                        </Accordion.Panel>

                    </Accordion>
                </div>
            </div>
        );
    }
}

export default createForm()(connect(state => ({ ...state.app }))(AddressMap));

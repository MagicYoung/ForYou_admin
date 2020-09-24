import * as React from 'react';
import { FormComponentProps } from 'antd/lib/form';
import Table, { ColumnProps } from 'antd/lib/table';
import * as AV from 'leancloud-storage';
import { connect } from 'react-redux';
import { Row, Col, Button, Upload, message, Modal, Input, Tag, Select, Drawer, Form, Icon } from 'antd';
import * as XLSX from 'xlsx';
import { ElectronicCode, ElectronicCodeList } from '@/AVObjects';
import moment from 'moment';
import styles from './electronicCode.less';

interface ElectronicCode {
    no: string;
    originAVObject: AV.Queriable;
    [key: string]: any;
}

interface CardCouponStates {
    dataSource?: ElectronicCode[];
    AVData?: AV.Queriable[];
    loading: boolean;
    visible: boolean;
    page: number;
    usedCount: number;
    unusedCount: number;
    unbindCount: number;
    total: number;
    electronicCodeTotal: number;
    electronicCodePage: number;
    dataSourceElectronicCode: any[];
    drawerVisible: boolean;
    currElectronicCode: any;
    excelJsonData: any[];
    modalVisible: boolean;
    isSubmiting: boolean;
    productArr: any[];
}

interface XLSXRow {
    no: string;
}

type Props = FormComponentProps & State.AppState;
@(Form.create() as any)
@connect(state => ({ adminRole: state.app.adminRole }))
export default class CardCouponPage extends React.Component<Props, CardCouponStates> {
    state: CardCouponStates = {
        dataSource: [],
        AVData: [],
        loading: false,
        visible: false,
        page: 1,
        usedCount: 0,
        unusedCount: 0,
        unbindCount: 0,
        total: 0,
        electronicCodeTotal: 0,
        electronicCodePage: 1,
        dataSourceElectronicCode: [],
        drawerVisible: false,
        currElectronicCode: null,
        excelJsonData: [],
        modalVisible: false,
        isSubmiting: false,
        productArr: [],
    };

    search: string = '';


    async componentDidMount() {
        this.setState({ loading: true })
        //只查询A类卡所属产品
        const query = new AV.Query('CardCouponCategory');
        query.equalTo('type', 'A')
        const dataCard = await query.find();
        const queryProduct = new AV.Query('Product');
        queryProduct.containedIn('usableCards', dataCard);
        const dataPro = await queryProduct.find();
        this.setState({ productArr: dataPro })
        this.onsearchElectronicCode();
    }

    columns: ColumnProps<ElectronicCode>[] = [
        {
            key: 'productName',
            title: '电子码名称',
            render: (item) => {
                return `${item.product ? item.product.get('name') : ''}`;
            },
        },
        {
            key: 'img',
            title: '图案',
            render: (item) => {
                return (
                    item.product ?
                        <img src={item.product.get('carouselImgs')[0].url} style={{ height: 80, objectFit: 'cover', objectPosition: 'center' }} /> : null
                );
            },
        },
        {
            key: 'createdAt',
            title: '创建日期',
            render: item => moment(item.createdAt).format('YYYY-MM-DD'),
        },
        {
            key: 'usedStatus',
            title: '使用情况',
            render: (item) => {
                return <div>
                    <div>已绑定：{item.bindCount}</div>
                    <div>未绑定：{item.notBindCount}</div>
                </div>
            },
        },
        {
            key: 'actions',
            title: '操作',
            render: (item: ElectronicCode) => {
                const onDelete = async () => {
                    Modal.confirm({
                        title: '删除',
                        content: `该操作将会删除该商品下的所有电子卡券，确定删除吗？`,
                        okText: '删除',
                        okType: 'danger',
                        cancelText: '取消',
                        onOk: async () => {
                            message.info('正在删除')
                            item.originAVObject.set('isDelete', true);
                            await item.originAVObject.save();
                            const query = new AV.Query('ElectronicCodeList');
                            query.equalTo('electronicCode', item.originAVObject);
                            const queryRes = await query.find();
                            queryRes.forEach((resItem) => {
                                // 更新属性值
                                resItem.set('isDelete', true);
                            });
                            await AV.Object.saveAll(queryRes);
                            message.success('删除成功！', 1.5)
                            this.onsearchElectronicCode()
                        },
                    });
                };
                const onDetail = async () => {
                    this.setState({ drawerVisible: true, currElectronicCode: item.originAVObject },
                        this.onSearch);
                }

                return <div>
                    <div><a onClick={onDetail}>详情</a></div>
                    <div style={{ marginTop: 10 }}><a onClick={onDelete}>删除</a></div>
                </div>;
            },
        },
    ];

    columnsDetail = [
        {
            key: 'no',
            title: '电子码',
            dataIndex: 'no',
        },
        {
            key: 'used',
            title: '使用状态',
            render: item =>
                !item.used ? (
                    <Tag color={item.user ? 'green' : 'gold'}>{item.user ? '未使用' : '未绑定'}</Tag>
                ) : (
                        <Tag color="red">已使用</Tag>
                    ),
        },
        {
            key: 'user',
            title: '绑定用户',
            dataIndex: 'user.mobilePhoneNumber',
        },
        {
            key: 'convertTime',
            title: '兑换日期',
            dataIndex: 'convertTime',
        },
        {
            key: 'actions',
            title: '操作',
            render: (item: ElectronicCode) => {
                const onDelete = async () => {
                    Modal.confirm({
                        title: '删除',
                        content: `您正在删除数据，确定删除吗？`,
                        okText: '删除',
                        okType: 'danger',
                        cancelText: '取消',
                        onOk: async () => {
                            //await item.originAVObject.destroy();
                            item.originAVObject.set('isDelete', true);
                            await item.originAVObject.save();
                            message.success('删除成功！', 1.5);
                            this.onSearch();
                            this.onsearchElectronicCode();
                        },
                    });
                };
                return <div><a onClick={onDelete}>删除</a></div>;
            },
        },
    ];


    onsearchElectronicCode = async (reset = false, search = '') => {
        this.setState({ loading: true, electronicCodePage: reset ? 1 : this.state.electronicCodePage });
        const query = new AV.Query('ElectronicCode');
        query.notEqualTo('isDelete', true)
        query.include('product');
        query.descending('createdAt');
        query.skip((reset ? 0 : this.state.page - 1) * 10);
        query.limit(10);
        const dataSource = await query.find();
        let dataSourceElectronicCode: any[] = [];
        dataSource.map(async (item: any, index) => {
            let queryCP = new AV.Query('ElectronicCodeList');
            queryCP.equalTo('electronicCode', item)
            queryCP.equalTo('user', null);
            const notBindCount = await queryCP.count();
            queryCP = new AV.Query('ElectronicCodeList');
            queryCP.notEqualTo('user', null);
            queryCP.equalTo('electronicCode', item)
            const bindCount = await queryCP.count();
            const dataItem: any = {};
            for (let key in item.attributes) {
                dataItem[`${key}`] = item.get(`${key}`);
            }
            dataItem['objectId'] = item.id;
            dataItem['originAVObject'] = item;
            dataItem['bindCount'] = bindCount;
            dataItem['notBindCount'] = notBindCount;
            dataSourceElectronicCode.push(dataItem)
            if (index === dataSource.length - 1) {
                const total = await query.count();
                this.setState({
                    loading: false,
                    dataSourceElectronicCode,
                    electronicCodeTotal: total
                });
            }
        })
        if (!dataSource.length) this.setState({ loading: false, dataSourceElectronicCode: [], electronicCodeTotal: 0 });
    }

    onSearch = async (reset = false, search = '') => {
        await this.getCount();
        this.setState({ loading: true, page: reset ? 1 : this.state.page });
        const query = new AV.Query('ElectronicCodeList');
        query.include('user');
        query.descending('createdAt');
        query.equalTo('electronicCode', this.state.currElectronicCode)
        query.notEqualTo('isDelete', true)
        query.skip((reset ? 0 : this.state.page - 1) * 10);
        query.limit(10);
        search && query.contains('no', search);
        const dataSource = await query.find();
        this.setState({
            loading: false,
            dataSource: dataSource.map(i => {
                return {
                    ...i.toJSON(),
                    originAVObject: i,
                };
            }),
        });

    };

    getCount = async () => {
        let query = new AV.Query('ElectronicCodeList');
        query.equalTo('electronicCode', this.state.currElectronicCode)
        const total = await query.count();
        query.equalTo('used', true);
        const usedCount = await query.count();
        query = new AV.Query('ElectronicCodeList');
        query.equalTo('electronicCode', this.state.currElectronicCode)
        query.notEqualTo('user', null);
        const bindCount = await query.count();
        this.setState({
            total,
            usedCount,
            unusedCount: bindCount - usedCount,
            unbindCount: total - bindCount,
        });
    };

    onNoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        this.search = e.target.value;
    };
    drawerTitle = () => {
        const { currElectronicCode } = this.state;
        return currElectronicCode ?
            <div>
                <div style={{ display: 'flex', color: 'rgba(0, 0, 0, 0.65)', fontSize: 14, marginBottom: 10 }}>
                    <div >{currElectronicCode.get('product') ? currElectronicCode.get('product').get('name') : ''}</div>
                </div>
                <Row align="middle" type="flex" gutter={24} style={{ marginBottom: 24 }}>
                    <Col span={4}>
                        <Input placeholder="输入电子券号码" allowClear={true} onChange={this.onNoChange} />
                    </Col>
                    <Col span={3}>
                        <Button type="primary" onClick={() => this.onSearch(true, this.search)}>查询</Button>
                    </Col>
                    <Col span={6}>
                        <Tag color="red">已使用{this.state.usedCount}</Tag>
                        <Tag color="green">未使用{this.state.unusedCount}</Tag>
                        <Tag color="green">未绑定{this.state.unbindCount}</Tag>
                        <Tag color="blue">
                            总计{this.state.unusedCount + this.state.usedCount + this.state.unbindCount}
                        </Tag>
                    </Col>
                </Row>
            </div> : null
    }
    renderOptions = () => {
        return this.state.productArr.map(i => {
            return (<Select.Option key={i} value={i.id}>{i.get('name')}</Select.Option>)
        })
    }

    onUpload = () => async file => {
        const reader = new FileReader();
        reader.onload = async (e: any) => {
            const data = e.target.result;
            const workbook = XLSX.read(data, { type: 'binary' });
            const json: XLSXRow[] = XLSX.utils.sheet_to_json(workbook.Sheets['Sheet1']);
            this.setState({ excelJsonData: json })
        };
        reader.readAsBinaryString(file);
        return false;
    };
    onSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        this.props.form.validateFields(async (err, fieldsValue) => {
            const { excelJsonData } = this.state;
            if (err) return;
            this.setState({ isSubmiting: true });
            message.loading(`正在保存...`, 0);
            try {
                const currProduct = this.state.productArr.find((pro) => { return pro.id === fieldsValue['product'] });
                if (excelJsonData.length === 0) throw '请上传文件';
                const electronicCode: AV.Object = new ElectronicCode();
                electronicCode.set('product', currProduct);
                electronicCode.set('isDelete', false);
                const saveRes = await electronicCode.save();
                let electronicCodeList = [];
                for (let i of excelJsonData) {
                    if (i.no) {
                        const electronicCodeListItem: AV.Object = new ElectronicCodeList();
                        electronicCodeListItem.set('electronicCode', saveRes);
                        electronicCodeListItem.set('no', i.no);
                        electronicCodeListItem.set('isDelete', false);
                        electronicCodeListItem.set('product', currProduct);
                        electronicCodeList.push(electronicCodeListItem);
                    }
                }
                await AV.Object.saveAll(electronicCodeList);
                message.destroy();
                message.success('导入成功！', 1.5, () => {
                    this.onsearchElectronicCode();
                    this.setState({
                        isSubmiting: false, modalVisible: false
                    })
                });
            } catch (err) {
                console.error(err);
                this.setState({ isSubmiting: false });
                message.error(err || '保存失败！');
            }
        });
    }

    render() {
        const { dataSource,
            loading,
            page,
            electronicCodePage,
            dataSourceElectronicCode,
            drawerVisible,
            modalVisible, isSubmiting
        } = this.state;
        const formItemLayout = {
            labelCol: {
                xs: { span: 24 },
                sm: { span: 6 },
            },
            wrapperCol: {
                xs: { span: 24 },
                sm: { span: 16 },
            },
        };
        const { getFieldDecorator } = this.props.form;
        return (
            <div style={{ height: '100%', overflowY: 'auto', overflowX: 'hidden' }}>
                <Row align="middle" type="flex" gutter={24} style={{ marginBottom: 24 }}>
                    <Col span={4}>
                        <Button type="primary" onClick={() => {
                            this.setState({ modalVisible: true, excelJsonData: [] })
                        }}>导入电子码</Button>
                    </Col>
                </Row>
                <Table
                    rowKey={i => i.objectId}
                    dataSource={dataSourceElectronicCode}
                    columns={this.columns}
                    loading={loading}
                    pagination={{
                        total: this.state.electronicCodeTotal,
                        current: electronicCodePage,
                        onChange: page => {
                            this.setState({ electronicCodePage: page }, this.onsearchElectronicCode);
                        },
                    }}
                />
                <Drawer
                    maskClosable={true}
                    closable={true}
                    title={this.drawerTitle()}
                    width={'80vw'}
                    onClose={() => { this.setState({ drawerVisible: false, currElectronicCode: null, dataSource: [] }) }}
                    visible={drawerVisible}
                >
                    <Table
                        rowKey={i => i.objectId}
                        dataSource={dataSource}
                        columns={this.columnsDetail}
                        loading={loading}
                        pagination={{
                            total: this.state.total,
                            current: page,
                            onChange: page => {
                                this.setState({ page: page }, this.onSearch);
                            },
                        }}
                    />
                </Drawer>
                {
                    modalVisible && <Modal
                        title={'导入电子码卡券'}
                        visible={true}
                        footer={null}
                        onCancel={() => {
                            this.setState({ modalVisible: false });
                        }}
                    >
                        <Form layout="vertical" {...formItemLayout} onSubmit={this.onSubmit}>
                            <Form.Item
                                label="所属电子卡商品"
                            >
                                {getFieldDecorator('product', {
                                    rules: [{ required: true, message: '请选择所属电子卡商品' }],
                                })(<Select >{this.renderOptions()}</Select>)}
                            </Form.Item>
                            <Form.Item label="导入文件">
                                {getFieldDecorator('excel', {
                                    rules: [{ required: true, message: '请上传Excel文件' }],
                                })(
                                    <Upload
                                        // showUploadList={false}
                                        beforeUpload={this.onUpload()}
                                        onRemove={() => {
                                            this.setState({ excelJsonData: [] });
                                            return true
                                        }}
                                        accept="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet">
                                        <Button><Icon type="upload" /> 导入电子码Excel文件</Button>
                                    </Upload>
                                )}
                            </Form.Item>
                            <div className={styles.modalFooter}>
                                <Button onClick={
                                    () => {
                                        this.setState({ modalVisible: false });
                                    }
                                } style={{ marginRight: 8 }}>取消 </Button>
                                <Button loading={isSubmiting} type="primary" htmlType="submit">保存</Button>
                            </div>
                        </Form>
                    </Modal>
                }

            </div >
        );
    }
}

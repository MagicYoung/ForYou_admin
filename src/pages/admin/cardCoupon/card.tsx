import * as React from 'react';
import { FormComponentProps } from 'antd/lib/form';
import Table, { ColumnProps } from 'antd/lib/table';
import * as AV from 'leancloud-storage';
import { connect } from 'react-redux';
import { Row, Col, Button, message, Modal, Input, Tag, Drawer, Form, Select } from 'antd';
import * as XLSX from 'xlsx';
import { CardCoupon, CardCouponRange } from '@/AVObjects';
import moment from 'moment';
import { paddingZero, randomWord } from '@/utils'
import styles from './index.less';
import { renderUploadItem, uploadFiles } from '@/utils';
import OrderDetail from '../../orders/Detail';

interface CardCoupon {
    no: string;
    pwd: string;
    value: number;
    originAVObject: AV.Queriable;
    [key: string]: any;
}

interface CardCouponStates {
    dataSource?: CardCoupon[];
    AVData?: AV.Queriable[];
    loading: boolean;
    visible: boolean;
    page: number;
    usedCount: number;
    unusedCount: number;
    unbindCount: number;
    type: string;
    total: number;
    cardCouponRangeTotal: number;
    cardCouponRangePage: number;
    dataSourceCardCouponRange: [];
    drawerVisible: boolean;
    currCouponRange: any;
    modalVisible: boolean;
    isSubmiting: boolean;
    cardCouponCategoryData: any[];
    orderVisible: boolean,
    orderId: string,
}

interface XLSXRow {
    cardCouponCategory: any;
    startCardNo: string;
    endCardNo: string;
    owner: string;
    buyingBusiness: string;
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
        type: '',
        total: 0,
        cardCouponRangeTotal: 0,
        cardCouponRangePage: 1,
        dataSourceCardCouponRange: [],
        drawerVisible: false,
        currCouponRange: null,
        modalVisible: false,
        isSubmiting: false,
        cardCouponCategoryData: [],
        orderVisible: false,
        orderId: '',
    };

    search: string = '';

    columns: ColumnProps<CardCoupon>[] = [
        {
            key: 'no',
            title: '卡号段',
            render: (item) => {
                return `${item.startCardNo}-${item.endCardNo}`;
            },
        },
        {
            key: 'buyingBusiness',
            title: '购方企业抬头',
            dataIndex: 'buyingBusiness',
        },
        {
            key: 'owner',
            title: '归属',
            dataIndex: 'owner',
        },
        {
            key: 'cardType',
            title: '类型',
            render: (item) => item.cardCouponCategory.get('typeName'),
        },
        {
            key: 'cardPrice',
            title: '面值',
            render: (item) => item.cardCouponCategory.get('cardPrice'),
        },
        {
            key: 'effectiveDate',
            title: '有效期',
            render: (item) => {
                return `${item.cardCouponCategory.get('effectiveStartDate')}至${item.cardCouponCategory.get('effectiveEndDate')}`;
            },
        },
        {
            key: 'createdAt',
            title: '创建日期',
            render: item => moment(item.originAVObject.createdAt).format('YYYY-MM-DD'),
        },
        {
            key: 'cardImage',
            title: '卡券图案',
            render: (item) => {
                return <img src={item.cardImage ? item.cardImage.url : item.cardCouponCategory.get('cardImage')[0].url} style={{ height: 80, objectFit: 'cover', objectPosition: 'center' }} />;
            },
        },
        {
            key: 'cardName',
            title: '卡券名称',
            render: (item) => item.cardCouponCategory.get('cardName'),
        },
        {
            key: 'isActivation',
            title: '是否激活',
            render: (item) => item.isActivation ? '已激活' : '未激活',
        },
        {
            key: 'bindStatus',
            title: '绑定状态',
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
            fixed: 'right',
            render: (item: CardCoupon) => {
                const onDelete = async () => {
                    Modal.confirm({
                        title: '删除',
                        content: `该操作将会删除该卡号段所有的卡券，确定删除吗？`,
                        okText: '删除',
                        okType: 'danger',
                        cancelText: '取消',
                        onOk: async () => {
                            message.info('正在删除')
                            item.originAVObject.set('isDelete', true);
                            item.originAVObject.set('hasItemDelete', true);
                            await item.originAVObject.save();
                            const query = new AV.Query('CardCoupon');
                            query.limit(1000);
                            query.equalTo('cardCouponRange', item.originAVObject);
                            const queryRes = await query.find();
                            queryRes.forEach((resItem) => {
                                // 更新属性值
                                resItem.set('isDelete', true);
                            });
                            await AV.Object.saveAll(queryRes);
                            // const query = new AV.Query('CardCoupon');
                            // query.equalTo('cardCouponRange', item.originAVObject);
                            // await query.destroyAll()
                            // await item.originAVObject.destroy();
                            // message.destroy();
                            message.success('删除成功！', 1.5);
                            this.onsearchCardCouponRange();
                        },
                    });
                };
                const onDetail = async () => {
                    this.setState({ drawerVisible: true, currCouponRange: item.originAVObject },
                        this.onSearch);
                }
                const onActivation = async (isActivation: boolean) => {
                    Modal.confirm({
                        title: isActivation ? '激活' : '冻结',
                        content: isActivation ? '确定激活该批次的卡吗？' : '确定冻结该批次的卡吗',
                        okText: isActivation ? '激活' : '冻结',
                        okType: 'danger',
                        cancelText: '取消',
                        onOk: async () => {
                            message.warn('正在处理...');
                            item.originAVObject.set('isActivation', isActivation);
                            await item.originAVObject.save();
                            const query = new AV.Query('CardCoupon');
                            query.equalTo('cardCouponRange', item.originAVObject);
                            query.limit(1000);
                            const queryRes = await query.find();
                            queryRes.forEach((resItem) => {
                                // 更新属性值
                                resItem.set('isActivation', isActivation);
                            });
                            await AV.Object.saveAll(queryRes);
                            message.destroy();
                            message.success('操作成功', 1.5);
                            this.onsearchCardCouponRange();
                        },
                    });
                }
                const onExport = async () => {
                    Modal.confirm({
                        title: '导出卡券',
                        content: '确定导出该批次的卡吗',
                        okText: '导出',
                        okType: 'danger',
                        cancelText: '取消',
                        onOk: async () => {
                            message.warn('正在导出...');
                            const query = new AV.Query('CardCoupon');
                            query.equalTo('cardCouponRange', item.originAVObject)
                            query.limit(1000);
                            const resData = await query.find();
                            const filename = `${item.cardCouponCategory.get('cardName')}${item.startCardNo}到${item.endCardNo}.xls`; //文件名称
                            let fileData = [['账号', '密码', '面额']];  //数据，一定注意需要时二维数组
                            resData.map((res) => {
                                fileData.push([res.get('no'), res.get('pwd'), item.cardCouponCategory.get('cardPrice')]);
                            })
                            var wsName = "Sheet1"; //Excel第一个sheet的名称
                            var wb = XLSX.utils.book_new(), ws = XLSX.utils.aoa_to_sheet(fileData);
                            XLSX.utils.book_append_sheet(wb, ws, wsName);  //将数据添加到工作薄
                            XLSX.writeFile(wb, filename); //导出Excel

                            message.destroy();
                            message.success('已导出卡券数据', 1.5);

                        },
                    });
                }

                return <div>
                    <div><a onClick={onDetail}>详情</a></div>
                    {item.isActivation ?
                        <div style={{ marginTop: 5 }}><a onClick={() => { onActivation(false) }}>冻结</a></div>
                        : <div style={{ marginTop: 5 }}><a onClick={() => { onActivation(true) }}>激活</a></div>
                    }
                    <div style={{ marginTop: 5 }}><a onClick={onExport}>导出</a></div>
                    <div style={{ marginTop: 5 }}><a onClick={onDelete}>删除</a></div>
                </div>;
            },
        },
    ];

    columnsDetail = [
        {
            key: 'no',
            title: '卡号',
            dataIndex: 'no',
        }, {
            key: 'pwd',
            title: '密码',
            dataIndex: 'pwd',
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
            key: 'card_order',
            title: '订单',
            render: (item) => {
                if (item.card_order && item.card_order.length) {
                    return item.card_order.map((c_o) => {
                        return <div key={c_o.objectId}><a onClick={() => {
                            this.setState({
                                orderVisible: true,
                                orderId: c_o.objectId
                            })
                        }}>{c_o.no};</a></div>
                    })
                } else {
                    return null
                }
            },
        },
        {
            key: 'value',
            title: '卡余额',
            dataIndex: 'value',
        },
        {
            key: 'isActivation',
            title: '是否激活',
            render: (item) => item.isActivation ? '已激活' : '未激活',
        },
        {
            key: 'userUnBind',
            title: '用户是否解绑',
            render: (item) => item.userUnBind ? <Tag color="red">已解绑</Tag> : <Tag color="green">未解绑</Tag>,
        },
        {
            key: 'actions',
            title: '操作',
            render: (item: CardCoupon) => {
                const onDelete = async () => {
                    Modal.confirm({
                        title: '删除',
                        content: `您正在删除卡券，确定删除吗？`,
                        okText: '删除',
                        okType: 'danger',
                        cancelText: '取消',
                        onOk: async () => {
                            //await item.originAVObject.destroy();
                            const { currCouponRange } = this.state
                            item.originAVObject.set('isDelete', true);
                            await item.originAVObject.save();
                            currCouponRange.set('hasItemDelete', true);
                            await currCouponRange.save();
                            message.success('删除成功！', 1.5);
                            this.onSearch();
                            this.onsearchCardCouponRange();
                        },
                    });
                };
                const onActivation = async (isActivation: boolean) => {
                    Modal.confirm({
                        title: isActivation ? '激活' : '冻结',
                        content: isActivation ? '确定激活该卡吗？' : '确定冻结该卡吗',
                        okText: isActivation ? '激活' : '冻结',
                        okType: 'danger',
                        cancelText: '取消',
                        onOk: async () => {
                            message.warn('正在处理...');
                            item.originAVObject.set('isActivation', isActivation);
                            await item.originAVObject.save();
                            message.destroy();
                            message.success('操作成功', 1.5);
                            this.onSearch();
                        },
                    });
                }
                return <div>
                    <div ><a onClick={onDelete}>删除</a></div>
                    {item.isActivation ? <div style={{ marginTop: 10 }}><a onClick={() => { onActivation(false) }}>冻结</a></div>
                        : <div style={{ marginTop: 10 }}><a onClick={() => { onActivation(true) }}>激活</a></div>}
                </div>;
            },
        },
    ];

    async componentDidMount() {
        this.onsearchCardCouponRange();
        const query = new AV.Query('CardCouponCategory');
        const data = await query.find();
        this.setState({
            cardCouponCategoryData: data,

        });
    }
    composeData = (node: any) => {
        return {
            key: node.id,
            name: node.get('name'),
            icon: node.get('icon') ? node.get('icon').url : null,
            children: node.children && node.children.map(i => this.composeData(i)),
            originAVObject: node,
        };
    };


    onsearchCardCouponRange = async (reset = false, search = '') => {
        this.setState({ loading: true, cardCouponRangePage: reset ? 1 : this.state.cardCouponRangePage });
        const query = new AV.Query('CardCouponRange');
        query.notEqualTo('isDelete', true)
        query.include('cardCouponCategory');
        query.descending('createdAt');
        (search && search.buyingBusiness) && query.equalTo('buyingBusiness', search.buyingBusiness);
        (search && search.owner) && query.equalTo('owner', search.owner);
        (search && search.cardCouponCategory) && query.equalTo('cardCouponCategory', search.cardCouponCategory);
        query.skip((reset ? 0 : this.state.page - 1) * 10);
        query.limit(10);
        const dataSource = await query.find();
        let dataSourceCardCouponRange: any[] = [];
        dataSource.map(async (item: any, index) => {
            let queryCP = new AV.Query('CardCoupon');
            queryCP.equalTo('cardCouponRange', item)
            queryCP.equalTo('user', null);
            const notBindCount = await queryCP.count();
            queryCP = new AV.Query('CardCoupon');
            queryCP.notEqualTo('user', null);
            queryCP.equalTo('cardCouponRange', item)
            const bindCount = await queryCP.count();
            // item.bindCount = bindCount;
            // item.notBindCount = notBindCount;
            const dataItem: any = {};
            for (let key in item.attributes) {
                dataItem[`${key}`] = item.get(`${key}`);
            }
            dataItem['objectId'] = item.id;
            dataItem['originAVObject'] = item;
            dataItem['bindCount'] = bindCount;
            dataItem['notBindCount'] = notBindCount;
            dataSourceCardCouponRange.push(dataItem)
            if (index === dataSource.length - 1) {
                const total = await query.count();
                this.setState({
                    loading: false,
                    dataSourceCardCouponRange,
                    cardCouponRangeTotal: total
                });
            }
        })
        if (!dataSource.length) this.setState({ loading: false, dataSourceCardCouponRange: [], cardCouponRangeTotal: 0 });
    }

    onSearch = async (reset = false, search = '') => {
        await this.getCount();
        this.setState({ loading: true, page: reset ? 1 : this.state.page });
        const query = new AV.Query('CardCoupon');
        query.include('user');
        query.include('cardCouponCategory');
        query.include('card_order');
        query.descending('user');
        query.equalTo('cardCouponRange', this.state.currCouponRange)
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
        let query = new AV.Query('CardCoupon');
        query.notEqualTo('isDelete', true)
        query.equalTo('cardCouponRange', this.state.currCouponRange)
        const total = await query.count();
        query.equalTo('used', true);
        const usedCount = await query.count();
        query = new AV.Query('CardCoupon');
        query.notEqualTo('isDelete', true)
        query.equalTo('cardCouponRange', this.state.currCouponRange)
        query.notEqualTo('user', null);
        const bindCount = await query.count();
        this.setState({
            total,
            usedCount,
            unusedCount: bindCount - usedCount,
            unbindCount: total - bindCount,
        });
    };



    onSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        this.props.form.validateFields(async (err, fieldsValue) => {
            if (err) return;
            if (parseInt(fieldsValue.startCardNo) >= parseInt(fieldsValue.endCardNo)) {
                this.props.form.setFields({
                    endCardNo: {
                        value: fieldsValue.endCardNo,
                        errors: [new Error('结束卡号应该大于起始卡号')],
                    },
                });
                return
            }
            //获取卡的类别
            const carCategoryItem = this.state.cardCouponCategoryData.filter((car: any) => { return car.id === fieldsValue.cardCouponCategory })[0];

            message.loading(`正在保存...`, 0);
            this.setState({ isSubmiting: true });
            try {

                const cardImage = await uploadFiles(fieldsValue['cardImage']);
                const noHead = `${moment().year()}${paddingZero(moment().month() + 1, 2)}${paddingZero(moment().date() + 1, 2)}`
                const cardRange: AV.Object = new CardCouponRange();
                cardRange.set('startCardNo', `${noHead}${fieldsValue.startCardNo}`);
                cardRange.set('isActivation', false);
                cardRange.set('isDelete', false);
                cardRange.set('endCardNo', `${noHead}${fieldsValue.endCardNo}`);
                cardRange.set('cardCouponCategory', carCategoryItem);
                cardRange.set('owner', fieldsValue.owner);
                cardRange.set('buyingBusiness', fieldsValue.buyingBusiness);
                cardRange.set('cardImage', cardImage[0]);
                const resData: any = await cardRange.save();
                const cards: AV.Object[] = [];
                const startCardNo = parseInt(resData.get('startCardNo'))
                const endCardNo = parseInt(resData.get('endCardNo'))
                for (let car = startCardNo; car <= endCardNo; car++) {
                    const cardCoupon: AV.Object = new CardCoupon();
                    cardCoupon.set('cardCouponRange', resData)
                    cardCoupon.set('cardCouponCategory', resData.get('cardCouponCategory'))
                    cardCoupon.set('no', `${car}`);//`${noHead}${paddingZero(car)}`
                    cardCoupon.set('pwd', randomWord(10));
                    cardCoupon.set('used', false);
                    cardCoupon.set('isActivation', false);
                    cardCoupon.set('isDelete', false);
                    cardCoupon.set('user', null);
                    cardCoupon.set('cardImage', cardImage[0]);
                    cardCoupon.set('value', resData.get('cardCouponCategory').get('cardPrice'));
                    cards.push(cardCoupon);
                }
                await AV.Object.saveAll(cards);
                message.destroy()
                message.success('导入成功！');
                this.setState({ isSubmiting: false, modalVisible: false });
                this.onsearchCardCouponRange();

            } catch (err) {
                alert(err || '保存失败！');
                console.error(err);
                this.setState({ isSubmiting: false });
            }
        });
    }


    // onUpload = () => async file => {
    //     const reader = new FileReader();
    //     reader.onload = async (e: any) => {
    //         const data = e.target.result;
    //         const workbook = XLSX.read(data, { type: 'binary' });
    //         const json: XLSXRow[] = XLSX.utils.sheet_to_json(workbook.Sheets['Sheet1']);
    //         const cardRange: AV.Object[] = [];
    //         const cardCouponCategoryQuery = new AV.Query('CardCouponCategory');
    //         const cardCouponCategoryData = await cardCouponCategoryQuery.find();
    //         const r = /^[0-9]+$/;
    //         try {
    //             for (let i of json) {
    //                 const cardCouponRangeItem: AV.Object = new CardCouponRange();
    //                 if (`${i.startCardNo}`.length !== 10) throw `起始卡号${i.startCardNo}长度不符合规范`;
    //                 if (`${i.endCardNo}`.length !== 10) throw `结束卡号${i.endCardNo}长度不符合规范`;
    //                 if (!r.test(i.startCardNo)) throw `起始卡号${i.startCardNo}应该是纯数字`;
    //                 if (!r.test(i.endCardNo)) throw `结束卡号${i.endCardNo}应该是纯数字`;
    //                 if (parseInt(i.startCardNo) >= parseInt(i.endCardNo)) throw `结束卡号${i.endCardNo}应该大于开始卡号${i.startCardNo}`;
    //                 //获取卡的类别
    //                 if (!i.cardCouponCategory) throw `请输入该卡的卡类别id`;
    //                 const carCategoryItem = cardCouponCategoryData.filter((car: any) => { return car.id === i.cardCouponCategory })[0];
    //                 if (!carCategoryItem) throw `该卡的卡类别${i.cardCouponCategory}不正确`;
    //                 cardCouponRangeItem.set('startCardNo', i.startCardNo.toString());
    //                 cardCouponRangeItem.set('isActivation', false);
    //                 cardCouponRangeItem.set('isDelete', false);
    //                 cardCouponRangeItem.set('endCardNo', i.endCardNo.toString());
    //                 cardCouponRangeItem.set('cardCouponCategory', carCategoryItem);
    //                 cardCouponRangeItem.set('owner', i.owner);
    //                 cardCouponRangeItem.set('buyingBusiness', i.buyingBusiness);
    //                 cardRange.push(cardCouponRangeItem);
    //             }
    //             const resData: any = await AV.Object.saveAll(cardRange);
    //             const cards: AV.Object[] = [];
    //             resData.map((item) => {
    //                 const startCardNo = parseInt(item.get('startCardNo'))
    //                 const endCardNo = parseInt(item.get('endCardNo'))
    //                 for (let car = startCardNo; car <= endCardNo; car++) {
    //                     const cardCoupon: AV.Object = new CardCoupon();
    //                     cardCoupon.set('cardCouponRange', item)
    //                     cardCoupon.set('cardCouponCategory', item.get('cardCouponCategory'))
    //                     cardCoupon.set('no', `${paddingZero(car)}`);
    //                     cardCoupon.set('pwd', randomWord(16));
    //                     cardCoupon.set('used', false);
    //                     cardCoupon.set('isActivation', false);
    //                     cardCoupon.set('isDelete', false);
    //                     cardCoupon.set('user', null);
    //                     cardCoupon.set('value', item.get('cardCouponCategory').get('cardPrice'));
    //                     cards.push(cardCoupon);
    //                 }
    //             })
    //             await AV.Object.saveAll(cards);
    //             message.success('导入成功！');
    //             this.onsearchCardCouponRange();
    //         } catch (err) {
    //             return message.error(err);
    //         }
    //     };
    //     reader.readAsBinaryString(file);
    //     return false;
    // };

    onNoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        this.search = e.target.value;
    };
    drawerTitle = () => {
        const { currCouponRange } = this.state;
        return currCouponRange ?
            <div>
                <div style={{ display: 'flex', color: 'rgba(0, 0, 0, 0.65)', fontSize: 14, marginBottom: 10 }}>
                    <div >{currCouponRange.get('cardCouponCategory').get('cardName')}：{currCouponRange.get('startCardNo')}-{currCouponRange.get('endCardNo')}</div>
                </div>
                <Row align="middle" type="flex" gutter={24} style={{ marginBottom: 24 }}>
                    <Col span={4}>
                        <Input placeholder="输入卡号" allowClear={true} onChange={this.onNoChange} />
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
        return this.state.cardCouponCategoryData.map(i => {
            return (<Select.Option key={i} value={i.id}>{i.get('cardName')}</Select.Option>)
        })
    }
    formSubmit = () => {
        this.props.form.validateFields((err, values) => {
            if (err) return;
            if (values.cardCouponCategory) {
                values.cardCouponCategory = this.state.cardCouponCategoryData.find((i) => i.id === values.cardCouponCategory);
            }
            this.onsearchCardCouponRange(true, values);
        });
    };

    resetSearch = () => {
        this.props.form.resetFields();
    };

    render() {
        const { dataSource, loading, page, cardCouponRangePage, dataSourceCardCouponRange, drawerVisible, modalVisible, isSubmiting } = this.state;
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
        const { getFieldDecorator, getFieldValue } = this.props.form;
        return (
            <div style={{ height: '100%', overflowY: 'auto', overflowX: 'hidden' }}>
                <Form layout="inline" className={styles.searchForm} style={{ marginBottom: 24 }}>
                    <Form.Item label="购方企业抬头">
                        {getFieldDecorator('buyingBusiness')(<Input placeholder="请输入" />)}
                    </Form.Item>
                    <Form.Item label="归属人">
                        {getFieldDecorator('owner')(<Input placeholder="请输入" />)}
                    </Form.Item>
                    <Form.Item
                        label="所属卡券类别"
                    >
                        {getFieldDecorator('cardCouponCategory', {
                        })(<Select style={{ width: 250 }} >{this.renderOptions()}</Select>)}
                    </Form.Item>

                    <Button type="primary" onClick={this.formSubmit} style={{ marginLeft: 16 }}>
                        查询 </Button>
                    <Button style={{ marginLeft: 8 }} onClick={this.resetSearch}>
                        重置  </Button>
                </Form>

                {/* <Row align="middle" type="flex" gutter={24} style={{ marginBottom: 24 }}>
                    <Col span={4}>
                        <Upload
                            showUploadList={false}
                            beforeUpload={this.onUpload()}
                            accept="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet">
                            <Button type="primary">批量生成卡券</Button>
                        </Upload>
                    </Col>
                </Row> */}
                <Row align="middle" type="flex" gutter={24} style={{ marginBottom: 24 }}>
                    <Col span={4}>
                        <Button type="primary" onClick={() => {
                            this.setState({ modalVisible: true })
                        }}>批量生成卡券</Button>
                    </Col>
                </Row>

                <Table
                    rowKey={i => i.objectId}
                    dataSource={dataSourceCardCouponRange}
                    columns={this.columns}
                    loading={loading}
                    scroll={{ x: true, y: false }}
                    pagination={{
                        total: this.state.cardCouponRangeTotal,
                        current: cardCouponRangePage,
                        onChange: page => {
                            this.setState({ cardCouponRangePage: page }, this.onsearchCardCouponRange);
                        },
                    }}
                />
                <Drawer
                    maskClosable={true}
                    closable={true}
                    title={this.drawerTitle()}
                    width={'80vw'}
                    onClose={() => { this.setState({ drawerVisible: false, currCouponRange: null, dataSource: [] }) }}
                    visible={drawerVisible}
                >
                    {
                        drawerVisible &&

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
                    }
                </Drawer>
                {
                    modalVisible && <Modal
                        title={<div>批量导入卡券</div>}
                        visible={true}
                        footer={null}
                        onCancel={() => {
                            this.setState({ modalVisible: false });
                        }}
                    >
                        <Form layout="vertical" {...formItemLayout} onSubmit={this.onSubmit}>
                            <Form.Item
                                label="起始卡号"
                            >
                                {getFieldDecorator('startCardNo', {
                                    rules: [
                                        { required: true, message: '请输入所属起始卡号' },
                                        { len: 4, message: '请输入4位数字' },
                                        { pattern: /^[0-9]+$/, message: '只能输入数字' },
                                    ],
                                })(<Input maxLength={4} placeholder="请输入起始卡号：如00001" />)}
                            </Form.Item>
                            <Form.Item
                                label="结束卡号"
                            >
                                {getFieldDecorator('endCardNo', {
                                    rules: [
                                        { required: true, message: '请输入所属结束卡号' },
                                        { len: 4, message: '请输入4位数字' },
                                        { pattern: /^[0-9]+$/, message: '只能输入数字' },
                                    ],
                                })(<Input maxLength={4} placeholder="请输入结束卡号：如00010" />)}
                            </Form.Item>

                            <Form.Item
                                label="购方企业抬头"
                            >
                                {getFieldDecorator('buyingBusiness', {
                                })(<Input placeholder="请输入购方企业抬头" />)}
                            </Form.Item>
                            <Form.Item
                                label="归属人"
                            >
                                {getFieldDecorator('owner', {
                                })(<Input placeholder="请输入归属人" />)}
                            </Form.Item>
                            <Form.Item
                                label="所属卡券类别"
                            >
                                {getFieldDecorator('cardCouponCategory', {
                                    rules: [{ required: true, message: '请选择所属卡券类别' }],
                                })(<Select >{this.renderOptions()}</Select>)}
                            </Form.Item>
                            {renderUploadItem({
                                name: 'cardImage',
                                label: '自定义卡图片',
                                getFieldDecorator,
                                getFieldValue,
                                formLayoutProps: { labelCol: { span: 6 }, wrapperCol: { span: 16 } },
                                initialValue: [],
                            })}

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
                <Modal
                    visible={this.state.orderVisible}
                    title="订单详情"
                    okText="确定"
                    cancelText="取消"
                    onCancel={() => this.setState({ orderVisible: false })}
                    onOk={() => this.setState({ orderVisible: false })}>
                    {this.state.orderId && <OrderDetail location={{ state: { orderId: this.state.orderId } }} />}
                </Modal>
            </div>
        );
    }
}

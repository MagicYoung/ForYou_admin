import * as React from 'react';
import { FormComponentProps } from 'antd/lib/form';
import Table, { ColumnProps } from 'antd/lib/table';
import * as AV from 'leancloud-storage';
import { connect } from 'react-redux';
import { Row, Col, Button, message, Modal, Input, Tag, Drawer, Form } from 'antd';
import { CardCoupon } from '@/AVObjects';
import moment from 'moment';

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
    type: string;
    total: number;
    cardCouponRangeTotal: number;
    cardCouponRangePage: number;
    dataSourceCardCouponRange: [];
    drawerVisible: boolean;
    currCouponRange: any;
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
export default class CardDelete extends React.Component<Props, CardCouponStates> {
    state: CardCouponStates = {
        dataSource: [],
        AVData: [],
        loading: false,
        visible: false,
        page: 1,
        type: '',
        total: 0,
        cardCouponRangeTotal: 0,
        cardCouponRangePage: 1,
        dataSourceCardCouponRange: [],
        drawerVisible: false,
        currCouponRange: null,
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
            key: 'actions',
            title: '操作',
            render: (item: CardCoupon) => {
                const onDelete = async () => {
                    Modal.confirm({
                        title: '彻底删除',
                        content: `该操作将会彻底删除该卡号段所有的卡券，确定删除吗？`,
                        okText: '删除',
                        okType: 'danger',
                        cancelText: '取消',
                        onOk: async () => {
                            message.info('正在删除')
                            //先删除所属卡券
                            const query = new AV.Query('CardCoupon');
                            query.equalTo('cardCouponRange', item.originAVObject);
                            query.limit(1000);
                            const queryRes = await query.find();
                            let deleteData: any[] = [];
                            queryRes.map((d) => {
                                if (d.get('isDelete')) {
                                    deleteData.push(d)
                                }
                            })
                            await AV.Object.destroyAll(deleteData);
                            if (deleteData.length === queryRes.length) {
                                await item.originAVObject.destroy();
                            } else {
                                item.originAVObject.set('isDelete', false);
                                item.originAVObject.set('hasItemDelete', false);
                                await item.originAVObject.save();
                            }
                            message.destroy();
                            message.success('删除成功！', 1.5);
                            this.onsearchCardCouponRange();
                        },
                    });
                };
                const onDetail = async () => {
                    this.setState({ drawerVisible: true, currCouponRange: item.originAVObject },
                        this.onSearch);
                }
                const onRecovery = async () => {
                    Modal.confirm({
                        title: '恢复',
                        content: '确定恢复该数据？',
                        okText: '确定',
                        okType: 'danger',
                        cancelText: '取消',
                        onOk: async () => {
                            message.info('正在恢复数据')
                            item.originAVObject.set('isDelete', false);
                            item.originAVObject.set('hasItemDelete', false);
                            await item.originAVObject.save();
                            const query = new AV.Query('CardCoupon');
                            query.limit(1000);
                            query.equalTo('cardCouponRange', item.originAVObject);
                            const queryRes = await query.find();
                            queryRes.forEach((resItem) => {
                                // 更新属性值
                                resItem.set('isDelete', false);
                            });
                            await AV.Object.saveAll(queryRes);
                            message.success('已恢复数据', 1.5);
                            this.onsearchCardCouponRange();
                        },
                    });
                }

                return <div>
                    <div><a onClick={onDetail}>详情</a></div>
                    <div style={{ marginTop: 5 }}><a onClick={onRecovery}>恢复</a></div>
                    <div style={{ marginTop: 5 }}><a onClick={onDelete}>彻底删除</a></div>
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
            key: 'address',
            title: '地址',
            render: (item) => {
                return item.address ? <div>{item.address.district},{item.address.addr}</div> : null
            },
        },
        {
            key: 'value',
            title: '卡余额',
            dataIndex: 'value',
        },
        {
            key: 'actions',
            title: '操作',
            render: (item: CardCoupon) => {
                const onDelete = async () => {
                    Modal.confirm({
                        title: '删除',
                        content: `数据将彻底删除无法恢复？`,
                        okText: '彻底删除',
                        okType: 'danger',
                        cancelText: '取消',
                        onOk: async () => {
                            await item.originAVObject.destroy();
                            message.success('删除成功！', 1.5);
                            this.onSearch();
                        },
                    });
                };
                const onRecovery = async () => {
                    Modal.confirm({
                        title: '恢复',
                        content: '确定恢复该数据？',
                        okText: '确定',
                        okType: 'danger',
                        cancelText: '取消',
                        onOk: async () => {
                            const { currCouponRange } = this.state;
                            item.originAVObject.set('isDelete', false);
                            await item.originAVObject.save();
                            currCouponRange.set('isDelete', false);
                            await currCouponRange.save();
                            message.success('操作成功', 1.5);
                            const res = await this.onSearch();
                            if (!res.length) {
                                currCouponRange.set('hasItemDelete', false);
                                await currCouponRange.save();
                                this.setState({ drawerVisible: false });
                                this.onsearchCardCouponRange();
                            }
                        },
                    });
                }
                return <div>
                    <div ><a onClick={onDelete}>彻底删除</a></div>
                    <div style={{ marginTop: 10 }}><a onClick={onRecovery}>恢复</a></div>
                </div>;
            },
        },
    ];

    async componentDidMount() {
        this.onsearchCardCouponRange();
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
        query.equalTo('hasItemDelete', true)
        query.include('cardCouponCategory');
        query.descending('createdAt');
        query.skip((reset ? 0 : this.state.page - 1) * 10);
        query.limit(10);
        const dataSource = await query.find();
        let dataSourceCardCouponRange: any[] = []
        dataSource.map(async (item: any, index) => {
            const dataItem: any = {};
            for (let key in item.attributes) {
                dataItem[`${key}`] = item.get(`${key}`);
            }
            dataItem['objectId'] = item.id;
            dataItem['originAVObject'] = item;
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
        query.include('convertProducts');
        query.include('user');
        query.include('cardCouponCategory');
        query.descending('user');
        query.equalTo('cardCouponRange', this.state.currCouponRange)
        query.equalTo('isDelete', true)
        query.skip((reset ? 0 : this.state.page - 1) * 10);
        query.limit(10);
        search && query.contains('no', search);
        const dataSource = await query.find();
        await this.setState({
            loading: false,
            dataSource: dataSource.map(i => {
                return {
                    ...i.toJSON(),
                    originAVObject: i,
                };
            }),
        });
        return dataSource;
    };

    getCount = async () => {
        let query = new AV.Query('CardCoupon');
        query.equalTo('cardCouponRange', this.state.currCouponRange)
        const total = await query.count();

        this.setState({
            total,
        });
    };



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
                </Row>
            </div> : null
    }


    render() {
        const { dataSource, loading, page, cardCouponRangePage, dataSourceCardCouponRange, drawerVisible } = this.state;
        return (
            <div style={{ height: '100%', overflowY: 'auto', overflowX: 'hidden' }}>
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
            </div>
        );
    }
}

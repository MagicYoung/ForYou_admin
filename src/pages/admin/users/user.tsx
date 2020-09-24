import * as React from 'react';
import {Table, Avatar, Drawer, Tag, Icon } from 'antd';
import { ColumnProps } from 'antd/lib/table';
import * as AV from 'leancloud-storage';
import moment from 'moment';
import { OrderStatus } from '@/constants';
import styles from './index.less';

interface PageProps extends ReduxComponentProps { }

class UsersPage extends React.Component<PageProps> {
    state = {
        loading: false,
        dataSource: [],
        AVData: [],
        count: 0,
        page: 1,
        size: 10,
        // usedCount: 0,
        // unusedCount: 0,
        // unbindCount: 0,
        drawerLoading: false,
        drawerCardVisible: false,
        dataSourceCard: [],

        drawerOrderVisible: false,
        dataSourceOrder: [],
    };

    columns: ColumnProps<any>[] = [
        {
            key: 'avatar',
            title: '头像',
            render: record => (
                <Avatar src={record.avatar && record.avatar.url} icon="user" size="large" />
            ),
        },
        {
            key: 'name',
            title: '用户名',
            dataIndex: 'username',
        },
        {
            key: 'nickname',
            title: '昵称',
            dataIndex: 'nickname',
        },
        {
            key: 'mobile',
            title: '手机号码',
            dataIndex: 'mobilePhoneNumber',
        },
        {
            key: 'sex',
            title: '性别',
            render: record => (record.sex ? '女性' : '男性'),
        },
        {
            key: 'birthday',
            title: '生日',
            render: record => moment(record).format('YYYY-MM-DD'),
        },
        {
            key: 'firstLogin',
            title: '第一次登陆',
            dataIndex: 'firstLogin',
        },
        {
            key: 'lastLogin',
            title: '最后一次登陆',
            dataIndex: 'lastLogin',
        },
        {
            key: 'actions',
            title: '操作',
            render: (text, record, index) => {
                return [
                    <div key="detail">
                        <a onClick={() => {
                            this.setState({ drawerCardVisible: true }, () => {
                                this.onSearchCard(record.originAVObject)
                            })
                        }}>用户代金卡</a>
                    </div>,
                    <div key="hf" style={{ marginTop: 5 }}>
                        <a
                            onClick={() => {
                                this.setState({ drawerOrderVisible: true }, () => {
                                    this.onSearchOrder(record.originAVObject)
                                })
                            }}
                        >历史订单</a>
                    </div>,
                ];
            },
        },
    ];

    componentDidMount() {
        this.onSearch();
    }

    onSearch = async () => {
        const query = new AV.Query('_User');
        query.notEqualTo('isAdmin', true);
        this.setState({ loading: true });
        const data = await query.find();
        this.setState({
            AVData: data,
            dataSource: data.map(i => {
                return {
                    ...i.toJSON(),
                    originAVObject: i,
                };
            }),
            loading: false,
        });
    };

    onPageChange = (page: number) => {
        this.setState({ page }, this.onSearch);
    };

    onShowSizeChange = (page: number, size: number) => {
        this.setState({ page, size }, this.onSearch);
    };
    cardColumns = [
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
            key: 'convertTime',
            title: '兑换日期',
            render: (item) => {
                return item.convertTime ? item.convertTime.map((item, index) => {
                    return <div key={index}>{item}</div>
                }) : null
                // return item.convertTime ? item.convertTime.join(',') : ''
            },
        },
        {
            key: 'convertProducts',
            title: '兑换商品',
            render: (item) => {
                return item.convertProducts ? item.convertProducts.map((pro, index) => {
                    return <div key={index}>{pro ? pro.name : ''}</div>
                }) : null
            },
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
            key: 'isActivation',
            title: '是否激活',
            render: (item) => item.isActivation ? '已激活' : '未激活',
        },
    ];

    onSearchCard = async (user) => {
        this.setState({ drawerLoading: true });
        const query = new AV.Query('CardCoupon');
        query.equalTo('user', user)
        query.include('convertProducts');
        query.include('user');
        query.include('cardCouponCategory');
        query.descending('createdAt');
        query.notEqualTo('isDelete', true)
        const dataSourceCard = await query.find();
        this.setState({
            drawerLoading: false,
            dataSourceCard: dataSourceCard.map(i => {
                return {
                    ...i.toJSON(),
                    originAVObject: i,
                };
            }),
        });

    };
    orderColumns: ColumnProps<any>[] = [
        {
            key: 'no',
            title: '订单号',
            dataIndex: 'no',
            fixed: 'left',
            width: 100,
        },
        {
            key: 'createdAt',
            title: '创建时间',
            render: text => {
                return moment(text.createdAt).format('YYYY-MM-DD HH:mm:ss');
            },
            fixed: 'left',
            width: 150,
        },
        {
            key: 'status',
            title: '订单状态',
            width: 100,
            render: (text, record) => {
                let label,
                    color = '';
                switch (record.status) {
                    case OrderStatus.Unverified:
                        label = '未确认';
                        color = '#d9d9d9';
                        break;
                    case OrderStatus.Ordered:
                        label = '已处理';
                        color = '#108ee9';
                        break;
                    case OrderStatus.Shipped:
                        label = '配送中';
                        color = '#fa8c16';
                        break;
                    case OrderStatus.Finished:
                        label = '已完成';
                        color = '#1AC194';
                        break;
                    default:
                        label = '取消中';
                        color = '#13c2c2';
                }
                if (record.isDelete) {
                    label = '已删除';
                    color = 'red';
                }
                return (
                    <span className={styles.label} style={{ background: color }}>
                        {label}
                    </span>
                );
            },
        },
        {
            key: 'phone',
            title: '客户手机号',
            dataIndex: 'phone',
            width: 100,
        },
        {
            key: 'count',
            title: '订单金额',
            dataIndex: 'count',
            width: 90,
            align: 'center',
        },
        {
            key: 'rName',
            title: '收货人',
            dataIndex: 'address.name',
            width: 100,
        },
        {
            key: 'rPhone',
            title: '收货人电话',
            dataIndex: 'address.mobile',
            width: 100,
        },
        {
            key: 'time',
            title: '配送时间',
            dataIndex: 'deliverTime',
        },
        {
            key: 'address',
            title: '配送地址',
            render: item => item.address.district + item.address.addr,
        },
        {
            key: 'cake',
            title: '规格',
            render: item => {
                return (
                    <div>
                        {item.carts.map((cart, index) =>
                            cart.product ? (
                                <div key={index}>
                                    {cart.product.name}
                                    {/* {cart.spec.weight}磅 */}
                  x{cart.num}
                                </div>
                            ) : null
                        )}
                    </div>
                );
            },
        },
        {
            key: 'usedCardCoupon',
            title: '卡券',
            render: item => {
                return (
                    <div>
                        {item.usedCardCoupon.map((card, index) => (
                            <div key={index}>
                                <Icon style={{ margin: 5 }} type="credit-card" />
                                {card.no}
                                <Icon style={{ margin: 5 }} type="lock" />
                                {card.pwd}
                            </div>
                        ))}
                    </div>
                );
            },
        },
        {
            key: 'note',
            title: '备注',
            dataIndex: 'note',
        },
    ];
    onSearchOrder = async (user) => {
        this.setState({ drawerLoading: true });
        const query = new AV.Query('Order');
        query.include('user');
        query.include('usedCardCoupon');
        query.descending('no');
        query.equalTo('user', user)
        const data = await query.find();
        this.setState({
            drawerLoading: false,
            dataSourceOrder: data.map(i => i.toJSON()),
        });
    };
    render() {
        const { loading, dataSource, count } = this.state;
        return (
            <div style={{ height: '100%', overflow: 'auto' }}>
                <Table
                    rowKey={i => i.objectId}
                    loading={loading}
                    pagination={{
                        total: count,
                        showSizeChanger: true,
                        onShowSizeChange: this.onShowSizeChange,
                        onChange: this.onPageChange,
                        showTotal: (total, range) => `${range[0]}-${range[1]} 总${total}条记录`,
                    }}
                    columns={this.columns}
                    dataSource={dataSource}
                />
                <Drawer
                    maskClosable={true}
                    closable={true}
                    title={"用户绑定的代金卡"}
                    width={'80vw'}
                    onClose={() => { this.setState({ drawerCardVisible: false, dataSourceCard: [] }) }}
                    visible={this.state.drawerCardVisible}
                >
                    {
                        this.state.drawerCardVisible &&
                        <Table
                            rowKey={i => i.objectId}
                            dataSource={this.state.dataSourceCard}
                            columns={this.cardColumns}
                            loading={this.state.drawerLoading}
                        />
                    }
                </Drawer>

                <Drawer
                    maskClosable={true}
                    closable={true}
                    title="历史订单"
                    width={'80vw'}
                    onClose={() => { this.setState({ drawerOrderVisible: false, dataSourceOrder: [] }) }}
                    visible={this.state.drawerOrderVisible}
                >
                    {
                        this.state.drawerOrderVisible &&
                        <Table
                            rowKey={i => i.objectId}
                            scroll={{ x: true }}
                            loading={this.state.drawerLoading}
                            columns={this.orderColumns}
                            dataSource={this.state.dataSourceOrder}
                        />
                    }
                </Drawer>
            </div>
        );
    }
}

export default UsersPage;

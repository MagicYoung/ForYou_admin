import * as React from 'react';
import {
    Table,
    Modal,
    message,
    Form,
    Input,
    Button,
    Icon,
    DatePicker,
} from 'antd';
import { ColumnProps } from 'antd/lib/table';
import * as AV from 'leancloud-storage';
import styles from './index.less';
import moment from 'moment';
import OrderDetail from '../../orders/Detail';
import { FormComponentProps } from 'antd/lib/form';

class OrderRecycle extends React.Component<FormComponentProps> {
    state = {
        loading: false,
        dataSource: [],
        AVData: [],
        count: 0,
        page: 1,
        size: 10,
        visible: false,
        detail: null,
    };
    columns: ColumnProps<any>[] = [
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
                return (
                    <span className={styles.label} style={{ background: 'red' }}>
                        已删除
                    </span>
                );
            },
        },
        {
          key: 'order_product',
          title: '订单商品',
          render: item => {
            return (
              <div>
                <a>{item.order_product.name}</a>
              </div>
            );
          },
        },
        {
          key: 'order_product_spec',
          title: '商品规格',
          dataIndex: 'order_product_spec',
        },
        {
          key: 'order_price',
          title: '订单金额',
          dataIndex: 'order_price',
          width: 90,
          align: 'center',
        },
        {
          key: 'phone',
          title: '客户手机号',
          dataIndex: 'phone',
          width: 100,
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
          key: 'order_cardCoupon',
          title: '卡券',
          render: item => {
            return (
              <div>
                <div >
                  <Icon style={{ margin: 5 }} type="credit-card" />
                  {item.order_cardCoupon ? item.order_cardCoupon.no : ''}
                  <Icon style={{ margin: 5 }} type="lock" />
                  {item.order_cardCoupon ? item.order_cardCoupon.pwd : ''}
                </div>
              </div>
            );
          },
        },
        {
          key: 'note',
          title: '备注',
          dataIndex: 'note',
        },
        {
            key: 'actions',
            title: '操作',
            fixed: 'right',
            render: (text, record, index) => {
                const { AVData } = this.state;
                const showDetail = () => {
                    this.setState({
                        visible: true,
                        detail: AVData[index],
                    });
                };
                const onDelete = async () => {
                    Modal.confirm({
                        title: '删除',
                        content: `数据将彻底删除无法恢复？`,
                        okText: '彻底删除',
                        okType: 'danger',
                        cancelText: '取消',
                        onOk: async () => {
                            await this.state.AVData[index].destroy();
                            message.success('删除成功！', 1.5);
                            this.onSearch();
                        },
                    });
                }
                return [
                    <div key="detail"><a onClick={showDetail}>详情</a></div>,
                    <div style={{ marginTop: 5 }} key="delete"><a onClick={onDelete}>彻底删除订单</a></div>,
                ];
            },
        },
    ];
    componentDidMount() {
        this.onSearch();
    }
    onSearch = async (params: any = {}) => {
        const { size, page } = this.state;
        const query = new AV.Query('Order');
        const count = await query.count();
        query.limit(size);
        query.skip((page - 1) * size);
        query.include('user');
        query.include('usedCardCoupon');
        query.descending('no');
        query.equalTo('isDelete', true)
        params.id && query.contains('no', params.id);
        params.phone && query.contains('phone', params.phone);
        if (params.date) {
            query.greaterThanOrEqualTo('createdAt', params.date[0].toDate());
            query.lessThanOrEqualTo('createdAt', params.date[1].toDate());
        }
        this.setState({ loading: true });
        const data = await query.find();
        this.setState({
            count,
            AVData: data,
            dataSource: data.map(i => i.toJSON()),
            loading: false,
        });
    };

    onPageChange = (page: number) => {
        this.setState({ page }, this.onSearch);
    };

    onShowSizeChange = (page: number, size: number) => {
        this.setState({ page, size }, this.onSearch);
    };

    formSubmit = () => {
        this.props.form.validateFields((err, values) => {
            if (err) return;
            this.onSearch(values);
        });
    };

    resetSearch = () => {
        this.props.form.resetFields();
    };

    render() {
        const { loading, dataSource, count, detail, visible } = this.state;
        const {
            form: { getFieldDecorator },
        } = this.props;
        return (
            <div style={{ height: '100%', overflow: 'auto' }}>
                <Form layout="inline" className={styles.searchForm} style={{ marginBottom: 24 }}>
                    <Form.Item label="订单号">
                        {getFieldDecorator('id')(<Input placeholder="请输入" />)}
                    </Form.Item>
                    <Form.Item label="手机号">
                        {getFieldDecorator('phone')(<Input placeholder="请输入" />)}
                    </Form.Item>
                    <Form.Item label="日期">
                        {getFieldDecorator('date')(<DatePicker.RangePicker />)}
                    </Form.Item>
                    <Button type="primary" onClick={this.formSubmit} style={{ marginLeft: 16 }}>
                        查询
            </Button>
                    <Button style={{ marginLeft: 8 }} onClick={this.resetSearch}>
                        重置
            </Button>
                </Form>
                <Table
                    rowKey={i => i.objectId}
                    scroll={{ x: true }}
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
                <Modal
                    visible={visible}
                    title="订单详情"
                    okText="确定"
                    cancelText="取消"
                    onCancel={() => this.setState({ visible: false })}
                    onOk={() => this.setState({ visible: false })}>
                    {detail && <OrderDetail location={{ state: { orderId: detail.id } }} />}
                </Modal>
            </div>
        );
    }
}

export default Form.create()(OrderRecycle);

import * as React from 'react';
import {
  Table,
  Modal,
  message,
  Divider,
  Form,
  Input,
  Select,
  Button,
  Icon,
  DatePicker,
} from 'antd';
import { ColumnProps } from 'antd/lib/table';
import * as AV from 'leancloud-storage';
import { OrderStatus } from '@/constants';
import styles from './index.less';
import moment from 'moment';
import OrderDetail from '../../orders/Detail';
import { FormComponentProps } from 'antd/lib/form';
import { extraCulteryPrice } from '@/config';
import * as XLSX from 'xlsx';
const { TextArea } = Input;

class AdminOrder extends React.Component<FormComponentProps> {
  state = {
    loading: false,
    dataSource: [],
    AVData: [],
    count: 0,
    page: 1,
    size: 10,
    visible: false,
    detail: null,
    visibleModify: false
  };
  columns: ColumnProps<any>[] = [
    {
      key: 'no',
      title: '订单号',
      fixed: 'left',
      width: 100,
      render: text => {
        return <React.Fragment>
          <div>{text.no}</div>
          {
            text.modifyContent &&
            <div style={{ color: '#1890ff' }}>有修改内容</div>
          }
        </React.Fragment>;
      },
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
            label = '取消确认';
            color = '#13c2c2';
        }
        return (
          <span className={styles.label} style={{ background: color }}>
            {label}
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
        const deleteOrder = () => {
          Modal.confirm({
            title: '确定要取消该订单?',
            okText: '确定',
            okType: 'danger',
            cancelText: '取消',
            onOk: async () => {
              try {
                message.loading('正在取消订单...')
                const AV_order = AVData[index]
                //代金卡处理
                let card_data = AV_order?.get('order_cardCoupon');
                //如果当前卡是A类型，那么该卡券的value为之前的额度
                if (card_data.get('cardCouponCategory').get('type') === 'A') {
                  card_data.set('value', card_data.get('cardCouponCategory').get('cardPrice'));
                } else {
                  card_data.set('value', card_data.get('value') + AV_order.get('coupon_deduction'));
                }
                card_data.set('used', false);
                await card_data.save();
                //删除订单
                AV_order.set('isDelete', true);
                await AV_order.save();
                message.destroy();
                message.success('取消成功！');
                this.onSearch();
              } catch (err) {
                console.error(err);
                message.error('操作失败！');
              }
            },
          });
        };
        const showDetail = () => {
          this.setState({
            visible: true,
            detail: AVData[index],
          });
        };
        const modify = () => {
          this.setState({
            visibleModify: true,
            detail: AVData[index],
          });
        }
        const actions = [];
        if (record.status === OrderStatus.Unverified) {
          actions.push(
            <a
              key="qr"
              onClick={() => {
                record.status = OrderStatus.Ordered;
                AVData[index].set('status', OrderStatus.Ordered);
                AVData[index].save();
                this.forceUpdate();
              }}>
              确认订单
            </a>
          );
        } else if (record.status === OrderStatus.Ordered) {
          actions.push(
            <a
              key="qsfh"
              onClick={() => {
                record.status = OrderStatus.Unverified;
                AVData[index].set('status', OrderStatus.Unverified);
                AVData[index].save();
                this.forceUpdate();
              }}>
              取消确认
            </a>,
            <Divider key="ddd" type="vertical" />,
            <a
              key="fh"
              onClick={() => {
                record.status = OrderStatus.Shipped;
                AVData[index].set('status', OrderStatus.Shipped);
                AVData[index].save();
                this.forceUpdate();
              }}>
              发货
            </a>
          );
        } else if (record.status === OrderStatus.Shipped) {
          actions.push(
            <a
              key="qsfh"
              onClick={() => {
                record.status = OrderStatus.Ordered;
                AVData[index].set('status', OrderStatus.Ordered);
                AVData[index].save();
                this.forceUpdate();
              }}>
              取消发货
            </a>,
            <Divider key="ddd" type="vertical" />,
            <a
              key="wc"
              onClick={() => {
                record.status = OrderStatus.Finished;
                AVData[index].set('status', OrderStatus.Finished);
                AVData[index].save();
                this.forceUpdate();
              }}>
              送达
            </a>
          );
        } else if (OrderStatus.Shipped === record.status) {
          actions.push(
            <a
              key="qssd"
              onClick={() => {
                record.status = OrderStatus.Shipped;
                AVData[index].set('status', OrderStatus.Shipped);
                AVData[index].save();
                this.forceUpdate();
              }}>
              取消送达
            </a>
          );
        }
        // else if (OrderStatus.Canceled === record.status) {
        //   actions.push(
        //     <a
        //       key="hf"
        //       onClick={() => {
        //         record.status = OrderStatus.Ordered;
        //         AVData[index].set('status', OrderStatus.Ordered);
        //         AVData[index].save();
        //         this.forceUpdate();
        //       }}>
        //       恢复订单
        //     </a>
        //   );
        // }
        return [
          <a key="1" onClick={showDetail}>
            详情
          </a>,
          <Divider key="2" type="vertical" />,
          ...actions,
          <Divider key="3" type="vertical" />,
          <a key="del" onClick={deleteOrder}>
            取消订单
          </a>,
          <Divider key="4" type="vertical" />,
          <a key="modify" onClick={modify}>
            修改补充
          </a>,
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
    query.include('order_cardCoupon');
    query.include('order_cardCoupon.cardCouponCategory');
    query.include('order_product');
    query.descending('no');
    query.notEqualTo('isDelete', true)
    params.id && query.contains('no', params.id);
    params.status && query.equalTo('status', params.status);
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

  onSaveModify = () => {
    const { form } = this.props;
    form.validateFields(
      ['modifyContent'],
      async (err, values) => {
        if (err) return;
        try {
          message.loading('正在保存..')
          const { detail } = this.state;
          detail.set('modifyContent', values['modifyContent']);
          await detail.save();
          message.destroy();
          message.success('保存成功', 2);
          this.setState({ visibleModify: false, detail: null });
        } catch (err) {
          console.error(err);
          message.error('保存失败', 2);
        }
      }
    );
  }
  onExport = async () => {
    Modal.confirm({
      title: '导出订单',
      content: '确定导出该批次的订单吗',
      okText: '导出',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        message.warn('正在导出...');
        let fileData = [['订单号', '创建日期', '客户电话', '金额', '收货人', '收货人电话', '配送时间', '配送地址', '规格', '备注']];  //数据，一定注意需要时二维数组

        this.state.dataSource.map((item) => {
          const product = item.carts.map((cart, index) =>
            cart.product ? `${cart.product.name}x${cart.num}` : ''
          )
          fileData.push([
            item.no,
            moment(item.createdAt).format('YYYY-MM-DD HH:mm:ss'),
            item.phone,
            item.order_price,
            item.address.name,
            item.address.mobile,
            item.deliverTime ? moment(item.deliverTime).format('YYYY-MM-DD HH:mm:ss') : '',
            item.address.district + item.address.addr,
            product.join(';'),
            item.note,
          ]);
        })
        var wsName = "Sheet1"; //Excel第一个sheet的名称
        var wb = XLSX.utils.book_new(), ws = XLSX.utils.aoa_to_sheet(fileData);
        XLSX.utils.book_append_sheet(wb, ws, wsName);  //将数据添加到工作薄
        XLSX.writeFile(wb, "订单.xls"); //导出Excel
        message.destroy();
        message.success('已导出订单数据', 1.5);

      },
    });
  }

  render() {
    const { loading, dataSource, count, detail, visible, visibleModify } = this.state;
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
          <Form.Item label="状态">
            {getFieldDecorator('status')(
              <Select style={{ width: 100 }}>
                <Select.Option value={OrderStatus.Unverified}>未确认</Select.Option>
                <Select.Option value={OrderStatus.Ordered}>已处理</Select.Option>
                <Select.Option value={OrderStatus.Shipped}>配送中</Select.Option>
                <Select.Option value={OrderStatus.Finished}>已完成</Select.Option>
                <Select.Option value={OrderStatus.Canceled}>取消中</Select.Option>
              </Select>
            )}
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
          <div>
            <Button type="primary" style={{ marginLeft: 8 }} onClick={this.onExport}>
              导出
            </Button>
          </div>
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
        <Modal
          visible={visibleModify}
          title="订单修改补充"
          okText="确定"
          cancelText="取消"
          onCancel={() => this.setState({ visibleModify: false, detail: null })}
          onOk={() => this.onSaveModify()} >
          {detail &&
            <React.Fragment>
              <Form>
                <Form.Item label="修改补充内容：">
                  {getFieldDecorator('modifyContent', {
                    initialValue: detail
                      ? detail.get('modifyContent')
                      : '',
                  })(
                    <TextArea rows={8} />
                  )}
                </Form.Item>
              </Form>
            </React.Fragment>

          }
        </Modal>
      </div>
    );
  }
}

export default Form.create()(AdminOrder);

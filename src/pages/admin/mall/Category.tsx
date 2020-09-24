import * as React from 'react';
import { Form, Table, Dropdown, Menu, Empty, Button, Modal, Input, message, Select } from 'antd';
import { FormComponentProps } from 'antd/lib/form';
import { ColumnProps } from 'antd/lib/table';
import * as AV from 'leancloud-storage';
import { Category } from '@/AVObjects';
import { getTree, getUploadListItem, renderUploadItem, uploadFiles } from '@/utils';
import { connect } from 'react-redux';

interface CategoryStates {
  dataSource?: Catergory[];
  AVData?: AV.Queriable[];
  loading: boolean;
  visible: boolean;
  currentCategory?: AV.Queriable;
  currentParent?: AV.Queriable;
}

interface Catergory {
  key: string;
  name: string;
  icon: string;
  children?: Catergory[];
  originAVObject: AV.Queriable;
}
interface Props extends FormComponentProps, State.AppState { }

@(Form.create() as any)
@connect(state => ({ adminRole: state.app.adminRole }))
export default class CategoryPage extends React.Component<Props, CategoryStates> {
  state: CategoryStates = {
    dataSource: [],
    AVData: [],
    loading: false,
    visible: false,
    currentCategory: null,
    currentParent: null,
  };

  columns: ColumnProps<Catergory>[] = [
    {
      key: 'name',
      title: '类别名称',
      dataIndex: 'name',
    },
    {
      key: 'icon',
      title: '图标',
      render: (text, record) => {
        if (record.icon) {
          return <img src={record.icon} style={{ height: 25, width: 25 }} />;
        } else {
          return '暂无图标';
        }
      },
    },
    {
      key: 'action',
      title: '操作',
      render: (text, record) => {
        const actionMenu = (
          <Menu
            onClick={({ key }) => {
              switch (key) {
                case '0':
                  this.setState({
                    visible: true,
                    currentParent: record.originAVObject.get('pNode'),
                  });
                  break;
                case '1':
                  this.setState({
                    visible: true,
                    currentParent: record.originAVObject,
                  });
                  break;
                case '2':
                  this.setState({
                    visible: true,
                    currentCategory: record.originAVObject,
                  });
                  break;
                case '4':
                  this.onMove('up', record.originAVObject);
                  break;
                case '5':
                  this.onMove('down', record.originAVObject);
                  break;
                case '3':
                default:
                  if (record.children && record.children.length > 0) {
                    message.error('该类别含有子类别，删除失败！');
                  } else {
                    Modal.confirm({
                      title: '确定要删除该类别?',
                      okText: '确定',
                      okType: 'danger',
                      cancelText: '取消',
                      onOk: async () => {
                        try {
                          await record.originAVObject.destroy();
                          message.success('删除成功！');
                          this.onSearch();
                        } catch (err) {
                          console.error(err);
                          message.error('删除失败！');
                        }
                      },
                    });
                  }

                  break;
              }
            }}>
            <Menu.Item key="0">
              <a>新增类别</a>
            </Menu.Item>
            {!record.originAVObject.get('pNode') && (
              <Menu.Item key="1">
                <a>新增子类别</a>
              </Menu.Item>
            )}
            <Menu.Item key="2">
              <a>编辑</a>
            </Menu.Item>
            {
              !record.originAVObject.get('pNode') &&
              <Menu.Item key="4">
                <a >上移</a>
              </Menu.Item>
            }
            {
              !record.originAVObject.get('pNode') &&
              <Menu.Item key="5">
                <a >下移</a>
              </Menu.Item>
            }
            <Menu.Item key="3">
              <a style={{ color: 'red' }}>删除</a>
            </Menu.Item>
          </Menu>
        );
        return (
          <div>
            <Dropdown overlay={actionMenu} placement="bottomCenter" trigger={['click']}>
              <a href="#">操作</a>
            </Dropdown>
          </div>
        );
      },
    },
  ];

  onMove = async (type, data) => {
    const { dataSource } = this.state;
    const order = data.get('order');
    if (type === "up" && order === 1) {
      message.warning('已经是第一个了');
      return
    }
    if (type === "down" && dataSource?.length === order) {
      message.warning('已经是最后一个了');
      return
    }
    const nextData = dataSource?.find((item) => item.originAVObject.get('order') === (type === "up" ? (order - 1) : (order + 1)))?.originAVObject;

    data.set('order', type === "up" ? (order - 1) : (order + 1));
    nextData?.set('order', order);
    await AV.Object.saveAll([data, nextData]);
    this.onSearch();
  }
  componentDidMount() {
    this.onSearch();
  }

  onSearch = async () => {
    const query = new AV.Query('Category');
    this.setState({ loading: true });
    query.include('icon');
    query.include('pNode');
    query.ascending('order');
    const data = await query.find();
    // 如果数据长度为0，设置dataSource为null，以渲染Empty组件，同时可以展示Table的loading效果
    this.setState({
      AVData: data,
      dataSource: data.length > 0 ? getTree(data).map(i => this.composeData(i)) : null,
      loading: false,
    });
  };

  composeData = (node: any) => {
    return {
      key: node.id,
      name: node.get('name'),
      icon: node.get('icon') ? node.get('icon').url : null,
      children: node.children && node.children.map(i => this.composeData(i)),
      originAVObject: node,
    };
  };

  onCancel = () => {
    this.props.form.resetFields();
    this.setState({ visible: false });
  };

  onSave = () => {
    this.props.form.validateFields(async (err, values) => {
      if (err) return;
      const { currentParent, currentCategory, dataSource } = this.state;
      const hide = message.loading('正在保存...', 0);
      try {
        const icon = await uploadFiles(values['icon']);
        const category = currentCategory || new Category();
        category.set('name', values.name);
        category.set('isHot', values.isHot === 'true');
        category.set('icon', icon[0] || null);
        category.set('pNode', currentParent || category.get('pNode'));
        if (!currentParent) {
          category.set('order', dataSource?.length + 1);
        }
        const acl = new AV.ACL();
        acl.setPublicReadAccess(true);
        acl.setRoleWriteAccess(this.props.adminRole, true);
        category.setACL(acl);
        await category.save();
        await this.onSearch();
        this.props.form.resetFields();
        this.setState({
          visible: false,
          currentParent: null,
          currentCategory: null,
        });
      } catch (err) {
        console.error(err);
        message.error('保存失败！');
      }
      hide();
    });
  };

  onAddCategory = () => {
    this.setState({ visible: true });
  };

  render() {
    const {
      form: { getFieldDecorator, getFieldValue },
    } = this.props;
    const { dataSource, loading, visible, currentCategory } = this.state;
    return (
      <div style={{ height: '100%', overflow: 'auto' }}>
        {dataSource ? (
          <Table
            //expandedRowKeys={AVData.map(i => i.id)}
            loading={loading}
            pagination={false}
            columns={this.columns}
            dataSource={this.state.dataSource}
          />
        ) : (
            <Empty
              image="https://gw.alipayobjects.com/mdn/miniapp_social/afts/img/A*pevERLJC9v0AAAAAAAAAAABjAQAAAQ/original"
              description="暂无分类数据">
              <Button type="primary" onClick={this.onAddCategory}>
                新增分类
              </Button>
            </Empty>
          )}
        <Modal
          visible={visible}
          title={currentCategory ? '编辑分类' : '新增分类'}
          okText="保存"
          cancelText="取消"
          onCancel={this.onCancel}
          onOk={this.onSave}>
          <Form layout="horizontal">
            <Form.Item label="名称" labelCol={{ span: 4 }} wrapperCol={{ span: 20 }}>
              {getFieldDecorator('name', {
                rules: [{ required: true, message: '请输入名称' }],
                initialValue: currentCategory ? currentCategory.get('name') : '',
              })(<Input placeholder="例：草莓" />)}
            </Form.Item>
            {renderUploadItem({
              name: 'icon',
              label: '图标',
              initialValue:
                currentCategory && currentCategory.get('icon')
                  ? [getUploadListItem(currentCategory.get('icon'), 1)]
                  : [],
              getFieldDecorator,
              getFieldValue,
            })}
            <Form.Item label="是否热门" labelCol={{ span: 4 }} wrapperCol={{ span: 10 }}>
              {getFieldDecorator('isHot', {
                initialValue: currentCategory ? currentCategory.get('isHot') ? 'true' : 'false':'false',
              })(<Select>
                <Select.Option value="true" >是</Select.Option>
                <Select.Option value="false">否</Select.Option>
              </Select>)}
            </Form.Item>
          </Form>
        </Modal>
      </div>
    );
  }
}

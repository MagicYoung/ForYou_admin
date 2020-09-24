import * as React from 'react';
import { Table, Avatar } from 'antd';
import { ColumnProps } from 'antd/lib/table';
import * as AV from 'leancloud-storage';

interface Props extends ReduxComponentProps { }

class FeedbackPage extends React.Component<Props> {
  state = {
    loading: false,
    dataSource: [],
    AVData: [],
    count: 0,
    page: 1,
    size: 10,
  };

  columns: ColumnProps<any>[] = [
    {
      key: 'avatar',
      title: '用户头像',
      render: ({ user }) => (
        <Avatar src={user.avatar && user.avatar.url} icon="user" size="large" />
      ),
    },
    {
      key: 'name',
      title: '用户名',
      dataIndex: 'user.username',
    },
    {
      key: 'mobile',
      title: '手机号码',
      dataIndex: 'user.mobilePhoneNumber',
    },
    {
      key: 'content',
      title: '意见内容',
      dataIndex: 'content',
      width: '50%',
    },
  ];

  componentDidMount() {
    this.onSearch();
  }

  onSearch = async () => {
    const query = new AV.Query('Feedback');
    query.include('user');
    query.descending('createdAt');
    this.setState({ loading: true });
    const data = await query.find();
    this.setState({
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
      </div>
    );
  }
}

export default FeedbackPage;

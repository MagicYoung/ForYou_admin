import * as React from 'react';
import styles from './index.less';
import { connect } from 'react-redux';
import Button from '@/components/Button';
import { Icon, List, Divider } from 'antd';
import router from 'umi/router';
import { WhiteSpace, Modal, Toast } from 'antd-mobile';
import Check from '@/components/Check';
import * as AV from 'leancloud-storage';

interface AddressProps extends ReduxComponentProps, State.HomeState {
  onSelect: (address: {}) => void;
}

class AddressPage extends React.Component<AddressProps> {
  state = {
    searchValue: '',
    isEdit: false,
    dataList: [],
  };
  componentDidMount() {
    this.onSearch();
  }
  onSearch = async () => {
    Toast.loading('正在加载');
    const {
      location: { query },
    } = this.props;
    const res = await this.props.dispatch({ type: 'home/queryAddresses', payload: { isCake: query.isCake ? query.isCake === 'true' : null } });
    this.setState({ dataList: res });
    Toast.hide();
  }

  onAddAddr = () => {
    const {
      location: { query },
    } = this.props;
    if (query.isCake && query.isCake === 'true') {
      router.push('/me/address/AddressMap');
    } else {
      router.push('/me/address/edit');
    }
  };
  onEditAddr(item, e) {
    e.stopPropagation();
    if (item.get('isCake')) {
      router.push({
        pathname: '/me/address/AddressMap',
        search: '?id=' + item.id,
      });
    } else {
      router.push({
        pathname: '/me/address/edit',
        search: '?id=' + item.id,
      });
    }
  }
  onDeleteAddr(item, e) {
    e.stopPropagation();
    Modal.alert('提示', '是否删除？', [
      { text: '取消', onPress: () => { } },
      {
        text: '确定',
        onPress: async () => {
          await this.props.dispatch({ type: 'home/deleteAddress', payload: item });

          this.onSearch();
        },
      },
    ]);
  }
  async onSetDefault(item: AV.Object, e) {
    e.stopPropagation();
    const o = this.props.addresses.map(i => {
      if (i.get('isDefault') === true) {
        i.set('isDefault', false);
      }
      return i as AV.Object;
    });
    item.set('isDefault', true);
    await AV.Object.saveAll([...o, item]);
    this.forceUpdate();
    Toast.success('设置成功', 1.5);
  }
  renderItem = (item: AV.Object) => {
    const {
      location: { query, search },
    } = this.props;
    const onCheck = () => {
      if (!search) return;
      this.props.dispatch({
        type: 'order/save',
        payload: {
          selectedAddress: item,
        },
      });
      router.goBack();
    };
    return (
      <List.Item
        onClick={onCheck}
        actions={this.state.isEdit ? [
          <span onClick={this.onDeleteAddr.bind(this, item)}>
            <Icon type="delete" />
          </span>,
          <span onClick={this.onEditAddr.bind(this, item)}>
            <Icon type="edit" style={{ marginRight: 6 }} />
          </span>
        ] : []}>
        <List.Item.Meta
          avatar={!!search && <Check checked={item.id === query.id} />}
          title={
            <div>
              <div className={styles.row}>
                <span >
                  {item.get('name')}
                  <span style={{ marginLeft: 4 }}>{item.get('mobile')}</span>
                </span>
              </div>
              {
                item.get('isCake') &&
                <div style={{ fontSize: 12 }}>（蛋糕用地址）</div>
              }
            </div>}
          description={
            <div>
              <div>{item.get('district')}</div>
              <div>{item.get('addr')}</div>
            </div>
          }
        />
      </List.Item>

    );
  };

  onSearchChange = searchValue => {
    this.setState({ searchValue });
  };

  filterData = data => {
    const { searchValue } = this.state;

    return data.filter(
      (i: AV.Object) =>
        (
          i.get('name') +
          i.get('mobile') +
          i.get('district') +
          i.get('addr')
        ).indexOf(searchValue) !== -1
    );
  };

  render() {
    return (
      <div style={{ height: '100%' }}>

        <div className={styles.edit} onClick={() => {
          this.setState({ isEdit: !this.state.isEdit })
        }}>
          <span >{this.state.isEdit ? '完成' : '编辑'}</span>
        </div>
        <div className={styles.container}>
          <WhiteSpace size="lg" />
          <List
            itemLayout="vertical"
            dataSource={this.filterData(this.state.dataList)}
            renderItem={this.renderItem}
          />
          <Divider style={{ margin: 0 }} />
        </div>
        <div className={styles.button}>
          <Button onClick={this.onAddAddr} style={{ backgroundColor: '#022c27', height: 53 }}>
            <Icon type="plus" style={{ fontSize: 18, marginRight: 6 }} />
            新增地址
            </Button>
        </div>
      </div>
    );
  }
}

export default connect(state => ({ addresses: state.home.addresses }))(AddressPage);

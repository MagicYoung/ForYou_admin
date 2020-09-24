import * as React from 'react';
import { Icon, Empty } from 'antd';
import { Toast, List } from 'antd-mobile';
import moment from 'moment'
import * as AV from 'leancloud-storage';
const Item = List.Item;
const Brief = Item.Brief;

interface AddressProps extends ReduxComponentProps, State.HomeState {
    onSelect: (address: {}) => void;
}
export default class RechargRecord extends React.Component<AddressProps> {
    state = {
        dataSorce: [],
    };
    async componentDidMount() {
        Toast.loading('正在加载..');
        const query = new AV.Query('Recharge');
        query.equalTo('user', AV.User.current());
        query.descending('createdAt');
        const ret = await query.find();
        this.setState({ dataSorce: ret })

        Toast.hide();
    }
    render() {
        return (
            <div>
                {
                    this.state.dataSorce.length ?

                        <List renderHeader={() => '充值记录'} className="my-list">
                            {
                                this.state.dataSorce?.map((item: any) => {
                                    return <Item key={item.id} extra={`+${item.get('money')}`}
                                        align="top"
                                        thumb={<Icon type="wechat" style={{ color: 'green', fontSize: 20 }} />}
                                        multipleLine
                                    >
                                        {item.get('name')}
                                        <Brief>{moment(item.createdAt).format('YYYY-MM-DD HH:mm')}</Brief>
                                    </Item>
                                })
                            }
                        </List> :
                        <Empty
                            style={{
                                width: '100%',
                                height: 400,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexDirection: 'column',
                            }}
                        />
                }
            </div>
        )
    }
}


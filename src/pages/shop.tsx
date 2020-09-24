import * as React from 'react';
import { Layout, Menu } from 'antd';
import { connect } from 'react-redux';
import styles from './shop.less';
import * as AV from 'leancloud-storage';
import router from 'umi/router';
import {Toast} from 'antd-mobile';

const { Sider, Content } = Layout;
interface ShopPageStates {
    originCategoryData: AV.Queriable[];
    currCategoryArr: AV.Queriable[];
    menuArr: AV.Queriable[];
}


interface AdminLayoutProps extends State.AppState, ReduxComponentProps {
    location: Location;
}

@connect(state => state.app)
export default class ShopPage extends React.Component<AdminLayoutProps, ShopPageStates> {
    state: ShopPageStates = {
        originCategoryData: [],
        currCategoryArr: null,
        menuArr: []
    };
    async componentDidMount() {
        Toast.loading('加载中...');
        const query = new AV.Query('Category');
        query.ascending('order');
        const originCategoryData = await query.find();
        let menuArr: any = [];
        originCategoryData.map((item) => {
            if (!item.get('pNode')) {
                menuArr.push(item);
            }
        })
        if (!this.props.shopSelectedKeys || !originCategoryData.find(i => i.id === this.props.shopSelectedKeys)) {
           await this.props.dispatch({ type: 'app/save', payload: { shopSelectedKeys: originCategoryData[0].id } })
        }
        this.setState({
            originCategoryData,
            menuArr,
            currCategoryArr: originCategoryData.filter((item: any) => {
                return item.get('pNode') ?  item.get('pNode').id === this.props.shopSelectedKeys : null;
            })
        });
        
        Toast.hide();
    }
    getMenuContent() {
        const { currCategoryArr, originCategoryData } = this.state;
        const { shopSelectedKeys } = this.props;
        const currAllCategory = originCategoryData.filter((m: any) => { return m.id === shopSelectedKeys })[0];
        return (
            <div style={{ display: 'flex', width: '100%', flexWrap: 'wrap' }}>
                {
                    currAllCategory &&
                    <div
                    style={{ backgroundImage: currAllCategory.get('icon') ? `url(${currAllCategory.get('icon').url})` : 'none',backgroundColor: currAllCategory.get('icon') ? 'initial' : '#000000' }}
                        className={styles.menuRightItem}
                        onClick={() => {
                            router.push({
                                pathname: 'productMall',
                                query: {
                                    tags: currAllCategory.id,
                                }
                            })
                        }}
                    >
                        <div className={styles.title}>{`全部${currAllCategory.get('name')}`}</div>
                    </div>
                }
                {currCategoryArr && currCategoryArr.map((item: any) => {
                    return (
                        <div
                            style={{ backgroundImage: item.get('icon') ? `url(${item.get('icon').url})` : 'none',backgroundColor: item.get('icon') ? 'initial' : '#000000' }}
                            key={item.id}
                            className={styles.menuRightItem}
                            onClick={() => {
                                router.push({
                                    pathname: 'productMall',
                                    query: {
                                        tags: item.id,
                                    }
                                })
                            }}
                        >
                            <div className={styles.title}>{item.get('name')}</div>
                        </div>
                    )

                })}
            </div>
        )
    }


    render() {
        const { originCategoryData, currCategoryArr, menuArr } = this.state;
        const { shopSelectedKeys } = this.props;
        return (
            <Layout className={styles.container}>
                <Sider width={120} style={{ background: '#fff' }}>
                    <Menu
                        mode="inline"
                        selectedKeys={[`${shopSelectedKeys}`]}
                        style={{ height: '100%' }}
                        onClick={({ key }) => {
                            this.setState({
                                shopSelectedKeys: key,
                                currCategoryArr: originCategoryData.filter((item: any) => {
                                    return item.get('pNode') ? item.get('pNode').id === key : null;
                                })
                            })
                            this.props.dispatch({ type: 'app/save', payload: { shopSelectedKeys: key } })
                        }}
                    >
                        {
                            menuArr.map((item) => {
                                const isSelect = item.id === shopSelectedKeys;
                                return (<Menu.Item key={item.id}>
                                    <span style={{ borderBottom: isSelect ? '3px solid #000000' : 'none', fontSize: isSelect ? '16px' : '14px' }} className={styles.menuItemTitle}>{item.get('name')}</span>
                                </Menu.Item>)
                            })
                        }
                    </Menu>
                </Sider>
                <Content style={{ padding: '0 0', height: '100%' }}>
                    {currCategoryArr && this.getMenuContent()}
                </Content>
            </Layout>
        );
    }
}
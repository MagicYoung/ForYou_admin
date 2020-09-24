import * as React from 'react';
import styles from './index.less';
import { Icon, Drawer, Tag, Badge, Popover } from 'antd';
import { TAB_MENU, HEAD_LEFT_MENU } from '@/config';
import Link from 'umi/link';
import classNames from 'classnames';
import router from 'umi/router';
import { connect } from 'react-redux';
import { TabBar, SearchBar, List, Toast } from 'antd-mobile';
import { throttle } from 'lodash';
import * as AV from 'leancloud-storage';
import { wechatId } from '@/config'
import { isWechat } from '@/utils'

const hideHeadMenu = ['/me', '/cart', '/userCardCoupon/Recharge',
  '/userCardCoupon/RechargeSuccess', '/me/address/edit', '/me/address/AddressMap']

interface CommonLayoutProps extends ReduxComponentProps, State.HomeState, State.AppState {
  designMode?: boolean;
  location: Location;
}

@connect(state => ({
  ...state.home,
  setting: state.app.setting,
}))
export default class CommonLayout extends React.Component<CommonLayoutProps> {

  componentWillMount() {
    if (isWechat() && !this.props.openid) {
      if (this.props.location.query.openid) {
        this.props.dispatch({ type: 'home/save', payload: { openid: this.props.location.query.openid } });
      } else {
        window.location.href = `https://payjs.cn/api/openid?mchid=${wechatId.mchid}&callback_url=${window.location.href}`
        return
      }
    }
  }

  async componentDidMount() {
    if (this.props.setting.get('name')) {
      document.title = this.props.setting.get('name')
    }
    this.props.dispatch({ type: 'home/getCategories' });
    this.props.dispatch({ type: 'home/queryCartNum' });

    const query = new AV.Query('Product');
    query.equalTo("isHotSearch", true)
    query.equalTo("active", true)
    const data = await query.find();
    this.setState({ hotSearch: data })
  }
  state = {
    searchVisible: false,
    searchValue: '',
    searchProArr: [],
    hotSearch: [],
    popovervisible: false
  };
  onToggleDrawer = () => {
    this.setState({
      searchVisible: false,
    });
    this.props.dispatch({
      type: 'home/save',
      payload: {
        drawerVisible: !this.props.drawerVisible,
      },
    });
  };

  onToggleSearch = () => {
    this.setState({
      searchVisible: !this.state.searchVisible,
      searchProArr: []
    })
  };

  goBack = () => {
    router.goBack();
  };

  toCart = () => {
    router.push('/cart');
  };

  onCategoryClick(item) {
    this.props.dispatch({
      type: 'home/save',
      payload: {
        drawerVisible: false,
      },
    });
    this.props.dispatch({ type: 'home/queryProducts', payload: item });
    if (this.props.location.pathname !== '/cakes') {
      router.replace('/cakes');
    }
  }

  renderSearch = () => {
    return <div
      className={styles.shopSearch}
      onClick={this.onToggleSearch}
    >
      <Icon
        type={'search'}
        style={{ color: '#000000', fontSize: 20, }}
      />
      <span style={{ marginLeft: 5 }}>搜索...</span>
    </div>
  }

  throttleOnSearch = throttle(async (val) => {
    if (!val.trim()) {
      this.setState({ searchProArr: [] })
      return
    }
    Toast.loading('正在加载...')
    const queryPro = new AV.Query('Product');
    queryPro.contains("name", val.trim())
    const dataPro = await queryPro.find();
    this.setState({ searchProArr: dataPro }, () => {
      Toast.hide();
    })
  }, 1000, { leading: false })

  getLeftMune = () => {
    return (
      <div style={{ fontSize: 18, color: '#000000' }}>
        {HEAD_LEFT_MENU.map((item) => {
          return (
            <div style={{ padding: '10px 20px' }} key={item.path}
              onClick={() => {
                this.setState({ popovervisible: false })
                router.replace(item.path);
              }}
            >
              <Icon
                className={styles.icon_header}
                type={item.icon}
                style={{ fontSize: 21 }}
              /> <span style={{ marginLeft: 15 }}> {item.name}</span>
            </div>
          )
        })}
      </div>
    )
  }
  isHideBar = () => {
    const pathname = this.props.location.pathname;
    if (pathname === '/' || pathname === '/signin' || pathname.indexOf('/product/') > -1) {
      return true
    } return false
  }
  render() {
    const {
      children,
      location,
      categories,
      drawerVisible,
      setting,
      cartNum,
    } = this.props;
    const pathname = this.props.location.pathname;
    const isTabRoute = TAB_MENU.some(i => i.path === location.pathname.toLowerCase());
    //alert(this.props.openid)
    return (
      (isWechat() && !this.props.openid) ?
        <div className={styles.container}>
          <div style={{ marginTop: 20, textAlign: 'center' }}>
            正在获取微信数据,等待跳转...
          </div>
        </div> :
        <div className={styles.container}>
          {
            hideHeadMenu.indexOf(pathname) < 0 ?
              <div style={{ boxShadow: this.isHideBar() ? 'none' : '0 0 12px 0 rgba(0, 0, 0, 0.1)' }} className={styles.header}>
                {
                  pathname === '/signin' && <Icon
                    className={styles.icon_header}
                    type={'left'}
                    onClick={this.goBack}
                  />
                }
                {
                  (!isTabRoute && pathname !== '/signin') &&
                  <Popover
                    content={this.getLeftMune()}
                    title={null}
                    trigger="click"
                    placement="bottomLeft"
                    visible={this.state.popovervisible}
                    onVisibleChange={(visible) => {
                      this.setState({ popovervisible: visible });
                    }}
                  >

                    <Icon
                      className={styles.icon_header}
                      type={'menu'}
                      onClick={this.getLeftMune}
                    />
                  </Popover>
                }

                {
                  (isTabRoute && pathname !== '/shop' && pathname !== '/signin') ? <Icon
                    className={styles.icon_header}
                    onClick={this.onToggleSearch}
                    type={'search'}
                  /> : null
                }
                {
                  pathname === '/shop' ? this.renderSearch() :
                    !this.isHideBar() ?
                      <Link to="/" className={styles.content}>
                        <img src={setting.get('logo') && setting.get('logo').url} />
                      </Link> : <div className={styles.content}></div>
                }
                {
                  (!isTabRoute && pathname !== '/signin') && <Icon
                    className={styles.icon_header}
                    onClick={this.onToggleSearch}
                    type={'search'}
                  />
                }

                {
                  ((isTabRoute || pathname.indexOf('/product/') < 0) && pathname !== '/cart' && pathname !== '/signin') &&
                  <Badge
                    count={cartNum}
                    style={{ backgroundColor: '#000', color: '#fff' }}
                    offset={[-7, 3]}
                    onClick={this.toCart}
                  >
                    <Icon
                      className={styles.icon_header}
                      type={'shopping-cart'}
                    />
                  </Badge>
                }
              </div> : null
          }

          <div
            id="common-layout-container"
            style={{ top: (hideHeadMenu.indexOf(pathname) < 0 && !this.isHideBar()) ? 43 : 0 }}
            className={classNames(styles.layoutContent, { [styles.noTab]: !isTabRoute })}>
            {children}
          </div>
          {isTabRoute && (
            <div className={styles.tabBar}>
              <TabBar
                unselectedTintColor="#949494"
                tintColor="#000000"
                barTintColor="white"
                tabBarPosition="top"
              >
                {
                  TAB_MENU.map((i, index) => (
                    <TabBar.Item
                      title={i.name}
                      key={i.path}
                      icon={<Icon style={{ fontSize: 24 }} type={i.icon} />}
                      selectedIcon={<Icon style={{ fontSize: 24 }} type={i.icon} />}
                      selected={location.pathname.toLowerCase() === i.path.toLowerCase()}
                      onPress={() => {
                        router.push({
                          pathname: i.path,
                          state:
                            i.path.toLowerCase() === '/cakes'
                              ? {
                                all: true,
                              }
                              : {},
                        })
                      }}
                    />
                  ))
                }
              </TabBar>
            </div>
          )}
          {this.state.searchVisible && (
            <div className={styles.searchContainer}>
              <div className={styles.mask} onClick={this.onToggleSearch} />
              <div className={styles.search}>
                <div style={{ width: '100%' }}>
                  <SearchBar
                    placeholder="请输入关键字"
                    showCancelButton
                    ref={ref => this.autoFocusInst = ref}
                    onClear={this.onToggleSearch}
                    onChange={this.throttleOnSearch}
                  />
                </div>
                <div>
                  <List>
                    {
                      this.state.searchProArr.map((pro) => {
                        return <List.Item key={pro.id} onClick={() => {
                          this.setState({ searchVisible: false }, () => {
                            router.push({
                              pathname: `/product/${pro.id}`,
                            });
                          })
                        }}>{pro.get("name")}</List.Item>
                      })
                    }
                  </List>
                </div>
                <div className={styles.hotSearch}>
                  <div className={styles.title}>热搜推荐</div>
                  <div className={styles.content}>
                    {
                      this.state.hotSearch.map((item) => {
                        return <Tag
                          key={item.id}
                          className={styles.tag}
                          onClick={() => {
                            this.setState({ searchVisible: false }, () => {
                              router.push({
                                pathname: `/product/${item.id}`,
                              });
                            })
                          }}
                        >{item.get('name')}</Tag>
                      })
                    }
                  </div>
                </div>
              </div>
            </div>
          )}

          <Drawer
            placement="left"
            width={200}
            visible={drawerVisible}
            onClose={this.onToggleDrawer}
            closable={false}
            title={null}>
            <div className={styles.drawer}>
              {categories.map((item: any, index) => {
                return (
                  <React.Fragment key={index}>
                    <div
                      key={index}
                      onClick={this.onCategoryClick.bind(this, item)}
                      className={styles.level1}>
                      {item.get('icon') && <img className={styles.icon} src={item.get('icon').url} />}
                      {item.get('name')}
                    </div>
                    {item.children &&
                      item.children.map((item, index) => (
                        <div
                          key={index}
                          onClick={this.onCategoryClick.bind(this, item)}
                          className={styles.level2}>
                          {item.get('icon') && (
                            <img className={styles.icon} src={item.get('icon').url} />
                          )}
                          {item.get('name')}
                        </div>
                      ))}
                  </React.Fragment>
                );
              })}
            </div>
          </Drawer>
        </div>
    );
  }
}

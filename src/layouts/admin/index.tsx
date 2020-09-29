import * as React from 'react';
import { Layout, Icon, Menu, Drawer, Spin, Result, Button } from 'antd';
import { connect } from 'react-redux';
import classNames from 'classnames';
import { ADMIN_MENU } from '@/config';
import Link from 'umi/link';
import AdminHeader from './Header';
import styles from './index.less';
import { User } from 'leancloud-storage';
import { Redirect } from 'react-router';
import * as AV from 'leancloud-storage';
import router from 'umi/router';

const { Sider, Content } = Layout;

interface AdminLayoutProps extends State.AppState, ReduxComponentProps {
  location: Location;
}

@connect(state => state.app)
export default class AdminLayout extends React.Component<AdminLayoutProps, {}> {

  state = {
    isLoadding: true,
    userRightsList: [],
  }
  async componentDidMount() {
    if (this.props.setting.get('name')) {
      document.title = this.props.setting.get('name')
    }
    this.setState({ isLoadding: true });
    const queryR = new AV.Query('User_Rights');
    queryR.equalTo('user', User.current());
    const resR = await queryR.find();
    this.setState({
      userRightsList: resR[0] ? resR[0].get('menuList') : [],
      isLoadding: false
    });


  }
  onToggleMenuCollasped = () => {
    this.props.dispatch({
      type: 'app/save',
      payload: { menuCollapsed: !this.props.menuCollapsed },
    });
  };

  onClose = () => {
    this.props.dispatch({
      type: 'app/save',
      payload: {
        menuCollapsed: false,
      },
    });
  };

  getKeys = () => {
    const {
      location: { pathname },
    } = this.props;
    const findItemByPathname = (menu: AdminMenuItem[], parentPath) => {
      for (let item of menu) {
        if (item.path === pathname) {
          return { path: item.path, parentPath };
        } else if (item.subMenu) {
          const ret = findItemByPathname(item.subMenu, item.path);
          if (ret) return ret;
        }
      }
    };
    const ret = findItemByPathname(ADMIN_MENU, null);
    return {
      selectedKeys: [ret ? ret.path : ''],
      openKeys: [ret ? ret.parentPath : ''],
    };
  };

  renderLogo() {
    return (
      <div className={styles.logo}>
        <img src={require('../../assets/logo.svg')} />
        <span>{this.props.setting.get('name')}</span>
      </div>
    );
  }

  renderMobileLayout() {
    const { menuCollapsed, children, location } = this.props;
    return (
      <Layout tagName="main" className={styles.container}>
        <AdminHeader />
        <Drawer
          bodyStyle={{
            padding: 0,
            height: '100vh',
          }}
          width={200}
          placement="left"
          closable={false}
          onClose={this.onClose}
          visible={menuCollapsed}>
          <div className={styles.siderMobile}>
            {this.renderLogo()}
            <Menu
              className={styles.menu}
              theme="dark"
              mode="inline"
              selectedKeys={[location.pathname]}>
              {this.getMenu(ADMIN_MENU)}
            </Menu>
          </div>
        </Drawer>
        <Content tagName="main" className={styles.content}>
          {children}
        </Content>
      </Layout>
    );
  }

  getMenu = (menu: AdminMenuItem[]) => {
    const { userRightsList } = this.state;
    return menu.map(item =>
      userRightsList.find((uc) => uc === item.path) || User.current().get('isSysAdmin') ?
        (item.subMenu ? (
          <Menu.SubMenu
            key={item.path}
            title={
              <span>
                <Icon type={item.icon} />
                <span>{item.name}</span>
              </span>
            }>
            {this.getMenu(item.subMenu)}
          </Menu.SubMenu>
        ) : (
            <Menu.Item key={item.path}>
              <Link to={item.path}>
                <span>
                  <Icon type={item.icon} />
                  <span>{item.name}</span>
                </span>
              </Link>
            </Menu.Item>
          )) : null
    );
  }

  render() {
    const { menuCollapsed, children } = this.props;
    // 如果不是管理员登录，返回到登录页
    if (!sessionStorage.getItem('adminUser') || !User.current() || !User.current().get('isAdmin')) {
      return <Redirect to="/admin/login" />;
    }
    // if (isMobile) {
    //   return this.renderMobileLayout();
    // }
    const { isLoadding, userRightsList } = this.state;
    return (
      <Spin spinning={isLoadding}>
        {
          isLoadding ? <div style={{ width: '100%', height: '100%' }}></div> :
            ((userRightsList.length > 0 || User.current().get('isSysAdmin')) ?
              <Layout tagName="main" className={styles.container}>
                <Sider className={styles.sider} trigger={null} collapsible={true} collapsed={menuCollapsed}>
                  {this.renderLogo()}
                  <Menu
                    theme="dark"
                    mode="inline"
                    selectedKeys={this.getKeys().selectedKeys}
                    defaultOpenKeys={this.getKeys().openKeys}>
                    {this.getMenu(ADMIN_MENU)}
                  </Menu>
                </Sider>
                <Layout
                  tagName="main"
                  className={classNames(styles.rightLayout, {
                    [styles.rightLayoutCollapsed]: menuCollapsed,
                  })}>
                  <AdminHeader />
                  <Content tagName="main" className={styles.content}>
                    {children}
                  </Content>
                </Layout>
              </Layout> :
              <Result
                status="403"
                title="403"
                subTitle="抱歉您没有访问系统的权限."
                extra={<Button type="primary" onClick={async () => {
                  await AV.User.logOut();
                  router.replace('/admin/login');
                }}>返回重新登录</Button>}
              />)

        }
      </Spin>

    );
  }
}

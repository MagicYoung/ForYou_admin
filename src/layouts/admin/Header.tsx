import * as React from 'react';
import { Layout, Icon, Dropdown, Avatar, Menu } from 'antd';
import styles from './Header.less';
import { connect } from 'react-redux';
import * as AV from 'leancloud-storage';
import router from 'umi/router';
import classNames from 'classnames';

const { Header } = Layout;

interface HeaderProps extends State.AppState, State.LoginState, ReduxComponentProps {}

@connect(state => ({ ...state.app, user: state.login.user }))
export default class AdminHeader extends React.Component<HeaderProps, {}> {
  onToggleMenuCollasped = () => {
    this.props.dispatch({
      type: 'app/save',
      payload: { menuCollapsed: !this.props.menuCollapsed },
    });
  };

  logout = async () => {
    await AV.User.logOut();
    router.replace('/admin/login');
  };

  render() {
    const { menuCollapsed, isMobile } = this.props;
    const user = AV.User.current();
    return (
      <Header tagName="header" className={styles.container}>
        <Icon
          className={styles.trigger}
          type={menuCollapsed ? 'menu-unfold' : 'menu-fold'}
          onClick={this.onToggleMenuCollasped}
        />
        <Dropdown
          overlay={
            <Menu>
              <Menu.Item onClick={this.logout}>
                <Icon type="logout" />
                退出登录
              </Menu.Item>
            </Menu>
          }>
          <div
            className={classNames(styles.user, {
              [styles.userMobile]: isMobile,
            })}>
            <Avatar size="small" icon="user" />
            {!isMobile && <span className={styles.name}>{user && user.getUsername()}</span>}
          </div>
        </Dropdown>
      </Header>
    );
  }
}

import * as React from 'react';
import Link from 'umi/link';
import { Icon } from 'antd';
import { GlobalFooter } from 'ant-design-pro';
import styles from './User.less';
import { connect } from 'react-redux';

const links = [
  {
    key: 'help',
    title: '帮助',
    href: '',
  },
  {
    key: 'privacy',
    title: '隐私',
    href: '',
  },
  {
    key: 'terms',
    title: '条款',
    href: '',
  },
];

const UserLayout: React.FC<State.AppState> = ({ children, setting }) => {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.top}>
          <div className={styles.header}>
            <Link to="/">
              <img alt="logo" className={styles.logo} src={require('../assets/logo.svg')} />
              <span className={styles.title}>{setting.get('name')}登录</span>
            </Link>
          </div>
          <div className={styles.desc}>{setting.get('description')}</div>
        </div>
        {children}
      </div>
      <GlobalFooter
        links={links}
        copyright={
          <span>
            Copyright <Icon type="copyright" /> {setting.get('copyright')}
          </span>
        }
      />
    </div>
  );
};

export default connect(state => ({ setting: state.app.setting }))(UserLayout);

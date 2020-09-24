import * as React from 'react';
import classNames from 'classnames';
import styles from './index.less';
import { Icon } from 'antd';

export default ({ checked, style = {}, onClick = () => {} }) => (
  <div
    onClick={onClick}
    style={style}
    className={classNames(styles.circle, {
      [styles.active]: checked,
    })}>
    {checked && <Icon type="check" style={{ color: 'white', fontSize: 18 }} />}
  </div>
);

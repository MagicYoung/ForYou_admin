import * as React from 'react';
import styles from './index.less';
import classNames from 'classnames';

export default function Button({ className = '', children, ...restProps }) {
  return (
    <div {...restProps} className={classNames(styles.button, className)}>
      {children}
    </div>
  );
}

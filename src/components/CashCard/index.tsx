import * as React from 'react';
import styles from './index.less';
import classNames from 'classnames';

export default function CashCard({
  value,
  showButton,
  disabled,
  onlyPhone,
  phoneCardNo = '',
  phoneCardPwd = '',
}) {
  return (
    <div className={classNames(styles.card, { [styles.disabled]: disabled })}>
      <div className={styles.header}>
        <div className={styles.label}>现金卡</div>
        {!disabled && <div className={styles.valid}>2021年12月31日到期</div>}
      </div>
      <div className={styles.content}>
        <span>
          ¥ <span>{value} </span>
        </span>
        <div className={styles.tip}>
          {phoneCardNo && phoneCardPwd ? (
            <React.Fragment>
              <p>卡号: {phoneCardNo} </p>
              <p>卡密: {phoneCardPwd} </p>
            </React.Fragment>
          ) : (
            '仅可购买指定类目商品（部分特殊特殊商品除外），特殊商品以卡背面使用说明为准'
          )}
          {showButton && (
            <div className={styles.use}>
              {disabled ? '已使用' : onlyPhone ? '仅电话订购' : '立即使用'}
            </div>
          )}
        </div>
      </div>
      <div className={styles.circleLeft} />
      <div className={styles.circleRight} />
    </div>
  );
}

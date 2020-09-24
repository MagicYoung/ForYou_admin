import * as React from 'react';
import styles from './index.less';

function ZeroPadding(num: number) {
  const str = num.toString();
  if (str.indexOf('.') > -1) {
    return { c: str.substring(0, str.indexOf('.')), s: str.substring(str.indexOf('.') + 1, str.length) }
  } else {
    return { c: str, s: 0 }
  }
}

function CakeItem({ item, onClick, onCartClick }) {
  return (
    <div className={styles.item}>
      <div className={styles.cover} onClick={onClick}>
        <img src={item.get('carouselImgs')[0].url + '?imageView/2/w/512/h/512/q/100/format/png'} />
      </div>
      <div className={styles.content}>
        <div className={styles.titleEN}>{item.get('fName')}</div>
        <div className={styles.title}>{item.get('name')}</div>
        <div className={styles.price}>
          <span className={styles.nPrice}>{`¥` + ZeroPadding(item.get('specs')[0].price).c}.</span>
          <span style={{fontSize:12,fontWeight:'bold'}}>{ ZeroPadding(item.get('specs')[0].price).s}</span>
        </div>
        {/* <div className={styles.cart} onClick={onCartClick}>
          <img src={require('../../assets/cart.png')} />
        </div> */}
      </div>
    </div>
  );
}

export default CakeItem;

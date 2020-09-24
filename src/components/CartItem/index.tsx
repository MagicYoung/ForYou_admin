import * as React from 'react';
import styles from './index.less';
import Check from '../Check';
import { Stepper } from 'antd-mobile';

function CartItem({ checked = false, onCheck = null, data, isEdit = false, onNumChange = null, style }) {
  data.get =
    data.get ||
    function (key) {
      return data[key];
    };
  const product = data.get('product');
  product.get =
    product.get ||
    function (key) {
      return product[key];
    };
  return (
    <div className={styles.item} style={...style}>
      {!!onCheck && <Check checked={checked} onClick={onCheck} />}
      <img className={styles.cover} src={product.get('carouselImgs')[0].thumbUrl} />
      {isEdit ? <Stepper
        showNumber={true}
        defaultValue={data.get('num')}
        min={1}
        onChange={(val) => { onNumChange(val, data.id) }}
      /> :
        <div className={styles.info}>
          <div className={styles.name}>{product.get('name')} </div>
          <div className={styles.fName}>{product.get('fName')}</div>
          <div className={styles.price}>
            ¥ {data.get('spec').price}
            <span>
              {data.get('spec').specsName} x {data.get('num')}
            </span>
          </div>

        </div>}
    </div>
  );
}

export default CartItem;

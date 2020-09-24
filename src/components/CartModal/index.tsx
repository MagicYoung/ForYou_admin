import * as React from 'react';
import { Modal, Picker, List, Stepper, Icon } from 'antd-mobile';
import styles from './index.less';
import Button from '../Button';
const StepperNorm: any = Stepper;

function CartModal({ visible, onClose, product, onSpecChange, onNumChange, onAddCart }) {
  const header = product && (
    <div className={styles.modalHeader}>
      <img className={styles.cover} src={product.get('carouselImgs')[0].url} />
      <div className={styles.content}>
        <div className={styles.title}>{product.get('name')}</div>
        <div className={styles.titleEN}>{product.get('fName')}</div>
        <span className={styles.price}>
          {product.get('specs')[0].oPrice ? (
            <React.Fragment>
              <span className={styles.delete}>{`¥ ` + product.get('specs')[0].oPrice}</span>
              <span className={styles.nPrice}>{`¥ ` + product.get('specs')[0].price}</span>
            </React.Fragment>
          ) : (
              `¥ ` + product.get('specs')[0].price
            )}
        </span>
      </div>
      <Icon type="close" style={{ fontSize: 18 }} onClick={onClose} />
    </div>
  );

  return (
    <Modal popup={true} visible={visible} onClose={onClose} animationType="slide-up">
      {/* 
      // @ts-ignore */}
      <List renderHeader={header} className="popup-list">
        {product && (
          <React.Fragment>
            <Picker
              cols={1}
              data={product.get('specs').map(i => {
                return {
                  value: i.specsName,
                  label: i.specsName,
                }
              })}
              onChange={onSpecChange}
              value={[product.spec ? product.spec.specsName : product.get('specs')[0].specsName]}>
              <List.Item arrow="horizontal">规格选择</List.Item>
            </Picker>
            <List.Item
              wrap={true}
              extra={
                <StepperNorm
                  style={{ width: '100%', minWidth: '100px' }}
                  showNumber={true}
                  min={1}
                  value={product.cartNum || 1}
                  onChange={onNumChange}
                />
              }>
              数量选择
            </List.Item>
          </React.Fragment>
        )}
        <List.Item>
          <Button onClick={onAddCart}>加入购物车</Button>
        </List.Item>
      </List>
    </Modal >
  );
}

export default CartModal;

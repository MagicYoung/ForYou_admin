import * as React from 'react';
import { connect } from 'react-redux';
import styles from './Cakes.less';
import CakeItem from '@/components/CakeItem';
import router from 'umi/router';
import CartModal from '@/components/CartModal';
import withScrollTop from '@/utils/withScrollTop';
import { Empty } from 'antd';
interface CakesProps extends State.HomeState, ReduxComponentProps {
  location: any;
}

@(withScrollTop('cakes-container') as any)
class Cakes extends React.Component<CakesProps> {
  state = {
    visible: false,
    currentProduct: null,
  };
  componentDidMount() {
    const { location, products } = this.props;
    if ((location.state && location.state.all) || products.length === 0) {
      this.props.dispatch({ type: 'home/queryProducts' });
    }
  }
  onSpecChange = value => {
    this.setState((state: any) => {
      state.currentProduct.spec = state.currentProduct
        .get('specs')
        .find(i => i.weight === value[0]);
      return state;
    });
  };

  onNumChange = value => {
    this.setState((state: any) => {
      state.currentProduct.cartNum = value;
      return state;
    });
  };
  onProductClick(item: AV.Object) {
    router.push({
      pathname: `/product/${item.id}`,
    });
  }
  onAddCart = async () => {
    const { currentProduct } = this.state;
    const ret = await this.props.dispatch({
      type: 'order/addToCart',
      payload: currentProduct,
    });
    if (ret) {
      this.setState({
        visible: false,
      });
    }
  };
  onCartClick = item => {
    this.setState({
      visible: true,
      currentProduct: item,
    });
  };
  render() {
    const { products } = this.props;
    return (
      <React.Fragment>
        <div id="cakes-container" className={styles.container}>
          {products.length > 0 ? (
            products.map((item, index) => (
              <CakeItem
                key={index}
                item={item}
                onClick={this.onProductClick.bind(this, item)}
                onCartClick={this.onCartClick.bind(this, item)}
              />
            ))
          ) : (
              <Empty
                style={{
                  width: '100%',
                  height: 400,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'column',
                }}
              />
            )}
        </div>
        <CartModal
          visible={this.state.visible}
          onClose={() =>
            this.setState({
              visible: false,
            })
          }
          product={this.state.currentProduct}
          onNumChange={this.onNumChange}
          onSpecChange={this.onSpecChange}
          onAddCart={this.onAddCart}
        />
      </React.Fragment>
    );
  }
}

export default connect(state => ({
  ...state.home,
}))(Cakes);

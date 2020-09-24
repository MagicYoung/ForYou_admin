import * as React from 'react';
import { connect } from 'react-redux';
import styles from './index.less';
import CakeItem from '@/components/CakeItem';
import router from 'umi/router';
import CartModal from '@/components/CartModal';
import withScrollTop from '@/utils/withScrollTop';
import { Empty } from 'antd';
import { Toast } from 'antd-mobile';
import PorductfFlter from '@/components/PorductfFlter'
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

    Toast.loading('正在加载..');
    const { location } = this.props;
    this.props.dispatch({ type: 'home/queryProductsbyQuery', payload: { condition: location.query } });
    // if ((location.state && location.state.all) || products.length === 0) {
    //   this.props.dispatch({ type: 'home/queryProducts' });
    // }
    Toast.hide();
  }
  onSpecChange = value => {
    this.setState((state: any) => {
      state.currentProduct.spec = state.currentProduct
        .get('specs')
        .find(i => {
          return i.specsName === value[0]
        });
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
  onFlter = async (val, otherVal) => {
    Toast.loading('正在加载..');
    const { location } = this.props;
    if (this.props.products.length === 0) return;
    let productData = [...this.props.products];
    switch (val) {
      case 'all':
        await this.props.dispatch({ type: 'home/queryProductsbyQuery', payload: { condition: location.query } });
        productData = [...this.props.products];
        break;
      case 'new':
        //productData = [...products];
        break;
      case 'price_up':
        productData = [...this.props.products];
        productData.sort((a, b) => {
          return a.get('specs')[0].price - b.get('specs')[0].price
        })
        break;
      case 'price_down':
        productData = [...this.props.products];
        productData.sort((a, b) => {
          return b.get('specs')[0].price - a.get('specs')[0].price
        })
        break;
      default:
        await this.props.dispatch({ type: 'home/queryProductsbyQuery', payload: { condition: location.query } });
        if (otherVal) {
          productData = [];
          const priceArr = otherVal.split('-')
          this.props.products.map((item) => {
            if (priceArr.length > 1) {
              if (item.get('specs')[0].price >= parseFloat(priceArr[0]) && item.get('specs')[0].price <= parseFloat(priceArr[1])) {
                productData.push(item)
              }
            } else {
              if (item.get('specs')[0].price >= parseFloat(priceArr[0])) {
                productData.push(item)
              }
            }
          })
        }else{
          productData = [...this.props.products];
        }

        break
    }
    this.props.dispatch({ type: 'home/save', payload: { products: productData } });

    Toast.hide();
  }
  render() {
    const { products } = this.props;
    return (
      <React.Fragment>
        <PorductfFlter
          onItemClick={(val, otherVal = '') => {
            console.log(val)
            this.onFlter(val, otherVal)
          }}
        />
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

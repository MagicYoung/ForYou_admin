import * as React from 'react';
import { connect } from 'react-redux';
import { RouteComponentProps } from 'react-router';
import * as AV from 'leancloud-storage';
import styles from './$id.less';
import { Empty, Icon, List, Avatar, Divider,Badge } from 'antd';
import classNames from 'classnames';
import Button from '@/components/Button';
import router from 'umi/router';
import Zmage from 'react-zmage';
import { Toast, Accordion, Carousel } from 'antd-mobile';
import CakeItem from '@/components/CakeItem';
import $ from 'jquery';

interface ProductProps
  extends State.HomeState,
  ReduxComponentProps,
  RouteComponentProps<{ id?: string }> { }

class Product extends React.Component<ProductProps> {
  state = {
    product: null,
    oProduct: null,
    activeSpec: 0,
    activeTab: 0,
    youMayLike: [],
    carouselIndex: 1,
  };

  async componentDidMount() {
    Toast.loading('正在加载..');
    await this.getProduct(this.props.match.params.id);
    await this.getYouMayLike(this.props.match.params.id);
    Toast.hide();
  }
  getYouMayLike = async (id) => {
    const queryProduct = new AV.Query('Product');
    queryProduct.limit(6);
    queryProduct.notEqualTo('objectId', id);
    const dataProduct = await queryProduct.find();
    this.setState({ youMayLike: dataProduct });
  }

  getProduct = async (id) => {
    const query = new AV.Query('Product');
    const product = await query.get(id);
    this.setState({ product: product.toJSON(), oProduct: product });
  }

  onAddCart = async () => {
    const { oProduct, activeSpec } = this.state;
    oProduct.cartNum = 1;
    oProduct.spec = oProduct.get('specs')[activeSpec];
    await this.props.dispatch({
      type: 'order/addToCart',
      payload: oProduct,
    });
  };

  onValidate = () => {
    if (!AV.User.current()) {
      router.push({
        pathname: '/signin',
        state: {
          tip: '当前还未登录，请先登录',
        },
      });
    } else {
      this.onAddCart();
    }
  };

  onBuy = async () => {
    await this.onAddCart();
    router.goBack();
    setTimeout(() => {
      router.replace('/cart');
    }, 500);
  };
  AccordionPanelHeader = (text: string) => {
    return <span className={styles.accordionPanelHeader}>{text}</span>
  }
  renderItem = item => {
    return (
      <List.Item style={{ padding: 12 }}>
        <List.Item.Meta
          avatar={
            <Avatar style={{ backgroundColor: '#fadb14' }} size="small">
              v{item.level}
            </Avatar>}
          title={
            <span>
              会员:{item.phone}
              <span style={{ fontSize: 12, color: '#ccc', marginLeft: 20 }}>{item.date}</span>
            </span>
          }
          description={
            <div>
              {item.content}
              <div className={styles.commentImgs}>
                {item.imgs.map((i, index) => (
                  <Zmage src={i.url} key={index} className={styles.commentImg} />
                ))}
              </div>
            </div>
          }
        />
      </List.Item>
    );
  };
  getDefaultActiveKey = () => {
    const { product } = this.state;
    let arr = [];
    if (product.otherContent && product.otherContent.length) {
      product.otherContent.map((item) => {
        if (item.otherContentShow === 'true') {
          arr.push(item.otherContentTitle);
        }
      })
    }
    return arr;
  }

  render() {
    const { product, activeSpec } = this.state;
    const { AVCategories } = this.props;
    const spec = product && product.specs[activeSpec];
    return (
      <React.Fragment >
        {product ? (
          <div id="product-container" className={styles.container}>
            <div className={styles.banner}>
              <Carousel
                dots={false}
                infinite
                autoplay
                beforeChange={(from, to) => {
                  this.setState({ carouselIndex: to + 1 })
                }}
              >
                {product.carouselImgs.map((item, index) => {
                  return (
                    <div key={index} className={styles.item}>
                      <img src={item.url} />
                    </div>
                  );
                })}
              </Carousel>
              <div className={styles.carouselIndex}><span >{this.state.carouselIndex}</span>/{product.carouselImgs.length} </div>
            </div>
            <div className={styles.proName}>
              <div style={{ fontSize: 15, fontWeight: '500' }}> {product.fName}</div>
              <div> {product.name}</div>
            </div>
            {
              product.specs.length > 1 &&
              <div className={styles.specs}>
                {product.specs.map((item, index) => {
                  return (
                    <div
                      onClick={() => this.setState({ activeSpec: index })}
                      key={index}
                      className={classNames(styles.item, {
                        [styles.active]: activeSpec === index,
                      })}>
                      <div className={styles.num}>{item.specsName}</div>
                      {
                        item.weight &&
                        <div className={styles.num}>({parseFloat(item.weight).toFixed(1) }磅)</div>
                      }
                      {
                        item.personNum &&
                        <div className={styles.num}>{item.personNum}人食</div>
                      }
                    </div>
                  );
                })}
              </div>
            }
            <div className={styles.price}>
              <React.Fragment>
                <span className={styles.nPrice}>{`¥` + spec.price + '.0'}</span>
                {
                  spec.oPrice &&
                  <span className={styles.delete}>{`¥` + spec.oPrice + '.0'}</span>
                }
              </React.Fragment>
            </div>
            {
              product.isCakes &&
              <div className={styles.specInfo}>
                <div className={styles.item}>
                  <img src={require('../../assets/time.svg')} />
                  提前{spec.bookTime}小时预约
                </div>
                <div className={styles.item}>
                  <img src={require('../../assets/cake.svg')} />
                  {spec.size}
                </div>
                <div className={styles.item}>
                  <img src={require('../../assets/fork.svg')} />
                  标准餐具x{spec.cutleryNum}
                </div>
              </div>
            }
            {
              product.description && <div className={styles.description} style={{ borderBottom: 'none' }}>
                <div className={styles.cn}>{product.description}</div>
              </div>
            }
            <div style={{ padding: 10, fontSize: 18, color: '#000', fontWeight: 'bolder' }}>
              商品详情
            </div>
            <React.Fragment>
              {
                product.detailDescription && <div className={styles.description}>
                  <div className={styles.cn} dangerouslySetInnerHTML={{
                    __html: product.detailDescription
                  }} ></div>
                </div>
              }
              <div className={styles.detail}>
                {product.detailImgs.map((i, index) => (
                  <img src={i.url} className={styles.img} key={index} />
                ))}
              </div>
            </React.Fragment>

            <div>
              {
                product.otherContent &&
                <Accordion defaultActiveKey={this.getDefaultActiveKey()} >
                  {
                    product.otherContent.map((item) => {
                      return (
                        <Accordion.Panel header={this.AccordionPanelHeader(item.otherContentTitle)} key={item.otherContentTitle}>
                          <div className={styles.description}>
                            <div
                              className={styles.en}
                              dangerouslySetInnerHTML={{
                                __html: item.otherContentText
                              }}></div>
                          </div>
                        </Accordion.Panel>
                      )
                    })
                  }
                </Accordion>
              }
              <div className={styles.tags}>
                {product.tags.map((i, index) => {
                  const category = AVCategories.find(j => j.id === i.objectId);
                  return (
                    <div className={styles.item} key={index}
                      onClick={() => {
                        if (category)
                          router.push({
                            pathname: '/productMall',
                            query: {
                              tags: category.id,
                            }
                          })
                      }}
                    >
                      {category && category.get('name')}
                    </div>
                  );
                })}
              </div>
              <div style={{ marginTop: 20 }}>
                <div className={styles.rTip}>猜你喜欢</div>
                <div className={styles.recommend}>
                  {this.state.youMayLike.map((item, index) => (
                    <CakeItem
                      key={index}
                      item={item}
                      onClick={async () => {
                        Toast.loading('正在加载..');
                        this.getProduct(item.id)
                        await this.getYouMayLike(item.id);
                        router.replace({
                          pathname: `/product/${item.id}`,
                        });
                        $(`#product-container`).scrollTop(0);
                        Toast.hide();
                      }}
                      onCartClick={this.onAddCart.bind(this, item)}
                    />
                  ))}
                </div>
              </div>


            </div>

            <Divider>
              <span style={{ fontSize: 12, color: '#333' }}>到底部啦</span>
            </Divider>
            <div className={styles.tabBar}>
              <div>
                <Badge
                  count={this.props.cartNum}
                  style={{ backgroundColor: '#000', color: '#fff' }}
                  offset={[-7, 3]}
                  onClick={this.toCart}
                >
                  <Icon
                    // className={styles.search}
                    onClick={() => {
                      router.push('/cart');
                    }}
                    type={'shopping-cart'}
                    style={{ color: '#000000', fontSize: 30 }}
                  />
                </Badge>
              </div>
              <div className={styles.tabBarButton}>
                <div className={styles.button}>
                  <Button onClick={this.onValidate} className={styles.cart}>
                    加入购物车
                </Button>
                </div>
                <div className={styles.button}>
                  <Button onClick={this.onBuy} className={styles.buy}>立即购买</Button>
                </div>
              </div>
            </div>

          </div>

        ) : (
            <Empty style={{ width: '100%' }} />
          )}
      </React.Fragment>
    );
  }
}

export default connect(state => ({
  AVCategories: state.home.AVCategories,
  cartNum: state.home.cartNum
}))(Product);

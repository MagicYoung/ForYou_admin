import React from 'react';
import Redirect from 'umi/redirect';
export default () => <Redirect to="/admin/order" />;

// import * as React from 'react';
// import styles from './index.less';
// import { connect } from 'react-redux';
// import { Skeleton, Divider, Row, Col } from 'antd';
// import { Carousel } from 'antd-mobile'
// import { BannerType } from '@/constants';
// import router from 'umi/router';
// import withScrollTop from '@/utils/withScrollTop';
// import * as AV from 'leancloud-storage';

// interface IndexPageProps extends State.HomeState, ReduxComponentProps {
//   disableClick?: boolean;
// }

// const middleBar = [
//   { icon: require('../assets/new.png'), text: '上新', link: '/productMall?isNew=true' },
//   { icon: require('../assets/hot.png'), text: '热销', link: '/productMall?isHot=true' },
//   { icon: require('../assets/recommend.png'), text: '为您推荐', link: '/productMall?isRecommend=true' },
//   { icon: require('../assets/card1.png'), text: '绑定卡券', link: '/userCardCoupon' },
// ]

// @connect(state => ({
//   ...state.home,
//   loading: state.loading.effects['home/getHomeData'],
// }))
// @(withScrollTop('index-container') as any)
// export default class IndexPage extends React.Component<IndexPageProps> {
//   state = {
//     visible: false,
//     currentProduct: null,
//     homeShopData: []
//   };


//   async componentDidMount() {
//     // console.log(this.props.location.query)
//     this.props.designs.length === 0 &&
//       this.props.banners.length === 0 &&
//       this.props.dispatch({ type: 'home/getHomeData' });
//     this.onSearchHomeShop();
//   }
//   onSearchHomeShop = async () => {
//     const query = new AV.Query('HomeShop');
//     query.include('category');
//     query.include('products');
//     query.ascending('no');
//     const homeShops = await query.find();
//     this.setState({
//       homeShopData: homeShops
//     });
//   }
//   onSpecChange = value => {
//     this.setState((state: any) => {
//       state.currentProduct.spec = state.currentProduct
//         .get('specs')
//         .find(i => {
//           return i.specsName === value[0]
//         });
//       return state;
//     });
//   };

//   onNumChange = value => {
//     this.setState((state: any) => {
//       state.currentProduct.cartNum = value;
//       return state;
//     });
//   };

//   onAddCart = async () => {
//     const { currentProduct } = this.state;
//     const ret = await this.props.dispatch({
//       type: 'order/addToCart',
//       payload: currentProduct,
//     });
//     if (ret) {
//       this.setState({
//         visible: false,
//       });
//     }
//   };

//   onBannerClick(item: AV.Object) {
//     if (
//       this.props.disableClick ||
//       (!item.get('product') && item.get('type') === BannerType.Product)
//     )
//       return;
//     if (item.get('type') === BannerType.Product) {
//       router.push({
//         pathname: `/product/${item.get('product').id}`,
//       });
//     } else if (item.get('type') === BannerType.Url) {
//       const url: string = item.get('url');
//       if (url.startsWith('http')) {
//         window.location.href = item.get('url');
//       } else {
//         router.push(url);
//       }
//     }
//   }

//   onProductClick(item: AV.Object) {
//     if (this.props.disableClick) return;
//     router.push({
//       pathname: `/product/${item.id}`,
//     });
//   }

//   onCartClick(item) {
//     this.setState({
//       currentProduct: item,
//       visible: true,
//     });
//   }

//   render() {
//     const { banners, designs, loading } = this.props;
//     if (loading && banners.length === 0 && designs.length === 0) {
//       return (
//         <div className={styles.skeleton}>
//           {Array(6)
//             .fill(1)
//             .map((i, index) => (
//               <Skeleton key={index} title={false} active={true} />
//             ))}
//         </div>
//       );
//     }
//     return (
//       <div id="index-container" className={styles.container}>
//         <div className={styles.banner}>
//           <Carousel autoplay autoplayInterval={2000} infinite>
//             {banners.map((item, index) => {
//               return (
//                 <div
//                   onClick={this.onBannerClick.bind(this, item)}
//                   key={index}
//                   className={styles.item}
//                 >
//                   <img src={(item.get('cover') as AVImg).url} />
//                 </div>
//               );
//             })}
//           </Carousel>
//         </div>
//         <div className={styles.middleBar}>
//           <Row gutter={24}>
//             {
//               middleBar.map((item: any, index) => {
//                 return (
//                   <Col key={index} span={8} className={styles.col} onClick={() => {
//                     router.push(item.link)
//                   }}>
//                     <div className={styles.iconDiv}>
//                       <img className={styles.icon} src={item.icon} /></div>
//                     <div>{item.text}</div>
//                   </Col>
//                 )
//               })
//             }
//           </Row>
//         </div>
//         {
//           this.state.homeShopData.length &&
//           <div className={styles.designHomeShopC}>
//             <div className={styles.topTitle}>
//               <img width="100%" src={require('../assets/homeShop.jpg')} />
//             </div>
//             <div className={styles.designHomeShop}>
//               {
//                 this.state.homeShopData.map((item, index) => {
//                   if (!item.get('products') || !item.get('category')) return null
//                   return (
//                     <div key={index} className={styles.item} onClick={() => {
//                       router.push({
//                         pathname: `/product/${item.get('products').id}`,
//                       });
//                     }}>
//                       <img src={item.get('products').get('carouselImgs')[0].url} />
//                       <div className={styles.title}>{item.get('title')}</div>
//                     </div>
//                   )
//                 })
//               }
//               <div>
//                 <div onClick={() => {
//                   router.push('/productMall?isNew=true');
//                 }} className={styles.seeMore}>查看更多  ></div>
//               </div>
//             </div>
//           </div>

//         }
//         {
//           designs.length > 0 &&
//           <div className={styles.designP}>
//             {designs?.map((item, index) => {
//               if (item.get('category')[0].get('icon')) {
//                 return (
//                   <div
//                     className={styles.designPItem}
//                     key={index}
//                     onClick={() => {
//                       router.push({
//                         pathname: 'productMall',
//                         query: {
//                           tags: item.get('category')[0].id,
//                         }
//                       })
//                     }}
//                   >
//                     <div className={styles.designPItemText}>
//                       <div>{item.get('name')}</div>
//                       <div>{item.get('fName')}</div>
//                     </div>
//                     <div>
//                       <img width="100%" src={item.get('category')[0].get('icon').url} />
//                     </div>
//                   </div>)

//               }
//               else return null
//             })}
//           </div>
//         }

//         < Divider >
//           <span style={{ fontSize: 12, color: '#333' }}>到底部啦</span>
//         </Divider>
//       </div >
//     );
//   }
// }

import * as React from 'react';
import styles from './Recommend.less';
import { connect } from 'react-redux';
import { Skeleton, Icon, Divider } from 'antd';
import { Carousel } from 'antd-mobile'
import router from 'umi/router';
import withScrollTop from '@/utils/withScrollTop';
import * as AV from 'leancloud-storage';

interface IndexPageProps extends State.HomeState, ReduxComponentProps {
    disableClick?: boolean;
}

@connect(state => ({
    ...state.home,
}))
@(withScrollTop('index-container') as any)
export default class IndexPage extends React.Component<IndexPageProps> {
    state = {
        currentProduct: [],
        banners: [],
        loading: false,
        userCardArr: [],
    };

    async componentDidMount() {
        //获取当前user已绑定的卡券的所有的类型
        this.setState({ loading: true })
        const queryUserCard = new AV.Query('CardCoupon');
        queryUserCard.equalTo('user', AV.User.current());
        queryUserCard.equalTo('isActivation', true);
        queryUserCard.include('cardCouponCategory');
        const ret = await queryUserCard.find();
        let userCardArr: any[] = []
        ret.map((item) => {
            const cc = item.get('cardCouponCategory')
            if (!userCardArr.find((c) => { return c.id === cc.id })) {
                userCardArr.push(item.get('cardCouponCategory'))
            }
        })
        //如果当前用户有绑定卡，那么查询绑定了所有卡型的热销或推荐的商品，如果没有就查询所有的热销或推荐的商品
        const isHotQuery = new AV.Query('Product');
        isHotQuery.equalTo('isHot', true);
        const isRecommendQuery = new AV.Query('Product');
        isRecommendQuery.equalTo('isRecommend', true);
        const query = AV.Query.or(isHotQuery, isHotQuery);
        //ret.length > 0 && query.containedIn('usableCards', userCardArr);
        query.include('usableCards')
        query.equalTo('active', true);
        const data = await query.find();
        const banners = [...data];
        banners.slice(0, 4);
        this.setState({ currentProduct: data, banners, loading: false, userCardArr })
    }



    onProductClick(item: AV.Object) {
        router.push({
            pathname: `/product/${item.id}`,
        });
    }
    renderRecommend = () => {
        const { currentProduct, userCardArr } = this.state;
        let proAarr: any[] = [];
        userCardArr.map((i: any) => {
            if (!proAarr.find((pa) => pa.type === i.get('type'))) {
                proAarr.push({
                    type: i.get('type'),
                    proItem: currentProduct.filter((pro: any) => {
                        return pro.get('usableCards')&& pro.get('usableCards').filter((uc: any) => uc.get('type') === i.get('type')).length > 0
                    })
                });
            }
        })
        if (userCardArr.length === 0) {
            return null
        } else {
            return (
                proAarr.length?<div >
                <div className={styles.title}>
                    <Icon type="like" />
                    <span style={{ marginLeft: 5 }}>为您推荐</span>
                </div>
                {
                    proAarr.map((item: any) => {
                        const title = item.type === 'A' ? '品牌电子券' : (item.type === 'F' ? '精选N+1' : '每日精选');
                        return (
                            <div key={item.type} style={{ marginTop: 10, padding: '0 10px' }}>
                                <div><span style={{ color: '#000', fontSize: 12 }}>{title}</span></div>
                                <div style={{ width: '100%', overflowX: 'scroll', marginTop: 10 }}>
                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                        {
                                            item.proItem.map((proItem: any, index) => {
                                                return <img
                                                    key={index}
                                                    className={styles.recommendImg}
                                                    src={proItem.get('carouselImgs')[0].url}
                                                    onClick={() => {
                                                        router.push({
                                                            pathname: `/product/${proItem.id}`,
                                                        });
                                                    }}
                                                />
                                            })
                                        }
                                    </div>
                                </div>
                            </div>
                        )
                    })
                }
            </div>:null)

        }
    }
    render() {
        const { banners, currentProduct } = this.state;
        if (this.state.loading && !currentProduct.length) {
            return (
                <div className={styles.skeleton}>
                    {Array(6)
                        .fill(1)
                        .map((i, index) => (
                            <Skeleton key={index} title={false} active={true} />
                        ))}
                </div>
            );
        }

        return (
            <div id="index-container" className={styles.container}>
                <div className={styles.banner}>
                    <Carousel autoplay autoplayInterval={2000} infinite>
                        {banners.map((item, index) => {
                            return (
                                <div
                                    onClick={this.onProductClick.bind(this, item)}
                                    key={index}
                                    className={styles.item}
                                >
                                    <img src={(item.get('carouselImgs')[0] as AVImg).url} />
                                </div>
                            );
                        })}
                    </Carousel>
                </div>
                {this.renderRecommend()}
                <div>
                    <div className={styles.title}>
                        <Icon type="fire" />
                        <span>最近热销</span>
                    </div>

                    <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', width: '100%', justifyContent: 'space-between', padding: '0 10px' }}>
                        {
                            currentProduct.filter((item: any) => item.get('isHot')).map((hot: any) => {
                                return (
                                    <div
                                        key={hot.id}
                                        style={{ width: '49%', marginBottom: 10, position: 'relative' }}
                                        onClick={() => {
                                            router.push({
                                                pathname: `/product/${hot.id}`,
                                            });
                                        }}
                                    >
                                        <img className={styles.hotImg} src={hot.get('carouselImgs')[0].url} />
                                        <div className={styles.transparentFrame}>
                                            <span style={{ fontSize: 12 }}>{hot.get('name')}</span>
                                            <span style={{ fontSize: 18, marginLeft: 5 }}>￥{hot.get('specs')[0].price}</span>
                                        </div>
                                    </div>)
                            })
                        }
                    </div>
                </div>
                <Divider>
                    <span style={{ fontSize: 12, color: '#333' }}>到底部啦</span>
                </Divider>
            </div>
        );
    }
}

import * as React from 'react';
import { Map } from 'react-amap';
import { mapData } from '@/config/mapData';
import { Input, Modal } from 'antd';
import styles from './index.less';
const { Search } = Input
const ZoomCtrl = (props) => {
    const map = props.__map__;
    if (!map) {
        return;
    }
    const onSearch = async (value: string) => {
        props.onSearch && props.onSearch(value);
    }

    return (<div className={styles.searchContainer}>
        <Search
            placeholder="请输入您的收货地址(暂时只支持上海市)"
            onSearch={onSearch}
            style={{ width: '100%' }}
            enterButton="定位"
        />
    </div>);
};


export default class GMap extends React.Component {
    state = {
        searchValue: '',
    }

    map = null;
    polygon = null;
    marker: any = null;
    onCreated = (instance: any) => {
        this.map = instance;
        window.AMap.plugin('AMap.Geocoder', () => {
            const geocoder = new window.AMap.Geocoder();
            geocoder.getLocation('上海', async (status, result) => {
                if (status === 'complete' && result.info === 'OK') {
                    instance.setCenter(result.geocodes[0].location);
                    let pathArr = []
                    mapData.data.map((mdata) => {
                        let path = [];
                        mdata.points.map((item) => {
                            path.push(new AMap.LngLat(item.lng, item.lat))
                        })
                        pathArr.push(path)
                    })

                    const polygon = new AMap.Polygon({
                        path: pathArr,
                        fillColor: '#8FBC8F', // 多边形填充颜色
                        borderWeight: 1, // 线条宽度，默认为 1
                        strokeColor: '#3183fd', // 线条颜色
                        fillOpacity: 0.2
                    });

                    await instance.add(polygon);
                    this.polygon = polygon;
                    if ( this.props.locs) {
                        this.onSearch(this.props.locs);
                    }

                }
            });
        });
    }
    onSearch = (value) => {
        if (!value)
            return
        window.AMap.plugin('AMap.Autocomplete', () => {
            const atocomplete = new window.AMap.Autocomplete({
                city: '上海',
                citylimit: true,
            });
            atocomplete.search(value, (statu, info) => {
                if (statu === 'no_data') {
                    Modal.warning({
                        title: '错误提示',
                        content: '找不到输入的地址',
                    });
                    return false
                }
                const loc = [info.tips[0].location.lng, info.tips[0].location.lat];
                //判断是否在区域内
                let isPointInRing = false;
                mapData.data.map((m) => {
                    let pointsArr = [];
                    m.points.map((p) => {
                        pointsArr.push([parseFloat(p.lng), parseFloat(p.lat)]);
                    })
                    if (window.AMap.GeometryUtil.isPointInRing(loc, pointsArr)) {
                        isPointInRing = true;
                    }

                })
                // 创建一个 Marker 实例：
                if (this.marker) {
                    this.map.remove(this.marker);
                }
                this.marker = new AMap.Marker({
                    position: new AMap.LngLat(loc[0], loc[1]),   // 经纬度对象，也可以是经纬度构成的一维数组[116.39, 39.9]
                    title: info.tips[0].name
                });
                this.map.add(this.marker);
                this.map.setCenter(info.tips[0].location);

                if (!isPointInRing) {
                    Modal.warning({
                        title: '错误提示',
                        content: '地址不在配送范围内',
                    });

                }
                this.props.onSearch && this.props.onSearch(isPointInRing ? info.tips[0] : null);
            })
        })
    }
    render() {
        // const plugins = [
        //     {
        //         name: 'ToolBar',
        //         options: {
        //             visible: true,  // 不设置该属性默认就是 true
        //         },
        //     }
        // ]
        return (
            <div style={{ height: '100%', width: '100%', position: 'relative' }} >
                <Map
                    Mapkey={'6da00aa0a73494c120a130354edb4cbb'}
                    version="1.4.0"
                    // plugins={plugins}
                    events={{
                        created: this.onCreated,
                    }}
                    zoom={9}
                //center={{ longitude: 130, latitude: 30 }}
                >
                    <ZoomCtrl onSearch={this.onSearch} />
                </Map>
            </div>
        );
    }
}

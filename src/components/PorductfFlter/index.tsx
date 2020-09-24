import * as React from 'react';
import styles from './index.less';
import { Icon, Drawer, Tag } from 'antd';
import Button from '../Button'
const { CheckableTag } = Tag;
const fiterArr = [
    {
        title: '综合',
        value: 'all'
    },
    {
        title: '新品',
        value: 'new'
    },
    {
        title: '价格',
        value: 'price'
    },
    {
        title: '筛选',
        value: 'other'
    }
]
const otherCheckedData = [
    {
        lable: '0-100元',
        value: '0-100'
    },
    {
        lable: '100-200元',
        value: '100-200'
    },
    {
        lable: '200-300元',
        value: '200-300'
    },
    {
        lable: '大于300元',
        value: '300'
    }
]

export default class PorductfFlter extends React.Component {
    state = {
        curFlter: 'all',
        drawerVisible: false,
        otherChecked: '',
    };

    onItemClick = (val: string) => {
        let curFlter = val;
        if (val === 'price') {
            if (this.state.curFlter.indexOf('price') < 0) {
                curFlter = 'price_up'
            } else {
                if (this.state.curFlter === 'price_up') {
                    curFlter = 'price_down'
                } else {
                    curFlter = 'price_up'
                }
            }
        }
        if (curFlter !== this.state.curFlter) {
            this.setState({ curFlter: curFlter })
            if (curFlter === 'other') {
                this.setState({ drawerVisible: true })
            }
            else
                this.props.onItemClick && this.props.onItemClick(curFlter)
        }
    }
    onDrawerClose = () => {
        this.setState({ drawerVisible: false, curFlter: 'all' })
    }
    render() {
        return (
            <div className={styles.container}>
                {fiterArr.map((item) => {
                    return (
                        <div
                            className={styles.flterItem}
                            key={item.value}
                            onClick={() => this.onItemClick(item.value)}
                        >
                            <span className={this.state.curFlter.indexOf(item.value) > -1 ? styles.flterItemSelect : null}>{item.title}</span>
                            {
                                item.value === 'price' &&
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <Icon type="caret-up" style={{ fontSize: 8, color: this.state.curFlter === 'price_up' ? '#000000' : 'rgba(0, 0, 0, 0.1)' }} />
                                    <Icon type="caret-down" style={{ fontSize: 8, color: this.state.curFlter === 'price_down' ? '#000000' : 'rgba(0, 0, 0, 0.1)' }} />
                                </div>
                            }
                        </div>
                    )
                })}
                <Drawer
                    title={null}
                    placement="right"
                    //style={{ height: 'calc(100vh  - 48px)', position: 'absolute', bottom: '0', width: '100%' }}
                    drawerStyle={{ boxShadow: 'none', width: '100%' }}
                    maskStyle={{ backgroundColor: 'inherit' }}
                    bodyStyle={{ padding: 0 }}
                    closable={true}
                    width={'100%'}
                    onClose={this.onDrawerClose}
                    visible={this.state.drawerVisible}
                >
                    <div style={{ display: 'flex', width: '100%', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
                        <div className={styles.drawerConter}>
                            <div className={styles.title}>价格区间</div>
                            <div className={styles.content}>
                                {
                                    otherCheckedData.map((item) => {
                                        return (
                                            <CheckableTag
                                                checked={this.state.otherChecked === item.value}
                                                key={item.value}
                                                className={styles.tag}
                                                color="red"
                                                onChange={() => {
                                                    if (item.value === this.state.otherChecked) {
                                                        this.setState({ otherChecked: '' })
                                                    } else
                                                        this.setState({ otherChecked: item.value })
                                                }}
                                            >{item.lable}</CheckableTag>
                                        )
                                    })
                                }
                            </div>
                        </div>
                        <div style={{ display: 'flex', width: '100%' }}>
                            <div className={styles.button}>
                                <Button onClick={() => {
                                    this.setState({ otherChecked: '' })
                                }} className={styles.reset}>
                                    重置筛选项
                                    </Button>
                            </div>
                            <div className={styles.button}>
                                <Button onClick={() => {
                                    this.onDrawerClose();
                                    this.props.onItemClick('other', this.state.otherChecked)
                                }} className={styles.submit} >确定</Button>
                            </div>
                        </div>
                    </div>
                </Drawer>
            </div>
        );
    }
}

import * as React from 'react';
import {
    Card, Icon, Form,
    Input,
    Button,
    Select,
    Empty, Modal, DatePicker, Upload, InputNumber, Tag,
    message,
} from 'antd';
import * as AV from 'leancloud-storage';
import { connect } from 'react-redux';
import styles from './CardCouponCategory.less';
import { FormComponentProps } from 'antd/lib/form';
import { CardCouponCategory } from '@/AVObjects';
import { cardTypeList } from '@/config'
import {
    getUploadListItem,
    uploadFiles, getTree
} from '@/utils';
import { pull, cloneDeep } from 'lodash';
import moment from 'moment'
const dateFormat = 'YYYY-MM-DD';

interface CardCouponCategoryStates {
    searchText: string;
    searchCategory: AV.Queriable;
    data: AV.Queriable[];
    modalVisible: boolean;
    currentCard?: AV.Queriable;
    isSubmiting: boolean;
    categoryData: any[];
    originalCategoryData: any[];
    currProductData: any[];
    proLoading: boolean;
    selectProduct: any[];
}
interface Props extends FormComponentProps, State.AppState { }
@(Form.create() as any)
@connect(state => ({ adminRole: state.app.adminRole }))
export default class CardCouponCategoryPage extends React.Component<Props, CardCouponCategoryStates> {
    state = {
        searchText: '',
        searchCategory: '',
        data: [],
        modalVisible: false,
        currentCard: null,
        isSubmiting: false,
        categoryData: [],
        currProductData: [],
        originalCategoryData: [],
        proLoading: false,
        selectProduct: [],
    };
    async componentDidMount() {
        this.onSearch();
        const queryCategory = new AV.Query('Category');
        const res = await queryCategory.find();
        this.setState({
            originalCategoryData: res,
            categoryData: res.length > 0 ? getTree(res) : null,
        });
    }
    onSearch = async () => {
        const { searchText, searchCategory } = this.state;
        const query = new AV.Query('CardCouponCategory');
        query.include("category")
        query.include("products")
        searchCategory && query.equalTo('type', searchCategory);
        searchText && query.contains('cardName', searchText);
        const data = await query.find();
        this.setState({ data });
    };
    resetSearch = () => {
        this.setState({ searchCategory: null, searchText: '' }, this.onSearch);
    };
    renderCardOPtions = () => {
        return cardTypeList.map(i => {
            return (<Select.Option key={i} value={i.value}>{i.text}</Select.Option>)
        })
    }
    editCard = (id: string) => {
        const currentCard = this.state.data.filter((i: any) => { return i.id === id })[0];
        this.setState(
            {
                modalVisible: true,
                currentCard: currentCard,
                selectProduct: cloneDeep(currentCard.get('products')) || []
            },
            () => {
                const categoryIdArr = currentCard.get('category').map((cat) => cat.id);
                currentCard.get('category') && this.onCategoryDataChange(categoryIdArr)
            }
        )
    }
    renderCardList = () => {
        return this.state.data.map((item: any, index) => {
            const attributes = item.attributes;
            return (
                <Card
                    key={index}
                    hoverable
                    className={styles.card}
                    // style={{ width: 240 }}
                    cover={<img className={styles.cardImg} alt="example" src={attributes.cardImage[0].url} />}
                    actions={[
                        <Icon type="edit" key="edit" onClick={() => this.editCard(item.id)} />,
                        <Icon type="delete" key="delete" onClick={() => {
                            Modal.confirm({
                                title: '删除卡券',
                                content: '确认删除该卡券吗？？',
                                okText: '确认',
                                cancelText: '取消',
                                onOk: () => {
                                    this.onDelete(item.id);
                                },
                            });
                        }} />,
                        <Icon type="eye" key="eye" onClick={() => {
                            Modal.info({
                                title: '卡券id，卡券管理导入卡时需要绑定这个id',
                                content: (
                                    <div>
                                        <p>{item.id}</p>
                                    </div>
                                ),
                                onOk() { },
                            });
                        }} />
                    ]}
                >
                    <Card.Meta title={`${attributes.cardName}${attributes.type === 'A' ? '' : `(面值${attributes.cardPrice})`}(${cardTypeList.find((t => t.value = attributes.type)).text})`} description={<div>
                        <div>{attributes.cardDescription}</div>
                        <div>{`有效期：${attributes.effectiveStartDate} 到 ${attributes.effectiveEndDate}`}</div>
                    </div>} />
                </Card>
            );
        });
    }
    onEditCanceled = () => {
        const { currentCard } = this.state;
        if (currentCard) {
            // edit mode
            this.setState({
                modalVisible: false,
                currentCard: null,
            });
            this.onSearch();
        } else {
            // new mode
            this.setState({ modalVisible: false });
        }
    };
    onEditCard = (e: React.FormEvent) => {
        e.preventDefault();
        this.props.form.validateFields(async (err, fieldsValue) => {
            if (err) return;
            this.setState({ isSubmiting: true });
            const { currentCard, selectProduct } = this.state;
            const hideMessage = message.loading(`正在保存卡券类别...`, 0);
            try {

                // 先上传文件
                const cardImagesUploaded = await uploadFiles(fieldsValue['cardImage']);
                const cardObj: AV.Object = currentCard || new CardCouponCategory();
                const category = this.state.originalCategoryData.filter((item) => {
                    return fieldsValue.category.indexOf(item.id) > -1
                }) || [];

                //清除掉之前绑定了这个卡的商品的卡券数据
                let savaProduct_data = []
                if (selectProduct.length > 0) {
                    savaProduct_data = selectProduct;
                }
                if (category.length && selectProduct.length === 0) {
                    savaProduct_data = this.state.currProductData;

                }
                if (currentCard) {
                    const del_product = currentCard.get('products');
                    if (del_product && del_product.length > 0) {
                        del_product.map((del_item) => {

                            if (!savaProduct_data.find((s_d) => s_d.id === del_item.id)) {
                                const del_item_usableCards = del_item.get('usableCards') || [];
                                if (del_item_usableCards.length > 0) {
                                    const del_item_index = del_item_usableCards.findIndex((dii) => dii.id === currentCard.id);
                                    if (del_item_index > -1) {
                                        del_item_usableCards.splice(del_item_index, 1);
                                    }
                                }
                                const del_item_specs_usableCards = del_item.get('specs')[0].usableCards || [];
                                if (del_item_specs_usableCards.length > 0) {
                                    const del_item_spec_index = del_item_specs_usableCards.indexOf(currentCard.id);
                                    if (del_item_spec_index > -1) {
                                        del_item_specs_usableCards.splice(del_item_spec_index, 1);
                                    }
                                }
                            }
                        })
                        await AV.Object.saveAll(del_product);
                    }
                }

                for (const key in fieldsValue) {
                    if (key === 'cardImage') {
                        cardObj.set(key, cardImagesUploaded);
                    } else if (key === 'type') {
                        cardObj.set(key, fieldsValue[key]);
                    } else if (key === 'effectiveDate') {
                        cardObj.set('effectiveStartDate', moment(fieldsValue[key][0]).format(dateFormat));
                        cardObj.set('effectiveEndDate', moment(fieldsValue[key][1]).format(dateFormat));
                    }
                    else if (key === 'category') {
                        cardObj.set('category', (category.length && selectProduct.length === 0) ? category : []);
                    }
                    else if (key === 'products') {
                        cardObj.set('products', selectProduct.length > 0 ? selectProduct : null);
                    }
                    else if (!/(\d+)$/g.test(key)) {
                        // 非数字结尾的字段可以加入
                        cardObj.set(key, fieldsValue[key]);
                    }
                }
                const acl = new AV.ACL();
                acl.setPublicReadAccess(true);
                acl.setRoleWriteAccess(this.props.adminRole, true);
                cardObj.setACL(acl);
                // 保存
                const saveRes = await cardObj.save();
                //处理商品绑定的卡券的数据
                if (savaProduct_data) {
                    savaProduct_data.map((item) => {
                        const cc = !item.get('usableCards') ? [saveRes] : [...item.get('usableCards'), saveRes];
                        const item_specs_0 = item.get('specs')[0] || [];
                        if (!item_specs_0.usableCards || item_specs_0.usableCards.indexOf(saveRes.id) < 0) {
                            item.set('usableCards', cc);
                            item_specs_0.usableCards = item_specs_0.usableCards ? [...item_specs_0.usableCards, saveRes.id] : [saveRes.id];
                        }

                    })
                    await AV.Object.saveAll(savaProduct_data);
                }
                this.setState({ isSubmiting: false, modalVisible: false }, () => {
                    hideMessage();
                    this.onSearch();
                    this.props.form.resetFields();
                });
            } catch (err) {
                console.error(err);
                this.setState({ isSubmiting: false }, hideMessage);
                message.error('新增卡券类别失败！');
            }
        });
    }

    onDelete = async (id: string) => {
        const hideMessage = message.loading(`正在删除卡券类别...`, 0)
        const deleteObj: any = this.state.data.filter((i: any) => { return i.id === id })[0];

        const queryCard = new AV.Query('CardCoupon');
        queryCard.equalTo("cardCouponCategory", deleteObj);

        const resC = await queryCard.find();
        if (resC.length > 0) {
            message.error('无法删除，该类别已存在导入的卡券');
            hideMessage();
            return
        }
        //判断是否存在绑定的商品

        const queryPro = new AV.Query('Product');
        queryPro.containedIn('usableCards', [deleteObj])

        const resPro = await queryPro.find();
        if (resPro.length > 0) {
            message.error('无法删除，该类别已绑定商品');
            hideMessage();
            return
        }

        const query = new AV.Query('CardCouponRange');
        query.equalTo('cardCouponCategory', deleteObj)
        const res = await query.find();
        await AV.Object.destroyAll(res);
        await deleteObj.destroy();
        this.onSearch();
        hideMessage();
        message.success("已删除");
    }
    getInitValue = (key: string, defaultValue: any = '') => {
        const { currentCard } = this.state;
        const dateFormat = 'YYYY-MM-DD';
        const res = currentCard ? (
            key === 'effectiveDate' ? [moment(currentCard.get("effectiveStartDate"), dateFormat), moment(currentCard.get('effectiveEndDate'), dateFormat)] : currentCard.get(key)) : defaultValue;
        return res;
    };
    // 处理form中Upload的方法
    normFile = (e: any) => {
        if (Array.isArray(e)) {
            return e;
        }
        return e && e.fileList;
    };


    renderCategoryOptions = (data: any) => {
        // return null
        return data.map(i => {
            if (i.children) {
                return (
                    <Select.OptGroup key={i.id} label={i.get('name')}>
                        {this.renderCategoryOptions(i.children)}
                    </Select.OptGroup>
                );
            } else {
                return (
                    <Select.Option key={i.id} value={i.id}>
                        {i.get('name')}
                    </Select.Option>
                );
            }
        });
    };
    renderProOptions = () => {
        return this.state.currProductData.map(i => {
            return (<Select.Option key={i} value={i.id}>{i.get('name')}</Select.Option>)
        })
    }
    onCategoryDataChange = async (value: string) => {
        if (value.length === 0) return
        this.setState({ proLoading: true });
        const category = this.state.originalCategoryData.filter((item) => {
            return value.indexOf(item.id) > -1
        });
        const query = new AV.Query('Product');
        query.include('usableCards');
        query.containedIn('tags', category);

        const data = await query.find();
        this.setState({ currProductData: data, proLoading: false });
    }
    onProChange = (value: string) => {
        const curPro = this.state.currProductData.find((item) => { return item.id === value });
        if (!this.state.selectProduct.find((item) => item.id === value)) {
            this.setState({ selectProduct: [...this.state.selectProduct, curPro] });
        }
    }
    render() {
        const { getFieldDecorator, getFieldValue, setFieldsValue } = this.props.form;
        const { searchText, searchCategory, data, modalVisible, isSubmiting, currentCard } = this.state;
        const formItemLayout = {
            labelCol: {
                xs: { span: 6 },
                sm: { span: 6 },
            },
            wrapperCol: {
                xs: { span: 24 },
                sm: { span: 16 },
            },
        };
        return (
            <div className={styles.container}>
                <Form layout="inline" className={styles.searchForm}>
                    <Form.Item label="卡券名称" >
                        <Input
                            placeholder="请输入"
                            value={searchText}
                            onChange={e => this.setState({ searchText: e.target.value })}
                        />
                    </Form.Item>
                    <Form.Item label="类别">
                        <Select
                            style={{ width: 150 }}
                            value={searchCategory}
                            onChange={value =>
                                this.setState({
                                    searchCategory: value,
                                })
                            }>
                            {this.renderCardOPtions()}
                        </Select>
                    </Form.Item>
                    <Button type="primary" onClick={() => this.onSearch()} style={{ marginLeft: 16 }}> 查询 </Button>
                    <Button style={{ marginLeft: 8 }} onClick={this.resetSearch}> 重置 </Button>
                    <Button
                        type="primary"
                        icon="plus"
                        style={{ marginLeft: 16 }}
                        onClick={() => this.setState({ modalVisible: true, currentCard: null })}>
                        新增卡券
                    </Button>
                </Form>
                <div className={styles.dataContainer}>
                    {
                        data.length === 0 ? <div className={styles.empty}>
                            <Empty />
                        </div> :
                            this.renderCardList()
                    }
                </div>
                <Modal
                    bodyStyle={{ maxHeight: '80vh', overflowY: 'scroll' }}
                    style={{ top: 50 }}
                    title={currentCard ? '编辑卡券' : '新增卡券'}
                    visible={modalVisible}
                    footer={null}
                    onCancel={this.onEditCanceled}
                >
                    <Form layout="vertical" {...formItemLayout} onSubmit={this.onEditCard}>
                        <Form.Item label="卡券名称" colon >
                            {getFieldDecorator('cardName', {
                                initialValue: this.getInitValue('cardName'),
                                rules: [{ required: true, message: '请输入卡券名称' }],
                            })(<Input placeholder="请输入卡券名称" />)}
                        </Form.Item>
                        <Form.Item
                            label="卡券类别"
                            help={getFieldValue("type") ? cardTypeList.find((item) => item.value === getFieldValue("type")).description : ''}
                        >
                            {getFieldDecorator('type', {
                                initialValue: this.getInitValue('type'),
                                rules: [{ required: true, message: '请选择卡券类别' }],
                            })(<Select >{this.renderCardOPtions()}</Select>)}
                        </Form.Item>
                        <Form.Item label="卡券描述">
                            {getFieldDecorator('cardDescription', {
                                initialValue: this.getInitValue('cardDescription'),
                                rules: [{ required: true, message: '请输入卡券描述' }],
                            })(<Input.TextArea rows={3} placeholder="请输入卡券描述" />)}
                        </Form.Item>
                        <Form.Item label={'卡券面额'}>
                            {getFieldDecorator('cardPrice', {
                                initialValue: this.getInitValue('cardPrice'),
                                rules: [{ required: true, message: '请输入卡券面额' }],
                            })(<InputNumber
                                min={0}
                                max={getFieldValue("type") === 3 ? 1 : Infinity}
                                placeholder="请输入卡券面额"
                            />)}
                        </Form.Item>

                        <Form.Item label="有效日期">
                            {getFieldDecorator('effectiveDate', {
                                initialValue: this.getInitValue('effectiveDate'),
                                rules: [{ required: true, message: '请选择有效日期' }],
                            })(<DatePicker.RangePicker />)}
                        </Form.Item>
                        <div style={{ fontSize: 12 }}>如果不选择商品，则会绑定选择商品类别下的所有商品</div>
                        <Form.Item
                            label="绑定的商品类别"
                        >
                            {getFieldDecorator('category', {
                                initialValue: (currentCard && currentCard.get('category')) ? currentCard.get('category').map((cat) => cat.id) : [],
                            })(<Select mode="multiple" onChange={(value) => {
                                this.onCategoryDataChange(value);
                                setFieldsValue({
                                    products: ''
                                })
                            }} >{this.renderCategoryOptions(this.state.categoryData)}</Select>)}
                        </Form.Item>
                        <Form.Item
                            label="绑定的商品"
                        >
                            {getFieldDecorator('products', {

                            })(<Select loading={this.state.proLoading} onChange={(value) => {
                                this.onProChange(value);
                            }} >
                                {this.renderProOptions()}
                            </Select>)}
                            {
                                this.state.selectProduct.length > 0 &&
                                <div className={styles.productBox}>
                                    {
                                        this.state.selectProduct.map((i, index) => {
                                            return <Tag
                                                closable
                                                key={index}
                                                onClose={() => {
                                                    const { selectProduct } = this.state;
                                                    pull(selectProduct, i);
                                                    this.setState({ selectProduct })
                                                }}>
                                                {i.get('name')}
                                            </Tag>
                                        })
                                    }
                                </div>
                            }
                        </Form.Item>

                        <div style={{ fontSize: 12 }}>提示：默认将此类型的卡券设置为该商品的第一个规格的可用卡券 ，且在这里保存的商品会直接影响商品的可用卡券数据，但是在商品修改卡券数据不会对这里的数据造成影响</div>
                        <Form.Item label="卡券图片">
                            {getFieldDecorator('cardImage', {
                                valuePropName: 'fileList',
                                getValueFromEvent: this.normFile,
                                initialValue: currentCard
                                    ? currentCard.get('cardImage').map(getUploadListItem)
                                    : [],
                                rules: [{ required: true, message: '请上传卡券图片' }],
                            })(<Upload
                                accept="image/*"
                                listType="picture"
                            >
                                <Button>
                                    <Icon type="upload" /> 上传卡券图片
                                </Button>
                            </Upload>)}
                        </Form.Item>
                        <div className={styles.modalFooter}>
                            <Button onClick={this.onEditCanceled} style={{ marginRight: 8 }}>取消 </Button>
                            <Button loading={isSubmiting} type="primary" htmlType="submit">保存</Button>
                        </div>
                    </Form>
                </Modal>
            </div >
        );
    }
}

import * as React from 'react';
import styles from './Product.less';
import {
  Form,
  Input,
  Button,
  Pagination,
  Drawer,
  Col,
  Row,
  Divider,
  InputNumber,
  Upload,
  Icon,
  message,
  Modal,
  Empty,
  Select,
  Switch,
  TreeSelect,
  Spin,
} from 'antd';
import { FormComponentProps } from 'antd/lib/form';
import * as AV from 'leancloud-storage';
import { Product } from '@/AVObjects';
import {
  getTree,
  getUploadListItem,
  uploadFiles,
  delay
} from '@/utils';
import { connect } from 'react-redux';
import { cardTypeList } from '@/config';
import LzEditor from 'react-lz-editor';
import WEditor from 'wangeditor'

interface ProductStates {
  searchText: string;
  searchCategory: AV.Queriable;
  data: AV.Queriable[];
  currentProduct?: AV.Queriable;
  count: number;
  page: number;
  size: number;
  visible: boolean;
  // 规格数量
  specs: number;
  submiting: boolean;
  // 分类
  categoryData: AV.Queriable[];
  originCategoryData: AV.Queriable[];
  //卡券
  originCardCouponCategoryData: AV.Queriable[];
  treeData: any;
  searchCard: AV.Queriable;
  //其他内容
  otherContentParameters: number;
  spinning: boolean;
  isCakes: boolean;
}

interface Props extends FormComponentProps, State.AppState { }

@(Form.create() as any)
@connect(state => ({ adminRole: state.app.adminRole }))
export default class ProductPage extends React.Component<Props, ProductStates> {
  state = {
    searchText: '',
    searchCategory: null,
    data: [],
    currentProduct: null,
    count: 0,
    page: 1,
    size: 10,
    visible: false,
    specs: 1,
    submiting: false,
    originCategoryData: [],
    categoryData: [],
    originCardCouponCategoryData: [],
    treeData: [],
    searchCard: null,
    otherContentParameters: 0,
    spinning: false,
    isCakes: false,
  };

  async componentDidMount() {
    this.setState({ spinning: true })
    const query = new AV.Query('Category');
    const originCategoryData = await query.find();
    const queryCard = new AV.Query('CardCouponCategory');
    const cardData = await queryCard.find();
    let treeData: any = [];
    const getChildren = (type: any) => {
      const cArry: any = [];
      cardData.map((c: any) => {
        if (c.get("type") === type) {
          cArry.push({
            title: c.get("cardName"),
            value: c.id,
            key: c.id,
          })
        }
      });
      return cArry;
    }
    cardTypeList.map((carItem: any) => {
      treeData.push({
        title: carItem.text,
        value: carItem.value,
        key: carItem.value,
        selectable: false,
        children: getChildren(carItem.value),
      })
    })
    this.setState({
      categoryData: getTree(originCategoryData),
      originCategoryData: originCategoryData,
      originCardCouponCategoryData: cardData,
      treeData,
      specs: 1,
      otherContentParameters: 0
    });
    await this.onSearch();
  }

  onFormReset = (e: React.FormEvent) => {
    e.preventDefault();
    const { form } = this.props;
    form.resetFields();
    this.onSearch();
  };

  onSearch = async () => {
    this.setState({ spinning: true })
    const { page, size, searchText, searchCategory, searchCard } = this.state;
    const query = new AV.Query('Product');
    const count = await query.count();
    query.include('tags');
    query.ascending('no');
    query.include('usableCards');
    searchCategory && query.equalTo('tags', searchCategory);
    query.equalTo('isCakes', this.state.isCakes)
    searchCard && query.equalTo('usableCards', searchCard);
    query.limit(size);
    query.skip((page - 1) * size);
    query.contains('name', searchText);
    query.include('carouselImgs');
    query.include('detailImgs');
    const data = await query.find();
    this.setState({ data, count });
    this.setState({ spinning: false })
  };

  onPageChange = (page: number) => {
    this.setState({ page }, this.onSearch);
  };

  onShowSizeChange = (page: number, size: number) => {
    this.setState({ page, size }, this.onSearch);
  };

  // 处理form中Upload的方法
  normFile = (e: any) => {
    if (Array.isArray(e)) {
      return e;
    }
    return e && e.fileList;
  };

  onEditCanceled = () => {
    const { currentProduct } = this.state;
    if (currentProduct) {
      // edit mode
      this.setState({
        visible: false,
        currentProduct: null,
        specs: 1,
        otherContentParameters: 0
      });
      this.onSearch();
    } else {
      // new mode
      this.setState({ visible: false, specs: 1, otherContentParameters: 0 });
    }
  };

  onDeleteProduct = () => {
    const { currentProduct } = this.state;
    Modal.confirm({
      title: '确定要删除该商品?',
      okText: '确定',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          //检查是否绑定了卡券
          const queryCardCoupon = new AV.Query('CardCoupon');
          queryCardCoupon.containedIn('convertProducts', [currentProduct])
          const countCardCoupon = await queryCardCoupon.count();
          if (countCardCoupon > 0) {
            message.error('删除失败,该商品已经存在关联的卡券');
            return
          }
          //检查是否存在对应的电子码
          const queryElec = new AV.Query('ElectronicCodeList');
          queryElec.equalTo('product', currentProduct)
          const countElec = await queryElec.count();
          if (countElec > 0) {
            message.error('删除失败,该商品已经存在关联的电子码');
            return
          }

          const queryBanner = new AV.Query('Banner');
          queryBanner.equalTo('product', currentProduct)
          const countBanner = await queryBanner.count();
          if (countBanner > 0) {
            message.error('删除失败,该商品已经存在关联的Banner');
            return
          }
          const queryDesign = new AV.Query('Design');
          queryDesign.equalTo('product', currentProduct)
          const countDesign = await queryDesign.count();
          if (countDesign > 0) {
            message.error('删除失败,该商品已经存在关联的营销板块');
            return
          }
          // const queryHomeShop = new AV.Query('HomeShop');
          // queryHomeShop.containedIn('product', [currentProduct])
          // const countHomeShop = await queryHomeShop.count();
          // if (countHomeShop > 0) {
          //   message.error('删除失败,该商品已经存在关联的选购模块');
          //   return
          // }

          await currentProduct.destroy();
          this.setState({ visible: false });
          message.success('删除成功！');
          this.onSearch();
        } catch (err) {
          console.error(err);
          message.error('删除失败！');
        }
      },
    });
  };

  onEditProduct = (e: React.FormEvent) => {
    e.preventDefault();
    this.props.form.validateFields(async (err, fieldsValue) => {
      if (fieldsValue['isHot'] === 'false') fieldsValue.isHot = false;
      else fieldsValue.isHot = true;
      if (fieldsValue['isRecommend'] === 'false') fieldsValue.isRecommend = false;
      else fieldsValue.isRecommend = true;
      if (fieldsValue['isNew'] === 'false') fieldsValue.isNew = false;
      else fieldsValue.isNew = true;
      if (err) return;
      this.setState({ submiting: true });
      const { currentProduct, originCategoryData, originCardCouponCategoryData } = this.state;
      const hideMessage = message.loading(`正在保存商品...`, 0);
      try {
        fieldsValue.showPrice = parseFloat(fieldsValue.price0);
        // 先上传文件
        const carouselImgsUploaded = await uploadFiles(fieldsValue['carouselImgs']);

        const detailImgsUploaded = await uploadFiles(fieldsValue['detailImgs']);
        // 创建Product
        const product: AV.Object = currentProduct || new Product();
        // 添加除了规格之外的常规字段
        for (const key in fieldsValue) {
          if (key === 'carouselImgs') {
            product.set(key, carouselImgsUploaded);
          }
          else if (key === 'detailImgs') {
            product.set(key, detailImgsUploaded);
          }
          else if (key === 'tags') {
            product.set(
              key,
              originCategoryData.filter(i => fieldsValue[key].some(j => j === i.id))
            );
          }
          // else if (key === 'usableCards') {
          //   product.set(
          //     key,
          //     fieldsValue[key] ? originCardCouponCategoryData.filter(i => fieldsValue[key].some(j => j === i.id)) : []
          //   );
          // } 
          else if (!/(\d+)$/g.test(key)) {
            // 非数字结尾的字段可以加入
            product.set(key, fieldsValue[key]);
          }
        }
        const acl = new AV.ACL();
        acl.setPublicReadAccess(true);
        acl.setRoleWriteAccess(this.props.adminRole, true);
        product.setACL(acl);
        // 添加规格，key是数字结尾
        const specs = [];
        let specs_usableCards: any[] = [];
        for (let i = 0; i < this.state.specs; i++) {
          const spec = {};
          for (const key in fieldsValue) {
            // 以数字i结尾的表单字段，添加到se
            if (key.endsWith(`${i}`) && !key.startsWith('comment') && key.indexOf('otherContent') === -1) {
              spec[key.replace(/(\d+)$/, '')] = fieldsValue[key];
              if (key.indexOf('usableCards') > -1) {
                specs_usableCards = [...specs_usableCards, ...fieldsValue[key] || []]
              }
            }
          }
          specs.push(spec);
        }
        specs_usableCards = Array.from(new Set(specs_usableCards));
        product.set('specs', specs);
        //获取每个规格的可用卡券，然后保存到usableCards
        let usableCards = originCardCouponCategoryData.filter(i => specs_usableCards.some(j => j === i.id));
        product.set(
          'usableCards',
          usableCards
        );
        // 添加其他内容
        const otherContent = [];
        for (let i = 0; i < this.state.otherContentParameters; i++) {
          const oc = {};
          for (const key in fieldsValue) {
            if (key.endsWith(`${i}`) && key.indexOf('otherContent') > -1) {
              oc[key.replace(/(\d+)$/, '')] = fieldsValue[key];
            }
          }
          otherContent.push(oc);
        }
        product.set('otherContent', otherContent);
        // 保存编号
        product.set('no', product.get('no') || this.state.count + 1);

        product.set('detailDescription', this.editor.txt.html())
        product.set('isCakes', this.state.isCakes)
        // 保存、
        await product.save();
        this.setState({ submiting: false, visible: false }, () => {
          hideMessage();
          this.onSearch();
          this.props.form.resetFields();
        });
      } catch (err) {
        console.error(err);
        this.setState({ submiting: false }, hideMessage);
        message.error('新增商品失败！');
      }
    });
  };

  getInitValue = (key: string, defaultValue: any = '') => {
    return this.state.currentProduct ? this.state.currentProduct.get(key) : defaultValue;
  };

  getSpecInitValue = (key: string, index: number, defaultValue: any = '') => {
    if (!this.state.currentProduct) return defaultValue;
    const spec = this.state.currentProduct.get('specs')[index] || {};

    return spec[key] || defaultValue;
  };

  getOtherContentInitValue = (key: string, index: number, defaultValue: any = '') => {
    if (!this.state.currentProduct) return defaultValue;
    const otherContent = this.state.currentProduct.get('otherContent') ? this.state.currentProduct.get('otherContent')[index] || {} : {};
    return otherContent[key] || defaultValue;
  };


  resetSearch = () => {
    this.setState(
      {
        searchCategory: null,
        searchCard: null,
        searchText: '',
      },
      this.onSearch
    );
  };

  renderSelectOptions = (data: any) => {
    return data.map(i => {
      if (i.children) {
        return (
          <Select.OptGroup key={i.id} label={i.get('name')}>
            {this.renderSelectOptions(i.children)}
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
  initEditor() {
    const elem = this.editorElem
    const editor = new WEditor(elem)

    this.editor = editor

    editor.customConfig.zIndex = 100
    editor.customConfig.uploadImgServer = 'redeemfile.xxbiji.com'
    // 限制一次最多上传 1 张图片
    editor.customConfig.uploadImgMaxLength = 1
    editor.customConfig.customUploadImg = async (files, insert) => {
      // files 是 input 中选中的文件列表
      if (files[0]) {
        const file = new AV.File(files[0].name, files[0]);
        const saveRes = await file.save();
        if (saveRes && saveRes.get('url')) {
          insert(saveRes.get('url'))
        } else {
          message.info('上传失败')
        }

      } else {
        message.info('請選擇要上傳的圖片')
      }
    }
    editor.customConfig.menus = [
      'head', // 标题
      'bold', // 粗体
      'fontSize', // 字号
      // 'fontName', // 字体
      'italic', // 斜体
      'underline', // 下划线
      'strikeThrough', // 删除线
      'foreColor', // 文字颜色
      // 'backColor', // 背景颜色
      'link', // 插入链接
      'list', // 列表
      'justify', // 对齐方式
      'quote', // 引用
      // 'emoticon', // 表情
      'image', // 插入图片
      // 'table', // 表格
      // 'video', // 插入视频
      // 'code', // 插入代码
      'undo', // 撤销
      'redo' // 重复
    ]
    editor.customConfig.lang = {
      '设置标题': 'Title',
      '字号': 'Size',
      '文字颜色': 'Color',
      '设置列表': 'List',
      '有序列表': '',
      '无序列表': '',
      '对齐方式': 'Align',
      '靠左': '',
      '居中': '',
      '靠右': '',
      '正文': 'p',
      '链接文字': 'link text',
      '链接': 'link',
      '上传图片': 'Upload',
      '网络图片': 'Web',
      '图片link': 'image url',
      '插入视频': 'Video',
      '格式如': 'format',
      '上传': 'Upload',
      '创建': 'init'
    }
    editor.create();
    this.editor.txt.html(this.getInitValue('detailDescription'))
  }

  showDrawer = () => {
    this.setState({ visible: true }, async () => {
      await delay(200)
      this.initEditor()
    });
  }

  render() {
    const {
      form: { getFieldDecorator },
    } = this.props;
    const {
      data,
      searchText,
      count,
      visible,
      specs,
      submiting,
      currentProduct,
      searchCategory,
      originCategoryData,
      treeData,
      searchCard, categoryData,
      originCardCouponCategoryData, otherContentParameters, isCakes
    } = this.state;
    return (
      <div className={styles.container}>
        <Form layout="inline" className={styles.searchForm}>
          <Form.Item label="是否是蛋糕">
            <Switch
              style={{ width: 40 }}
              checked={isCakes}
              onChange={() => {
                this.setState({ isCakes: !isCakes }, () => {
                  this.onSearch();
                })
              }}
            />
          </Form.Item>

          <Form.Item label="商品名称">
            <Input
              placeholder="请输入"
              value={searchText}
              onChange={e => this.setState({ searchText: e.target.value })}
            />
          </Form.Item>
          <Form.Item label="类别">
            <Select
              style={{ width: 150 }}
              value={searchCategory && searchCategory.id}
              onChange={value =>
                this.setState({
                  searchCategory: originCategoryData.find(i => i.id === value),
                })
              }>
              {this.renderSelectOptions(categoryData)}
            </Select>
          </Form.Item>
          <Form.Item label="可用卡券">
            <TreeSelect
              style={{ width: 150 }}
              dropdownStyle={{ maxHeight: 400, overflow: 'auto' }}
              placeholder="请选择卡券"
              treeData={treeData}
              showSearch
              allowClear
              value={searchCard && searchCard.id}
              onChange={value =>
                this.setState({
                  searchCard: originCardCouponCategoryData.find(i => i.id === value),
                })
              }
            />
          </Form.Item>
          <Button type="primary" onClick={() => this.onSearch()} style={{ marginLeft: 16 }}>
            查询
            </Button>
          <Button style={{ marginLeft: 8 }} onClick={this.resetSearch}>
            重置
            </Button>
          <Button
            type="primary"
            icon="plus"
            style={{ marginLeft: 16 }}
            onClick={this.showDrawer}>
            新增商品
            </Button>
        </Form>
        <Spin spinning={this.state.spinning}>
          <div className={styles.dataContainer}>
            {data.length > 0 ? (
              data.map((item: AV.Queriable, index: number) => {
                const onClick = async () => {
                  await this.showDrawer()
                  this.setState({
                    currentProduct: item,
                    specs: item.get('specs').length,
                    otherContentParameters: item.get('otherContent') ? item.get('otherContent').length : 0,
                  });
                };
                const onActivate = async (checked: boolean, e: MouseEvent) => {
                  e.stopPropagation();
                  item.set('active', checked);
                  await item.save();
                  message.success(checked ? '商品已上架' : '商品已下架', 1.5);
                  this.forceUpdate();
                };
                const onMove = up => async (e: any) => {
                  e.stopPropagation();
                  let lastItem: AV.Object = data[index - (up ? 1 : -1)];
                  if (!lastItem) {
                    const query = new AV.Query('Product');
                    query.equalTo('no', item.get('no') - (up ? 1 : -1));
                    const ret = await query.find();
                    lastItem = ret[0] as AV.Object;
                  }
                  const lastNo = lastItem.get('no');
                  lastItem.set('no', item.get('no'));
                  item.set('no', lastNo);
                  await AV.Object.saveAll([lastItem, item as AV.Object]);
                  await this.onSearch();
                  message.success('移动成功', 1.5);
                };
                const isFisrt = index === 0 && this.state.page === 1;
                const isLast =
                  index === this.state.count - (this.state.page - 1) * this.state.size - 1;
                return (
                  <div onClick={onClick} key={index} className={styles.item}>
                    <img src={item.get('carouselImgs')[0].url} />
                    <div className={styles.row}>
                      <div className={styles.title}>{item.get('name')}</div>
                      <div className={styles.subtitle}>{item.get('fName')}</div>
                    </div>
                    <div className={styles.row}>
                      {item.get('specs').length}种规格{' '}
                      <span>
                        上架：
                        <Switch
                          style={{ width: 40 }}
                          checked={item.get('active')}
                          onChange={onActivate}
                        />
                      </span>
                    </div>
                    <div>
                      {!isFisrt && (
                        <Icon
                          onClick={onMove(true)}
                          style={{ padding: '6px 12px', fontSize: 20 }}
                          type="caret-left"
                        />
                      )}
                      {!isLast && (
                        <Icon
                          onClick={onMove(false)}
                          style={{ padding: '6px 12px', fontSize: 20 }}
                          type="caret-right"
                        />
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
                <div className={styles.empty}>
                  <Empty />
                </div>
              )}
          </div>
        </Spin>

        <span>
          <Pagination
            total={count}
            showSizeChanger={true}
            onShowSizeChange={this.onShowSizeChange}
            onChange={this.onPageChange}
          />
        </span>
        <Drawer
          maskClosable={!submiting}
          closable={false}
          title={`${currentProduct ? '编辑商品' : '新增商品'}${isCakes ? '(蛋糕)' : ''}`}
          width={'70vw'}
          onClose={this.onEditCanceled}
          visible={visible}>
          <Form layout="vertical" className={styles.drawerForm} onSubmit={this.onEditProduct}>
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item label="商品名称">
                  {getFieldDecorator('name', {
                    initialValue: this.getInitValue('name'),
                    rules: [{ required: true, message: '请输入商品名称' }],
                  })(<Input placeholder="名称" />)}
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="品牌名称">
                  {getFieldDecorator('fName', {
                    initialValue: this.getInitValue('fName'),
                  })(<Input placeholder="vaste étendue" />)}
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="类别">
                  {getFieldDecorator('tags', {
                    initialValue:
                      currentProduct && currentProduct.get('tags')
                        ? currentProduct
                          .get('tags')
                          .filter(i => i)
                          .map(i => i.id)
                        : [],
                  })(
                    <Select mode="multiple">
                      {this.renderSelectOptions(categoryData)}
                    </Select>
                  )}
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>

              {/* <Col span={6}>
                <Form.Item label="商品展示价格">
                  {getFieldDecorator('showPrice', {
                    rules: [{ required: true, message: '请输入商品展示价格' }],
                    initialValue: this.getInitValue('showPrice'),
                  })(<Input type="number" placeholder="请输入价格" />)}
                </Form.Item>
              </Col> */}
              <Col span={12}>
                <Form.Item label="标语">
                  {getFieldDecorator('description', {
                    rules: [{ required: true, message: '请输入商品展示标语' }],
                    initialValue: this.getInitValue('description'),
                  })(
                    <Input.TextArea
                      placeholder="请输入内容"
                      rows={4}
                    />
                  )}
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="短名称">
                  {getFieldDecorator('shortName', {
                    initialValue: this.getInitValue('shortName'),
                  })(<Input placeholder="请输入短名称" />)}
                </Form.Item>
              </Col>
            </Row>
            {
              isCakes &&
              <Row gutter={16}>
                <Col span={6}>
                  <Form.Item label="甜味（1-5级）">
                    {getFieldDecorator('sweetness', {
                      initialValue: this.getInitValue('sweetness', 1),
                    })(<InputNumber min={1} max={5} />)}
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item label="口味基底">
                    {getFieldDecorator('base', {
                      initialValue: this.getInitValue('base'),
                    })(<Input placeholder="例：Whipping Cream" />)}
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item label="口感">
                    {getFieldDecorator('texture', {
                      initialValue: this.getInitValue('texture'),
                    })(<Input placeholder="例：绵软细腻" />)}
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item label="口味">
                    {getFieldDecorator('flavor', {
                      initialValue: this.getInitValue('flavor'),
                    })(<Input placeholder="例：奶油/水果" />)}
                  </Form.Item>
                </Col>
              </Row>
            }
            <Row gutter={16}>
              {/* <Col span={12}>
                <Form.Item label="可用的卡券">
                  {getFieldDecorator('usableCards', {
                    initialValue:
                      (currentProduct && currentProduct.get('usableCards'))
                        ? currentProduct
                          .get('usableCards')
                          .filter(i => i)
                          .map(i => i.id)
                        : [],
                  })(<TreeSelect
                    style={{ width: '100%' }}
                    dropdownStyle={{ maxHeight: 400, overflow: 'auto' }}
                    placeholder="请选择可用卡券"
                    treeData={treeData}
                    showSearch
                    allowClear
                    multiple
                  />)}
                </Form.Item>
              </Col> */}

              <Col span={4}>
                <Form.Item label="是否热销">
                  {getFieldDecorator('isHot', {
                    initialValue: this.getInitValue('isHot') ? 'true' : 'false',
                  })(<Select>
                    <Select.Option value="true" >是</Select.Option>
                    <Select.Option value="false">否</Select.Option>
                  </Select>)}
                </Form.Item>
              </Col>
              <Col span={4}>
                <Form.Item label="是否推荐">
                  {getFieldDecorator('isRecommend', {
                    initialValue: this.getInitValue('isRecommend') ? 'true' : 'false',
                  })(<Select>
                    <Select.Option value="true" >是</Select.Option>
                    <Select.Option value="false">否</Select.Option>
                  </Select>)}
                </Form.Item>
              </Col>
              <Col span={4}>
                <Form.Item label="是否新品">
                  {getFieldDecorator('isNew', {
                    initialValue: this.getInitValue('isNew') ? 'true' : 'false',
                  })(<Select>
                    <Select.Option value="true" >是</Select.Option>
                    <Select.Option value="false">否</Select.Option>
                  </Select>)}
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={20}>
                <Form.Item label="详情描述">
                  {/* <div ref={ele => (this.editorElem = ele)} style={{ textAlign: 'left', width: '100%', height: '400px' }} /> */}
                  {visible && getFieldDecorator('detailDescription')(
                    <div ref={ele => (this.editorElem = ele)} className={styles.WEditor} />

                  )}
                </Form.Item>
              </Col>
            </Row>
            <React.Fragment>
              {Array(specs)
                .fill(null)
                .map((itemNull, index) => (
                  <React.Fragment key={index}>
                    <Divider orientation="left">
                      规格{index + 1}
                      {index === specs - 1 && (
                        <Button
                          onClick={() => this.setState({ specs: specs - 1 })}
                          icon="delete"
                          size="small"
                          style={{ marginLeft: 8 }}
                        />
                      )}
                    </Divider>
                    <Row gutter={16}>
                      <React.Fragment>
                        <Col span={6}>
                          <Form.Item label="规格名称">
                            {getFieldDecorator('specsName' + index, {
                              initialValue: this.getSpecInitValue('specsName', index),
                              rules: [{ required: true, message: '请输入规格名称' }],
                            })(<Input placeholder="例：xx尺寸" />)}
                          </Form.Item>
                        </Col>
                      </React.Fragment>
                      {
                        isCakes &&
                        <Col span={6}>
                          <Form.Item label="重量(磅)">
                            {getFieldDecorator('weight' + index, {
                              initialValue: this.getSpecInitValue('weight', index),
                              rules: [{ required: true, message: '请输入重量(磅)' }],
                            })(<InputNumber type="number" placeholder="1" />)}
                          </Form.Item>
                        </Col>
                      }
                      <Col span={6}>
                        <Form.Item label="现价（元）">
                          {getFieldDecorator('price' + index, {
                            initialValue: this.getSpecInitValue('price', index),
                            rules: [{ required: true, message: '请输入现价' }],
                          })(<InputNumber type="number" placeholder="例：88" />)}
                        </Form.Item>
                      </Col>
                      <Col span={6}>
                        <Form.Item label="市场价（元）">
                          {getFieldDecorator('oPrice' + index, {
                            initialValue: this.getSpecInitValue('oPrice', index),
                          })(<InputNumber type="number" placeholder="例：128" />)}
                        </Form.Item>
                      </Col>

                    </Row>
                    {
                      isCakes &&
                      <Row gutter={16}>
                        <Col span={6}>
                          <Form.Item label="提前预定时间（小时）">
                            {getFieldDecorator('bookTime' + index, {
                              initialValue: this.getSpecInitValue('bookTime', index),
                              rules: [{ required: true, message: '请输入提前预定时间' }],
                            })(<InputNumber type="number" placeholder="例：5" />)}
                          </Form.Item>
                        </Col>
                        <Col span={6}>
                          <Form.Item label="尺寸（自定义）">
                            {getFieldDecorator('size' + index, {
                              initialValue: this.getSpecInitValue('size', index),
                              rules: [{ required: true, message: '请输入尺寸' }],
                            })(<Input placeholder="例：17cm*8cm" />)}
                          </Form.Item>
                        </Col>
                        <Col span={6}>
                          <Form.Item label="餐具数量（个）">
                            {getFieldDecorator('cutleryNum' + index, {
                              initialValue: this.getSpecInitValue('cutleryNum', index),
                              rules: [{ required: true, message: '请输入餐具数量' }],
                            })(<InputNumber type="number" placeholder="例：7" />)}
                          </Form.Item>
                        </Col>
                        <Col span={6}>
                          <Form.Item label="建议食用人数">
                            {getFieldDecorator('personNum' + index, {
                              initialValue: this.getSpecInitValue('personNum', index),
                              rules: [{ required: true, message: '请输入建议食用人数' }],
                            })(<Input placeholder="例：2-3" />)}
                          </Form.Item>
                        </Col>
                      </Row>
                    }

                    <Row gutter={16}>
                      <Col span={10}>
                        <Form.Item label="可用的卡券">
                          {getFieldDecorator('usableCards' + index, {
                            initialValue: this.getSpecInitValue('usableCards', index) || [],
                          })(<TreeSelect
                            style={{ width: '100%' }}
                            dropdownStyle={{ maxHeight: 400, overflow: 'auto' }}
                            placeholder="请选择可用卡券"
                            treeData={treeData}
                            showSearch
                            allowClear
                            multiple
                          />)}
                        </Form.Item>
                      </Col>
                    </Row>


                  </React.Fragment>
                ))}

              <Divider orientation="left">
                <Button icon="plus" onClick={() => this.setState({ specs: specs + 1 })}>
                  新增规格
                </Button>
              </Divider>
            </React.Fragment>

            <Divider orientation="left">图片上传</Divider>
            <Form.Item>
              {getFieldDecorator('carouselImgs', {
                rules: [
                  {
                    required: true,
                    message: '请上传至少一张主图',
                  },
                ],
                valuePropName: 'fileList',
                getValueFromEvent: this.normFile,
                initialValue: currentProduct
                  ? currentProduct.get('carouselImgs').map(getUploadListItem)
                  : [],
              })(
                <Upload
                  multiple={true}
                  accept="image/*"
                  listType="picture"
                  className="upload-list-inline">
                  <Button>
                    <Icon type="upload" /> 上传轮播主图
                    </Button>
                </Upload>
              )}
            </Form.Item>
            <Form.Item>
              {getFieldDecorator('detailImgs', {
                valuePropName: 'fileList',
                getValueFromEvent: this.normFile,
                initialValue: currentProduct
                  ? currentProduct.get('detailImgs').map(getUploadListItem)
                  : [],
              })(
                <Upload
                  multiple={true}
                  accept="image/*"
                  listType="picture"
                  className="upload-list-inline">
                  <Button>
                    <Icon type="upload" /> 上传商品详情图
                    </Button>
                </Upload>
              )}
            </Form.Item>

            <React.Fragment>
              <Divider orientation="left">其他内容</Divider>
              {Array(otherContentParameters)
                .fill(null)
                .map((itemNull, index) => (
                  <React.Fragment key={index}>
                    <Divider orientation="left">
                      其他内容{index + 1}
                      {index === otherContentParameters - 1 && (
                        <Button
                          onClick={() => this.setState({ otherContentParameters: otherContentParameters - 1 })}
                          icon="delete"
                          size="small"
                          style={{ marginLeft: 8 }}
                        />
                      )}
                    </Divider>
                    <Row gutter={16} align="top" type="flex">
                      <Col span={6}>
                        <Form.Item label="内容标题">
                          {getFieldDecorator('otherContentTitle' + index, {
                            initialValue: this.getOtherContentInitValue('otherContentTitle', index),
                          })(<Input placeholder="请输入内容标题" />)}
                        </Form.Item>
                      </Col>
                      <Col span={3}>
                        <Form.Item label="是否默认展开">
                          {getFieldDecorator('otherContentShow' + index, {
                            initialValue: this.getOtherContentInitValue('otherContentShow', index) || 'false',
                          })(<Select>
                            <Select.Option value="true" >是</Select.Option>
                            <Select.Option value="false">否</Select.Option>
                          </Select>)}
                        </Form.Item>
                      </Col>
                    </Row>
                    <Row gutter={16} align="top" type="flex">
                      <Col span={16}>
                        <Form.Item label="内容描述">
                          {visible && getFieldDecorator('otherContentText' + index, {
                            initialValue: this.getOtherContentInitValue('otherContentText', index),
                          })(
                            <LzEditor
                              active={true}
                              importContent={this.getOtherContentInitValue('otherContentText', index)}
                              cbReceiver={(content) => {
                                let fieldsValue: any = {}
                                fieldsValue[`otherContentText${index}`] = content
                                this.props.form.setFieldsValue(fieldsValue)
                              }}
                              blockStyle={false}
                              video={false}
                              audio={false}
                              image={false}
                              urls={false}
                              fullScreen={false}
                              color={false}
                              autoSave={false}
                              lang="ch" />
                          )}
                        </Form.Item>
                      </Col>
                    </Row>

                  </React.Fragment>
                ))}
              <Divider orientation="left">
                <Button icon="plus" onClick={() => this.setState({ otherContentParameters: otherContentParameters + 1 })}>
                  新增内容
                </Button>
              </Divider>
            </React.Fragment>
            <div className={styles.drawerFooter}>
              <Button onClick={this.onEditCanceled} style={{ marginRight: 8 }}>
                取消
                </Button>
              {currentProduct && (
                <Button type="danger" onClick={this.onDeleteProduct} style={{ marginRight: 8 }}>
                  删除
                </Button>
              )}
              <Button loading={submiting} type="primary" htmlType="submit">
                保存
                </Button>
            </div>
          </Form>
        </Drawer>
      </div>
    );
  }
}

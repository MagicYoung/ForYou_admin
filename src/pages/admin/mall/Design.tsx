import * as React from 'react';
import { List, Form, Modal, Button, Input, Select, message, Divider, Avatar } from 'antd';
import { FormComponentProps } from 'antd/lib/form';
import * as AV from 'leancloud-storage';
import styles from './Design.less';
import { Design, Banner, HomeShop } from '@/AVObjects';
import { getUploadListItem, renderUploadItem, uploadFiles, getTree } from '@/utils';
import { BannerType, DesignType } from '@/constants';
import { connect } from 'react-redux';

const formLayoutProps = {
  labelCol: {
    span: 4,
  },
  wrapperCol: {
    span: 20,
  },
};
interface Props extends FormComponentProps, State.AppState { }

@(Form.create() as any)
@connect(state => ({ adminRole: state.app.adminRole }))
export default class DesignPage extends React.Component<Props> {
  state = {
    designs: [],
    banners: [],
    products: [],
    designModalVisible: false,
    bannerModalVisible: false,
    currentQueriable: null,
    originCategoryData: [],
    categoryData: [],
    homeShops: [],
    homeShopModalVisible: false,
  };

  async componentDidMount() {
    const query = new AV.Query('Product');
    query.equalTo('active', true);
    //query.include('tags')
    const products = await query.find();
    const queryCategoryData = new AV.Query('Category');
    const originCategoryData = await queryCategoryData.find();
    this.setState({
      products,
      categoryData: getTree(originCategoryData),
      originCategoryData
    });
    this.onSearchDesigns();
    this.onSearchBanners();
    this.onSearchHomeShop();
  }

  onSearchDesigns = async () => {
    const query = new AV.Query('Design');
    query.include('products');
    query.include('category');
    query.ascending('no');
    const designs = await query.find();
    this.setState({ designs });
  };

  onSearchBanners = async () => {
    const query = new AV.Query('Banner');
    query.include('img');
    query.include('product');
    query.ascending('no');
    const banners = await query.find();
    this.setState({
      banners: banners.filter(
        i =>
          (i.get('type') === BannerType.Product && i.get('product')) ||
          i.get('type') !== BannerType.Product
      ),
    });
  };

  onCancel = () => {
    this.setState(
      {
        currentQueriable: null,
        designModalVisible: false,
        bannerModalVisible: false,
        homeShopModalVisible: false,
      },
      this.props.form.resetFields
    );
  };

  onBannerSave = () => {
    const { form } = this.props;
    const otherFields = [];
    if (form.getFieldValue('banner-type') === BannerType.Product) {
      otherFields.push('banner-product');
    } else if (form.getFieldValue('banner-type') === BannerType.Url) {
      otherFields.push('banner-url');
    }
    form.validateFields(['banner-type', 'banner-cover', ...otherFields], async (err, values) => {
      if (err) return;
      try {
        message.loading('正在保存..')
        const { currentQueriable, products, banners } = this.state;
        const banner = currentQueriable || new Banner();

        const cover = await uploadFiles(values['banner-cover']);

        banner.set('cover', cover[0] || null);

        banner.set('type', values['banner-type']);
        if (values['banner-type'] === BannerType.Product) {
          banner.set('product', products.find(i => i.get('name') === values['banner-product']));
        } else if (values['banner-type'] === BannerType.Url) {
          banner.set('url', values['banner-url']);
        }
        !currentQueriable &&
          banner.set('no', banners.length > 0 ? banners[banners.length - 1].get('no') + 1 : 1);

        const acl = new AV.ACL();
        acl.setPublicReadAccess(true);
        acl.setRoleWriteAccess(this.props.adminRole, true);
        banner.setACL(acl);

        await banner.save();
        message.destroy();
        message.success('保存成功', 2);
        form.resetFields();
        this.setState({ bannerModalVisible: false, currentQueriable: null }, this.onSearchBanners);
      } catch (err) {
        console.error(err);
        message.error('保存失败', 2);
      }
    });
  };

  onDesignSave = () => {
    const { form } = this.props;
    form.validateFields(
      ['design-name', 'design-fName', 'design-type', 'design-fNameShort', 'design-products', 'category'],
      async (err, values) => {
        if (err) return;
        try {
          message.loading('正在保存..')
          const { currentQueriable, designs } = this.state;
          const design = currentQueriable || new Design();
          design.set('name', values['design-name']);
          design.set('fName', values['design-fName']);
          design.set('fNameShort', values['design-fNameShort']);
          design.set('type', values['design-type']);
          // design.set(
          //   'products',
          //   values['design-products'].map(i => products.find(j => j.get('name') === i))
          // );
          design.set(
            'category',
            this.state.originCategoryData.filter(i => i.id === values['category'])
          );
          !currentQueriable && design.set('no', designs.length ? designs[designs.length - 1].get('no') + 1 : 1);
          const acl = new AV.ACL();
          acl.setPublicReadAccess(true);
          acl.setRoleWriteAccess(this.props.adminRole, true);
          design.setACL(acl);
          await design.save();
          message.destroy();
          message.success('保存成功', 2);
          form.resetFields();
          this.setState(
            { designModalVisible: false, currentQueriable: null },
            this.onSearchDesigns
          );
        } catch (err) {
          console.error(err);
          message.error('保存失败', 2);
        }
      }
    );
  };


  onDesignEdit(item) {
    this.setState({
      currentQueriable: item,
      designModalVisible: true,
    });
  }

  onDesignDelete = async (item: AV.Queriable) => {
    Modal.confirm({
      title: '确定要删除该板块?',
      okText: '确定',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await item.destroy();
          this.onSearchDesigns();
          message.success('删除成功！');
        } catch (err) {
          console.error(err);
          message.error('删除失败！');
        }
      },
    });
  };

  onDesignMove = async (item: AV.Queriable, up = true) => {
    const { designs } = this.state;
    const lastItem =
      designs[designs.findIndex(i => i.get('no') === item.get('no')) - (up ? 1 : -1)];
    const thisNo = item.get('no');
    item.set('no', lastItem.get('no'));
    lastItem.set('no', thisNo);
    await AV.Object.saveAll([item, lastItem]);
    this.onSearchDesigns();
    message.success('移动成功！', 1.5);
  };

  onBannerEdit(item) {
    this.setState({
      currentQueriable: item,
      bannerModalVisible: true,
    });
  }

  onBannerDelete = (item: AV.Object) => {
    Modal.confirm({
      title: '确定要删除该Banner?',
      okText: '确定',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await item.destroy();
          this.onSearchBanners();
          message.success('删除成功！');
        } catch (err) {
          console.error(err);
          message.error('删除失败！');
        }
      },
    });
  };

  onBannerMove = async (item: AV.Object, up: boolean) => {
    const { banners } = this.state;
    const lastItem =
      banners[banners.findIndex(i => i.get('no') === item.get('no')) - (up ? 1 : -1)];
    const thisNo = item.get('no');
    item.set('no', lastItem.get('no'));
    lastItem.set('no', thisNo);
    await AV.Object.saveAll([item, lastItem]);
    this.onSearchBanners();
    message.success('移动成功！', 1.5);
  };

  renderBannerItem = (item: AV.Object, index) => {
    const actions = [
      <a onClick={this.onBannerEdit.bind(this, item)}>编辑</a>,
      <a style={{ color: 'red' }} onClick={this.onBannerDelete.bind(this, item)}>
        删除
      </a>,
      index < 1 ? '上移' : <a onClick={this.onBannerMove.bind(this, item, true)}>上移</a>,
      index === this.state.banners.length - 1 ? (
        '下移'
      ) : (
          <a onClick={this.onBannerMove.bind(this, item, false)}>下移</a>
        ),
    ];
    let title,
      description = '';
    switch (item.get('type')) {
      case BannerType.Product:
        title = item.get('product').get('name');
        description = item.get('product').get('fName');
        break;
      case BannerType.Url:
        title = '链接';
        description = item.get('url');
        break;
      case BannerType.Blank:
      default:
        title = '无交互';
        break;
    }
    return (
      <List.Item actions={actions}>
        <List.Item.Meta
          avatar={<Avatar size="large" shape="square" src={item.get('cover').thumbUrl} />}
          title={title}
          description={description}
        />
      </List.Item>
    );
  };

  renderDesignItem = (item: AV.Object, index: number) => {
    const actions = [
      <a onClick={this.onDesignEdit.bind(this, item)}>编辑</a>,
      <a style={{ color: 'red' }} onClick={this.onDesignDelete.bind(this, item)}>
        删除
      </a>,
      index < 1 ? '上移' : <a onClick={this.onDesignMove.bind(this, item, true)}>上移</a>,
      index === this.state.designs.length - 1 ? (
        '下移'
      ) : (
          <a onClick={this.onDesignMove.bind(this, item, false)}>下移</a>
        ),
    ];
    return (
      <List.Item actions={actions}>
        <List.Item.Meta
          className={styles.meta}
          title={item.get('name')}
          description={item.get('fName')}
        />
        {
          item.get('category')[0] &&
          <div className={styles.products}>
            关联类别：{item.get('category')[0].get('name')}
          </div>
        }
      </List.Item>
    );
  };

  renderLoadMore = (type: 'design' | 'banner' | 'homeShop') => {
    return (
      <div className={styles.loadMore}>
        <Button
          onClick={() =>
            this.setState({
              designModalVisible: type === 'design',
              bannerModalVisible: type === 'banner',
              homeShopModalVisible: type === 'homeShop',
            })
          }
          style={{ width: '50%', marginTop: 10 }}
          type="dashed"
          icon="plus">
          {type === 'design' ? '新增板块' : (type === 'banner' ? '新增Banner' : '新增选购项')}
        </Button>
      </div>
    );
  };

  // 处理form中Upload的方法
  normFile = (e: any) => {
    if (Array.isArray(e)) {
      return e;
    }
    return e && e.fileList;
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

  onSearchHomeShop = async () => {
    const query = new AV.Query('HomeShop');
    query.include('category');
    query.include('products');
    query.ascending('no');
    const homeShops = await query.find();
    this.setState({
      homeShops: homeShops
    });
  }
  renderHomeShopProuct = () => {
    let homeShopProduct: any[] = []
    this.state.products.map((pro: any) => {
      if (pro.get('tags').some((p) => p.id === this.props.form.getFieldValue('homeShopCategory'))) {
        homeShopProduct.push(pro);
      }
    })
    return homeShopProduct.map((item) => {
      return <Select.Option key={item.id} value={item.id}>
        {item.get('name')}
      </Select.Option>
    });
  }
  onHomeShoperSave = () => {
    const { form } = this.props;
    form.validateFields(
      ['homeShopCategory', 'homeShopProduct', 'homeShopTitle'],
      async (err, values) => {
        if (err) return;
        try {
          message.loading('正在保存..')
          const { currentQueriable, homeShops } = this.state;
          const homeShop = currentQueriable || new HomeShop();
          homeShop.set(
            'products',
            this.state.products.find((j: any) => j.id === values['homeShopProduct'])
          );
          homeShop.set(
            'category',
            this.state.originCategoryData.find(i => i.id === values['homeShopCategory'])
          );

          homeShop.set('title', values['homeShopTitle'])
          !currentQueriable && homeShop.set('no', homeShops.length ? homeShops[homeShops.length - 1].get('no') + 1 : 1);
          const acl = new AV.ACL();
          acl.setPublicReadAccess(true);
          acl.setRoleWriteAccess(this.props.adminRole, true);
          homeShop.setACL(acl);
          await homeShop.save();
          message.destroy();
          message.success('保存成功', 2);
          form.resetFields();
          this.setState(
            { homeShopModalVisible: false, currentQueriable: null },
            this.onSearchHomeShop
          );
        } catch (err) {
          console.error(err);
          message.error('保存失败', 2);
        }
      }
    );
  }
  onHomeShopMove = async (item: AV.Queriable, up = true) => {
    const { homeShops } = this.state;
    const lastItem = homeShops[homeShops.findIndex(i => i.get('no') === item.get('no')) - (up ? 1 : -1)];
    const thisNo = item.get('no');
    item.set('no', lastItem.get('no'));
    lastItem.set('no', thisNo);
    await AV.Object.saveAll([item, lastItem]);
    this.onSearchHomeShop();
    message.success('移动成功！', 1.5);
  };
  renderHomeShopItem = (item: AV.Object, index: number) => {
    if (!item.get('products') || !item.get('category')) return <div></div>
    const actions = [
      <a onClick={() => {
        this.setState({
          currentQueriable: item,
          homeShopModalVisible: true,
        });
      }}>编辑</a>,
      <a style={{ color: 'red' }} onClick={() => {
        Modal.confirm({
          title: '确定要删除该板块?',
          okText: '确定',
          okType: 'danger',
          cancelText: '取消',
          onOk: async () => {
            try {
              await item.destroy();
              this.onSearchHomeShop();
              message.success('删除成功！');
            } catch (err) {
              console.error(err);
              message.error('删除失败！');
            }
          },
        });
      }}>
        删除
      </a>,
      index < 1 ? '上移' : <a onClick={this.onHomeShopMove.bind(this, item, true)}>上移</a>,
      index === this.state.homeShops.length - 1 ? (
        '下移'
      ) : (
          <a onClick={this.onHomeShopMove.bind(this, item, false)}>下移</a>
        ),
    ];
    return (
      <List.Item key={item.id} actions={actions}>
        <List.Item.Meta
          avatar={<Avatar size="large" shape="square" src={item.get('products').get('carouselImgs')[0].thumbUrl} />}
          title={item.get('category').get('name')}
          description={
            item.get('products').get('name')
          }
        />
      </List.Item>)
  }
  render() {
    const {
      form: { getFieldDecorator, getFieldValue },
    } = this.props;
    const {
      designs,
      banners,
      designModalVisible,
      bannerModalVisible,
      currentQueriable,
      products, categoryData,
      homeShops,
      homeShopModalVisible,
    } = this.state;
    return (
      <div className={styles.container}>
        <div className={styles.left}>
          <Divider orientation="left">Banner装修</Divider>
          <List
            itemLayout="horizontal"
            dataSource={banners}
            renderItem={this.renderBannerItem}
            loadMore={this.renderLoadMore('banner')}
          />
          <Divider orientation="left">营销板块</Divider>
          <List
            itemLayout="horizontal"
            dataSource={designs}
            renderItem={this.renderDesignItem}
            loadMore={this.renderLoadMore('design')}
          />
        </div>
        <div className={styles.right}>
          <Divider orientation="left">选购模块</Divider>
          <List
            itemLayout="horizontal"
            dataSource={homeShops}
            loadMore={this.renderLoadMore('homeShop')}
            renderItem={this.renderHomeShopItem}
          />
        </div>
        <Modal
          visible={designModalVisible}
          title={currentQueriable ? '编辑板块' : '新增板块'}
          okText="保存"
          cancelText="取消"
          onCancel={this.onCancel}
          onOk={this.onDesignSave}>
          {
            designModalVisible &&
            <Form layout="horizontal">
              <Form.Item label="名称" {...formLayoutProps}>
                {getFieldDecorator('design-name', {
                  initialValue: currentQueriable ? currentQueriable.get('name') : '',
                  rules: [
                    {
                      required: true,
                      message: '请输入板块名称',
                    },
                  ],
                })(<Input placeholder="板块名称" />)}
              </Form.Item>
              <Form.Item label="展示方式" {...formLayoutProps}>
                {getFieldDecorator('design-type', {
                  initialValue: currentQueriable
                    ? currentQueriable.get('type')
                    : DesignType.Default,
                })(
                  <Select style={{ width: '100%' }}>
                    <Select.Option value={DesignType.Default}>默认</Select.Option>
                    <Select.Option value={DesignType.Horizontal}>横向滚动</Select.Option>
                  </Select>
                )}
              </Form.Item>
              <Form.Item label="外语名称" {...formLayoutProps}>
                {getFieldDecorator('design-fName', {
                  initialValue: currentQueriable ? currentQueriable.get('fName') : '',
                })(<Input placeholder="板块外语名称" />)}
              </Form.Item>
              <Form.Item label="外语简称" {...formLayoutProps}>
                {getFieldDecorator('design-fNameShort', {
                  initialValue: currentQueriable ? currentQueriable.get('fNameShort') : '',
                })(<Input placeholder="板块外语简称" />)}
              </Form.Item>
              {designModalVisible && (
                <Form.Item label="关联类别"  {...formLayoutProps}>
                  {getFieldDecorator('category', {
                    initialValue: currentQueriable
                      ? currentQueriable.get('category')[0].id
                      : [],
                    rules: [
                      {
                        required: true,
                        message: '请选择类别',
                      },
                    ],
                  })(
                    <Select
                      style={{ width: '100%' }}>
                      {this.renderSelectOptions(categoryData)}
                    </Select>
                  )}
                </Form.Item>
              )}
            </Form>
          }

        </Modal>
        <Modal
          visible={bannerModalVisible}
          title={currentQueriable ? '编辑Banner' : '新增Banner'}
          okText="保存"
          cancelText="取消"
          onCancel={this.onCancel}
          onOk={this.onBannerSave}>
          {
            bannerModalVisible &&
            <Form layout="horizontal">
              <Form.Item label="类型" {...formLayoutProps}>
                {getFieldDecorator('banner-type', {
                  rules: [
                    {
                      required: true,
                      message: '请选择',
                    },
                  ],
                  initialValue: currentQueriable
                    ? currentQueriable.get('type')
                    : BannerType.Product,
                })(
                  <Select style={{ width: '100%' }}>
                    <Select.Option key="01" value={BannerType.Product}>
                      关联商品
                        </Select.Option>
                    <Select.Option key="02" value={BannerType.Url}>
                      外部链接
                        </Select.Option>
                    <Select.Option key="03" value={BannerType.Blank}>
                      无交互
                        </Select.Option>
                  </Select>
                )}
              </Form.Item>
              {getFieldValue('banner-type') === BannerType.Product && (
                <Form.Item label="商品" {...formLayoutProps}>
                  {getFieldDecorator('banner-product', {
                    rules: [
                      {
                        required: true,
                        message: '请选择商品',
                      },
                    ],
                    initialValue:
                      currentQueriable &&
                      currentQueriable.get('product') &&
                      currentQueriable.get('product').get('name'),
                  })(
                    <Select showSearch={true} style={{ width: '100%' }}>
                      {products.map(item => (
                        <Select.Option key={item.id} value={item.get('name')}>
                          {item.get('name')}
                        </Select.Option>
                      ))}
                    </Select>
                  )}
                </Form.Item>
              )}
              {getFieldValue('banner-type') === BannerType.Url && (
                <Form.Item label="链接" {...formLayoutProps}>
                  {getFieldDecorator('banner-url', {
                    rules: [
                      {
                        required: true,
                        message: '请输入外部链接',
                      },
                    ],
                    initialValue: currentQueriable && currentQueriable.get('url'),
                  })(<Input placeholder="例：https://www.google.com" />)}
                </Form.Item>
              )}
              {renderUploadItem({
                label: '封面',
                name: 'banner-cover',
                initialValue:
                  currentQueriable && currentQueriable.get('cover')
                    ? [getUploadListItem(currentQueriable.get('cover'), 1)]
                    : [],
                rules: [
                  {
                    required: true,
                    message: '请上传封面',
                  },
                ],
                getFieldDecorator,
                getFieldValue,
              })}
            </Form>
          }
        </Modal>
        <Modal
          visible={homeShopModalVisible}
          title={currentQueriable ? '编辑模块' : '新增模块'}
          okText="保存"
          cancelText="取消"
          onCancel={this.onCancel}
          onOk={this.onHomeShoperSave}>
          {
            homeShopModalVisible ?
              <Form layout="horizontal">
                <Form.Item label="关联类别"  {...formLayoutProps}>
                  {getFieldDecorator('homeShopCategory', {
                    initialValue: currentQueriable
                      ? currentQueriable.get('category').id
                      : '',
                    rules: [
                      {
                        required: true,
                        message: '请选择类别',
                      },
                    ],
                  })(
                    <Select
                      style={{ width: '100%' }}>
                      {this.renderSelectOptions(categoryData)}
                    </Select>
                  )}
                </Form.Item>
                <Form.Item label="关联商品"  {...formLayoutProps}>
                  {getFieldDecorator('homeShopProduct', {
                    initialValue:
                      currentQueriable && currentQueriable.get('products')
                        ? currentQueriable
                          .get('products')
                          .filter(i => i)
                          .map(i => i.id)
                        : [],
                    rules: [
                      {
                        required: true,
                        message: '商品',
                      },
                    ],
                  })(
                    <Select style={{ width: '100%' }}>
                      {this.renderHomeShopProuct()}
                    </Select>
                  )}
                </Form.Item>
                <Form.Item label="标题"  {...formLayoutProps}>
                  {getFieldDecorator('homeShopTitle', {
                    initialValue: currentQueriable
                      ? currentQueriable.get('title')
                      : '',
                    rules: [
                      {
                        required: true,
                        message: '请填写标题',
                      },
                    ],
                  })(<Input placeholder="标题" />)}
                </Form.Item>
              </Form> : null
          }

        </Modal>
      </div>
    );
  }
}

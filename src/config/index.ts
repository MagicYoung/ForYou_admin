export const USER_LAYOUT_ROUTES: string[] = ['/admin/login'];

export const ADMIN_ROLE = 'Administrator';

export const ADMIN_EMAIL = '751647689@qq.com';

export const SMS = {
  TEMPLATE: 'requestLoginSmsCode',
  SIGN: '百福得',
};

export const ADMIN_MENU: AdminMenuItem[] = [
  {
    path: '/admin/anlysis',
    icon: 'bar-chart',
    name: '统计分析',
  },
  {
    path: '/admin/order',
    name: '订单管理',
    icon: 'solution',
    subMenu: [
      {
        path: '/admin/order/order',
        name: '所有订单',
        icon: 'solution',
      },
      {
        path: '/admin/order/OrderRecycle',
        name: '订单回收站',
        icon: 'delete',
      }
    ],
  },
  {
    path: '/admin/mall',
    name: '商城管理',
    icon: 'shop',
    subMenu: [
      {
        path: '/admin/mall/product',
        name: '商品管理',
        icon: 'shopping-cart',
      },
      {
        path: '/admin/mall/category',
        name: '分类管理',
        icon: 'tags',
      },
      // {
      //   path: '/admin/mall/electronicCode',
      //   name: '电子码管理',
      //   icon: 'tags',
      // },
      {
        path: '/admin/mall/design',
        name: '店铺装修',
        icon: 'gold',
      },
      // {
      //   path: '/admin/mall/map',
      //   name: '绘制地图',
      //   icon: 'gold',
      // },
    ],
  },
  {
    path: '/admin/cardCoupon',
    name: '卡券管理',
    icon: 'credit-card',
    subMenu: [
      {
        path: '/admin/cardCoupon/card',
        name: '所有卡券',
        icon: 'shopping-cart',
      },
      {
        path: '/admin/cardCoupon/cardDelete',
        name: '卡券回收站',
        icon: 'delete',
      },
      {
        path: '/admin/cardCoupon/cardCouponCategory',
        name: '卡券类别',
        icon: 'tags',
      },
    ],
  },
  {
    path: '/admin/users',
    name: '用户管理',
    icon: 'user',
    subMenu: [
      {
        path: '/admin/users/user',
        name: '普通用户',
        icon: 'user',
      },
      {
        path: '/admin/users/sysUser',
        name: '系统管理员',
        icon: 'usergroup-add',
      },
    ],
  },
  {
    path: '/admin/feedback',
    name: '意见反馈',
    icon: 'mail',
  },
  {
    path: '/admin/settings',
    name: '系统设置',
    icon: 'setting',
  },
];

export const TAB_MENU: TabItem[] = [
  {
    path: '/',
    name: '首页',
    icon: 'home',
  },
  {
    path: '/shop',
    name: '选购',
    icon: 'bars',
  },
  {
    path: '/recommend',
    name: '精选',
    icon: 'heart',
  },
  // {
  //   path: '/cart',
  //   name: '购物车',
  //   icon: 'shopping-cart',
  // },
  {
    path: '/me',
    name: '我的',
    icon: 'user',
  },
];
export const HEAD_LEFT_MENU: TabItem[] = [
  {
    path: '/',
    name: '首页',
    icon: 'home',
  },
  {
    path: '/shop',
    name: '选购',
    icon: 'bars',
  },
  {
    path: '/me',
    name: '我的',
    icon: 'user',
  },
];
export const PAGEARR = [
  {
    path: '/productMall',
    name: ''
  }, {
    path: '/cart',
    name: '购物车'
  },
  {
    path: '/product/',
    name: '商品详情',
  },
  {
    path: '/orders/detail',
    name: '订单详情',
  }, {
    path: '/orders',
    name: '订单列表',
  },
  {
    path: '/me/address',
    name: '我的地址',
  },
  {
    path: '/userCardCoupon',
    name: '我的卡券',
  },
  {
    path: '/userCardCoupon/AddCard',
    name: '绑定卡券',
  },
  {
    path: '/me/edit',
    name: '编辑个人信息',
  },
];

export const SLICK_SETTINGS = {
  dots: true,
  infinite: true,
  speed: 20000,
  autoplay: true,
};

export const ORDER_TIMES: string[] = [
  '10:00-11:00',
  '11:00-12:00',
  '12:00-13:00',
  '13:00-14:00',
  '14:00-15:00',
  '15:00-16:00',
  '17:00-18:00',
  '19:00-20:00',
];

interface PickerItem {
  value: string;
  label: string;
  children?: PickerItem[];
}

export const CITIES: PickerItem[] = [
  {
    label: '上海市',
    value: '上海市',
    children: [
      { label: '浦东新区', value: '浦东新区' },
      { label: '宝山区', value: '宝山区' },
      { label: '黄浦区', value: '黄浦区' },
      { label: '普陀区', value: '普陀区' },
      { label: '嘉定区', value: '嘉定区' },
      { label: '杨浦区', value: '杨浦区' },
      { label: '青浦区', value: '青浦区' },
      { label: '松江区', value: '松江区' },
      { label: '长宁区', value: '长宁区' },
      { label: '静安区', value: '静安区' },
      { label: '虹口区', value: '虹口区' },
      { label: '闵行区', value: '闵行区' },
      { label: '徐汇区', value: '徐汇区' },
      { label: '崇明区', value: '崇明区' },
      { label: '奉贤区', value: '奉贤区' },
      { label: '金山区', value: '金山区' },
    ],
  },
  {
    label: '常州市',
    value: '常州市',
    children: [
      { label: '金坛区', value: '金坛区' },
      { label: '武进区', value: '武进区' },
      { label: '天宁区', value: '天宁区' },
      { label: '钟楼区', value: '钟楼区' },
      { label: '溧阳市', value: '溧阳市' },
      { label: '新北区', value: '新北区' },
    ],
  },
  {
    label: '苏州市',
    value: '苏州市',
    children: [
      { label: '张家港市', value: '张家港市' },
      { label: '常熟市', value: '常熟市' },
      { label: '太仓市', value: '太仓市' },
      { label: '虎丘区', value: '虎丘区' },
      { label: '姑苏区', value: '姑苏区' },
      { label: '相城区', value: '相城区' },
      { label: '吴江区', value: '吴江区' },
      { label: '昆山市', value: '昆山市' },
      { label: '吴中区', value: '吴中区' },
    ],
  },
  {
    label: '杭州市',
    value: '杭州市',
    children: [
      { label: '西湖区', value: '西湖区' },
      { label: '上城区', value: '上城区' },
      { label: '富阳区', value: '富阳区' },
      { label: '桐庐县', value: '桐庐县' },
      { label: '建德市', value: '建德市' },
      { label: '淳安县', value: '淳安县' },
      { label: '萧山区', value: '萧山区' },
      { label: '滨江区', value: '滨江区' },
      { label: '江干区', value: '江干区' },
      { label: '下城区', value: '下城区' },
      { label: '临安区', value: '临安区' },
      { label: '余杭区', value: '余杭区' },
      { label: '拱墅区', value: '拱墅区' },
    ],
  },
  {
    label: '宁波市',
    value: '宁波市',
    children: [
      { label: '北仑区', value: '北仑区' },
      { label: '象山县', value: '象山县' },
      { label: '镇海区', value: '镇海区' },
      { label: '江北区', value: '江北区' },
      { label: '奉化区', value: '奉化区' },
      { label: '宁海县', value: '宁海县' },
      { label: '余姚市', value: '余姚市' },
      { label: '鄞州区', value: '鄞州区' },
      { label: '海曙区', value: '海曙区' },
      { label: '慈溪市', value: '慈溪市' },
    ],
  },
  {
    label: '无锡市',
    value: '无锡市',
    children: [
      { label: '宜兴市', value: '宜兴市' },
      { label: '锡山区', value: '锡山区' },
      { label: '梁溪区', value: '梁溪区' },
      { label: '新吴区', value: '新吴区' },
      { label: '惠山区', value: '惠山区' },
      { label: '滨湖区', value: '滨湖区' },
      { label: '江阴市', value: '江阴市' },
    ],
  },
  {
    label: '南京市',
    value: '南京市',
    children: [
      { label: '浦口区', value: '浦口区' },
      { label: '江宁区', value: '江宁区' },
      { label: '雨花台区', value: '雨花台区' },
      { label: '溧水区', value: '溧水区' },
      { label: '六合区', value: '六合区' },
      { label: '高淳区', value: '高淳区' },
      { label: '建邺区', value: '建邺区' },
      { label: '鼓楼区', value: '鼓楼区' },
      { label: '秦淮区', value: '秦淮区' },
      { label: '栖霞区', value: '栖霞区' },
      { label: '玄武区', value: '玄武区' },
    ],
  },
  {
    label: '北京市',
    value: '北京市',
    children: [
      { label: '密云区', value: '密云区' },
      { label: '怀柔区', value: '怀柔区' },
      { label: '延庆区', value: '延庆区' },
      { label: '丰台区', value: '丰台区' },
      { label: '门头沟区', value: '门头沟区' },
      { label: '顺义区', value: '顺义区' },
      { label: '朝阳区', value: '朝阳区' },
      { label: '石景山区', value: '石景山区' },
      { label: '平谷区', value: '平谷区' },
      { label: '通州区', value: '通州区' },
      { label: '昌平区', value: '昌平区' },
      { label: '大兴区', value: '大兴区' },
      { label: '西城区', value: '西城区' },
      { label: '海淀区', value: '海淀区' },
      { label: '东城区', value: '东城区' },
      { label: '房山区', value: '房山区' },
    ],
  },
  {
    label: '天津市',
    value: '天津市',
    children: [
      { label: '东丽区', value: '东丽区' },
      { label: '河东区', value: '河东区' },
      { label: '宝坻区', value: '宝坻区' },
      { label: '和平区', value: '和平区' },
      { label: '河北区', value: '河北区' },
      { label: '静海区', value: '静海区' },
      { label: '河西区', value: '河西区' },
      { label: '津南区', value: '津南区' },
      { label: '滨海新区', value: '滨海新区' },
      { label: '蓟州区', value: '蓟州区' },
      { label: '武清区', value: '武清区' },
      { label: '西青区', value: '西青区' },
      { label: '南开区', value: '南开区' },
      { label: '宁河区', value: '宁河区' },
      { label: '红桥区', value: '红桥区' },
      { label: '北辰区', value: '北辰区' },
    ],
  },
  {
    label: '绍兴市',
    value: '绍兴市',
    children: [
      { label: '嵊州市', value: '嵊州市' },
      { label: '上虞区', value: '上虞区' },
      { label: '越城区', value: '越城区' },
      { label: '柯桥区', value: '柯桥区' },
      { label: '诸暨市', value: '诸暨市' },
      { label: '新昌县', value: '新昌县' },
    ],
  },
  {
    label: '重庆市',
    value: '重庆市',
    children: [
      { label: '合川区', value: '合川区' },
      { label: '潼南区', value: '潼南区' },
      { label: '铜梁区', value: '铜梁区' },
      { label: '长寿区', value: '长寿区' },
      { label: '璧山区', value: '璧山区' },
      { label: '大足区', value: '大足区' },
      { label: '荣昌区', value: '荣昌区' },
      { label: '江北区', value: '江北区' },
      { label: '武隆区', value: '武隆区' },
      { label: '渝中区', value: '渝中区' },
      { label: '永川区', value: '永川区' },
      { label: '大渡口区', value: '大渡口区' },
      { label: '南川区', value: '南川区' },
      { label: '九龙坡区', value: '九龙坡区' },
      { label: '万州区', value: '万州区' },
      { label: '涪陵区', value: '涪陵区' },
      { label: '綦江区', value: '綦江区' },
      { label: '渝北区', value: '渝北区' },
      { label: '梁平区', value: '梁平区' },
      { label: '开州区', value: '开州区' },
      { label: '江津区', value: '江津区' },
      { label: '黔江区', value: '黔江区' },
      { label: '巴南区', value: '巴南区' },
      { label: '南岸区', value: '南岸区' },
      { label: '沙坪坝区', value: '沙坪坝区' },
      { label: '北碚区', value: '北碚区' },
    ],
  },
  {
    label: '成都市',
    value: '成都市',
    children: [
      { label: '彭州市', value: '彭州市' },
      { label: '都江堰市', value: '都江堰市' },
      { label: '青白江区', value: '青白江区' },
      { label: '崇州市', value: '崇州市' },
      { label: '大邑县', value: '大邑县' },
      { label: '简阳市', value: '简阳市' },
      { label: '蒲江县', value: '蒲江县' },
      { label: '金堂县', value: '金堂县' },
      { label: '新津县', value: '新津县' },
      { label: '邛崃市', value: '邛崃市' },
      { label: '青羊区', value: '青羊区' },
      { label: '温江区', value: '温江区' },
      { label: '金牛区', value: '金牛区' },
      { label: '武侯区', value: '武侯区' },
      { label: '双流区', value: '双流区' },
      { label: '郫都区', value: '郫都区' },
      { label: '新都区', value: '新都区' },
      { label: '龙泉驿区', value: '龙泉驿区' },
      { label: '成华区', value: '成华区' },
      { label: '锦江区', value: '锦江区' },
    ],
  },
  {
    label: '台州市',
    value: '台州市',
    children: [
      { label: '临海市', value: '临海市' },
      { label: '路桥区', value: '路桥区' },
      { label: '椒江区', value: '椒江区' },
      { label: '玉环市', value: '玉环市' },
      { label: '三门县', value: '三门县' },
      { label: '温岭市', value: '温岭市' },
      { label: '天台县', value: '天台县' },
      { label: '仙居县', value: '仙居县' },
      { label: '黄岩区', value: '黄岩区' },
    ],
  },
  {
    label: '嘉兴市',
    value: '嘉兴市',
    children: [
      { label: '平湖市', value: '平湖市' },
      { label: '海宁市', value: '海宁市' },
      { label: '秀洲区', value: '秀洲区' },
      { label: '南湖区', value: '南湖区' },
      { label: '嘉善县', value: '嘉善县' },
      { label: '海盐县', value: '海盐县' },
      { label: '桐乡市', value: '桐乡市' },
    ],
  },
];



export const cardTypeList = [
  { value: 'A', text: '一次性兑换卡', description: '不受商品价格约束，套餐内显示的商品，兑换无需补差 价，不找零，一次性兑换' }
  // { value: 'B', text: '储值卡', description: '该卡有实际的面值,用户可以选购任意价值的商品，通过该卡来抵扣价格' },
  // { value: 'C', text: 'C类卡', description: 'A+B通兑：可以兑换实物+电子券类商品' },
  // { value: 'D', text: 'D类卡', description: '仅限兑换：定制商品（特定某一个部分的商品）客户定制的礼 包，套餐，所能兑换的商品范围有限' },
  // { value: 'F', text: 'F类卡', description: '不受商品价格约束，套餐内显示的商品，兑换无需补差 价，不找零，一次性兑换' },
]


export const fileUploadAcion = 'http://redeemfile.xxbiji.com';


export const extraCulteryPrice = 3;//额外餐具费

export const wechatId = {
  mchid: '1579497801',//payjs商户号
  appid: 'wx775ab9e533366bfe',
  key:'1579497801'
}   
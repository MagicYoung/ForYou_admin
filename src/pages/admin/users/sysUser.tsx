import * as React from 'react';
import { Table, Avatar, Tag, Modal, message, Button, Form, Input, TreeSelect } from 'antd';
import { ColumnProps } from 'antd/lib/table';
import * as AV from 'leancloud-storage';
import styles from './index.less';
import { ADMIN_MENU } from '@/config';
import { UserRights } from '@/AVObjects';
import { connect } from 'react-redux';

const { TreeNode } = TreeSelect;

interface PageProps extends ReduxComponentProps { }

@(Form.create() as any)
@connect(state => state.app)
class SysUsersPage extends React.Component<PageProps> {
    state = {
        loading: false,
        dataSource: [],
        AVData: [],
        count: 0,
        page: 1,
        size: 10,
        isSubmiting: false,
        modalVisible: false,
        currUser: null,
        userRightsList: [],
    };

    columns: ColumnProps<any>[] = [
        {
            key: 'avatar',
            title: '头像',
            render: record => (
                <Avatar src={record.avatar && record.avatar.url} icon="user" size="large" />
            ),
        },
        {
            key: 'name',
            title: '用户名',
            dataIndex: 'username',
        },
        {
            key: 'nickname',
            title: '昵称',
            dataIndex: 'nickname',
        },
        {
            key: 'mobile',
            title: '手机号码',
            dataIndex: 'mobilePhoneNumber',
        },
        {
            key: 'menuList',
            title: '菜单权限',
            render: (item) => {
                const menuList = this.state.userRightsList.find((ur) => ur.get('user').id === item.objectId);
                return (
                    item.isSysAdmin ? <div>系统最高权限管理员</div> :
                        (menuList && menuList.get('menuList')) ?
                            <div style={{ maxWidth: 300, display: 'flex', flexWrap: 'wrap' }}>
                                {
                                    menuList.get('menuList').map((ml) => {
                                        return <Tag key={ml}>{this.getUserMenuName(ml)}</Tag>
                                    })
                                }
                            </div> : null
                )
                // return (menuList && menuList.get('menuList')) ? menuList.get('menuList').map((ml) => {
                //     return <Tag key={ml}>{this.getUserMenuName(ml)}</Tag>
                // }) : null
            },
        },
        {
            key: 'firstLogin',
            title: '第一次登陆',
            dataIndex: 'firstLogin',
        },
        {
            key: 'lastLogin',
            title: '最后一次登陆',
            dataIndex: 'lastLogin',
        },
        {
            key: 'isBan',
            title: '是否禁用',
            render: item => {
                const menuList = this.state.userRightsList.find((ur) => ur.get('user').id === item.objectId);
                return (
                    item.isSysAdmin ? <Tag color="green">使用中</Tag> :
                        menuList && menuList.get('menuList').length) ? (<Tag color="green">使用中</Tag>) : (<Tag color="red">禁用</Tag>
                    )
            }
        },
        {
            key: 'actions',
            title: '操作',
            render: (text, record, index) => {
                const menuList = this.state.userRightsList.find((ur) => ur.get('user').id === record.objectId);
                const onUserDelete = () => {
                    Modal.confirm({
                        title: '删除',
                        content: '确定删除改用户？',
                        okText: '确定',
                        okType: 'danger',
                        cancelText: '取消',
                        onOk: async () => {
                            const userId = record.originAVObject.id;
                            const userRightsList = this.state.userRightsList.find((i) => i.get('user').id === userId);
                            if (userRightsList) {
                                userRightsList?.set('isDelete', true);
                                userRightsList?.set('menuList', []);
                                await userRightsList.save();
                            }
                            this.onSearch();
                        },
                    });
                }
                return [
                    <div key="detail">
                        {
                            <div>
                                <div>
                                    <a onClick={() => {
                                        this.setState({ currUser: record.originAVObject, modalVisible: true })
                                    }}>修改权限</a>
                                </div>
                                {
                                    record.isSysAdmin || (!menuList || !menuList.get('menuList').length) ? null :
                                        <div style={{ marginTop: 5 }}>
                                            <a onClick={() => {
                                                onUserDelete()
                                            }}>禁用</a>
                                        </div>
                                }
                            </div>
                        }
                    </div>,

                ];
            },
        },
    ];

    getUserMenuName = (path: string) => {
        let menuName = '';
        ADMIN_MENU.map((item) => {
            if (item.path === path) {
                menuName = item.name;
            } else {
                if (item.subMenu) {
                    item.subMenu.map((subm) => {
                        if (subm.path === path) {
                            menuName = subm.name;
                        }
                    })
                }
            }
        })
        return menuName;
    }

    componentDidMount() {
        this.onSearch();
    }

    onSearch = async () => {
        const query = new AV.Query('_User');
        query.equalTo('isAdmin', true);
        this.setState({ loading: true });
        const data = await query.find();

        const queryR = new AV.Query('User_Rights');
        queryR.notEqualTo('isDelete', true);
        const resR = await queryR.find();
        this.setState({
            AVData: data,
            dataSource: data.map(i => {
                return {
                    ...i.toJSON(),
                    originAVObject: i,
                };
            }),
            loading: false,
            userRightsList: resR
        });
    };

    onPageChange = (page: number) => {
        this.setState({ page }, this.onSearch);
    };

    onShowSizeChange = (page: number, size: number) => {
        this.setState({ page, size }, this.onSearch);
    };


    onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        this.props.form.validateFields(async (err, fieldsValue) => {
            // return
            if (err) return;
            try {
                this.setState({ isSubmiting: true })
                const { currUser, userRightsList } = this.state
                if (!currUser) {
                    var user = new AV.User();
                    user.setUsername(fieldsValue.username);
                    user.set("isAdmin", true);
                    user.set('nickname', fieldsValue.nickname);
                    user.set('mobilePhoneVerified', true);
                    user.setPassword(fieldsValue.mobilePhoneNumber);
                    user.setMobilePhoneNumber(fieldsValue.mobilePhoneNumber);
                    const res = await user.save();
                    // 当前用户不具备 Administrator，因此你需要把当前用户添加到 Role 的 Users 中
                    let relation = this.props.adminRole.getUsers();
                    relation.add(res);
                    await this.props.adminRole.save();
                    const userRightsObj: AV.Object = new UserRights();
                    userRightsObj.set('user', res);
                    userRightsObj.set('menuList', fieldsValue.menuList);
                    await userRightsObj.save();
                } else {
                    const ur = userRightsList.find((item) => item.get('user').id === currUser.id);
                    const userRightsObj = ur || new UserRights();
                    userRightsObj.set('menuList', fieldsValue.menuList);
                    userRightsObj.set('user', currUser);
                    await userRightsObj.save(); 
                    // 当前用户不具备 Administrator，因此你需要把当前用户添加到 Role 的 Users 中
                    let relation = this.props.adminRole.getUsers();
                    relation.add(currUser);
                    await this.props.adminRole.save();
                    message.info('如果您修改的是自己的，权限，刷新当前页面生效')
                }


                this.setState({ isSubmiting: false, modalVisible: false, currUser: null });
                this.onSearch();
            } catch (err) {
                console.error(err);
                this.setState({ isSubmiting: false });
                message.error(err || '保存失败！');
            }
        });
    }
    getTreeNode = (menu: AdminMenuItem[]) => {
        return menu.map(item =>
            item.subMenu ? (
                <TreeNode value={item.path} title={item.name} key={item.path} >
                    {this.getTreeNode(item.subMenu)}
                </TreeNode>

            ) : (
                    <TreeNode value={item.path} title={item.name} key={item.path} >
                    </TreeNode>
                )
        );
    }
    getUserMenuLis = () => {
        const ur = this.state.userRightsList.find((item) => item.get('user').id === this.state.currUser.id);
        if (ur) {
            return ur.get('menuList');
        } else { return []; }

    }
    render() {
        const { getFieldDecorator } = this.props.form;
        const { loading, dataSource, count, currUser } = this.state;
        const formItemLayout = {
            labelCol: {
                xs: { span: 24 },
                sm: { span: 6 },
            },
            wrapperCol: {
                xs: { span: 24 },
                sm: { span: 16 },
            },
        };
        return (
            <div style={{ height: '100%', overflow: 'auto' }}>
                <div style={{ marginBottom: 10 }}>
                    <Button type="primary" onClick={() => { this.setState({ modalVisible: true, currUser: null }) }}> 新增用户 </Button>
                </div>

                <Table
                    rowKey={i => i.objectId}
                    loading={loading}
                    pagination={{
                        total: count,
                        showSizeChanger: true,
                        onShowSizeChange: this.onShowSizeChange,
                        onChange: this.onPageChange,
                        showTotal: (total, range) => `${range[0]}-${range[1]} 总${total}条记录`,
                    }}
                    columns={this.columns}
                    dataSource={dataSource}
                />
                <Modal
                    title={currUser ? '编辑权限' : '新增管理员'}
                    visible={this.state.modalVisible}
                    footer={null}
                    onCancel={() => {
                        this.setState({ modalVisible: false, currUser: null });
                    }}
                >
                    <Form layout="vertical" {...formItemLayout} onSubmit={this.onSubmit}>
                        <Form.Item
                            label="用户名"
                        >
                            {getFieldDecorator('username', {
                                rules: [{ required: true, message: '请输入用户名' }],
                                initialValue: currUser ? currUser.get('username') : ''
                            })(<Input disabled={!!currUser} placeholder="请输入用户名：Jack001" />)}
                        </Form.Item>
                        <Form.Item
                            label="昵称"
                        >
                            {getFieldDecorator('nickname', {
                                initialValue: currUser ? currUser.get('nickname') : ''
                            })(<Input disabled={!!currUser} placeholder="请输入昵称：如张三" />)}
                        </Form.Item>
                        <Form.Item
                            label="电话号码"
                        >
                            {getFieldDecorator('mobilePhoneNumber', {
                                rules: [{ required: true, message: '请输入电话号码' }],
                                initialValue: currUser ? currUser.get('mobilePhoneNumber') : '',
                                pattern: /^1[34578]\d{9}$/
                            })(<Input disabled={!!currUser} placeholder="请输入电话号码" />)}
                        </Form.Item>

                        <Form.Item
                            label="菜单权限"
                        >
                            {getFieldDecorator('menuList', {
                                initialValue: currUser ? this.getUserMenuLis() : []
                            })(
                                <TreeSelect
                                    showSearch
                                    style={{ width: '100%' }}
                                    //value={this.state.value}
                                    dropdownStyle={{ maxHeight: 400, overflow: 'auto' }}
                                    placeholder="请选择权限,如果权限为空，用户不能登录"
                                    allowClear
                                    multiple
                                    treeDefaultExpandAll
                                >
                                    {
                                        this.getTreeNode(ADMIN_MENU)
                                    }
                                </TreeSelect>
                            )}
                            <div style={{ fontSize: 12, color: '080808' }}>tips:如果选择了子级菜单，没选父级菜单，那么子级菜单权限不会生效哦</div>
                        </Form.Item>

                        <div className={styles.modalFooter}>
                            <Button onClick={
                                () => {
                                    this.setState({ modalVisible: false });
                                }
                            } style={{ marginRight: 8 }}>取消 </Button>
                            <Button type="primary" loading={this.state.isSubmiting} htmlType="submit">保存</Button>
                        </div>
                    </Form>
                </Modal>
            </div>
        );
    }
}

export default SysUsersPage;

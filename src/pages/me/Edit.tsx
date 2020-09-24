import * as React from 'react';
import ReactDOM from 'react-dom';
import * as AV from 'leancloud-storage';
import {
  List,
  InputItem,
  SegmentedControl,
  DatePicker,
  WingBlank,
  WhiteSpace,
  Toast,
} from 'antd-mobile';
import { Upload, Avatar } from 'antd';
import zhCN from 'antd-mobile/lib/date-picker/locale/zh_CN';
import Button from '@/components/Button';
import { uploadFiles, getUploadListItem } from '@/utils';

const ListItem = List.Item;

export default class EditPage extends React.Component {
  state = {
    avatar: null,
    nickname: '',
    sex: -1,
    birthday: undefined,
    src: null,
  };

  upload: Upload;
  componentDidMount() {
    const user = AV.User.current();
    this.setState({
      avatar: getUploadListItem(user.get('avatar'), 0) || null,
      nickname: user.get('nickname') || '',
      sex: user.get('sex'),
      birthday: user.get('birthday') || null,
    });
    let uploadDOM = ReactDOM.findDOMNode(this.upload) as Element;
    setTimeout(() => {
      let addClassDOM = uploadDOM.querySelector('.ant-upload>.ant-upload');
      addClassDOM.className += ' needsclick';
    }, 0);
  }

  onAvatarChange = ({ file }) => {
    this.setState({ avatar: file });

    const reader = new FileReader();
    reader.onload = () => {
      this.setState({ src: reader.result });
    };
    file && reader.readAsDataURL(file.originFileObj);
  };

  onSave = async () => {
    Toast.loading('正在保存', 0);
    const user = AV.User.current();
    const uploaded = await uploadFiles([this.state.avatar]);
    await user.save({
      avatar: uploaded[0] || null,
      nickname: this.state.nickname,
      sex: this.state.sex,
      birthday: this.state.birthday,
    });
    Toast.success('保存成功', 1.5);
  };

  render() {
    const { nickname, sex, birthday, src, avatar } = this.state;
    const avatarUpload = (
      <Upload ref={o => (this.upload = o)} onChange={this.onAvatarChange} showUploadList={false}>
        <Avatar src={src || (avatar && avatar.url)} icon="user" size="large" />
      </Upload>
    );
    return (
      <React.Fragment>
        <List>
          <ListItem
            style={{ padding: '12px 0 0px 15px' }}
            arrow="horizontal"
            extra={avatarUpload}>
            头像
            </ListItem>
          <InputItem
            value={nickname}
            onChange={nickname => this.setState({ nickname })}
            placeholder="请输入昵称"
            style={{ textAlign: 'right' }}>
            昵称
            </InputItem>
          <ListItem
            extra={
              <SegmentedControl
                onValueChange={value => this.setState({ sex: value === '男' ? 0 : 1 })}
                values={['男', '女']}
                selectedIndex={sex}
              />
            }>
            性别
            </ListItem>
          <DatePicker
            locale={zhCN}
            mode="date"
            title="生日"
            value={birthday}
            minDate={new Date('1940-01-01')}
            maxDate={new Date()}
            onChange={birthday => this.setState({ birthday })}>
            <List.Item arrow="horizontal" extra="请选择">
              生日
              </List.Item>
          </DatePicker>
        </List>
        <WhiteSpace size="lg" />
        <WingBlank>
          <Button onClick={this.onSave}>保存</Button>
        </WingBlank>
      </React.Fragment>
    );
  }
}

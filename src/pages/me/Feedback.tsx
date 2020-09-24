import * as React from 'react';
import styles from './Edit.less';
import { TextareaItem, WingBlank, Toast } from 'antd-mobile';
import Button from '@/components/Button';
import router from 'umi/router';
import { Divider } from 'antd';
import * as AV from 'leancloud-storage';

const FeedbackClass = AV.Object.extend('Feedback');

class Feedback extends React.Component<{}> {
  state = {
    value: '',
  };

  onSave = async () => {
    const feedback: AV.Object = new FeedbackClass();
    feedback.set('content', this.state.value);
    feedback.set('user', AV.User.current());
    Toast.loading('正在提交', 0);
    await feedback.save();
    Toast.success('提交成功', 1.5);
    router.goBack();
  };

  render() {
    return (
      <div className={styles.container}>
        <TextareaItem
          placeholder="请填写意见"
          value={this.state.value}
          onChange={value => this.setState({ value })}
          rows={8}
        />
        <Divider />
        <WingBlank>
          <Button onClick={this.onSave}>提交</Button>
        </WingBlank>
      </div>
    );
  }
}

export default Feedback;

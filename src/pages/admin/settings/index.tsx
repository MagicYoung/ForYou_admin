import * as React from 'react';
import { Tabs } from 'antd';
import styles from './index.less';
import Mall from './components/Mall';

const TabPane = Tabs.TabPane;

export default class SettingsPage extends React.Component {
  render() {
    return (
      <div className={styles.container}>
        <Tabs defaultActiveKey="1">
          <TabPane tab="商城设置" key="1">
            <Mall />
          </TabPane>
          {/* <TabPane tab="安全设置" key="2">
            <Security />
          </TabPane> */}
        </Tabs>
      </div>
    );
  }
}

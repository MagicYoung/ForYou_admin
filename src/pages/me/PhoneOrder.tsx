import * as React from 'react';
import { WingBlank } from 'antd-mobile';
import { Card, Icon } from 'antd';

export default class PhoneOrder extends React.Component<ReduxComponentProps> {
  render() {
    return (
      <div>
        <WingBlank>
          <Card
            title="拨打客服电话"
            extra={<a href="tel:400-627-5757">400-627-5757</a>}
            style={{ width: '100%', marginTop: 24 }}>
            <div>
              <Icon style={{ marginRight: 6 }} type="credit-card" />
              卡号: {this.props.location.query.no}
            </div>
            <div style={{ marginTop: 8 }}>
              <Icon style={{ marginRight: 6 }} type="lock" />
              卡密: {this.props.location.query.pwd}
            </div>
          </Card>
        </WingBlank>
      </div>
    );
  }
}

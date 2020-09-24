import * as React from 'react';
import { Row, Col } from 'antd';
import { NumberInfo } from 'ant-design-pro';
import { MiniArea, ChartCard } from 'ant-design-pro/lib/Charts';
import * as AV from 'leancloud-storage';
import moment from 'moment';

export default class Anlysis extends React.Component {
  state = {
    count: 0,
    users: [],
  };
  async componentDidMount() {
    const query = new AV.Query('_User');
    const count = await query.count();
    query.greaterThanOrEqualTo(
      'createdAt',
      moment()
        .subtract(7, 'days')
        .toDate()
    );
    const users = await query.find();

    this.setState({
      count,
      users: users.map(i => i.toJSON()),
    });
  }
  render() {
    const { count, users } = this.state;
    const visitData = [];
    for (let i = 7; i > 0; i--) {
      const theDayStart = moment()
        .subtract(i, 'days')
        .format('YYYY-MM-DD');
      const theDayEnd = moment()
        .subtract(i - 1, 'days')
        .format('YYYY-MM-DD');
      const theDayUsers = users.filter(i => {
        return moment(i.createdAt).isBetween(moment(theDayStart), moment(theDayEnd));
      });
      visitData.push({
        x: theDayStart,
        y: theDayUsers.length,
      });
    }
    return (
      <Row>
        <Col span={8}>
          <ChartCard title="总用户数量" total={count} contentHeight={134}>
            <NumberInfo subTitle={<span>本周新增</span>} total={users.length} />
            <MiniArea line={true} height={45} data={visitData} />
          </ChartCard>
        </Col>
      </Row>
    );
  }
}

import * as React from 'react';
import hoistStatics from 'hoist-non-react-statics';
import { withRouter, RouteComponentProps } from 'react-router-dom';
import $ from 'jquery';

interface WrappedProps extends RouteComponentProps<any> {
  wrappedComponentRef?: any;
}

const scrollTopForId = {};

export default (containerId: string) => Component => {
  class WrappedComponent extends React.Component<WrappedProps> {
    static displayName = `withHashRouter(${Component.displayName || Component.name})`;
    static WrappedComponent = Component;
    componentDidMount() {
      $(`#${containerId}`).scrollTop(scrollTopForId[containerId] || 0);
    }
    componentWillUnmount() {
      scrollTopForId[containerId] = $(`#${containerId}`).scrollTop();
    }
    render() {
      const { wrappedComponentRef, ...remainingProps } = this.props;
      return <Component {...remainingProps} ref={wrappedComponentRef} />;
    }
  }
  return hoistStatics(withRouter(WrappedComponent), Component);
};

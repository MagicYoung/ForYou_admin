import * as React from 'react';
import { USER_LAYOUT_ROUTES } from '@/config';
import UserLayout from './User';
import AdminLayout from './admin';
import CommonLayout from './common';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/lib/locale-provider/zh_CN';

interface MainLayoutProps {
  location?: Location;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children, location, ...restProps }) => {
  if (USER_LAYOUT_ROUTES.some(pathname => location.pathname.toLowerCase() === pathname)) {
    return <UserLayout {...restProps}>{children}</UserLayout>;
  }
  if (location.pathname.toLowerCase().startsWith('/admin')) {
    return (
      <AdminLayout location={location} {...restProps}>
        {children}
      </AdminLayout>
    );
  }
  return (
    <CommonLayout location={location} {...restProps}>
      {children}
    </CommonLayout>
  );
};

export default props => (
  <ConfigProvider locale={zhCN}>
    <MainLayout {...props} />
  </ConfigProvider>
);

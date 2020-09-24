declare namespace State {
  interface LoadingState {
    gloabl?: boolean;
    models?: {
      [key: string]: boolean;
    };
    effects?: {
      [key: string]: boolean;
    };
  }

  interface AppState {
    isMobile?: boolean;
    menuCollapsed?: boolean;
    setting?: AV.Object;
    adminRole?: AV.Role;
    currentCity?: string;
  }

  interface HomeState {
    banners?: AV.Queriable[];
    designs?: AV.Queriable[];
    categories?: AV.Queriable[];
    AVCategories?: AV.Queriable[];
    addresses?: AV.Queriable[];
    products?: AV.Queriable[];
    drawerVisible?: boolean;
    item?: AV.Object;
    cartNum: number;
    selectedPhoneCard: AV.Queriable;
  }

  interface OrderState {
    cart?: AV.Queriable[];
    cartChecked: AV.Queriable[];
    selectedAddress?: AV.Object;
    orders: AV.Queriable[];
    selectedCardCoupon: any[];
  }

  interface LoginState {
    user?: AV.User;
  }

  interface RootState {
    app: AppState;
    home: HomeState;
    login: LoginState;
    order: OrderState;
    loading: LoadingState;
    routing: {
      location: {
        pathname: string;
        search: string;
        hash: string;
        query: Record<string, any>;
      };
    };
    [key: string]: any;
  }
}

declare interface ReduxComponentProps {
  dispatch?: Dispatch;
  [key: string]: any;
}

declare function dispatch(action: Action): Promise<any>;

declare type Dispatch = (action: Action) => Promise<any>;

interface Action {
  type: string;
  payload?:
  | {
    [key: string]: any;
  }
  | any;
}

interface Effect {
  put: (action: Action) => any;
  call: Function;
  take: (type: string) => any;
  select: (mapState: (state: State.RootState) => {}) => any;
}

interface Model<T> {
  namespace: string;
  state: T;
  reducers: {
    save?: (state: T, action: Action) => T;
    [key: string]: (state: T, action: Action) => T;
  };
  effects?: {
    [key: string]: (action: Action, effects: Effect) => IterableIterator<any>;
  };
  subscriptions?: {
    setup?: (arg: { dispatch: Dispatch }) => void;
    [key: string]: Function;
  };
}

interface ReactLocation {
  hash?: string;
  key?: string;
  pathname: string;
  query: {
    [key: string]: any;
  };
  search: string;
  state?: any;
}

declare module 'react-redux' {
  export function connect(
    mapStateToProps?: (
      state: State.RootState,
      ownProps: Record<string, any>
    ) => Function | Record<string, any>,
    mapDispatchToProps?: Function,
    mergeProps?: Function,
    options?: Record<string, any>
  ): Function;
}

interface AdminMenuItem {
  path: string;
  name: string;
  icon: string;
  subMenu?: AdminMenuItem[];
}

interface TabItem {
  path: string;
  name: string;
  icon: string;
}

interface AVImg {
  id: string;
  name: string;
  url: string;
  thumbUrl: string;
}

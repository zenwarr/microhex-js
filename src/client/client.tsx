import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {connect, Provider} from 'react-redux';
import {initMenu} from './menu';
import * as classNames from 'classnames';
import * as Actions from './actions';
import {StoreManager} from './store';
import * as Immutable from 'immutable';

require('../styles/style.scss');

initMenu();

interface ITabProps {
  id:number;
  title:string;
  content:JSX.Element;
  isActive?:boolean;
  onClick?:(e:React.MouseEvent) => void;
  onClose?:(e:React.MouseEvent) => void;
}

class Tab extends React.Component<ITabProps, void> {
  render():JSX.Element {
    let classes = classNames({
      'tab': true,
      'tab--active': this.props.isActive
    });

    console.log('Creating tab, isActive = ', this.props.isActive, ', classes are', classes);

    return (
      <div className={classes} onClick={this.props.onClick.bind(this)}>
        <span className='tab__title'>{this.props.title}</span>
      </div>
    );
  }

  static defaultProps:ITabProps = {
    id: -1,
    title: '',
    content: null,
    isActive:false,
    onClick: () => {},
    onClose: () => {},
  };
}

interface ITabsProps {
  tabList:ITabProps[];
  currentTabId:number;
  onTabClick:(tabId:number)=>void;
}

class Tabs extends React.Component<ITabsProps, void> {
  constructor(props:ITabsProps) {
    super(props);
  }

  static defaultProps:ITabsProps = {
    tabList: [],
    currentTabId: -1,
    onTabClick: (tabId:number) => {}
  };

  render():JSX.Element {
    return (
      <div className='tabs'>
        <div className='tabs__tabs'>
          {this.props.tabList.map(tab => {
            return <Tab {...tab} isActive={tab.id === this.props.currentTabId} key={tab.id}
                                 onClick={this.props.onTabClick.bind(this, tab.id)} />;
          })}
        </div>

        <div className='tabs__panes'>
          {this.props.tabList.map(tab => {
            return <div className='tab__pane' hidden={tab.id !== this.props.currentTabId} key={tab.id}>
              {tab.content}
            </div>;
          })}
        </div>
      </div>
    );
  }
}

const StateTabs = connect((state:Immutable.Map<string, any>) => {
  console.log('invoked mapStateToProps');

  return {
    tabList: state.get('tabs').map(td => {
      return {
        id: td.id,
        title: td.title
      };
    }),
    currentTabId: state.get('currentTabId')
  };
}, {
  onTabClick: function(tabId:number):Actions.IActivateTab {
    console.log('action creator called');
    return {
      type: Actions.ACTIVATE_TAB,
      tabId: tabId
    };
  }
})(Tabs);

let application_jsx:JSX.Element;

if (process.env.NODE_ENV === 'production') {
  application_jsx = (
    <div className='working-area'>
      <StateTabs />
    </div>
  );
} else {
  let DevTools = require('./store-dev').DevTools;

  application_jsx = (
    <div className='working-area'>
      <StateTabs />

      <DevTools />
    </div>
  );
}

class Application extends React.Component<any, any> {
  render():JSX.Element {
    return application_jsx;
  }
}

// add #app to body
let app:Element = document.createElement('div');
app.setAttribute('id', 'app');
document.body.insertBefore(app, document.body.firstChild);

ReactDOM.render(<Provider store={StoreManager.instance.store}><Application /></Provider>, document.getElementById('app'));

StoreManager.instance.store.dispatch({
  type: Actions.ADD_TAB,
  tabData: {
    id: 0,
    title: 'New tab'
  }
} as Actions.IAddTab);

StoreManager.instance.store.dispatch({
  type: Actions.ADD_TAB,
  tabData: {
    id: 1,
    title: 'Another tab'
  }
} as Actions.IAddTab);


import * as React from 'react';
import * as Actions from './actions';
import * as State from './state';
import {connect} from 'react-redux';
import * as classNames from 'classnames';
import {HexComponent} from '../hex/index';

export interface ITabProps {
  id:number;
  title:string;
  content?:JSX.Element;
  isActive?:boolean;
  onClick?:(e:React.MouseEvent) => void;
  onClose?:(e:React.MouseEvent) => void;
}

export class Tab extends React.Component<ITabProps, void> {
  render():JSX.Element {
    let classes = classNames({
      'tab': true,
      'tab--active': this.props.isActive
    });

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

export interface ITabsProps {
  tabList:ITabProps[];
  currentTabId:number;
  onTabClick:(tabId:number)=>void;
}

export class Tabs extends React.Component<ITabsProps, void> {
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

export const StateTabs = connect((state:State.ApplicationState) => {
  return {
    tabList: state.tabs.map((td:State.TabState):ITabProps => {
      let editor:State.EditorState = state.editors.find((s:State.EditorState) => s.id === td.editorId);

      return {
        id: td.id,
        title: td.title,
        content: editor == null ? null : (
          <HexComponent document={editor.document} columns={[]} />
        )
      };
    }).toJS(),
    currentTabId: state.currentTabId
  };
}, {
  onTabClick: function(tabId:number):Actions.IActivateTab {
    return {
      type: Actions.ACTIVATE_TAB,
      tabId: tabId
    };
  }
})(Tabs);

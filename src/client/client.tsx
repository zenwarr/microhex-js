import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {Provider} from 'react-redux';
import {initMenu} from './menu';
import {StoreManager} from './store';
import {IHexProps} from '../hex/index';
import {StateTabs} from './tabs';

try {
  require('../styles/style.scss');
} catch (err) {
  ;
}

initMenu();

interface IWorkingAreaState {
  editors?:IHexProps[];
}

class WorkingArea extends React.Component<IWorkingAreaState, void> {
  static defaultProps:IWorkingAreaState = {
    editors: []
  };

  render() {
    return (
      <div className='working-area'>
        <StateTabs></StateTabs>
      </div>
    );
  }
}

let application_jsx:JSX.Element;

if (process.env.NODE_ENV === 'production') {
  application_jsx = (
    <div className='application'>
      <WorkingArea />
    </div>
  );
} else {
  let DevTools = require('./store-dev').DevTools;

  application_jsx = (
    <div className='application'>
      <WorkingArea />
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

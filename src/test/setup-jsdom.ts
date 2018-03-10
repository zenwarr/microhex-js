import { JSDOM } from 'jsdom';

const dom = new JSDOM('');

global['window'] = dom.window;
global['document'] = dom.window.document;

Object.keys(dom).forEach((property) => {
  if (typeof global[property] === 'undefined') {
    global[property] = dom[property];
  }
});

global['navigator'] = {
  userAgent: 'node.js'
};

const configure = require('enzyme').configure;
const Adapter = require('enzyme-adapter-react-16');

configure({
  adapter: new Adapter()
});

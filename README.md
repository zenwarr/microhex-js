Microhex is crossplatform binary-editing software based on web technologies (JavaScript, Node.JS, Electron).

You should have Node.js installed to use this application. Visit http://nodejs.org/ to get information
about installing it. Additionally, run

    npm install -g electron-prebuilt bower

to install required dependencies. Make sure that installed electron executable is accessible from your path
(if you are using Windows).

Go to root directory of microhex-js (where app.js is located). Open command shell and run the following
commands:

    npm install
    bower install

Now application is ready to start. Run it:
    electron .

In order to run tests you should install nodeunit with the following command:
    npm install -g nodeunit
All test are located in 'test' directory. You can run only single test package with command (example)
    nodeunit test/utils
or all tests in once:
    node test/all.js

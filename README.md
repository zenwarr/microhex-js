Microhex is crossplatform binary-editing software based on web technologies (JavaScript, Node.JS, Electron).

You should have Node.js (v >= 6.0) and npm (>= 3.0) installed to use this application.
Visit http://nodejs.org/ to get information about installing it.

Go to root directory of microhex-js (where package.json file is located). Open command
shell and run the following command to install required dependencies:

    npm install

Next step is to build application files. Run

    npm run build

to compile application.

Now application is ready to start. Run it with:

    npm start

In order to launch tests you should run:

    npm run build-and-test

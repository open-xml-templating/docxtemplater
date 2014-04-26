# Contribution Guide

This is an open-source community. Please be kind and have a positive attitude. You are not my client.

## Issues

Please give information about:

Whether you use docxtemplater:

 - on the client side (which browser ?, or does it fail on all browsers ?)
 - on the server side

## Pull Requests

To generate the JS files, I use gulp. For this you will need to install gulp globally:

    npm install -g gulp
    npm install -g jasmine-node

You than just execute `gulp` in the command line.


Be sure the tests still pass (requires jasmine-node installe globally):

    npm test

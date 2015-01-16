language: node_js

node_js:
    - "0.11"
    - "0.10.32"

env:
    - NODE_SCRIPT=node
    - NODE_SCRIPT=./iojs-v1.0.2-linux-x64/bin/iojs

matrix:
    exclude:
        - node_js: 0.10.32
        - env: NODE_SCRIPT=./iojs-v1.0.2-linux-x64/bin/iojs

script:
    - $NODE_SCRIPT $(whereis jasmine-node | awk "{print $(NF-1)}") test/spec/docxgenTest.spec.js

before_script:
    - "npm install -g npm"
    - "npm install -g gulp"
    - "npm install -g jasmine-node"
    - "gulp allCoffee"
    - "wget https://iojs.org/dist/v1.0.2/iojs-v1.0.2-linux-x64.tar.xz"
    - "tar xvfJ iojs-v1.0.2-linux-x64.tar.xz"
    - "echo $(whereis jasmine-node)"
    - "echo $(whereis ls)"
    - "echo $(whereis jasmine-node | awk '{print $(NF-1)}')"

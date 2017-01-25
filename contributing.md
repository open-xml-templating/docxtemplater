Contribution Guide
==================

This is an open-source project. Please be kind and have a positive attitude. You are not my client.

How can you solve an issue by your own
--------------------------------------

The best way to debug a problem is to **inspect** the docx. You can unzip a docx, the main files are the following:

-	`word/document.xml` : contains the main part of the document
-	`word/media/` : contains the images
-	`word/_rels/` : contains the link to the images, other media

Issues
------

Please give information about:

Whether you use docxtemplater:

-	on the client side (which browser ?, or does it fail on all browsers ?)
-	on the server side

please also include a **minimal, self contained code sample** that reproduces the bug.

### What is a minimal, self contained code sample ?

A minimal,self contained code sample is a sample that shows the issue that you are having.

It is **minimal** because it should be the way to show the issue that doesn't add any unnecessary stuff, like including other modules, doing something unrelated to docxtemplater, ...

It is **self contained** because everything to reproduce the issue is inside the sample, **including** the docx documents, images, ... if they are any.

I don't work primarly with microsoft word and don't want to recreate all samples by hand, using a minimal, self contained example will help a lot to get a **faster** answer to your issue.

Pull Requests
-------------

To generate the JS files, I use npm scripts :

```
git clone https://github.com/open-xml-templating/docxtemplater.git
cd docxtemplater
npm run preversion
```

Be sure the tests still pass :

```
npm test
```

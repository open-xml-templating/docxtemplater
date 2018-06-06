.. index::
   single: Testing

..  _testing:

Testing
=======

This page documents how docxtemplater is tested.

First, there are multiple types of tests done in docxtemplater

 * **Integration tests**, that are tests where we take a real .docx document, some JSON data, render the document and then verify that it the same as the expected document (this can be seen as snapshot testing)
 * **Regression tests**, that are tests where we take real or fake docx to ensure that bugfixes that have been found can't occur in the future
 * **Unit tests**, that help understand the internals of docxtemplater, and allows to verify that the internal data structures of the parsed template are correct
 * **Speed tests**, that help to optimize the speed of docxtemplater

Integration
-----------

The integration tests are in es6/tests/integration.js


.. code-block:: javascript

	it("should work with table pptx", function (done) {
		createDoc("table-example.pptx").then(function (doc) => {
			doc.setData({users: [{msg: "hello", name: "mary"}, {msg: "hello", name: "john"}]}).render().then(function () {
				shouldBeSame({doc, expectedName: "table-example-expected.pptx"}).then(() => {
					done();
				});
			});
		});
	});

All of the test documents are in the folder `examples/`

* We first load a document from table-example.pptx 
* We then set data and render the document.
* We then verify that the document is the same as "table-example-expected.pptx"

shouldBeSame will, for each XML file that is inside the zip document, pretty print it, and then compare them. That way, we have a more beautiful diff and spacing differences do not matter in the output document.

Regression tests
----------------

They are many regression tests, eg tests that are there to ensure that bugs that occured once will not appear again in the future.

A good example of such a test is 

Docxtemplater https://github.com/open-xml-templating/docxtemplater/issues/14

Docxtemplater was not able to render text that was written in russian (because of an issue with encoding).

.. code-block:: javascript

    it("should insert russian characters", function (done) {
        const russianText = [1055, 1091, 1087, 1082, 1080, 1085, 1072];
        const russian = russianText.map(function (char) {
            return String.fromCharCode(char);
        }).join("");
        createDoc("tag-example.docx").then(function (doc) {
            JSZip.loadAsync(doc.loadedContent).then(function (zip) {
                const d = new Docxtemplater().loadZip(zip);
                d.setData({last_name: russian});
                d.render().then(function() {
                    d.getFullText().then(function (outputText) {
                        expect(outputText.substr(0, 7)).to.be.equal(russian);
                        done();
                    });
                });
            });
        });
    });

This test ensures that the output of the document is correct.

Every time we correct a bug, we should also add a regression test to make sure that bug cannot appear in the future.

Unit tests
-----------

The input/output for the unit tests can be found in es6/tests/fixtures.js :

For example


.. code-block:: javascript

    simple: {
        it: "should handle {user} with tag",
        content: "<w:t>Hi {user}</w:t>",
        scope: {
            user: "Foo",
        },
        result: '<w:t xml:space="preserve">Hi Foo</w:t>',
        lexed: [
            {type: "tag", position: "start", value: "<w:t>", text: true},
            {type: "content", value: "Hi ", position: "insidetag"},
            {type: "delimiter", position: "start"},
            {type: "content", value: "user", position: "insidetag"},
            {type: "delimiter", position: "end"},
            {type: "tag", value: "</w:t>", text: true, position: "end"},
        ],
        parsed: [
            {type: "tag", position: "start", value: "<w:t>", text: true},
            {type: "content", value: "Hi ", position: "insidetag"},
            {type: "placeholder", value: "user"},
            {type: "tag", value: "</w:t>", text: true, position: "end"},
        ],
        postparsed: [
            {type: "tag", position: "start", value: '<w:t xml:space="preserve">', text: true},
            {type: "content", value: "Hi ", position: "insidetag"},
            {type: "placeholder", value: "user"},
            {type: "tag", value: "</w:t>", text: true, position: "end"},
        ],
    },


There you can see what the different steps of docxtemplater are, lex, parse, postparse.


Speed tests
-----------

To ensure that there is no regression on the speed of docxtemplater, we test the performance by generating multiple documents and we expect that the time to generate these documents should be less than for example 100ms.

These tests can be found in es6/tests/speed.js

For example for this test: 

.. code-block:: javascript

    it("should be fast for loop tags", function (done) {
        const content = "<w:t>{#users}{name}{/users}</w:t>";
        const users = [];
        for (let i = 1; i <= 1000; i++) {
            users.push({name: "foo"});
        }
        const time = new Date();
        createXmlTemplaterDocx(content, {tags: {users}}).then(function (doc) {
            doc.render().then(function () {
                const duration = new Date() - time;
                expect(duration).to.be.below(60);
                done();
            });
        });
    });

Here we verify that rendering a loop of 1000 items takes less than 60ms.
This happens to also be a regression test, because they was a problem when generating documents with loops (the loops became very slow for more than 500 items), and we now ensure that such a regression cannot occur in the future.

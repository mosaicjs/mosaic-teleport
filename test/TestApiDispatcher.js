var expect = require('expect.js');
var _ = require('underscore');
var Mosaic = require('mosaic-commons');
require('..');
var Utils = require('./Utils');

var bindHttp = Mosaic.ApiDescriptor.bind;

describe('ApiDispatcher', function() {

    var FirstType = Mosaic.Class.extend({
        sayHello : bindHttp('/hello', 'get', function(options) {
            var name = options.name || 'Anonymous';
            return {
                msg : 'Hello, ' + name + '!'
            };
        }),
        sayGoodbye : bindHttp('/bye', 'get', function(options) {
            var name = options.name || 'Anonymous';
            return {
                msg : 'Bye-bye, ' + name + '!'
            };
        })
    });
    var SecondType = Mosaic.Class.extend({
        sendMsg : bindHttp('/message', 'post', function(options) {
            var name = options.name || 'Anonymous';
            return {
                msg : name + ', your message was sent!'
            };
        })
    });

    it('should be able to provide API description for each path', function() {
        var dispatcher = new Mosaic.ApiDispatcher({
            path : '/toto'
        });
        dispatcher.addEndpoint({
            path : '/first',
            instance : new FirstType()
        });
        dispatcher.addEndpoint({
            path : '/second',
            instance : new SecondType()
        });

        var descriptorJson = dispatcher.getDescriptorJson('/toto/first');
        expect(descriptorJson).to.eql({
            endpoint : '/toto/first',
            api : [ {
                path : '/bye',
                http : 'get',
                method : 'sayGoodbye',
            }, {
                path : '/hello',
                http : 'get',
                method : 'sayHello'
            } ]
        });

        descriptorJson = dispatcher.getDescriptorJson('/toto/first/bye');
        expect(descriptorJson).to.eql({
            endpoint : '/toto/first',
            api : [ {
                path : '/bye',
                http : 'get',
                method : 'sayGoodbye',
            }, {
                path : '/hello',
                http : 'get',
                method : 'sayHello'
            } ]
        });

        descriptorJson = dispatcher.getDescriptorJson('/toto/first/bye');
        expect(descriptorJson).to.eql({
            endpoint : '/toto/first',
            api : [ {
                path : '/bye',
                http : 'get',
                method : 'sayGoodbye',
            }, {
                path : '/hello',
                http : 'get',
                method : 'sayHello'
            } ]
        });

        descriptorJson = dispatcher.getDescriptorJson('/toto/second');
        expect(descriptorJson).to.eql({
            endpoint : '/toto/second',
            api : [ {
                path : '/message',
                http : 'post',
                method : 'sendMsg'
            } ]
        });
    });

    describe('should manage remote calls', function() {
        var options = {
            port : 1234,
            path : '/toto'
        };
        it('should be able handle remote API calls', function(done) {
            Utils.withServer(function(app) {
                var dispatcher = new Mosaic.ApiDispatcher(options);
                dispatcher.addEndpoint({
                    path : '/first',
                    instance : new FirstType()
                });
                var prefix = (options.path || '') + '/*';
                app.all(prefix, function(req, res) {
                    dispatcher.handle(req, res).done();
                });
                return options;
            }, function(server) {
                var baseUrl = Utils.getBaseUrl(options) + '/first';
                return Mosaic.ApiDescriptor.HttpClientStub.load(baseUrl)//
                .then(function(client) {
                    return client.sayHello({
                        name : 'John Smith'
                    }).then(function(result) {
                        expect(result).to.eql({
                            msg : 'Hello, John Smith!'
                        });
                    });
                });
            }).then(done, done).done();
        });

    });

});

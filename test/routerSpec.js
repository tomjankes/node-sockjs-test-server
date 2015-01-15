var expect = require('chai').expect,
    sinon = require('sinon');

describe("Router", function () {

    describe ('when calling callbacks', function () {

        var router,
            request,
            httpServer,
            callback;

        beforeEach(function () {
            router = require('../lib/router');
            request = {method: null, url: null};
            httpServer = {
                on: function (eventName, callback) {
                    callback(request, {});
                }
            };
            callback = sinon.spy();
        });

        it("should run passed callback if route matches", function () {
            //given
            request.method = 'GET';
            request.url = 'http://some.url';
            //when
            router.get('/', callback);
            router.installHandlers(httpServer);
            //then
            expect(callback.calledOnce).to.be.true();
        });

        it("should not run passed callback if route does not match", function () {
            //given
            request.method = 'GET';
            request.url = 'http://some.url/test';
            //when
            router.get('/', callback);
            router.installHandlers(httpServer);
            //then
            expect(callback.called).to.be.false();
        });

        it("should not run passed callback if route does match but method does not match", function () {
            //given
            request.method = 'POST';
            request.url = 'http://some.url/test';
            //when
            router.get('/test', callback);
            router.installHandlers(httpServer);
            //then
            expect(callback.called).to.be.false();
        });

    });

    describe("when parsing path parameters", function() {
        var router,
            request,
            callback,
            httpServer = {
                on: function (eventName, callback) {
                    callback(request, {});
                }
            };

        beforeEach(function () {
            router = require('../lib/router');
            request = {
                method: 'GET',
                url: null
            };
            callback = sinon.spy();
        });

        it("should parse path parameters and present them to callback as request.pathParams", function () {
            //given
            request.url = 'http://some.url/test/123';
            //when
            router.get('/test/:someNumber', callback);
            router.installHandlers(httpServer);
            //then
            expect(callback.getCall(0).args[0].pathParams.someNumber).to.be.equal('123');
        });

        it("should parse multiple parameters", function () {
            //given
            request.url = 'http://some.url/users/thisUserId/friends/thisFriendId';
            //when
            router.get('/users/:userId/friends/:friendId', callback);
            router.installHandlers(httpServer);
            //then
            var calledParams = callback.getCall(0).args[0].pathParams;
            expect(calledParams.userId).to.be.equal('thisUserId');
            expect(calledParams.friendId).to.be.equal('thisFriendId');
        });
    });

    describe('when calling multiple controllers', function () {
        var firstCallback,
            secondCallback,
            request,
            router,
            httpServer = {
                on: function (eventName, callback) {
                    callback(request, {});
                }
            };


        beforeEach(function() {
            router = require('../lib/router');
            firstCallback = sinon.spy();
            secondCallback = sinon.spy();
            request = { method: 'GET', url: 'http://some.url/users/123' };
        });

        it('should call controllers in reversed registration order', function() {
            //when
            router.get('/users*', firstCallback);
            router.get('/users/:id', secondCallback);
            router.installHandlers(httpServer);
            //then
            expect(firstCallback.called).to.be.false();
            expect(secondCallback.called).to.be.true();
        });

        it('if controller is found other matching controllers should not be called', function() {
            //when
            router.get('/users/something', firstCallback);
            router.get('/users/:id', secondCallback);
            router.installHandlers(httpServer);
            //then
            expect(firstCallback.called).to.be.false();
            expect(secondCallback.called).to.be.true();
        });
    });

    describe('on http server interaction', function () {
        var http = require('http'),
            httpServer,
            router;

        beforeEach(function() {
            router = require('../lib/router');
            httpServer = http.createServer();
            sinon.spy(httpServer, "on");
        });

        afterEach(function() {
            httpServer.on.restore();
        });

        it('should hook to http server "request" event when installing handlers', function() {
            //when
            router.installHandlers(httpServer);
            //then
            expect(httpServer.on.getCall(0).args[0]).to.be.equal('request');
        });
    });

    describe('when handling different methods', function () {
        var router,
            httpServer = {
                callback: null,
                on: function (eventName, callback) {
                    this.callback = callback;
                },
                makeRequest: function (request) {
                    this.callback(request, {});
                }
            },
            getCallback,
            postCallback,
            deleteCallback,
            optionsCallback,
            putCallback,
            headCallback,
            traceCallback,
            connectCallback,
            patchCallback,
            customCallback,
            request = { method: null, url: 'http://some.url/test'};

        beforeEach(function() {
            getCallback = sinon.spy();
            postCallback = sinon.spy();
            deleteCallback = sinon.spy();
            optionsCallback = sinon.spy();
            putCallback = sinon.spy();
            headCallback = sinon.spy();
            traceCallback = sinon.spy();
            connectCallback = sinon.spy();
            patchCallback = sinon.spy();
            customCallback = sinon.spy();
            router = require('../lib/router');
            router.get('/test', getCallback);
            router.post('/test', postCallback);
            router.del('/test', deleteCallback);
            router.options('/test', optionsCallback);
            router.put('/test', putCallback);
            router.head('/test', headCallback);
            router.trace('/test', traceCallback);
            router.connect('/test', connectCallback);
            router.patch('/test', patchCallback);
            router.route('CUSTOM', '/test', customCallback);
        });

        it('should correctly make GET request', function () {
            //given
            request.method = 'GET';
            //when
            router.installHandlers(httpServer);
            httpServer.makeRequest(request);
            //then
            expect(getCallback.calledOnce).to.be.true();
        });

        it('should correctly make POST request', function () {
            //given
            request.method = 'POST';
            //when
            router.installHandlers(httpServer);
            httpServer.makeRequest(request);
            //then
            expect(postCallback.calledOnce).to.be.true();
        });

        it('should correctly make DELETE request', function () {
            //given
            request.method = 'DELETE';
            //when
            router.installHandlers(httpServer);
            httpServer.makeRequest(request);
            //then
            expect(deleteCallback.calledOnce).to.be.true();
        });

        it('should correctly make OPTIONS request', function () {
            //given
            request.method = 'OPTIONS';
            //when
            router.installHandlers(httpServer);
            httpServer.makeRequest(request);
            //then
            expect(optionsCallback.calledOnce).to.be.true();
        });

        it('should correctly make PUT request', function () {
            //given
            request.method = 'PUT';
            //when
            router.installHandlers(httpServer);
            httpServer.makeRequest(request);
            //then
            expect(putCallback.calledOnce).to.be.true();
        });

        it('should correctly make HEAD request', function () {
            //given
            request.method = 'HEAD';
            //when
            router.installHandlers(httpServer);
            httpServer.makeRequest(request);
            //then
            expect(headCallback.calledOnce).to.be.true();
        });

        it('should correctly make TRACE request', function () {
            //given
            request.method = 'TRACE';
            //when
            router.installHandlers(httpServer);
            httpServer.makeRequest(request);
            //then
            expect(traceCallback.calledOnce).to.be.true();
        });

        it('should correctly make CONNECT request', function () {
            //given
            request.method = 'CONNECT';
            //when
            router.installHandlers(httpServer);
            httpServer.makeRequest(request);
            //then
            expect(connectCallback.calledOnce).to.be.true();
        });

        it('should correctly make PATCH request', function () {
            //given
            request.method = 'PATCH';
            //when
            router.installHandlers(httpServer);
            httpServer.makeRequest(request);
            //then
            expect(patchCallback.calledOnce).to.be.true();
        });

        it('should correctly make custom request', function () {
            //given
            request.method = 'CUSTOM';
            //when
            router.installHandlers(httpServer);
            httpServer.makeRequest(request);
            //then
            expect(customCallback.calledOnce).to.be.true();
        });
    });
});
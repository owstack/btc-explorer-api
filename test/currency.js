'use strict';

var should = require('should');
var sinon = require('sinon');
var proxyquire = require('proxyquire');
var CurrencyController = require('../lib/currency');

describe('Currency', function() {

  var bitstampData = {
    high: 239.44,
    last: 237.90,
    timestamp: 1443798711,
    bid: 237.61,
    vwap: 237.88,
    volume: 21463.27736401,
    low: 235.00,
    ask: 237.90
  };

  var bitcoincomData = {
    price: 240.57,
    time: {
      unix: 1443798711,
      iso: '2015-10-02T15:11:51.000Z'
    }
  };

  it.skip('will make live request to bitstamp', function(done) {
    var currency = new CurrencyController({});
    var req = {};
    var res = {
      jsonp: function(response) {
        response.status.should.equal(200);
        should.exist(response.data.rates.USD[0].rate);
        (typeof response.data.rates.USD[0].rate).should.equal('number');
        done();
      }
    };
    currency.index(req, res);
  });

  it('will retrieve a fresh value', function(done) {
    var requestStub = sinon.stub();
    requestStub.onCall(0).callsArgWith(1, null, {statusCode: 200}, JSON.stringify(bitstampData));
    requestStub.onCall(1).callsArgWith(1, null, {statusCode: 200}, JSON.stringify(bitcoincomData));
    requestStub.onCall(2).callsArgWith(1, null, {statusCode: 200}, JSON.stringify(bitstampData));
    requestStub.onCall(3).callsArgWith(1, null, {statusCode: 200}, JSON.stringify(bitcoincomData));
    requestStub.returns(4);

    var TestCurrencyController = proxyquire('../lib/currency', {
      request: requestStub
    });
    var node = {
      log: {
        error: sinon.stub()
      }
    };

    var currency = new TestCurrencyController({node: node});
    currency.rates = {
      USD: [{
        name: 'Bitstamp',
        rate: 220.20
      }, {
        name: 'Bitcoin.com',
        rate: 220.20
      }],
      EUR: [{
        name: 'Bitstamp',
        rate: 190.10
      }, {
        name: 'Bitcoin.com',
        rate: 190.10
      }]
    };
    currency.timestamp = Date.now() - 61000 * CurrencyController.DEFAULT_CURRENCY_DELAY;
    var req = {};
    var res = {
      jsonp: function(response) {
        response.status.should.equal(200);
        should.exist(response.data.rates.USD[0].rate);
        should.exist(response.data.rates.EUR[1].rate);
        response.data.rates.USD[0].rate.should.equal(237.90);
        response.data.rates.USD[1].rate.should.equal(240.57);
        done();
      }
    };
    currency.index(req, res);
  });

  it('will log an error from request', function(done) {
    var TestCurrencyController = proxyquire('../lib/currency', {
      request: sinon.stub().callsArgWith(1, new Error('test'))
    });
    var node = {
      log: {
        error: sinon.stub()
      }
    };
    var currency = new TestCurrencyController({node: node});
    currency.rates = {
      USD: [{
        name: 'Bitstamp',
        rate: 448.60
      }, {
        name: 'Bitcoin.com',
        rate: 448.60
      }],
      EUR: [{
        name: 'Bitstamp',
        rate: 190.10
      }, {
        name: 'Bitcoin.com',
        rate: 190.10
      }]
    };
    currency.timestamp = Date.now() - 65000 * CurrencyController.DEFAULT_CURRENCY_DELAY;
    var req = {};
    var res = {
      jsonp: function(response) {
        response.status.should.equal(200);
        should.exist(response.data.rates.USD[0].rate);
        response.data.rates.USD[0].rate.should.equal(448.60);
        node.log.error.called;
        done();
      }
    };
    currency.index(req, res);
  });

  it('will retrieve a cached value', function(done) {
    var request = sinon.stub();
    var TestCurrencyController = proxyquire('../lib/currency', {
      request: request
    });
    var node = {
      log: {
        error: sinon.stub()
      }
    };
    var currency = new TestCurrencyController({node: node});
    currency.rates = {
      USD: [{
        name: 'Bitstamp',
        rate: 448.60
      }, {
        name: 'Bitcoin.com',
        rate: 448.60
      }],
      EUR: [{
        name: 'Bitstamp',
        rate: 367.30
      }, {
        name: 'Bitcoin.com',
        rate: 367.30
      }]
    };
    currency.timestamp = Date.now();
    var req = {};
    var res = {
      jsonp: function(response) {
        response.status.should.equal(200);
        should.exist(response.data.rates.USD[0].rate);
        response.data.rates.USD[0].rate.should.equal(448.60);
        request.callCount.should.equal(0);
        done();
      }
    };
    currency.index(req, res);
  });

});

'use strict';

/**
 * Module dependencies.
 */

var ImplicitGrantType = require('../../../lib/grant-types/implicit-grant-type');
var Promise = require('bluebird');
var sinon = require('sinon');
var should = require('should');

/**
 * Test `ImplicitGrantType`.
 */

describe('ImplicitGrantType', function() {
  describe('saveToken()', function() {
    it('should call `model.saveToken()`', function() {
      var client = {};
      var user = {};
      var model = {
        saveToken: sinon.spy(function(token, client, user, cb) { cb(null, true); })
      };
      var handler = new ImplicitGrantType({ user: user, accessTokenLifetime: 120, model: model });

      sinon.stub(handler, 'validateScope').returns('foobiz');
      sinon.stub(handler, 'generateAccessToken').returns(Promise.resolve('foo'));
      sinon.stub(handler, 'getAccessTokenExpiresAt').returns(Promise.resolve('biz'));

      return handler.saveToken(user, client, 'foobiz')
        .then(function() {
          model.saveToken.callCount.should.equal(1);
          model.saveToken.firstCall.args.should.have.length(4);
          model.saveToken.firstCall.args[0].should.eql({ accessToken: 'foo', accessTokenExpiresAt: 'biz', scope: 'foobiz' });
          model.saveToken.firstCall.args[1].should.equal(client);
          model.saveToken.firstCall.args[2].should.equal(user);
          model.saveToken.firstCall.thisValue.should.equal(model);
        })
        .catch(should.fail);
    });
  });
});

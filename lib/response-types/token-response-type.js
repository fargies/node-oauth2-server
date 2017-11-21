'use strict';

/**
 * Module dependencies.
 */

var InvalidArgumentError = require('../errors/invalid-argument-error');
var ImplicitGrantType = require('../grant-types/implicit-grant-type');
var Promise = require('bluebird');
var BearerTokenType = require('../token-types/bearer-token-type');
var TokenModel = require('../models/token-model');

/**
 * Constructor.
 */

function TokenResponseType(options) {
  options = options || {};

  if (!options.accessTokenLifetime) {
    throw new InvalidArgumentError('Missing parameter: `accessTokenLifetime`');
  }

  this.token = null;
  this.accessTokenLifetime = options.accessTokenLifetime;
  this.model = options.model;
}

/**
 * Handle token response type.
 */

TokenResponseType.prototype.handle = function(request, client, user, uri, scope) {
  if (!request) {
    throw new InvalidArgumentError('Missing parameter: `request`');
  }

  if (!client) {
    throw new InvalidArgumentError('Missing parameter: `client`');
  }

  var accessTokenLifetime = this.getAccessTokenLifetime(client);

  var options = {
    user: user,
    scope: scope,
    model: this.model,
    accessTokenLifetime: accessTokenLifetime
  };

  var grantType = new ImplicitGrantType(options);

  return Promise.bind(this)
    .then(function() {
      return grantType.handle(request, client);
    })
    .then(function(token) {
      this.token = token;
      return token;
    });
};

/**
 * Get access token lifetime.
 */

TokenResponseType.prototype.getAccessTokenLifetime = function(client) {
  return client.accessTokenLifetime || this.accessTokenLifetime;
};

/**
 * Build redirect uri.
 */

TokenResponseType.prototype.buildRedirectUri = function(redirectUri) {
  var model = new TokenModel(this.token, {allowExtendedTokenAttributes: this.allowExtendedTokenAttributes});
  var token = this.getTokenType(model).valueOf();

  for (var property in token) {
    if (token.hasOwnProperty(property)) {
      redirectUri = this.setRedirectUriParam(redirectUri, property, token[property]);
    }
  }
  return redirectUri;
};

/**
 * Get token type.
 */

TokenResponseType.prototype.getTokenType = function(model) {
  return new BearerTokenType(model.accessToken, model.accessTokenLifetime, model.refreshToken, model.scope, model.customAttributes);
};

/**
 * Set redirect uri parameter.
 */

TokenResponseType.prototype.setRedirectUriParam = function(redirectUri, key, value) {
  if (!redirectUri) {
    throw new InvalidArgumentError('Missing parameter: `redirectUri`');
  }

  if (!key) {
    throw new InvalidArgumentError('Missing parameter: `key`');
  }

  redirectUri.hash = redirectUri.hash || '';
  redirectUri.hash += (redirectUri.hash ? '&' : '') + key + '=' + encodeURIComponent(value);

  return redirectUri;
};

/**
 * Export constructor.
 */

module.exports = TokenResponseType;

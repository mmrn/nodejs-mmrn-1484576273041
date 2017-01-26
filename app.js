/*eslint-env node*/

//------------------------------------------------------------------------------
// node.js starter application for Bluemix
//------------------------------------------------------------------------------

// This application uses express as its web server
// for more info, see: http://expressjs.com
var express = require('express');

// cfenv provides access to your Cloud Foundry environment
// for more info, see: https://www.npmjs.com/package/cfenv
var cfenv = require('cfenv');

// create a new express server
var app = express();

// serve the files out of ./public as our main files
app.use(express.static(__dirname + '/public'));

// get the app environment from Cloud Foundry
var appEnv = cfenv.getAppEnv();

// start server on the specified port and binding host
app.listen(appEnv.port, '0.0.0.0', function() {
  // print a message when the server starts listening
  console.log("server starting on " + appEnv.url);
});

// 松尾さんのガイドを参照して以下を追加

var passport = require('passport');
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser(function(user, done) {
  done(null, user);
});
passport.deserializeUser(function(obj, done) {
  done(null, obj);
});

var services = JSON.parse(process.env.VCAP_SERVICES);
var isSso = false;
var ssoConfig = null;
if (services['SingleSignOn'] != undefined){
  isSso = true;
  ssoConfig = services['SingleSignOn'][0];
}

if (isSso) {
  var OpenIDConnectStrategy = require('passport-idaas-openidconnect').IDaaSOIDCStrategy;
  passport.use(new OpenIDConnectStrategy({
    authorizationURL: ssoConfig.credentials.authorizationEndpointUrl,
    tokenURL: ssoConfig.credentials.tokenEndpointUrl,
    clientID: ssoConfig.credentials.clientId,
    scope: ssoConfig.credentials.serverSupportedScope[0],
    response_type: 'code',
    clientSecret: ssoConfig.credentials.secret,
    callbackURL: 'https://nodejs-mmrn.mybluemix.net/auth/sso/callback',
    skipUserProfile: true,
    issuer: ssoConfig.credentials.issuerIdentifier
  }, function(accessToken, refreshToken, profile, done) {
    process.nextTick(function() {
      profile.accessToken = accessToken;
      profile.refreshToken = refreshToken;
      done(null, profile);
    });
  }));
}

// Single Sign On Login処理
//app.get(‘/loginSSO‘, passport.authenticate(‘openidconnect’, {}));
app.get('/login', passport.authenticate('openidconnect', {}));
//app.get('https://nodejs-mmrn.mybluemix.net', passport.authenticate('openidconnect', {}));

//app.get(‘/auth/sso/callback’, passport.authenticate(‘openidconnect’, {
app.get('/auth/sso/callback', passport.authenticate('openidconnect', {
    successRedirect: '/success',
//  failureRedirect: ‘/loginSSO‘
    failureRedirect: '/failure',
  }), function(req, res) {});
  //Successfully Authenticated
  // ……
//  });
//});

// IBM Connectionsのサンプルコードからコピー
// https://w3-connections.ibm.com/wikis/home?lang=en-us#!/wiki/W89b23bf7ad80_4411_822f_2a6dc171c6b3/page/Configure%20Bluemix%20deployed%20Node%20JS%20web%20app%20with%20IBM%20Cloud%20IDP%20%28IBM%20SSO%20server%29

app.get('/success', sendSuccess, redirectToppage);

Var sendSuccess = function(req, res, next) {
  res.send('Login Success !!');
  return next();
};

Var redirectToppage = function(req, res, next) {
  res.redirect('https://nodejs-mmrn.mybluemix.net/');
};

//app.get('/success', function(req, res) {
//  res.send('Login Success !!');
//  res.redirect("https://nodejs-mmrn.mybluemix.net/");
//  res.redirect('/');
//});

app.get('/failure', function(req, res) {
  res.send('login Failure ..');
//  res.redirect('/loginSSO');
});

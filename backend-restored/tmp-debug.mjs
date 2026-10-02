import passport from './src/config/passport.js';
import { googleCallbackController } from './src/module/auth/auth.controller.js';
import { createGoogleOAuthState, OAUTH_PORTALS, validateGoogleOAuthState } from './src/module/auth/oauth.state.js';

const original = passport.authenticate;
const state = await createGoogleOAuthState(OAUTH_PORTALS.USER);
console.log('state created', state);
console.log('validate before', await validateGoogleOAuthState(state));

passport.authenticate = (strategy, options, callback) => {
  console.log('authenticate called', strategy, options);
  return (req, res, next) => {
    console.log('inner callback start');
    callback(null, {
      _id: 'u1', role: 'USER', roles: ['USER'], email: 'x@y.com', fullName: 'X',
      phone:'', address:'', organizationName:'', website:'', bio:''
    });
  };
};

let redirectUrl = '';
const req = { query: { state }, headers: {} };
const res = {
  redirect: (url) => { redirectUrl = url; console.log('REDIRECT_URL', url); return res; },
  clearCookie: () => {},
  cookie: () => {}
};

try {
  await googleCallbackController(req, res, () => console.log('next called'));
  console.log('final redirectUrl', JSON.stringify(redirectUrl));
} finally {
  passport.authenticate = original;
}

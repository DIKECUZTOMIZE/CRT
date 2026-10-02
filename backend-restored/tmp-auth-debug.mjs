import passport from './src/config/passport.js';
import { googleCallbackController } from './src/module/auth/auth.controller.js';
import { createGoogleOAuthState, OAUTH_PORTALS } from './src/module/auth/oauth.state.js';

const original = passport.authenticate;
const state = await createGoogleOAuthState(OAUTH_PORTALS.USER);

passport.authenticate = (strategy, options, callback) => {
  console.log('STUB AUTH', strategy, options);
  return (req, res, next) => {
    console.log('STUB RUNNING');
    const user = {
      _id: 'user-google-1',
      role: 'USER',
      roles: ['USER'],
      email: 'state-user@example.com',
      fullName: 'State User',
      phone: '',
      address: '',
      organizationName: '',
      website: '',
      bio: '',
      username: 'state-user',
    };
    callback(null, user);
  };
};

try {
  let redirectUrl = '';
  const req = { query: { state }, headers: {} };
  const res = {
    redirect: (url) => {
      redirectUrl = url;
      console.log('REDIRECT URL', url);
      return res;
    },
    clearCookie: () => {},
    cookie: () => {},
  };

  await googleCallbackController(req, res, () => {});
  console.log('FINAL REDIRECT', redirectUrl);
} finally {
  passport.authenticate = original;
}

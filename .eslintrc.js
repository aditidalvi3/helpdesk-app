module.exports = {
  extends: [
    'react-app',
    'react-app/jest'
  ],
  globals: {
    __app_id: 'readonly',
    __firebase_config: 'readonly',
    __initial_auth_token: 'readonly',
  },
  rules: {
    // You can add specific ESLint rules here if needed
  }
};
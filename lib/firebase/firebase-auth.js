// Firebase Auth 모의 구현
if (!window.firebase) window.firebase = {};
window.firebase.auth = function() {
  return {
    onAuthStateChanged: function(callback) {
      callback(null);
    },
    currentUser: null
  };
};
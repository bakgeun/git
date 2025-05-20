// Firebase Firestore 모의 구현
if (!window.firebase) window.firebase = {};
window.firebase.firestore = function() {
  return {
    collection: function() {
      return {
        orderBy: function() { return this; },
        limit: function() { return this; },
        get: function() {
          return Promise.resolve({
            empty: true,
            forEach: function() {}
          });
        }
      };
    }
  };
};
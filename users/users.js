var records = [
    { id: 1, username: 'user1', password: 'password', displayName: 'user1', emails: [ { value: 'user1@example.com' } ] }
  , { id: 2, username: 'user2', password: 'password', displayName: 'user2', emails: [ { value: 'user2@example.com' } ] }
];

exports.findByUsername = function(username, cb) {
  process.nextTick(function() {
    for (var i = 0, len = records.length; i < len; i++) {
      var record = records[i];
      if (record.username === username) {
        return cb(null, record);
      }
    }
    return cb(null, null);
  });
}

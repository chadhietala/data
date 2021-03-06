var env, store, User, Job;

var attr = DS.attr, belongsTo = DS.belongsTo;

function stringify(string) {
  return function() { return string; };
}

module('integration/relationships/one_to_one_test - OneToOne relationships', {
  setup: function() {
    User = DS.Model.extend({
      name: attr('string'),
      bestFriend: belongsTo('user', {async: true}),
      job: belongsTo('job')
    });

    User.toString = stringify('User');

    Job = DS.Model.extend({
      isGood: attr(),
      user: belongsTo('user')
    });

    Job.toString = stringify('Account');

    env = setupStore({
      user: User,
      job: Job
    });

    store = env.store;
  },

  teardown: function() {
    env.container.destroy();
  }
});

/*
  Server loading tests
*/

test("Relationship is available from both sides even if only loaded from one side - async", function () {
  var stanley = store.push('user', {id:1, name: 'Stanley', bestFriend: 2});
  var stanleysFriend = store.push('user', {id:2, name: "Stanley's friend"});
  stanleysFriend.get('bestFriend').then(async(function(fetchedUser) {
    equal(fetchedUser, stanley, 'User relationship was set up correctly');
  }));
});

test("Relationship is available from both sides even if only loaded from one side - sync", function () {
  var job = store.push('job', {id:2 , isGood: true});
  var user = store.push('user', {id:1, name: 'Stanley', job:2 });
  equal(job.get('user'), user, 'User relationship was set up correctly');
});

test("Fetching a belongsTo that is set to null removes the record from a relationship - async", function () {
  var stanleysFriend = store.push('user', {id:2, name: "Stanley's friend", bestFriend: 1});
  store.push('user', {id:1, name: 'Stanley', bestFriend: null});
  stanleysFriend.get('bestFriend').then(async(function(fetchedUser) {
    equal(fetchedUser, null, 'User relationship was removed correctly');
  }));
});

test("Fetching a belongsTo that is set to null removes the record from a relationship - sync", function () {
  var job = store.push('job', {id:2 , isGood: true});
  store.push('user', {id:1, name: 'Stanley', job:2 });
  job = store.push('job', {id:2 , isGood: true, user:null});
  equal(job.get('user'), null, 'User relationship was removed correctly');
});

test("Fetching a belongsTo that is set to a different record, sets the old relationship to null - async", function () {
  expect(3);
  var stanley = store.push('user', {id:1, name: 'Stanley', bestFriend: 2});
  var stanleysFriend = store.push('user', {id:2, name: "Stanley's friend", bestFriend: 1});

  stanleysFriend.get('bestFriend').then(async(function(fetchedUser) {
    equal(fetchedUser, stanley, 'User relationship was initally setup correctly');
    var stanleysNewFriend = store.push('user', {id:3, name: "Stanley's New friend", bestFriend: 1});

    stanley.get('bestFriend').then(async(function(fetchedNewFriend){
      equal(fetchedNewFriend, stanleysNewFriend, 'User relationship was updated correctly');
    }));

    stanleysFriend.get('bestFriend').then(async(function(fetchedOldFriend){
      equal(fetchedOldFriend, null, 'The old relationship was set to null correctly');
    }));
  }));
});

test("Fetching a belongsTo that is set to a different record, sets the old relationship to null - sync", function () {
  var job = store.push('job', {id:2 , isGood: false});
  var user = store.push('user', {id:1, name: 'Stanley', job:2 });
  equal(job.get('user'), user, 'Job and user initially setup correctly');
  var newBetterJob = store.push('job', {id:3, isGood: true, user:1 });

  equal(user.get('job'), newBetterJob, 'Job updated correctly');
  equal(job.get('user'), null, 'Old relationship nulled out correctly');
  equal(newBetterJob.get('user'), user, 'New job setup correctly');
});

/*
  Local edits
*/

test("Setting a OneToOne relationship reflects correctly on the other side- async", function () {
  var stanley = store.push('user', {id:1, name: 'Stanley'});
  var stanleysFriend = store.push('user', {id:2, name: "Stanley's friend"});
  stanley.set('bestFriend', stanleysFriend);
  stanleysFriend.get('bestFriend').then(async(function(fetchedUser) {
    equal(fetchedUser, stanley, 'User relationship was updated correctly');
  }));
});

test("Setting a OneToOne relationship reflects correctly on the other side- sync", function () {
  var job = store.push('job', {id:2 , isGood: true});
  var user = store.push('user', {id:1, name: 'Stanley'});
  user.set('job', job);
  equal(job.get('user'), user, 'User relationship was set up correctly');
});

test("Setting a OneToOne relationship to null reflects correctly on the other side - async", function () {
  var stanley = store.push('user', {id:1, name: 'Stanley', bestFriend:2});
  var stanleysFriend = store.push('user', {id:2, name: "Stanley's friend", bestFriend:1});
  stanley.set('bestFriend', null); // :(
  stanleysFriend.get('bestFriend').then(async(function(fetchedUser) {
    equal(fetchedUser, null, 'User relationship was removed correctly');
  }));
});

test("Setting a OneToOne relationship to null reflects correctly on the other side - sync", function () {
  var job = store.push('job', {id:2 , isGood: false, user:1});
  var user = store.push('user', {id:1, name: 'Stanley', job:2});
  user.set('job', null);
  equal(job.get('user'), null, 'User relationship was removed correctly');
});

test("Setting a belongsTo to a different record, sets the old relationship to null - async", function () {
  expect(3);
  var stanley = store.push('user', {id:1, name: 'Stanley', bestFriend: 2});
  var stanleysFriend = store.push('user', {id:2, name: "Stanley's friend", bestFriend: 1});

  stanleysFriend.get('bestFriend').then(async(function(fetchedUser) {
    equal(fetchedUser, stanley, 'User relationship was initally setup correctly');
    var stanleysNewFriend = store.push('user', {id:3, name: "Stanley's New friend"});
    stanleysNewFriend.set('bestFriend', stanley);

    stanley.get('bestFriend').then(async(function(fetchedNewFriend){
      equal(fetchedNewFriend, stanleysNewFriend, 'User relationship was updated correctly');
    }));

    stanleysFriend.get('bestFriend').then(async(function(fetchedOldFriend){
      equal(fetchedOldFriend, null, 'The old relationship was set to null correctly');
    }));
  }));
});

test("Setting a belongsTo to a different record, sets the old relationship to null - sync", function () {
  var job = store.push('job', {id:2 , isGood: false});
  var user = store.push('user', {id:1, name: 'Stanley', job:2 });
  equal(job.get('user'), user, 'Job and user initially setup correctly');
  var newBetterJob = store.push('job', {id:3, isGood: true});
  newBetterJob.set('user', user);

  equal(user.get('job'), newBetterJob, 'Job updated correctly');
  equal(job.get('user'), null, 'Old relationship nulled out correctly');
  equal(newBetterJob.get('user'), user, 'New job setup correctly');
});


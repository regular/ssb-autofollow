var test = require('tape')
var pull = require('pull-stream')
var ssbKeys = require('ssb-keys')
var CreateTestSbot = require('scuttle-testbot').use(require('.'))

var lucyKeys = ssbKeys.generate()

test('do nothing if no autofollow feed is specified', t => {
  const myTestSbot = CreateTestSbot({ name: 'test1', keys: lucyKeys })
  const lucy = myTestSbot.createFeed(lucyKeys)

  setTimeout(() => {
    pull(
      myTestSbot.createFeedStream({}),
      pull.collect((err, msgs) => {
        t.error(err)
        t.equals(msgs.length, 0, 'no message')
        myTestSbot.close()
        t.end()
      })
    )
  }, 300)
})

// NOTE: scuttle-testbot seems to fail if started again(?)
test.only('one follow message, if one feed is specified', t => {
  const myTestSbot = CreateTestSbot({
    name: 'test2', 
    keys: lucyKeys,
    config: {
      autofollow: 'alice'
    }
  })
  const lucy = myTestSbot.createFeed(lucyKeys)

  setTimeout(() => {
    pull(
      myTestSbot.createFeedStream({}),
      pull.collect((err, msgs) => {
        t.error(err);
        t.equals(msgs.length, 1, 'one message');
        const msg = msgs[0]

        t.equals(typeof msg.key, 'string', 'message has key')
        t.equals(typeof msg.value, 'object', 'message has value')
        t.equals(msg.value.author, lucyKeys.id, 'message author is lucy')
        t.equals(typeof msg.value.content, 'object', 'value has content')
        t.equals(msg.value.content.type, 'contact', 'content type is cotact');
        t.equals(
          msg.value.content.contact,
          'alice',
          'contact is correct'
        )
        t.equals(msg.value.content.following, true, 'following is true')
        myTestSbot.close()
        t.end()
      })
    )
  }, 300)
})

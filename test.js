const test = require('tape')
const pull = require('pull-stream')
const ssbKeys = require('ssb-keys')

const lucyKeys = ssbKeys.generate()

test('do nothing if no autofollow feed is specified', t => {
  const CreateTestSbot = require('scuttle-testbot').use(require('.'))
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

test('one follow message, if one feed is specified', t => {
  const CreateTestSbot = require('scuttle-testbot').use(require('.'))
  const myTestSbot = CreateTestSbot({
    name: 'test1', 
    keys: lucyKeys,
    autofollow: 'alice'
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

test('array of feeds', t => {
  const CreateTestSbot = require('scuttle-testbot').use(require('.'))
  const myTestSbot = CreateTestSbot({
    name: 'test1', 
    keys: lucyKeys,
    autofollow: ['alice', 'bob']
  })
  const lucy = myTestSbot.createFeed(lucyKeys)

  setTimeout(() => {
    pull(
      myTestSbot.createFeedStream({}),
      pull.collect((err, msgs) => {
        t.error(err);
        t.equals(msgs.length, 2, 'two messages');
        let msg

        msg = msgs[0]
        t.equals(typeof msg.key, 'string', 'message has key')
        t.equals(typeof msg.value, 'object', 'message has value')
        t.equals(msg.value.author, lucyKeys.id, 'message author is lucy')
        t.equals(typeof msg.value.content, 'object', 'value has content')
        t.equals(msg.value.content.type, 'contact', 'content type is cotact');
        t.equals(
          msg.value.content.contact,
          'alice',
          'contact is alice'
        )
        t.equals(msg.value.content.following, true, 'following is true')
        
        msg = msgs[1]
        t.equals(typeof msg.key, 'string', 'message has key')
        t.equals(typeof msg.value, 'object', 'message has value')
        t.equals(msg.value.author, lucyKeys.id, 'message author is lucy')
        t.equals(typeof msg.value.content, 'object', 'value has content')
        t.equals(msg.value.content.type, 'contact', 'content type is cotact');
        t.equals(
          msg.value.content.contact,
          'bob',
          'contact is bob'
        )
        t.equals(msg.value.content.following, true, 'following is true')
        
        myTestSbot.close()
        t.end()
      })
    )
  }, 300)
})

test('pre-existing message', t => {
  function publish(cb) {
    const CreateTestSbot = require('scuttle-testbot')
    const myTestSbot = CreateTestSbot({
      name: 'test1', 
      keys: lucyKeys,
    })
    const lucy = myTestSbot.createFeed(lucyKeys)

    lucy.publish({
      type: 'contact',
      contact: 'alice',
      following: true
    }, err => {
      myTestSbot.close()
      cb(err)
    }) 
  }
      
  publish( err => {
    t.error(err)
    
    const CreateTestSbot = require('scuttle-testbot').use(require('.'))
    const myTestSbot = CreateTestSbot({
      name: 'test1', 
      startUnclean: true,
      keys: lucyKeys,
      autofollow: ['alice', 'bob']
    })
    const lucy = myTestSbot.createFeed(lucyKeys)

    setTimeout( ()=>{
      pull(
        myTestSbot.createFeedStream({}),
        pull.collect((err, msgs) => {
          t.error(err);
          t.equals(msgs.length, 2, 'two messages');
          let msg

          msg = msgs[1]
          t.equals(typeof msg.key, 'string', 'message has key')
          t.equals(typeof msg.value, 'object', 'message has value')
          t.equals(msg.value.author, lucyKeys.id, 'message author is lucy')
          t.equals(typeof msg.value.content, 'object', 'value has content')
          t.equals(msg.value.content.type, 'contact', 'content type is cotact');
          t.equals(
            msg.value.content.contact,
            'bob',
            'contact is bob'
          )
          t.equals(msg.value.content.following, true, 'following is true')
          
          myTestSbot.close()
          t.end()
        })
      )
    }, 300)
  })
})

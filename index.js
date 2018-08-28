const pull = require('pull-stream')
const debug = require('debug')('ssb-autofollow')

exports.name = 'autofollow'
exports.version = require('./package.json').version
exports.manifest = {}

exports.init = function (ssb, config) {
  let to_follow = config && config.autofollow
  if (to_follow) {
    if (!Array.isArray(to_follow)) to_follow = [to_follow]
    ssb.whoami( (err, feed) => {
      if (err) throw err
      to_follow = to_follow.filter( x=>x !== feed.id )
      if (!to_follow.length) return debug('INFO: config.autofollow is an empty array')
      pull(
        ssb.createUserStream({
          id: feed.id,
          values: true,
          keys: false
        }),
        pull.asyncMap( (value, cb) => {
          const content = value.content
          if (content && content.type == 'contact' && content.following) {
            if (to_follow.includes(content.contact)) {
              debug('INFO: Already following %s', content.contact)
              to_follow = to_follow.filter( x=>x !== content.contact )
              if (!to_follow.length) return cb(true)
            }
          }
          cb(null, value)
        }),
        pull.onEnd( err => {
          if (err) throw err
          pull(
            pull.values(to_follow),
            pull.map( id => {
              return {
                type: 'contact',
                contact: id,
                following: true
              }
            }),
            pull.asyncMap( (content, cb) => {
              ssb.publish(content, cb)
            }),
            pull.drain( msg => {
              debug('INFO: published follow message for %s', msg.value.content.contact)
            }, (err) => {
              debug('INFO: done: %s', err ? err.message : 'no errors')
            })
          )
        })
      )
    })
  } else {
    debug('INFO: No autofollow section in config')
  }
  return {}
}


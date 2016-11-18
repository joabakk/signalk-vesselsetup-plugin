const signalkSchema = require('signalk-schema')
const Bacon = require('baconjs')

const relevantKeys = Object.keys(signalkSchema.metadata)
  .filter(s => s.indexOf('/vessels/*') >= 0)
  .map(s => s.replace('/vessels/*', '').replace(/\//g, '.').replace(/RegExp/g, '*').substring(1))

module.exports = function(app) {
  var plugin = {}
  var unsubscribes = []

  plugin.id = "static-data-edit"
  plugin.name = "Edit static data for vessel"
  plugin.description = "A plugin to set vessel info and static values"

  plugin.schema = {
    type: "object",
    properties: {
      zones: {
        type: "array",
        title: " ",
        items: {
          title: "Categories",
          type: "object",
          properties: {
            "active": {
              title: "Active",
              type: "boolean",
              default: true
            },
            "key": {
              title: "Signal K Path",
              type: "string",
              default: "",
              "enum": relevantKeys
            },
            "values": {
              title: "Set value",
              type: "string",
              default: "",
              "description": "set static value",

          }
        }
      }
    }
  }
}

  plugin.start = function(options) {
    unsubscribes = options.zones.reduce((acc, {
      key,
      active,
      values,
    }) => {
      if(active) {
        var stream = app.streambundle.getSelfStream(key)
        const tests = zones.map((zone, i) => {
          if(typeof zone.upper != 'undefined') {
            if(typeof zone.lower != 'undefined') {
              return value => value < zone.upper && value >= zone.lower
            } else {
              return value => value < zone.upper
            }
          } else {
            return value => value > zone.upper
          }
        })
        acc.push(stream.map(value => {
          return tests.findIndex(test => test(value))
        }).skipDuplicates().onValue(zoneIndex => {
          sendNotificationUpdate(key, zoneIndex, zones)
        }))
      }
      return acc
    }, [])
    return true
  }

  plugin.stop = function() {
    unsubscribes.forEach(f => f())
    unsubscribes = []
  }

  function sendNotificationUpdate(key, zoneIndex, zones) {
    var value = null
    if(zoneIndex >= 0) {
      value = {
        state: zones[zoneIndex].state,
        message: zones[zoneIndex].message,
        timestamp: (new Date()).toISOString()
      }
    }
    const delta = {
      context: "vessels." + app.selfId,
      updates: [
        {
          source: {
            label: "self.notificationhandler"
          },
          values: [{
            path: "notifications." + key,
            value: value
          }]
        }
      ]
    }
    app.signalk.addDelta(delta)
  }

  return plugin
}

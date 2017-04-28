const signalkSchema = require('signalk-schema')
const Bacon = require('baconjs')
const fs = require('fs')
var find = require('fs-find')
, path = process.cwd();

const relevantKeys = Object.keys(signalkSchema.metadata)
.filter(s => s.indexOf('/vessels/*') >= 0)
.map(s => s.replace('/vessels/*', '').replace(/\//g, '.').replace(/RegExp/g, '*').substring(1))

var fileList = []

var list = find("settings", function(err, results) {
  if(err) {
    return console.log(err);
  }
  for(var item of results) {
    //Only show .json files in enum
    if(item.file.indexOf('.json') !== -1){fileList.push(item.file)}
  }
})

var data = function getContent(){
  fs.readFile('settings/aava-file-settings.json', 'utf8', function (err,data) {
    if (err) {
      return console.log(err);
    }
    console.log(data);
    return JSON.stringify(data)
  });

}

module.exports = function(app) {
  var plugin = {}
  var unsubscribes = []

  plugin.id = "static-data-edit"
  plugin.name = "Edit static data for vessel"
  plugin.description = "A plugin to set vessel info and static values"
  //Values that don’t change could be in default.json
  //Values that might change should be visible in the plugin (sail areas, names), updated on ‘submit'
  //pick and choose json blocks from settings examples (to/from file, N2K, NMEA0183 etc.)
  plugin.schema = {
    type: "object",
    properties: {
      file: {
        title: "Settings file to import",
        type: "string",
        "enum": fileList
      },
      saveAs: {
        type: "string",
        title: "Save as",
        default: "settings/[filename here].json"
      },
      "name"  : {
        title: "Vessel name",
        type: "string",
        default: "Volare"
      },
      "brand" : {
        title: "Vessel brand",
        type: "string",
        default: ""
      },
      "type"  : {
        title: "Vessel brand model",
        type: "string",
        default: ""
      },
      "uuid"  : {
        title: "Signal K UUID",
        type: "string",
        default: ""
      },
      optional: {
        type: "array",
        title: "Optional data",
        items: {
          title: "data",
          type: "object",
          properties: {
          "active": {
            title: "Active",
            type: "boolean",
            default: true
          },
          "infoType": {
            title: "value",
            type: "string",
            "enum": ["mmsi", "callsign"],
            enumNames: ["International MMSI number", "VHF call sign"]
          },
          "value": {
            title: "value",
            type: "string"
          }
        }
      }
      },
      dimensions: {
        type: "array",
        title: "Optional dimensions",
        items: {
          title: "Dimensions",
          type: "object",
          properties: {
            "active": {
              title: "Active",
              type: "boolean",
              default: true
            },
            "dimensionType": {
              title: "dimension",
              type: "string",
              "enum": ["length", "beam", "mast", "depthTransducer", "keel", "fromCenter", "fromBow"],
              enumNames: ["length over all (LOA) [m]", "beam (width) [m]", "mast height above water line [m]", "Depth transducer level below water line [m]", "keel depth below water line [m]", "GPS antenna distance from center line [m]", "GPS antenna distance from bow [m]"]
            },
            "dimension": {
              title: "value",
              type: "number"
            }
          }
        }
      }
    }
  };
  plugin.uiSchema = {
    content: {
      "ui:widget": "textarea",
      rows: 15
    }
  };


  plugin.start = function(options) {



    return true
  }

  plugin.stop = function() {
    unsubscribes.forEach(f => f())
    unsubscribes = []
  }

  function sendNotificationUpdate(key, zoneIndex, zones) {
    var value = null


  }


  return plugin
}

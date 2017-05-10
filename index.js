const signalkSchema = require('signalk-schema')
var find = require('fs-find')
, path = process.cwd();

const relevantKeys = Object.keys(signalkSchema.metadata)
.filter(s => s.indexOf('/vessels/*') >= 0)
.map(s => s.replace('/vessels/*', '').replace(/\//g, '.').replace(/RegExp/g, '*').substring(1))

var fileList = [];

var list = find("settings", function(err, results) {
  if(err) {
    return console.log(err);
  }
  for(var item of results) {
    //Only show .json files in enum
    if(item.file.indexOf('.json') !== -1){fileList.push(item.file);}
  }
});

var data = function getContent(){
  fs.readFile('settings/aava-file-settings.json', 'utf8', function (err,data) {
    if (err) {
      return console.log(err);
    }
    console.log(data);
    return JSON.stringify(data);
  });

};

module.exports = function(app) {
  var plugin = {};
  var unsubscribes = [];

  plugin.id = "static-data-edit";
  plugin.name = "Edit static data for vessel";
  plugin.description = "A plugin to set vessel info and static values";

  plugin.schema = {
    type: "object",
    properties: {
      saveAs: {
        type: "string",
        title: "Save as",
        default: "settings/[filename here].json (vesselname or test or onboard etc)"
      },
      "name"  : {
        title: "Vessel name",
        type: "string",
        default: ""
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
        default: app.signalk.self.uuid
      },
      "ws": {
        title: "websocket",
        type: "boolean",
        default: true
      },
      "mdns": {
        title: "mdns",
        type: "boolean",
        default: true
      },
      "bower": {
        title: "bower",
        type: "boolean",
        default: true
      },
      "rest": {
        title: "rest",
        type: "boolean",
        default: true
      },
      "tcp": {
        title: "tcp",
        type: "boolean",
        default: true
      },
      "nmea-tcp": {
        title: "nmea_tcp",
        type: "boolean",
        default: true
      },
      optional: {
        type: "array",
        title: "Optional data",
        items: {
          title: "data",
          type: "object",
          properties: {
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
          title: " ",
          type: "object",
          properties: {
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
      },
      providers: {
        type: "array",
        title: "",
        items: {
          title: "Providers",
          type: "object",
          properties: {
            "active": {
              title: "Active",
              type: "boolean",
              default: true
            },
            "id": {
              title: "Provider ID",
              type: "string"
            },
            "type": {
              title: "Select Provider",
              type: "number",
              default: 0,
              "enum": [0,1,2,3],
              enumNames: ["NMEA0183 from file (option 1: filename, option 2: throttle rate)", "NMEA0183 from serial (option 1: device, option 2: baudrate)", "N2K from file (option 1: file name, option 2: throttle rate)", "N2K from serial (option 1: device, option 2 not used)"]
            },
            "option1": {
              title: "option 1",
              type: "string",
            },
            "option2": {
              title: "option 2",
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
    var jsonfile = require('jsonfile');
    var file = options.saveAs;
    var obj = {
      "vessel": {
        "name"  : options.name,
        "brand" : options.brand,
        "type"  : options.type,
        "uuid"  : options.uuid,

      },
      "mdns": options.mdns,
      "interfaces": {
        "bower": options.bower,
        "rest": options.rest,
        "ws": options.ws,
        "tcp": options.tcp,
        "nmea-tcp": options.nmea_tcp
      },
      "pipedProviders": []
    };
    if (options.dimensions) {
      obj.vessel.dimensions = {};
      options.dimensions.forEach((item)=>{
        obj.vessel.dimensions[item.dimensionType] = item.dimension;
      });
    }

    options.providers.forEach(function(item){
      if(item.active){
        if(item.type === 0){
          obj.pipedProviders.push(
            {
              "id": item.id,
              "pipeElements": [
                {
                  "type": "providers/filestream",
                  "options": {
                    "filename": item.option1
                  },
                  "optionMappings": [
                    {
                      "fromAppProperty": "argv.nmeafilename",
                      "toOption": "filename"
                    }
                  ]
                },
                {
                  "type": "providers/throttle",
                  "options": {
                    "rate": item.option2
                  }
                },
                {
                  "type": "providers/liner"
                },
                {
                  "type": "providers/nmea0183-signalk",
                  "optionMappings": [
                    {
                      "fromAppProperty": "selfId",
                      "toOption": "selfId"
                    },
                    {
                      "fromAppProperty": "selfType",
                      "toOption": "selfType"
                    }
                  ]
                }
              ]
            }
          );
        }
        if(item.type === 1){
          obj.pipedProviders.push(
            {
              "id": item.id,
              "pipeElements": [
                {
                  "type": "providers/serialport",
                  "options": {
                    "device": item.option1,
                    "baudrate": item.option2
                  },
                  "optionMappings": [
                    {
                      "fromAppProperty": "argv.nmeadevice",
                      "toOption": "device"
                    },

                    {
                      "fromAppProperty": "argv.nmeabaudrate",
                      "toOption": "baudrate"
                    }
                  ]
                },
                {
                  "type": "providers/nmea0183-signalk",
                  "optionMappings": [
                    {
                      "fromAppProperty": "selfId",
                      "toOption": "selfId"
                    },
                    {
                      "fromAppProperty": "selfType",
                      "toOption": "selfType"
                    }
                  ]
                }
              ]
            }
          );
        }
        if(item.type === 2){
          var command = "actisense-serial " + item.option1
          obj.pipedProviders.push(
            {
              "id": item.id,
              "pipeElements": [
       {
         "type": "providers/filestream",
         "options": {
           "filename": item.option1
         },
         "optionMappings": [
           {
             "fromAppProperty": "argv.n2kfilename",
             "toOption": "filename"
           }
         ]
       },
       {
         "type": "providers/liner"
       },
       {
         "type": "providers/n2kAnalyzer"
       },
       {
         "type": "providers/timestamp-throttle"
       },
       {
         "type": "providers/n2k-signalk"
       }
    ]
            }
          );
        }
        if(item.type === 3){
          var command = "actisense-serial " + item.option1;
          obj.pipedProviders.push(
            {
              "id": item.id,
              "pipeElements": [{
                "type": "providers/execute",
                "options": {
                  "command": command
                }
              }, {
                "type": "providers/liner"
              }, {
                "type": "providers/n2kAnalyzer"
              }, {
                "type": "providers/n2k-signalk"
              }]
            }
          );
        }
      }
    });


    jsonfile.writeFile(file, obj, {spaces: 2}, function (err) {
      console.error(err);
    });
    return true;
  };

  plugin.stop = function() {
    unsubscribes.forEach(f => f());
    unsubscribes = [];
  };



  return plugin;
};

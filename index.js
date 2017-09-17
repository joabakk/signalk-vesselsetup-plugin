const signalkSchema = require('signalk-schema')
var find = require('fs-find')
, path = process.cwd();

const uuidV4 = require('uuid/v4');
const newuuid = "urn:mrn:signalk:uuid:" + uuidV4();

const relevantKeys = Object.keys(signalkSchema.metadata)
.filter(s => s.indexOf('/vessels/*') >= 0)
.map(s => s.replace('/vessels/*', '').replace(/\//g, '.').replace(/RegExp/g, '*').substring(1))

var fileList = [];
var itemType;

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
  var selfUuid = 'none';

  try {
    selfUuid = app.signalk.self.uuid;
  }
  catch(err) {
    selfUuid ='none';
  }

  plugin.id = "static-data-edit";
  plugin.name = "Edit static data for vessel";
  plugin.description = "A plugin to set vessel info and static values";

  plugin.schema = {
    type: "object",
    required: [
      "name"
    ],
    anyOf: [
      {"required": ["uuid"]},
      {"required": ["mmsi"]}
    ],
    additionalProperties:false,
    properties: {
      saveAs: {
        type: "string",
        title: "Save as: (vesselname or test or onboard etc). After 'submit', the node server must be restarted to implement changes",
        default: "settings/[filename here].json"
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
        title: "Signal K UUID, if no MMSI number is available",
        type: "string",
        "enum": ['null', `${selfUuid}`, `${newuuid}`],
        enumNames: ["Do not use UUID", `Use existing: ${selfUuid}`, `Make new: ${newuuid}`]
      },
      "mmsi"  : {
        title: "International MMSI number",
        type: "string"
      },
      "ssl": {
        title: "ssl",
        type: "boolean",
        default: false
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
      "charts": {
        title: "charts",
        type: "boolean",
        default: true
      },
      "webapps": {
        title: "webapps",
        type: "boolean",
        default: true
      },
      "nmea-tcp": {
        title: "nmea_tcp",
        type: "boolean",
        default: true
      },
      /*"loggingSK": {
      title: "SK log to file (not enabled)",
      type: "boolean",
      default: false
    },
    "logfile": {
    title: "logfile folder",
    type: "string",
    default: "logs"
  },*/
  optional: {
    type: "array",
    title: "Optional data (not enabled)",
    items: {
      title: "data",
      type: "object",
      properties: {
        "infoType": {
          title: "value",
          type: "string",
          "enum": ["callsign", "IMO"],
          enumNames: ["VHF call sign", "IMO number"]
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
    title: "Providers (input)",
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
          "enum": [0,1,2,3,4,5,6],
          enumNames: ["NMEA0183 from file (option 1: filename, option 2: throttle rate)",
          "NMEA0183 from serial (option 1: device, option 2: baudrate)",
          "N2K from file (option 1: filename, option 2: throttle rate)",
          "N2K from serial (option 1: device, option 2 not used)",
          "NMEA0183 over tcp (option1: host, option 2 port)",
          "NMEA0183 over UDP (option 1: not used, option 2 port)",
          "Signal K from serial port (option 1: device, option 2: baudrate)"
        ]
      },
      "option1": {
        title: "Option 1",
        type: "string",
      },
      "option2": {
        title: "option 2",
        type: "number"
      },
      /*"loggingInput": {
      title: "log input to file",
      type: "boolean"
    }*/
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
      "type"  : options.type
    },
    "mdns": options.mdns,
    "ssl" : options.ssl,
    "interfaces": {
      "bower": options.bower,
      "rest": options.rest,
      "ws": options.ws,
      "tcp": options.tcp,
      "nmea-tcp": options.nmea_tcp,
      "charts": options.charts,
      "webapps": options.webapps
    },
    "pipedProviders": []
  };
  if (options.mmsi === ""){
    obj.vessel["uuid"] = options.uuid;
  } else {
    obj.vessel["mmsi"] = "urn:mrn:imo:mmsi:" + options.mmsi;
  }

  if (options.dimensions) {
    obj.vessel.dimensions = {};
    options.dimensions.forEach((item)=>{
      obj.vessel.dimensions[item.dimensionType] = item.dimension;
    });
  }

  if(options.providers){
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
        if(item.type === 4){
          obj.pipedProviders.push(
            {
              "id": item.id,
              "pipeElements": [
                {
                  "type": "providers/tcp",
                  "options": {
                    "host": item.option1,
                    "port": item.option2,
                  }
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
        if(item.type === 5){
          obj.pipedProviders.push(
            {
              "id": item.id,
              "pipeElements": [
                {
                  "type": "providers/udp",
                  "options": {
                    "port": item.option2
                  },
                  "optionMappings": [
                    {
                      "fromAppProperty": "argv.udpport",
                      "toOption": "port"
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
        if(item.type === 6){
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
                  "type": "providers/from_json"
                },
              ]
            }
          );
        }
        //if(options.loggingSK === true){
        //obj.pipedProviders[(obj.pipedProviders.length + 1)] = {"type": "providers/log","options": {"logdir": options.logfile,"discriminator": "I"}};
        //}
      }
    });
  }
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

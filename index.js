{
  "vessel": {
    "name": "Kristina",
    "brand": "maxi",
    "type": "fenix",
    "uuid": "urn:mrn:signalk:uuid:c0d79334-4e25-4245-8892-54e8ccc8021d",
    "mmsi": "257817010",
    "dimensions": {
      "length": 10,
      "beam": 3,
      "mast": 10
    }
  },
  "mdns": true,
  "ssl": false,
  "interfaces": {
    "bower": true,
    "rest": true,
    "ws": true,
    "tcp": true
  },
  "pipedProviders": [
    {
      "id": "nmeaFromFile",
      "pipeElements": [
        {
          "type": "providers/filestream",
          "options": {
            "filename": "samples/plaka.log"
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
            "rate": 500
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
    },
    {
      "id": "tcp",
      "pipeElements": [
        {
          "type": "providers/tcp",
          "options": {
            "host": "localhost",
            "port": 3000
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
    },
    {
      "id": "udp",
      "pipeElements": [
        {
          "type": "providers/udp",
          "options": {
            "port": 3900
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
  ]
}

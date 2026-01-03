const app = Vue.createApp({
    data() {
        return {
            sidebarVisible: false,
            dataObject: "",
            selectA: "",
            selectB: "",
            listA: [
                "Attain HVAC",
                "Attain Metering",
                "Attain Sensors",
                "General MEP", 
                "HVAC-R", 
                "Electrical Service", 
                "Security System",
                "Audio/Visual System",
                "Vertical Transportation",
                "Waste Management",
                "Catering",
                "Smart Sensors",
                "ICT",
                "Fire/Smoke System",
                "Lighting",
                "Renewable Energy",
                "Appliances"
            ],
            listB: [],
            item: "",
            sys: "",
            equipmentReference: "",
            assetReference: "",
            deviceDataT: "",
            deviceDataA: "",
            pointsListA: [], // LIST OF ALL TELEMETRY NAMES
            pointsListB: [], // POINTS LIST PER DEVICE TYPE
            pointsListC: [], // DEVICE SEMI STATIC ATTRIBUTES
            pointsListD: [], // DEVICE BDNS NAMES
            selectP: "",
            endPointStringAT: "https://<host>/api/plugins/telemetry/ASSET/<assetID>/values/timeseries?keys=<comma separated list>&startTs=<range start UTC Timestamp milliseconds>&endTs=<range stop UTC Timestamp milliseconds> (Not including startTs and endTs results in last telemetry value being returned)",
            endPointStringAA: "https://<host>/api/plugins/telemetry/ASSET/<assetID>/values/attributes?keys=<comma separated list>",
            endPointStringDT: "https://<host>/api/plugins/telemetry/DEVICE/<deviceID>/values/timeseries?keys=<comma separated list>&startTs=<range start UTC Timestamp milliseconds>&endTs=<range stop UTC Timestamp milliseconds> (Not including startTs and endTs results in last telemetry value being returned)",
            endPointStringDA: "https://<host>/api/plugins/telemetry/DEVICE/<deviceID>/values/attributes?keys=<comma separated list>",
            endPointStringDTK: "https://<host>/api/plugins/telemetry/DEVICE/<deviceID>/keys/timeseries",
            endPointStringDAK: "https://<host>/api/plugins/telemetry/DEVICE/<deviceID>/keys/attributes",
            assetEndpointListA: [],
            selectedEndpointT: "",
            selectedEndpointA: "",
            dataDesignA: {
                'data':{
                    'DEVICE_A_NAME (from Attain device naming schema)': {
                        'telemetry key name (from points library <Attain Key>)':'<point value> (NUMBER, STRING, BOOL->NUM 0/1)'
                    },
                    'DEVICE_B_NAME': {},
                    'DEVICE_C_NAME': {},
                    'DEVICE_..._NAME': {},
                    'FCU_A-05E-010M-0106': {
                        'rat': 21.9,
                        'sat': 26.2,
                        'tsp': 22.0,
                        'enb': 1,
                        'htg': 100,
                        'clg': 0,
                        'spd': 100,
                        'flt': 1,
                        'afl': 176
                    }
                }
            },
            dataDesignB: {
                'data': 
                    [
                        ['DEVICE_NAME','command type (SETPOINT/MODE/SCHEDULE)','desired value i.e 21.0','current value i.e 22.5','minute of day timestamp','expected energy saving KWh'],
                        ['DEVICE_NAME','SETPOINT','20.5','21.5','660','0.3'],
                        ['DEVICE_NAME','MODE','FAN','HEAT','720','1.2'],
                        ['...'],
                        ['...']
                ]
            },
            dataDesignC: {
                'data':{
                    'DEVICE_NAME (from Attain device naming schema)': ['command type (TEMP/FAN/LIGHTING)','command action i.e increase/decrease','current value i.e 22.5'],
                    'DEVICE_NAME': [],
                    'DEVICE_..._NAME': [],
                    'FCU_A-05E-03-011N': ['TEMP','increase','19.5'],
                }
            }
        };
    },

    mounted() {
        this.getPlatformDevicesData();
        //this.getAssetEndpoints(); 
    },

    methods: {
        toggleSidebar() {
            this.sidebarVisible = !this.sidebarVisible;
        },
        closeSidebar() {
            this.sidebarVisible = false;
        },
        
        getPlatformDevicesData() { 
            const url = 'https://red.attain-energy.io/getPlatformData';
            fetch(url).then(res => {
                if (res.status === 200) {
                    res.json().then(data => {
                        console.log(data);
                        this.pointsListA = data.a;
                        this.pointsListB = data.b;
                        this.pointsListC = data.c;
                        this.pointsListD = data.d;
                    });
                }
            });
        },
        getAssetEndpoints() {
            const url = 'https://red.attain-energy.io/assetEndpointsA';
            fetch(url).then(res => {
                if (res.status === 200) {
                    res.json().then(data => {
                        console.log(data);
                        this.assetEndpointListA = data;
                    });
                }
            });
        },
        
        syntaxHighlight(input) {
            let jsonString;
            // If input is a string, try parsing it as JSON
            if (typeof input === "string") {
                try {
                    jsonString = JSON.parse(input);
                } catch (error) {
                    return `<span class="string">${input}</span>`;
                }
            } else {
                jsonString = input; // If already an object/array
            }
            if (Array.isArray(jsonString)) {
                // Handle arrays by converting them to a bullet-point list
                return `<ul class="json-array">` + jsonString.map(item => 
                    `<li>${this.syntaxHighlight(item)}</li>`
                ).join('') + `</ul>`;
            }
            // If it's an object, continue with normal JSON highlighting
            let formattedJson = JSON.stringify(jsonString, undefined, 4)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;');
            return formattedJson.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
                let cls = 'number';
                if (/^"/.test(match)) {
                    cls = /:$/.test(match) ? 'key' : 'string';
                } else if (/true|false/.test(match)) {
                    cls = 'boolean';
                } else if (/null/.test(match)) {
                    cls = 'null';
                }
                return `<span class="${cls}">${match}</span>`;
            });
        },

        getAssetEndpoint() {
            const endP = this.selectP;
            if (endP=='building') {
                this.assetReference = "BUILDING_ABCD";
            } else if (endP=='floor') {
                this.assetReference = "BUILDING_ABCD_FLOOR_FFF"
            }
            this.endPointStringAT = 'https://<host>/api/plugins/telemetry/ASSET/<assetID>/values/timeseries?keys=<comma separated list>&startTs=<range start UTC Timestamp milliseconds>&endTs=<range stop UTC Timestamp milliseconds> (Not including startTs and endTs results in last telemetry value being returned)';
            this.endPointStringAA = 'https://<host>/api/plugins/telemetry/ASSET/<assetID>/values/attributes?keys=<comma separated list>';
            const url = `https://red.attain-energy.io/assetEndpointsB?endPoint=${endP}`;
            fetch(url)
                .then(res => {
                    if (res.status === 200) {
                        return res.json().catch(error => {
                            console.error("Response is not valid JSON:", error);
                            return Promise.reject("Invalid JSON response");
                        });
                    } else {
                        console.warn("Server responded with status:", res.status);
                        return Promise.reject(`Server error: ${res.status}`);
                    }
                })
                .then(data => {
                    console.log("Fetched endpoint data:", data);
                    this.selectedEndpointT = data.timeseries;
                    this.selectedEndpointA = data.semistatic;
                })
                .catch(error => {
                    console.error("Fetch error:", error);
                    // Show an error message instead of JSON if there was a fetch error
                    this.selectedEndpointT = `Error: ${error}`;
                    this.selectedEndpointA = `Error: ${error}`;
                });
        },
    
        setSystem() {
            this.deviceDataT = "";
            const x = this.selectA;
            this.listB = [];
            this.equipmentReference = "";
            //const url = `https://red.attain-energy.io/getDevicesData?sys=${x}`;
            //fetch(url).then(res => {
                //if (res.status === 200) {
                    //res.json().then(data => {
                        //console.log(data);
                        //this.dataObject = data;
                        //for (let i = 0; i < data[0].length; i++) {
                            //this.listB.push(data[0][i][0]);
                        //}
                    //});
                //}
            //});
            let selected = "";
            if (x == "Attain HVAC") { selected = "ATTAIN_HVAC" }
            if (x == "Attain Metering") { selected = "ATTAIN_METERS" }
            if (x == "Attain Sensors") { selected = "ATTAIN_SENSORS" }
            if (x == "HVAC-R") {selected = "HVAC"}
            if (x == "Electrical Service") { selected = "PMS" }
            if (x == "Security System") { selected = "SEC" }
            if (x == "Audio/Visual System") { selected = "AV" }
            if (x == "Vertical Transportation") { selected = "VRT" }
            if (x == "Waste Management") { selected = "WST" }
            if (x == "Catering") { selected = "CAT" }
            if (x == "Smart Sensors") { selected = "xxx" }
            if (x == "ICT") { selected = "ICT" }
            if (x == "Fire/Smoke System") { selected = "FIR" }
            if (x == "Lighting") { selected = "LTG" }
            if (x == "Renewable Energy") { selected = "ENE" }
            if (x == "Appliances") { selected = "APL" }
            if (x == "General MEP") { selected = "MEP" }
            
            const refData = this.pointsListD;
            let items = [];
            for (let i = 0; i < refData.length; i++) {
                if (refData[i].col6==selected) {
                    items.push([data[i].col1, data[i].col2, selected])
                }
            }
            this.dataObject = items;
                for (let j = 0; j < items[0].length; j++) {
                    this.listB.push(items[0][j][0]);
                }
        },

        setItem() {
            const x = this.selectB;
            const y = this.dataObject;
            for (let i = 0; i < y[0].length; i++) {
                if (y[0][i][0] === x) {
                    this.item = y[0][i][1];
                    this.sys = y[0][i][2];
                }
            }
            const z = this.item;
            console.log(z);
            const url = `https://red.attain-energy.io/getDeviceConfig?item=${z}`;
            fetch(url).then(res => {
                if (res.status === 200) {
                    res.json().then(data => {
                        console.log(data);
                        this.deviceDataT = data
                    });
                }
            });
            this.getAssetName();
        },

        getAssetName() {
            const generateString = function() {
                const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
                let result = '';
                for (let i = 0; i < 3; i++) {
                    result += chars.charAt(Math.floor(Math.random() * chars.length));
                }    
                return result;
            };
            const type = this.item;
            const floor = "FFF-";
            const inst = "NNNN-";
            const proj = "ABCD";
            this.equipmentReference = "Equipment Name : " + type + "-" + floor + inst + proj + " , where FFF is a floor number or zone reference, and NNNN is a unique equipment instance/reference for that floor, and ABCD is the unique Attain project reference";
        }
    }
});

app.mount('#smartBldgDesign');

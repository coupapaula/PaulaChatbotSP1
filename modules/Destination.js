class Destination {

    constructor(data) {
    if (!("destinationConfiguration" in data)) {
    // TODO: could check even more here, maybe use a JSON Schema before parsing
    throw new Error("Invalid Destination configuration: " + JSON.stringify(data));
    }
    
    this.destinationConfiguration = data.destinationConfiguration;
    this.authTokens = data.authTokens;
    }
    
    hasLocationId() {
    return typeof this.destinationConfiguration.CloudConnectorLocationId === 'string';
    }
    
    getLocationId() {
    return this.destinationConfiguration.CloudConnectorLocationId;
    }
    }
    
    module.exports = Destination;
const axios = require ("axios");
const jsdom = require("jsdom");
const {JSDOM} = jsdom;
const twilio = require('twilio');
const config = {
    urls: [
            {
                label:"Neuron 6 Green",
                url: "https://www.canyon.com/en-ca/mountain-bikes/trail-bikes/neuron/al/neuron-6/3156.html?dwvar_3156_pv_rahmenfarbe=GN"
            },
            {
                label: "Neuron 6 Blue",
                url: "https://www.canyon.com/en-ca/mountain-bikes/trail-bikes/neuron/al/neuron-6/3156.html?dwvar_3156_pv_rahmenfarbe=BU"
            },
            {
                label: "Neuron 5 Grey",
                url: "https://www.canyon.com/en-ca/mountain-bikes/trail-bikes/neuron/al/neuron-5/3155.html?dwvar_3155_pv_rahmenfarbe=GY%2FBK"
            },
            {   
                label: "Neuron 5 Red",
                url: "https://www.canyon.com/en-ca/mountain-bikes/trail-bikes/neuron/al/neuron-5/3155.html?dwvar_3155_pv_rahmenfarbe=RD"
            }
        ],
    sizes: [
        "XS",
        "S"
    ]
    
}

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const senderPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

async function getBikePage(url) {
    
    try {
        const bikeResponse = await axios.get(url);
        console.log(`response status for ${url} - ${bikeResponse.status}`)
        //console.log(JSON.stringify(bikeResponse.data))
        return await bikeResponse.data;
    } catch(e){
        console.error(e.message);
    }
}

function parseBikeSizes(bikePage) {

    const dom = new JSDOM(bikePage);
   
    var availableNodes = dom.window.document.querySelectorAll('button.js-productConfigurationSelect');
    const availableSizes = [];
    console.log(JSON.stringify(availableNodes))
    if (availableNodes) {
        availableNodes.forEach( node => availableSizes.push(node.attributes.getNamedItem('data-product-size').value))
    } 

    return availableSizes;
}

async function findBike(url) {
    console.log(`requesting bike info for ${url.label} at ${url.url}...`);
    const bikePage = await getBikePage(url.url);
    const availableSizes = await parseBikeSizes(bikePage);

    const desiredSizes = availableSizes.filter(size => config.sizes.includes(size));

    if (desiredSizes && desiredSizes.length > 0){
        desiredSizes.forEach(async size => 
            {
                console.log(`${url.label} is available in size ${size}`);
                notifyAvailableBike(url.label, size);
            });
    } else {
        console.log(`${url.label} not available in desired sizes`);
    }
}

async function notifyAvailableBike(bike, size){
    const client = twilio(accountSid, authToken);

    await client.messages
        .create({body:`${bike} is now available in size ${size}`, from:senderPhoneNumber, to:'6472142057'})
        .then(message => console.log(message.sid));
}

function findAvailableBikes() {
    config.urls.forEach(url => findBike(url));
}

exports.handler=async function(event, context) {
    return findAvailableBikes();
};
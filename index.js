import axios from "axios";
import { JSDOM } from "jsdom";
import twilio from 'twilio';
const config = {
    urls: [
            {
                label:"NEURON_7_ORANGE",
                url: "https://www.canyon.com/en-ca/mountain-bikes/trail-bikes/neuron/al/neuron-7/2627.html?dwvar_2627_pv_rahmenfarbe=GY%2FOG"
            },
            {
                label: "NEURON_7_STEALTH",
                url: "https://www.canyon.com/en-ca/mountain-bikes/trail-bikes/neuron/al/neuron-7/2627.html?dwvar_2627_pv_rahmenfarbe=BK%2FGY"
            },
            {
                label: "NEURON_6_BLUE",
                url: "https://www.canyon.com/en-ca/mountain-bikes/trail-bikes/neuron/al/neuron-6/2625.html?dwvar_2625_pv_rahmenfarbe=BU%2FBK"
            },
            {   
                label: "NEURON_6_STEALTH",
                url: "https://www.canyon.com/en-ca/mountain-bikes/trail-bikes/neuron/al/neuron-6/2625.html?dwvar_2625_pv_rahmenfarbe=BK%2FGY"
            }
        ],
    sizes: [
        "XS",
        "S",
        "XL"
    ]
    
}

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const senderPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

async function getBikePage(url) {
    
    try {
        const bikeResponse = await axios.get(url);
        console.log(`response status for ${url} - ${bikeResponse.status}`)
        return bikeResponse.data;
    } catch(e){
        console.error(e.message);
    }
}

 async function parseBikeSizes(bikePage) {

    const dom = await new JSDOM(bikePage);

    var availableNodes = dom.window.document.querySelectorAll('button.js-productConfigurationSelect');
    const availableSizes = [];

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
        desiredSizes.forEach(size => 
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

    client.messages
        .create({body:`${bike} is now available in size ${size}`, from:senderPhoneNumber, to:'6472142057'})
        .then(message => console.log(message.sid));
}

async function findAvailableBikes() {
    config.urls.forEach(async url => findBike(url));
}



findAvailableBikes();

export default findAvailableBikes;
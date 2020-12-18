'use strict';
const ComputerVisionClient = require('@azure/cognitiveservices-computervision').ComputerVisionClient;
const ApiKeyCredentials = require('@azure/ms-rest-js').ApiKeyCredentials;
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');
var express = require('express');
var bodyParser = require("body-parser");
const sleep = require('util').promisify(setTimeout); 
                                    

var app = express();
var port = 3001;             
     
app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(function (req, res, next) {
    req.header("Content-Type", "application/json");
    res.header("Content-Type", "application/json");
    next();
  });


const key = '1b4df8a9ff584808b0c51a6494887db0';
const endpoint = 'https://itcs61771.cognitiveservices.azure.com/';

const computerVisionClient = new ComputerVisionClient(
    new ApiKeyCredentials({ inHeader: { 'Ocp-Apim-Subscription-Key': key } }), endpoint)

app.post('/v1/imageCategory', (req, res) => {
    if(req.body.url){
        console.log(req.body.url);
        const categoryURLImage = req.body.url;
   
           const imageCategory=async()=> {
               // Analyze URL image
           console.log('Analyzing category in image...', categoryURLImage.split('/').pop());
           try{
               const categories = (await computerVisionClient.analyzeImage(categoryURLImage)).categories;
           console.log(`Categories: ${formatCategories(categories)}`);
           function formatCategories(categories) {
               categories.sort((a, b) => b.score - a.score);
               return categories.map(cat => `${cat.name} (${cat.score.toFixed(2)})`).join(', ');
             } 
             res.json(categories);
           }
           catch(err){
               var e={
                   message :err.code,
                   statusCode:err.statusCode
               }
               res.status(e.statusCode);
               res.json(e);
           }  
            }
            imageCategory();
        }
        else{
            res.send("The url for the image to be analysed has to be passed in the body of the request");
        }
        
     });

    app.post('/v1/imageTags', (req, res) => {
        console.log(req.body.url);
        if(req.body.url){
            console.log(req.body.url);
            const imageURL = req.body.url;
    
                const imageTags=async()=> {

                    const tagsURL = imageURL;
                    try{
                       // Analyze URL image
                    console.log('Analyzing tags in image...', tagsURL.split('/').pop());
                    const tags = (await computerVisionClient.analyzeImage(tagsURL, { visualFeatures: ['Tags'] })).tags;
                    console.log(`Tags: ${formatTags(tags)}`);
                    
                    
                    // Format tags for display
                    function formatTags(tags) {
                        return tags.map(tag => (`${tag.name} (${tag.confidence.toFixed(2)})`)).join(', ');
                    }
                    res.json(tags);
                   return tags;
                    }
                    catch(err){
                        var e={
                            message :err.code,
                            statusCode:err.statusCode
                        }
                        res.status(e.statusCode);
                        res.json(e);
                    }  
                }
                imageTags();
        }
        else{
            res.send("The url for the image to be analysed has to be passed in the body of the request");
        }      
        });

    app.post('/v1/detectObjects',(req,res)=>{
        if(req.body.url){
            console.log(req.body.url);
            const imageURL = req.body.url;
            async function detectObjects () {
                const objectURL = imageURL;
                 try{
                  // Analyze a URL image
                console.log('Analyzing objects in image...', objectURL.split('/').pop());
                const objects = (await computerVisionClient.analyzeImage(objectURL, { visualFeatures: ['Objects'] })).objects;
                console.log();
    
                // Print objects bounding box and confidence
                if (objects.length  ) {
                console.log(`${objects.length} object${objects.length == 1 ? '' : 's'} found:`);
                for (const obj of objects) { console.log(`    ${obj.object} (${obj.confidence.toFixed(2)}) at ${formatRectObjects(obj.rectangle)}`); }
               }else { console.log('No objects found.'); }
               
               // Formats the bounding box
               function formatRectObjects(rect) {
               return `top=${rect.y}`.padEnd(10) + `left=${rect.x}`.padEnd(10) + `bottom=${rect.y + rect.h}`.padEnd(12)
               + `right=${rect.x + rect.w}`.padEnd(10) + `(${rect.w}x${rect.h})`;
                };
                res.json(objects);
                 }
                 catch(err){
                    var e={
                        message :err.code,
                        statusCode:err.statusCode
                    }
                    res.status(e.statusCode);
                    res.json(e);
                }
               
                }
                detectObjects();
        }   
            else{
                res.send("The url for the image to be analysed has to be passed in the body of the request");
            }
        });

    app.post('/v1/read',(req,res)=>{
    const STATUS_SUCCEEDED = "succeeded";
// URL images containing printed and/or handwritten text. 
// The URL can point to image files (.jpg/.png/.bmp) or multi-page files (.pdf, .tiff).

if(!req.body.url){
    res.send("The url for the image has to be provided in the body")
}
const printedTextSampleURL = req.body.url;

// Recognize text in printed image from a URL
async function read1(){
    try{
        console.log('Read printed text from URL...', printedTextSampleURL.split('/').pop());
        const printedResult = await readTextFromURL(computerVisionClient, printedTextSampleURL);
        res.json(printedResult);
    }
    catch(err){
        var e={
            message :err.code,
            statusCode:err.statusCode
        }
        res.status(e.statusCode);
        res.json(e);
    }
}

// Perform read and await the result from URL
async function readTextFromURL(client, url) {
    // To recognize text in a local image, replace client.read() with readTextInStream() as shown:
    try{
        let result = await client.read(url);
    // Operation ID is last path segment of operationLocation (a URL)
    let operation = result.operationLocation.split('/').slice(-1)[0];
  
    // Wait for read recognition to complete
    // result.status is initially undefined, since it's the result of read
    while (result.status !== STATUS_SUCCEEDED) {
        try{
        await sleep(1000); 
        result = await client.getReadResult(operation);
        return result.analyzeResult.readResults; // Return the first page of result. Replace [0] with the desired page if this is a multi-page file such as .pdf or .tiff.
    }
    catch(err){
        console.log("err here");
        var e={
            message :err.code,
            statusCode:err.statusCode
        }
        res.status(e.statusCode);
        res.json(e);
    }
    }
 }
  catch(err){
      console.log("error occured");
      var e={
        message :err.code,
        statusCode:err.statusCode
    }
    res.status(e.statusCode);
    res.json(e);
  }
}
  read1();
    })

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`) })

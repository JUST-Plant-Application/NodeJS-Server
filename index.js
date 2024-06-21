require('dotenv').config();
const express = require('express');
const axios = require('axios');
const app = express();
const bodyParser = require('body-parser');
const fetch =require('node-fetch');
const fs = require('fs');
const multer = require('multer');
const path = require('path');
const serviceAccount = require('./google-services.json'); 

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json({ limit: '1gb' }));

app.use(express.json());

api_key= process.env.PLANTS_API_KEY;
crop_api_key= process.env.CROP_HEALTH_API_KEY;
const port = process.env.PORT  ;


/////////////////////test USAGE INFO.
app.get("/UsageInfo",(req,res)=>{

var config = {
  method: 'get',
maxBodyLength: Infinity,
  url: 'https://plant.id/api/v3/usage_info',
  headers: { 
    'Api-Key': api_key, 
    'Content-Type': 'application/json'
  }
};

axios(config)
.then(function (response) {
  console.log(JSON.stringify(response.data));
  res.send(JSON.stringify(response.data));
})
.catch(function (error) {
  console.log(error);
});


})


////////////// CREATE IDENTIFICATION
app.post('/identify', async (req, res) => {
  const { images, latitude, longitude, similar_images } = req.body;

  const data = {
    images,
    latitude,
    longitude,
    similar_images
  };

  const config = {
    method: 'post',
    maxBodyLength: Infinity,
    url: 'https://plant.id/api/v3/identification?details=common_names,url,description,taxonomy,rank,gbif_id,inaturalist_id,image,synonyms,edible_parts,watering&language=en',
    headers: { 
      'Api-Key': api_key, 
      'Content-Type': 'application/json'
    },
    data: data
  };

  try {
    const response = await axios(config);
    res.json(response.data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while processing your request.' });
  }
});


/////////////HEALTH ASSESSMENT 
app.post('/health-assessment', async (req, res) => {
  const { images, latitude, longitude, similar_images } = req.body;

  const data = {
    images,
    latitude,
    longitude,
    similar_images
  };

  const config = {
    method: 'post',
    maxBodyLength: Infinity,
    url: 'https://plant.id/api/v3/health_assessment?language=en&details=local_name,description,url,treatment,classification,common_names,cause',
    headers: { 
      'Api-Key': api_key, 
      'Content-Type': 'application/json'
    },
    data: data
  };

  try {
    const response = await axios(config);
    res.json(response.data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while processing your request.' });
  }
});


////////////////////RETRIEVE IDENTIFICATION
app.get("/retrieve-identification/:access_token", async (req, res) => {
  const access_token = req.params.access_token;
  const details = req.query.details || 'common_names,url,description,taxonomy,rank,gbif_id,inaturalist_id,image,synonyms,edible_parts,watering,propagation_methods';
  const language = req.query.language || 'en';

  const config = {
    method: 'get',
    maxBodyLength: Infinity,
    url: `https://plant.id/api/v3/identification/${access_token}?details=${details}&language=${language}`,
    headers: {
      'Api-Key': api_key,
      'Content-Type': 'application/json'
    }
  };

  try {
    
    const response = await axios(config);
    console.log('API response:', response.data);
    res.json(response.data);
  } catch (error) {
    console.error('Error occurred:', error);
    res.status(500).json({ error: 'An error occurred while processing your request.' });
  }
});


//////////////// PLANT SEARCH
app.get('/plants/search', async (req, res) => {
  const { query } = req.query;
  const limit =10;
  const  lang ="en";
  
  const config = {
      method: 'get',
      maxBodyLength: Infinity,
      url: `https://plant.id/api/v3/kb/plants/name_search?q=${query}&limit=${limit}&lang=${lang}`,
      headers: {
          'Api-Key': api_key,
          'Content-Type': 'application/json'
      }
  };

  try {
      const response = await axios(config);
      const plantEntities = response.data.entities;
      
      // Fetch details for each plant to get the image URL
      const plantDetailsPromises = plantEntities.map(async (plant) => {
          const detailConfig = {
              method: 'get',
              maxBodyLength: Infinity,
              url: `https://plant.id/api/v3/kb/plants/${plant.access_token}?details=image`,
              headers: {
                  'Api-Key': api_key,
                  'Content-Type': 'application/json'
              }
          };
          const detailResponse = await axios(detailConfig);
          return {
              ...plant,
              image_url: detailResponse.data.image?.value || null
          };
      });

      const plantDetails = await Promise.all(plantDetailsPromises);
      res.json({ entities: plantDetails });
  } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'An error occurred while processing your request.' });
  }
});


/////////////////// PLANTS DETAILS
app.get('/plants/detail/:access_token', async (req, res) => {
  const { access_token } = req.params;
  const details="common_names,url,description,taxonomy,rank,gbif_id,inaturalist_id,image,images,synonyms,edible_parts,watering,propagation_methods";
  const lang ="en";

  var config = {
      method: 'get',
      maxBodyLength: Infinity,
      url: `https://plant.id/api/v3/kb/plants/${access_token}?details=${details}&lang=${lang}`,
      headers: { 
          'Api-Key': api_key, 
          'Content-Type': 'application/json'
      }
  };

  try {
      const response = await axios(config);
      res.json(response.data);
  } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'An error occurred while processing your request.' });
  }
});


///////////////////////////////////////////////////////////
////////////////////// CROP HEALTH ///////////////////////
///////////////////////Usage Info , CROP HEALTH
app.get("/UsageInfo-CropHealth",(req,res)=>{
var config = {
  method: 'get',
maxBodyLength: Infinity,
  url: 'https://crop.kindwise.com/api/v1/usage_info',
  headers: { 
    'Api-Key': crop_api_key, 
    'Content-Type': 'application/json'
  }
};

axios(config)
.then(function (response) {
  console.log(JSON.stringify(response.data));
})
.catch(function (error) {
  console.log(error);
   });
});


//////////////////////POST Create identification [CROP]

app.post('/crop-health-identify', async (req, res) => {
  const { images, latitude, longitude, similar_images } = req.body;

  const data = {
    images,
    latitude,
    longitude,
    similar_images
  };

  const config = {
    method: 'post',
    maxBodyLength: Infinity,
    url: 'https://crop.kindwise.com/api/v1/identification?details=common_names,type,taxonomy,eppo_code,eppo_regulation_status,gbif_id,image,images,wiki_url,wiki_description,treatment,description,symptoms,severity,spreading&language=en',
    headers: { 
      'Api-Key': crop_api_key, 
      'Content-Type': 'application/json'
    },
    data: data
  };

  try {
    const response = await axios(config);
    res.json(response.data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while processing your request.' });
  }
});
 


////////////////////////////GET Retrieve identification [CROP]
app.get("/crop-health-retrieve/:access_token", async (req, res) => {
  const access_token = req.params.access_token;
  const details ='type,common_names,eppo_code,wiki_url,taxonomy';
  const language =  'en';

  const config = {
    method: 'get',
    maxBodyLength: Infinity,
    url: `https://crop.kindwise.com/api/v1/identification/${access_token}?details=${details}&language=${language}`,
    headers: {
      'Api-Key': crop_api_key,
      'Content-Type': 'application/json'
    }
  };

  try {
    const response = await axios(config);
    console.log('API response:', response.data);
    res.json(response.data);
  } catch (error) {
    console.error('Error occurred:', error);
    res.status(500).json({ error: 'An error occurred while processing your request.' });
  }
});



////////////////////////////////////
//local server

app.listen(port ,()=>
{
    console.log(`Server listening at http://localhost:${port}`);
})


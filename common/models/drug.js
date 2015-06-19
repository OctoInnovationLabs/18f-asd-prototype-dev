var request = require('request');
//var utilsjs = require('../utils/utils');
var log4js = require('log4js');
log4js.configure('server/log4js_configuration.json', {});
var logger = log4js.getLogger('18f-asd-prototype-dev');

module.exports = function(Drug) {

function getToString(str) {
    if(!str) return null;
    var lastChar = str.charCodeAt(str.length-1);

    var nextChar = String.fromCharCode(lastChar+1);
    var newString = str.slice(0,str.length-1) + nextChar;    
    
    return newString;
};

function getSearchQuery(str) {
   var result = 'https://api.fda.gov/drug/label.json?api_key=yiv5ZoikJg3kSSZ5edvsiqnJa9yvHoxrm6EWT8yi&search=openfda.brand_name:';
   var range = '[' + str + '+TO+' + getToString(str) + ']';
   result = result + range + '+OR+openfda.generic_name:' + range +'&limit=10';

   return result;
};

Drug.findSuggestions = function(q, cb){
	logger.debug('Enterd findSuggestions method');
  //Fetching the search API
  var fdaAPI = getSearchQuery(q);
  logger.debug('fdaAPI:: '+ fdaAPI);
  //Making the API call
  request(fdaAPI, 
          function (error, response, body) {
    var drugSuggestions = [];  
    //if error returning error object  
    if(error){
      logger.debug('Error happened');
      return cb(error); 
    } else if (!error && response.statusCode == 200) {
      q = q.toUpperCase();
      //Converting response bidy to JSON object
      var responseOBJ = JSON.parse(body);
      var results = responseOBJ.results;
      for(var i in results) {
         var drugItem = results[i];
         if(drugItem.set_id){

            //Looping brandnames to find the matches
            if(drugItem.openfda.brand_name){
              var brandNames = drugItem.openfda.brand_name;
              for(var j in brandNames){
                 var brandName = brandNames[j];
                  brandName = brandName.toUpperCase();
                  //logger.debug('brandName:::'+brandName);
                 if(brandName.indexOf(q) > -1){
                  drugSuggestions.push({
                      "id": drugItem.set_id,
                      "name": brandNames[j],
                      "indicator": "brand"
                   });
                 }
              }
            }  

            //Looping generic names to find the matches
            if(drugItem.openfda.generic_name){
               var genericNames = drugItem.openfda.generic_name;
                for(var k in genericNames){
                 var genericName = genericNames[k];
                genericName = genericName.toUpperCase();
                 //logger.debug('genericName:::'+genericName);
                 if(genericName.indexOf(q) > -1){
                  drugSuggestions.push({
                      "id": drugItem.set_id,
                      "name": genericNames[k],
                      "indicator": "generic"
                   });
                 }
              }
            } 

         }         
      }      
    }
    return cb(null, drugSuggestions);
  });
};

Drug.remoteMethod(
    'findSuggestions',
    {
      description: 'Fetch suggestions for the given drug name',
      accepts: {arg: 'q', type: 'string', required: true},
      returns: {arg: 'result', type: 'array'},
      http: {path: '/suggestions', verb: 'get'}
    }
  );

};

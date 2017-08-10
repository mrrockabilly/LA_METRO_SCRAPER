'use strict';

const cheerio = require('cheerio');
const request = require('request');

var cacheOutput = {};
var lastTime;
const duration = 300000; // 5 mins in millisecs

const scrapeController = {
  cachify: (req, res, next) => {

  	const currTime = new Date(Date.now());

  	if(! lastTime) {
  		lastTime =  currTime; // get current date

  		scrapeController.getAll(req, res, function(finalOutput){
  			cacheOutput['news'] = finalOutput; 
  			res.type('application/json');
				res.send(cacheOutput);
  		}); // this gives us {'news': output}

  	} else if(currTime - lastTime > duration) {
  		lastTime =  currTime; // get current date
    	scrapeController.getAll(req, res, function(finalOutput){
  			cacheOutput['news'] = finalOutput; 
  			res.type('application/json');
				res.send(cacheOutput);
  		}); // this gives us {'news': output}
  	} else {
  			res.type('application/json');
				res.send(cacheOutput);
  	}


  },

	//Sample Code.
  getData: (req, res, next) => {

    // change URL to any site that you want
    request('http://www.producthunt.com/', (error, response, html) => {
      let $ = cheerio.load(html);
      // add code here

    });
  },
  //Root Route logic. Scrapes LA metro news.
  getAll: (req, res, next) =>{

  	// initial scrape of the LA metro news webpage
  	request('https://www.metro.net/news/toc/', (error,response, html) => {
  		let $ = cheerio.load(html); // use cheerio to access html like jquery
  		
  		var output = [];
  		const domain = 'https://www.metro.net';

  		// selecting each 'article' with headline, url, date, summary, keyword
  		$('dl').each(function(index, element) {

  			var newsObj = {};
  			var a = $(this).find('dt a');
  			newsObj['headline'] = a.text();
  			newsObj['url'] = domain + a.attr('href');
  			newsObj['date'] = $(this).children().first().text().trim();
  			newsObj['summary'] = $(this).find('dd p').text().trim();
  			newsObj['keyword'] = $(this).children().last().text().trim();
  			output.push(newsObj); // add news article object to output array
  		});

  		// this is the function defines the promise for each output array element
  		function getFullText(newsObj){
  			var textProm = new Promise(function(resolve, reject){
  				// scrape the webpage with the article's full text
  				request(newsObj.url, (error, response, html) => {
  					if(error){
  						// console.log('err with request', newsObj);
  						reject(error);
  					} else {
  						// access the full text webpage using cheerio
  						let $ = cheerio.load(html);
	  					let fullText = '';

	  					// select the paragraph element with class 'PressReleaseDefault'
	  					// note there are edge cases - some p's left out the classname
	  					$('p[class=PressReleaseDefault]').each(function(){
	  						fullText += $(this).text() + '\n'; 
	  					});

	  					// pass over the success value to promise
	  					resolve(fullText);
  					}
  				});
  			});
  			return textProm;
  		}

  		var promiseArray = output.map(getFullText); // creates array of Promises
  		var results = Promise.all(promiseArray); // only done when all Promises complete
  		results.then((data) => {

  			// add the full text property to the news objects in our output array
  			const len = output.length;
  			for(let i = 0; i < len; i++) {
  				output[i]['fullText'] = data[i];
  			}

  			// send final output array to requestor
  			// res.type('application/json');
  			// res.send({news: output});
  			return next(output);
  		});
				
  	});
  }
};

module.exports = scrapeController;

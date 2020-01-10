
 
var BasePage;

BasePage = function() {
	
	
	
	this.selectDropdownbyNum = function ( element, optionNum ) {
		  if (optionNum){
		    var options = element.all(by.tagName('option'))   
		      .then(function(options){
		        options[optionNum].click();
		      });
		  }
		};
	
	
	this.element= function(ele){
		
		return ele;
		
	};


	this.getPageTitle = function() {

		return browser.getTitle();

	};

	this.logOut = function(xpath) {

		element(by.xpath(xpath)).click();

		
	};

	this.uploadfile = function(fileToUpload, value, absolutePath) {

		absolutePath = path.resolve(__dirname, fileToUpload);

		element(by.css('input[type="file"]')).sendKeys(absolutePath);

		element(by.xpath(value)).click();

	};
	this.getPageTitle = function() {

		return browser.getTitle();

	};

	this.refreshThePage = function() {

		browser.executeScript("history.go(0)")

	};

	this.ScrollTheViewElementAndClick = function(element) {

		browser.executeScript("arguments[0].scrollIntoView();", element);

	};
	this.highlightElement = function(el) {

		console.log("highlight--");

		console.log("locator---:" + el.locator());

		return browser.driver.executeScript(
				"arguments[0].setAttribute('style', arguments[1]);",
				el.getWebElement(), "color: Red; border: 2px solid red;").then(
				function(resp) {
					browser.sleep(2000);
					return el;
				}, function(err) {
					console.log("error is :" + err);
				});
	};
	
	
	// code to verify status code
	
	this.httpget= function(siteUrl){
		
		      var http = require('http');
		
			  var defer = protractor.promise.defer();

			  http.get(siteUrl, function(response) {

			      var bodyString = '';

			      response.setEncoding('utf8');

			      response.on("data", function(chunk) {
			          bodyString += chunk;
			      });

			      response.on('end', function() {
			          defer.fulfill({
			              statusCode: response.statusCode,
			              bodyString: bodyString
			          });
			      });

			  }).on('error', function(e) {
			      defer.reject("Got http.get error: " + e.message);
			  });

			  return defer.promise;
			}
		

	
	this.stringtoNumber= function(value){
		

    var amount = value;
        
        
    // return  Number(amount.replace(/[^0-9\.]+/g,""));


		
	};

};

module.exports = new BasePage();
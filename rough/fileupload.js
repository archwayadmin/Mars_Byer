
	// code for focus on the element once scrolle the window..	
var ele=element(by.xpath("//label[@class='btn btn-primary float-right']"));
		
        browser.executeScript("arguments[0].scrollIntoView();",ele);
        
        
        
        





var fileToUpload = './images/demo.jpg',
		
	    absolutePath = path.resolve(__dirname, fileToUpload);

    element(by.css('input[type="file"]')).sendKeys(absolutePath);    
	  
	 element(by.xpath("//div[@id='toast-container']")).click();
		
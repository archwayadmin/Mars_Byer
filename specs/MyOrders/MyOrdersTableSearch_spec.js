var loginPageObj = require('./../../pageobjects/LoginPage/LoginPage.js');

var page = require('./../../pageobjects/BasePage/BasePage.js');

var Additemobj = require('./../../pageobjects/AddItem/AddItem.js');

var myorderobj = require('./../../pageobjects/MyOrders/MyOrders.js');

var homepageobj = require('./../../pageobjects/HomePage/HomePage.js');

var tdata = require('./../../json/MyOrder.json');

//var xl=require('./../../util/ReadExcel.js');

var dataReaderObj=require('./../../utils/DataReader.js');

var logger= require('./../../log');

var selectwraper = require('./../../Select-Wrapper.js');

var myselect = new selectwraper(by.xpath("//select[@id='status']"));



browser.manage().timeouts().implicitlyWait(4000);

describe(' Verifying the Login Page - ', function () {
	

	beforeEach(function() {
		
		
		setTimeout(function() {
			
		}, 100000);
		        originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
		        jasmine.DEFAULT_TIMEOUT_INTERVAL = 200000;
		     });

		     afterEach(function() {
		      jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
		     });
		     
		     browser.ignoreSynchronization = true;
		     
		     
	
    it("Verify order status and respected orders", function() {
    	
    	homepageobj.clickOnmyOrders();
    	
    	browser.sleep(4000);
    	
    	
    	myselect.getOptions().getText().then(function(text){
    		
    		console.log(text);//[ ' All ', ' Open ', ' Shipped ', ' Declined ', ' Canceled ' ]
    		
    		 if(text[1]==" Open "){
    			 
    			 myselect.selectByText(" Open ");
    			 
    			 browser.sleep(4000);
    			 
    			 element.all(by.css("td.text-center:nth-child(1)")).count().then(function(text){
    				 
    				 
    				if(text>0 && text<10){
    					
    					
    					console.log(" Table Header name logic will apply here");
    					
    					
    					 var headersize= element.all(by.css("table>thead>tr>th"));
    			        	
    			        	
    		        	   headersize.count().then(function(size){
    		        		   
    		        		   if(size>0){
    		        			   
    		        			   for(var i=0; i<size; i++ ){
    		        				   
    		        				   headersize.get(i).getText().then(function(text){
    		        					   
    		        					console.log(text);  
    		        					
    		        					
    		        					   
    		        				   });  
    		        				  
    		        				   
    		        				   
    		        			   }
    		        			  
    		        			  
    		        			   
    		        			   
    		        			   
    		        		   }
    		        		   
    		        		   
    		        		   
    		        		   
    		        		   
    		        	   });
    		        	   
    		        	   // Header text labeling verification starts from here
    		        	   
    		        	   

    		        		  // for Order Name
    		        		  
    		        		  element(by.xpath("//button[contains(text(),'Order Number')]")).getText().then(function(text){
    		        				
    		        				console.log("label of the Order Number text is:"+text);
    		        		
    		        				
    		        				expect(text).toContain("Order Number","not found");
    		        				
    		        				
    		        			});
    		        		  
    		        		  //total item
    		        		  
    		        		  element(by.xpath("//button[contains(text(),'Total Items')]")).getText().then(function(text){
    		        				
    		        				console.log("label of the total item text is:"+text);
    		        		
    		        				
    		        				expect(text).toContain("Total Items","not found");
    		        				
    		        				
    		        			});
    		        		  
    		        		  //status
    		        		  element(by.xpath("//th[3]//button[1]")).getText().then(function(text){
    		        				
    		        				console.log("label of status text is:"+text);
    		        		
    		        				
    		        				expect(text).toContain("Status","not found");
    		        				
    		        				
    		        			});
    		        		  
    		        		  //status date
    		        		  
    		        		  element(by.xpath("//button[contains(text(),'Status Date')]")).getText().then(function(text){
    		        				
    		        				console.log("label of the Status date text is:"+text);
    		        		
    		        				
    		        				expect(text).toContain("Status Date","not found");
    		        				
    		        				
    		        			});
    		        		  
    		        		  //date submitted
    		        		  
    		        		  element(by.xpath("//button[contains(text(),'Date Submitted')]")).getText().then(function(text){
    		        				
    		        				console.log("label of the Date Submitted text is:"+text);
    		        		
    		        				
    		        				expect(text).toContain("Date Submitted","not found");
    		        				
    		        				
    		        			});
    		        		  
    		        		  // ordered for
    		        		  
    		        		  element(by.xpath("//button[contains(text(),'Ordered For')]")).getText().then(function(text){
    		        				
    		        				console.log("label of the Ordered For text is:"+text);
    		        		
    		        				
    		        				expect(text).toContain("Ordered For","not found");
    		        				
    		        				
    		        			});
    		        		  
    		        		  // ordered By
    		        		  
    		        		  element(by.xpath("//button[contains(text(),'Ordered By')]")).getText().then(function(text){
    		        				
    		        				console.log("label of the Ordered By text is:"+text);
    		        		
    		        				
    		        				expect(text).toContain("Ordered By","not found");
    		        				
    		        				
    		        			});
    		        		  
    		        		  // order total
    		        		  
    		        		  element(by.xpath("//button[contains(text(),'Order Total')]")).getText().then(function(text){
    		        				
    		        				console.log("label of the Order Total text is:"+text);
    		        		
    		        				
    		        				expect(text).toContain("Order Total","not found");
    		        				
    		        				
    		        			});
    		        			
    		        		  
    		 
    		        	   
    		        		  // Header text labeling verification ends from here
       		        	   
    		        	   
    		        	
    		        	  
    		        	  
    					console.log(" pagination logic does not applly here");
    					
    					  
    				     
    				      
    				     // expect(browser.getCurrentUrl()).to.contain.text('30');
    				   
    				      // capturing the latest url when click on last page
    				      browser.getCurrentUrl().then(function(text){
    						  
    						   console.log(text);
    						   
    					
    						   
    						   expect(text).toBeTruthy();
    						   
    						  browser.sleep(5000);
    						  
    						
    						       
    				    
    						  
    				      });
    				      
    					
    					
    					
    					
    				}
    				
    				else if(text>=10){
    					
    					
    					console.log(" Table Header name logic will apply here");
    					
    					 var headersize= element.all(by.css("table>thead>tr>th"));
    			        	
    			        	
    		        	   headersize.count().then(function(size){
    		        		   
    		        		   if(size>0){
    		        			   
    		        			   for(var i=0; i<size; i++ ){
    		        				   
    		        				   headersize.get(i).getText().then(function(text){
    		        					   
    		        					console.log(text);  
    		        					
    		        					
    		        					   
    		        				   });  
    		        				  
    		        				   
    		        				   
    		        			   }
    		        			   
    		        			   
    		        			   
    		        		   }
    		        		   
    		        		   
    		        		   
    		        		   
    		        		   
    		        	   });
    		        	   
    		        	// Header text labeling verification starts from here
    		        	   
    		        	   

 		        		  // for Order Name
 		        		  
 		        		  element(by.xpath("//button[contains(text(),'Order Number')]")).getText().then(function(text){
 		        				
 		        				console.log("label of the Order Number text is:"+text);
 		        		
 		        				
 		        				expect(text).toContain("Order Number","not found");
 		        				
 		        				
 		        			});
 		        		  
 		        		  //total item
 		        		  
 		        		  element(by.xpath("//button[contains(text(),'Total Items')]")).getText().then(function(text){
 		        				
 		        				console.log("label of the total item text is:"+text);
 		        		
 		        				
 		        				expect(text).toContain("Total Items","not found");
 		        				
 		        				
 		        			});
 		        		  
 		        		  //status
 		        		  element(by.xpath("//th[3]//button[1]")).getText().then(function(text){
 		        				
 		        				console.log("label of status text is:"+text);
 		        		
 		        				
 		        				expect(text).toContain("Status","not found");
 		        				
 		        				
 		        			});
 		        		  
 		        		  //status date
 		        		  
 		        		  element(by.xpath("//button[contains(text(),'Status Date')]")).getText().then(function(text){
 		        				
 		        				console.log("label of the Status date text is:"+text);
 		        		
 		        				
 		        				expect(text).toContain("Status Date","not found");
 		        				
 		        				
 		        			});
 		        		  
 		        		  //date submitted
 		        		  
 		        		  element(by.xpath("//button[contains(text(),'Date Submitted')]")).getText().then(function(text){
 		        				
 		        				console.log("label of the Date Submitted text is:"+text);
 		        		
 		        				
 		        				expect(text).toContain("Date Submitted","not found");
 		        				
 		        				
 		        			});
 		        		  
 		        		  // ordered for
 		        		  
 		        		  element(by.xpath("//button[contains(text(),'Ordered For')]")).getText().then(function(text){
 		        				
 		        				console.log("label of the Ordered For text is:"+text);
 		        		
 		        				
 		        				expect(text).toContain("Ordered For","not found");
 		        				
 		        				
 		        			});
 		        		  
 		        		  // ordered By
 		        		  
 		        		  element(by.xpath("//button[contains(text(),'Ordered By')]")).getText().then(function(text){
 		        				
 		        				console.log("label of the Ordered By text is:"+text);
 		        		
 		        				
 		        				expect(text).toContain("Ordered By","not found");
 		        				
 		        				
 		        			});
 		        		  
 		        		  // order total
 		        		  
 		        		  element(by.xpath("//button[contains(text(),'Order Total')]")).getText().then(function(text){
 		        				
 		        				console.log("label of the Order Total text is:"+text);
 		        		
 		        				
 		        				expect(text).toContain("Order Total","not found");
 		        				
 		        				
 		        			});
 		        			
 		        		  
 		 
 		        	   
 		        		  // Header text labeling verification ends from here
    		        	   
    		        	   
    					console.log("Apply pagination logic here");
    					
    					  
    				      //getting the size of the pagination
    				        
    				      var getPaginationsize = element.all(by.css("ngb-pagination>ul>li"));
    				      
    				      
    				      getPaginationsize.count().then(function (pagination) {
    				    	  
    				          if (pagination > 0) {

    				              for (var i = 1; i < pagination-1; i++) {
    				            	  
    				            	  browser.executeScript('window.scrollTo(0,document.body.scrollHeight)');
    				            	  
    				            	  browser.sleep(3000);
    				            	  
    				            	  
    				                  getPaginationsize.get(i).click();
    				                  
    				                  
    				                
    				                   element.all(by.css("td.text-center:nth-child(1)")).count().then(function(text){
    				                	
    				                	console.log("total count:"+text);
    				                	
    				                	
    				                });
    				                
    				                browser.executeScript('window.scrollTo(0,document.body.scrollHeight)');
    				         	   
    				         	   browser.sleep(3000);
    				         	   
    				         	   
    				         	  browser.getCurrentUrl().then(function(text){
    	    						  
    	    						   console.log(text);
    	    						   
    	    					
    	    						   
    	    						   expect(text).toBeTruthy();
    	    						   
    	    						  browser.sleep(3000);
    	    						  
    	    						
    	    						       
    	    				    
    	    						  
    	    				      });
    				         	   
    				         	   
    				         	   
    				              }
    				          } 
    				      });
    				      
    				     // expect(browser.getCurrentUrl()).to.contain.text('30');
    				   
    				      
    				      // capturing the latest url when click on last page
    				      browser.getCurrentUrl().then(function(text){
    						  
    						   console.log(text);
    						   
    					
    						   
    						   expect(text).toBeTruthy();
    						   
    						  browser.sleep(5000);
    						  
    						
    						       
    				    
    						  
    				      });
    				      
    					
    					
    				}
    				
    				else if(text==0){
    					
    					
    					element.all(by.css("td.text-center:nth-child(1)")).count().then(function(val){
    						
    						console.log("Total records found:"+val);
    						
    						expect(val).toBe(0);
    						
    						//console.log("No records found");
    						
    						element(by.xpath("//p[contains(text(),'No orders found')]")).getText().then(function(text){
    							
    							console.log("No orders found");
    							
    							expect(text).toContain("No orders found");
    							
    							
    							
    							
    						});
    						
    						
    						
    						
    					});
    					
    					
    				}
    				 
    				 
    				 
    				 
    				 
    				 
    			 });
    			 
    			 
    			 
    				 
    			 
    		 }
    		 
    		 else{
    			 
    			 
    			 console.log("Value selected from dropdown is invalid");
    			 
    			 
    		 }
    		
    		
    
    		
    		
    	});
    	
    	
    	
    	
  	
    	
    });
    
    
   
    
    
        xit("Verify Headers name", function() {
        	
        	   var headersize= element.all(by.css("table>thead>tr>th"));
        	
        	
        	   headersize.count().then(function(size){
        		   
        		   if(size>0){
        			   
        			   for(var i=0; i<size; i++ ){
        				   
        				   headersize.get(i).getText().then(function(text){
        					   
        					console.log(text);  
        					
        					
        					   
        				   });  
        				  
        				   
        				   
        			   }
        			   
        			   
        			   
        		   }
        		   
        		   
        		   
        		   
        		   
        	   });
        	
        	
           	
        	
        	
        });
        
        
      
        
        
  xit("verifying my orders table pagination", function() {
  	

        
      //getting the size of the pagination
        
      var getPaginationsize = element.all(by.css("ngb-pagination>ul>li"));
      
      
      getPaginationsize.count().then(function (pagination) {
    	  
          if (pagination > 0) {

              for (var i = 1; i < pagination-1; i++) {
            	  
            	  browser.executeScript('window.scrollTo(0,document.body.scrollHeight)');
            	  
            	  browser.sleep(5000);
            	  
            	  
                  getPaginationsize.get(i).click();
                  
                  
                
                   element.all(by.css("td.text-center:nth-child(1)")).count().then(function(text){
                	
                	console.log("total count:"+text);
                	
                	
                });
                
                browser.executeScript('window.scrollTo(0,document.body.scrollHeight)');
         	   
         	   browser.sleep(5000);
         	   
         	   
              }
          } else {
              console.log('Order does not  exists');
          }
      });
      
     // expect(browser.getCurrentUrl()).to.contain.text('30');
   
      
      // capturing the latest url when click on last page
      browser.getCurrentUrl().then(function(text){
		  
		   console.log(text);
		   
	
		   
		   expect(text).toBeTruthy();
		   
		  browser.sleep(5000);
		  
		
		       
    
		  
      });
      
  });
  
  xit("Headers name verify", function() {
	  
	  // for Order Name
	  
	  element(by.xpath("//button[contains(text(),'Order Number')]")).getText().then(function(text){
			
			console.log("label of the Order Number text is:"+text);
	
			
			expect(text).toContain("Order Number","not found");
			
			
		});
	  
	  //total item
	  
	  element(by.xpath("//button[contains(text(),'Total Items')]")).getText().then(function(text){
			
			console.log("label of the total item text is:"+text);
	
			
			expect(text).toContain("Total Items","not found");
			
			
		});
	  
	  //status
	  element(by.xpath("//th[3]//button[1]")).getText().then(function(text){
			
			console.log("label of status text is:"+text);
	
			
			expect(text).toContain("Status","not found");
			
			
		});
	  
	  //status date
	  
	  element(by.xpath("//button[contains(text(),'Status Date')]")).getText().then(function(text){
			
			console.log("label of the Status date text is:"+text);
	
			
			expect(text).toContain("Status Date","not found");
			
			
		});
	  
	  //date submitted
	  
	  element(by.xpath("//button[contains(text(),'Date Submitted')]")).getText().then(function(text){
			
			console.log("label of the Date Submitted text is:"+text);
	
			
			expect(text).toContain("Date Submitted","not found");
			
			
		});
	  
	  // ordered for
	  
	  element(by.xpath("//button[contains(text(),'Ordered For')]")).getText().then(function(text){
			
			console.log("label of the Ordered For text is:"+text);
	
			
			expect(text).toContain("Ordered For","not found");
			
			
		});
	  
	  // ordered By
	  
	  element(by.xpath("//button[contains(text(),'Ordered By')]")).getText().then(function(text){
			
			console.log("label of the Ordered By text is:"+text);
	
			
			expect(text).toContain("Ordered By","not found");
			
			
		});
	  
	  // order total
	  
	  element(by.xpath("//button[contains(text(),'Order Total')]")).getText().then(function(text){
			
			console.log("label of the Order Total text is:"+text);
	
			
			expect(text).toContain("Order Total","not found");
			
			
		});
		
	  
	  
	  
	  
	  
	  
	  
  	
  });
       
      
	
 

 
});


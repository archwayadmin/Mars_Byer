
var HtmlReporter = require('protractor-beautiful-reporter');

exports.config = {
		
  framework: 'jasmine',
 directConnect: true,
 
 //directConnect: true,
// chromeDriver: 'C:\\Users\\NareshS\\Downloads\\chromedriver.exe',
 //geckoDriver: 'path_to_geckodriver.exe',

  //seleniumAddress: 'http://localhost:4444/wd/hub', 
  
  capabilities: {
      browserName: 'chrome'
      /*chromeoptions: {
       args: ['headless', 'window-size=1920,1080']
       }*/
  },
  
allScriptsTimeout:2500000,
  
  jasmineNodeOpts: {defaultTimeoutInterval: 2500000},
  
 // specs: ['./Smoke/*spec.js'], // if you want to run all test cases for a group like smoke
  
  // so this will be the syantx.
  
  //specs: ['./test_spec/exception.js'],
  
  specs: ['./specs/LoginPage/LoginPage_spec.js'],
  
  // how to run multiple suite
  
  
  /* 
  C:\Users\NareshS\eclipse-workspace\protrract\PM_Byer>protractor conf.js --suite=
	  login,Home,QuickAdd,Checkout */

  
  
  
  
  
  //specs: ['./test_spec/exception.js'],
 // specs: ['./Smoke/*spec.js'],  // to run all test cases under smoke folder
  
  //login,additem,checkout,myorder working fine..
  
  suites:{
	  
	  
	  /*-------------------Login Page--------------*/
	  
	  login:'./specs/LoginPage/LoginPage_spec.js',
	  
	  /*-------------------Home  Page--------------*/
	  
	//Home:'./specs/HomePage/HomePage_spec.js',
	  
	 
	  
	  /*-------------------Add Item --------------*/
	  
	  
	  
  //QuickAdd:'./specs/AddItem/AddItem_quickadd_spec.js',
	  
	//AddMultipleProducts:'./specs/AddItem/AddMultipleProduct.js',
	  
	  
	//AddByCategory:'./specs/AddItem/AddItemByCategory_spec.js',
	  
	//AddByFilter:'./specs/AddItem/AddItemByFilters_spec.js',
	  
	//AddByGrid:'./specs/AddItem/AddItemByGrid_spec.js',
	  
	//AddByList:'./specs/AddItem/AddItemByList_spec.js',
	  
	//AddByTable:'./specs/AddItem/AddItemByTable_spec.js',
	  
	//AddBySearch:'./specs/AddItem/AddItemBySearch_spec.js',
	  
	
  
  
  
  /*-------------------My Orders --------------*/
  
	SearchAndReorder:'./specs/MyOrders/SearchAndReorder_spec.js',
	
	//AdvanceSearchAndReorder:'./specs/MyOrders/MyOrder_specificSearch_spec.js',
	  
	//MyOrdersVerificationByStatus:'./specs/MyOrders/MyOrdersTableSearch_spec.js',


 
	  
	  
	  
	  /*-------------------Checkout Process which will select one time address --------------*/ 
	  
//Checkout:'./specs/Checkout/Checkout_spec.js',
	  
	  
	  /*-------------------Address selection  chocie--------------*/
  
 // MultipleAddress:'./specs/Address/MultipleAddress_spec.js',
  
  //SelectASaveAddress:'./specs/Address/SelectASaveAddress_spec.js',
  
	//Address:'./specs/Address/AddAddress_spec.js',
	  
	  
	  /*-------------------Profile --------------*/
	  
	//profile:'./specs/MyProfile/MyProfile_spec.js',

/*-------------------Change password --------------*/

//changepassword:'./specs/ChangePassword/ChangePassword_spec.js
	 
	  
	  
	  /*-------------------log out--------------*/
	  
//logout:'./specs/Logout/Logout_spec.js',
	  
	  
  },
  
  onPrepare: function () {
      browser.manage().window().maximize();
      
    

    

      jasmine.getEnv().afterEach(function (done) {
          browser.takeScreenshot().then(function (png) {
              allure.createAttachment('Screenshot', function () {
                  return new Buffer(png, 'base64')
              }, 'image/png')();
              done();
          });
      });
  },
  
 
  
  onPrepare: function() {
      // Add a screenshot reporter and store screenshots to `/tmp/screenshots`:
      jasmine.getEnv().addReporter(new HtmlReporter({
         baseDirectory: 'Reports/screenshots'
      }).getJasmine2Reporter());
   },
   
   
   
   
  
  
};
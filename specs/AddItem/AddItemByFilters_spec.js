var page = require('./../../pageobjects/BasePage/BasePage.js');

var Additemobj = require('./../../pageobjects/AddItem/AddItem.js');

var homepageobj = require('./../../pageobjects/HomePage/HomePage.js');

var OR = require('./../../json/objects.json');

var logger = require('./../../log');

var selectwraper = require('./../../Select-Wrapper.js');

var myselect = new selectwraper(by.xpath("//div[4]/display-filter[1]/form[1]/div[1]/select[1]']"));

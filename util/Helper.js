var Helper;
Helper = function () {

    this.IsNonAngularPage = function (value) {
        browser.ignoreSynchronization = value;
    };

    this.WaitTillElementIsEnabled = function (element) {
        browser.wait(function () {
            return element.isEnabled();
        });
    };

    this.WaitTillElementIsVisible = function (element) {
        browser.wait(function () {
            return element.elementIsVisible();
        });
    };


    this.ExecuteRawScript = function (selector, id, value) {
        if (selector == 'Id') {
            return browser.executeScript("document.getElementBy" + selector + "('" + id + "').value = '" + value + "'");
        } else {
            return browser.executeScript("document.getElementsBy" + selector + "('" + id + "').value = '" + value + "'");
        }
    };

    this.Select2Selector = function (id, value) {
        return element(by.cssContainingText(id, value)).click();
    };

    this.GetElementXpath = function (identifier, type) {
        var locator;
        switch (type) {
            case "text":
                locator = element(by.xpath("//input[@id='" + identifier + "']"));
                break;
            case "textarea":
                locator = element(by.xpath("//textarea[@id='" + identifier + "']"));
                break;
            case "list":
                locator = element(by.xpath("//div[@id='s2id_" + identifier + "']"));
                break;
        }
        return locator;
    };

    this.GetElementDefinationXpath = function (identifier, type) {
        var locator;
        var locator_1;
        switch (type) {
            case "text":
                locator = element(by.xpath("//input[@id='data" + identifier + "']"));
                break;
            case "textarea":
                locator = element(by.xpath("//textarea[@id='data" + identifier + "']"));
                break;
            case "float":
                locator = element(by.xpath("//input[@id='data" + identifier + "']"));
                locator_1 = element(by.xpath("//input[@id='data" + identifier + "_lmknjbhvgc']"));
                break;
            case "list":
                locator = element(by.xpath("//div[@id='s2id_data." + identifier + "']"));
                break;
            case "date":
                locator = element(by.xpath("//input[@id='" + identifier + "']"));
                break;
        }
        return {locator: locator, locator_1: locator_1};
    };

    

    this.GetElementXPIsXpath = function (identifier, type) {
        var locator;
        var locator_1;
        switch (type) {
            case "date":
                locator = element(by.xpath("(//input[@id='" + identifier + "'])[2]"));
                break;
            case "text":
                locator = element(by.xpath("//input[@ng-model='kpidata." + identifier + "']"));
                break;
            case "textarea":
                locator = element(by.xpath("//textarea[@ng-model='kpidata." + identifier + "']"));
                break;
            case "select":
                locator = element(by.xpath("(//div[@id='kpi-form']//span[@class='select2-chosen'])[" + identifier + "]"));
                break;
            case "numeric":
                locator = element(by.xpath("//input[@ng-model='kpidata." + identifier + "']"));
                locator_1 = element(by.xpath("//input[@id='kpidata" + identifier + "_lmknjbhvgc']"));
                break;
            case "float":
                locator = element(by.xpath("//input[@id='kpidata" + identifier + "']"));
                locator_1 = element(by.xpath("//input[@id='kpidata" + identifier + "_lmknjbhvgc']"));
                break;
            case "list":
                if (identifier == 'owner') {
                    locator = element(by.xpath("//*[@id='s2id_idea-" + identifier + "']"));
                    break;
                } else {
                    locator = element(by.xpath("//*[@id='s2id_kpidata." + identifier + "']"));
                    break;
                }

        }
        return {locator: locator, locator_1: locator_1};
    };

    this.SwtichToPopup = function () {
        browser.getAllWindowHandles().then(function (handles) {
            browser.switchTo().window(handles[1]).then(function () {
                //do your stuff on the pop up window
            });
        });
    }


    this.SweetAlertText = function (TexttoVerfiy) {
        element(by.xpath('//div[@class="sweet-alert showSweetAlert visible"]/h2')).getText().then(function (PopupText) {
            allure.createStep(PopupText, function () {
            })();
            var r = PopupText;
            expect(r).toContain(TexttoVerfiy);
        });
    }

    this.WaitforSweetAlert = function () {
        var sweet = element(by.xpath('//div[@class="sweet-alert showSweetAlert visible"]/h2'));
        browser.wait(function () {
            return sweet.isPresent();
        });
    }
    
    this.searchAndClickOnElement= function(){
    	
    	var ele=element(by.xpath("test"));
    	
    	
    	
    	
    	
    };

    this.ExecuteRawScriptForDate = function (selector, id, value) {
        if (selector == 'Id') {
            return browser.executeScript("document.querySelectorAll('input#" + id + "')[1].value = '" + value + "'");
        } else {
            return browser.executeScript("document.querySelectorAll('input#" + id + "')[1].value = '" + value + "'");
        }
    }

    this.ClickOnButtonUsingText = function (buttonText) {
        element(by.buttonText(buttonText)).click();
    }

    this.SelectColumnAndInsertValue = function (ColId, value) {
        browser.executeScript(function (arg1, arg2) {
            var allElements = document.querySelectorAll('.ui-grid-header-cell .ui-grid-filter-input-0');
            allElements[arg1].click();
            return allElements[arg1];

            //setTimeout(function(){
            //    var ab= document.querySelectorAll('.ui-grid-icon-cancel');
            //    ab[0].click();
            //},5000);

            //if()
            // allElements[0].value='';
        }, ColId, value).then(function (allELE) {

            allELE.sendKeys(value);
            // console.log(id[0]);

        });
    }

    this.CheckInsertedValue = function (ColId, value) {
        // browser.sleep(500);
        browser.executeScript(function (arg1, arg2) {
            var a = document.querySelectorAll('.ui-grid-canvas .ui-grid-cell-contents');
            var n = document.querySelectorAll('.ui-grid-canvas .ui-grid-row');
            var k = n.length - 2;
            //code to get the no of Rows on the UI
            //if you are on 3

            if (a.length > 0) {
                if (arg1 > 1) {
                    if (a[k + arg1].innerText.contains(arg2)) {
                        return "Details found with search criteria";
                    } else {
                        return "Not found";
                    }
                }
                else {
                    if (a[arg1].innerText.contains(arg2)) {
                        return "Details found with search criteria";
                    } else {
                        return "Not found";
                    }
                }
            }
            return "No Results found";
        }, ColId, value).then(function (message) {
            console.log(message);
            expect('Details found with search criteria').toEqual(message);
        });
    }

    this.DelTextfromColumn = function (ColId) {
        browser.executeScript(function (args) {
            var a = document.querySelectorAll('.ui-grid-icon-cancel');
            a[args].click();
        }, ColId);
    }


    this.SelectDropdown = function (value) {
        var optionToSelect;
        var list = element.all(by.className('ui-grid-filter-select ui-grid-filter-input-0'));
        list.get(0).all(by.tagName('option')).then(function (options) {
            options.some(function (option) {
                option.getText().then(function (text) {
                    if (value === text) {
                        optionToSelect = option;
                        return true;
                    }
                });
            });
        }).then(function () {
            if (optionToSelect) {
                optionToSelect.click();
            }
        });
    }

    this.SearchByDropdown = function (ColId, value) {
        var optionToSelect;
        var list = element.all(by.className('ui-grid-filter-select ui-grid-filter-input-0'));
        list.get(ColId).all(by.tagName('option')).then(function (options) {
            options.some(function (option) {
                option.getText().then(function (text) {
                    if (value === text) {
                        optionToSelect = option;
                        return true;
                    }
                });
            });
        }, ColId, value).then(function () {
            if (optionToSelect) {
                optionToSelect.click();
            }
        });
    }

    this.GetReportTypeAndClick = function (Reporttype) {
        browser.executeScript(function (agr) {

            var allElements = document.querySelectorAll('.reportBoxes .reportImage a');
            var excelElement = null;

            if (allElements && allElements.length > 0) {
                for (var i = 0; i < allElements.length; i++) {
                    if (allElements[i].innerHTML.contains(agr)) {
                        excelElement = allElements[i];
                        break;
                    }
                }
            }

            if (excelElement != null) {
                excelElement.click();
                return "Excel type report found Successfully";
            } else {
                return "this is not excel type report";
            }


        }, Reporttype).then(function (message) {
            console.log(message);
        })

    }


    this.SelectColumnAndInsertValue1 = function (colLabel, value) {
        ele = element(by.xpath("//span[@class='ui-grid-header-cell-label ng-binding' and text()='" + colLabel + "']//following::input[1]"));
        ele.sendKeys(value);
        browser.sleep(2000);
    }


    this.CheckVisible = function (colLabel) {
        //console.log("Lets check what comming in Tab" +Tab);
        //console.log("Lets check what comming in Tab" +J);
        element(by.xpath("//span[@class='ui-grid-header-cell-label ng-binding' and text()='" + colLabel + "']//following::select[1]")).isDisplayed().then(function (visible) {
            try {
                console.log("Entering Code:");
                var r = visible;
                console.log(r);
                //calback(r);
                return r;
            }
            catch (err) {
                console.log('In catch block');

            }
        }, function (err) {
            console.info('Code Text Box not displayed on page. Proceeding with default Code');
            return false;
        });


    }

    /**
     * To ensure the visibility of the column field and then enter value in the field
     * @param {*} colLabel column field in which we have to enter the value
     * @param {*} type type of the column field
     * @param {*} value value to be entered in the column field
     */
    this.visibleAndEnterValue = function (colLabel, type, value) {
        //console.log("Lets check what comming in Tab" +Tab);
        //console.log("Lets check what comming in Tab" +J);

        switch (type) {
            case "numeric":
            case "text":
            case "date":
                var c = 0;
                var actionPerformed = false;
                // var count=0;
                for (var i = 0; i < 10; i++) {
                    element(by.xpath("//span[@class='ui-grid-header-cell-label ng-binding' and text()='" + colLabel + "']//following::input[1]")).isDisplayed().then(function (visible) {
                        try {
                            //console.log("value of element isDisplayed() is: ", visible);
                            if (!actionPerformed) {
                                if (visible) {
                                    var SearchEle = element(by.xpath("//span[@class='ui-grid-header-cell-label ng-binding' and text()='" + colLabel + "']//following::input[1]"));
                                    browser.actions().mouseMove(SearchEle).click().perform();
                                    SearchEle.sendKeys(value);
                                    actionPerformed = true;
                                    //visibleAndEnterValueCB(null);
                                    //console.log("i > ",i);
                                } else {
                                    // console.log("Scroll count: ", c);
                                    browser.executeScript('$(".ui-grid-viewport").scrollLeft(' + c + '000/2)');
                                    c++;
                                }
                            }
                        }
                        catch (err) {
                            console.log('Error caught by catch block');
                        }
                    }, function (err) {
                        //console.log("Scroll count from error: ", c);
                        browser.executeScript('$(".ui-grid-viewport").scrollLeft(' + c + '000/2)');
                        c++;
                    });

                }
            case "list":
                var c = 0;
                var actionPerformed = false;
                // var count=0;
                for (var i = 0; i < 10; i++) {
                    element(by.xpath("//span[@class='ui-grid-header-cell-label ng-binding' and text()='" + colLabel + "']//following::select[1]")).isDisplayed().then(function (visible) {
                        try {
                            // console.log("value of element isDisplayed() is: ", visible);
                            if (!actionPerformed) {
                                if (visible) {
                                    var SearchEle = element(by.xpath("//span[@class='ui-grid-header-cell-label ng-binding' and text()='" + colLabel + "']//following::select[1]"));
                                    browser.actions().mouseMove(SearchEle).click().perform();
                                    //console.log("Check the switch case");
                                    actionPerformed = true;


                                } else {
                                    // console.log("Scroll count: ", c);
                                    browser.executeScript('$(".ui-grid-viewport").scrollLeft(' + c + '000/2)');
                                    c++;
                                }
                            }
                        }
                        catch (err) {
                            console.log('Error caught by catch block');
                        }
                    }, function (err) {
                        //console.log("Scroll count from error: ", c);
                        browser.executeScript('$(".ui-grid-viewport").scrollLeft(' + c + '000/2)');
                        c++;
                    });

                }
        }
    }
    this.SearchByDropdown1 = function (colLabel, value) {
        var optionToSelect;
        var list = element(by.xpath("//span[@class='ui-grid-header-cell-label ng-binding' and text()='" + colLabel + "']//following::select[1]"));
        list.all(by.tagName('option')).then(function (options) {
            options.some(function (option) {
                option.getText().then(function (text) {
                    if (value === text) {
                        optionToSelect = option;
                        return true;
                    }
                });
            });
        }, colLabel, value).then(function () {
            if (optionToSelect) {
                optionToSelect.click();
            }
        });
    }

    /**
     * To delete the entered value in column field
     * @param {*} colLabel label of the column
     */
    this.deleteEnteredData = function (colLabel) {

        var crossBtn = element(by.xpath("(//span[@class='ui-grid-header-cell-label ng-binding' and text()='" + colLabel + "']//following::i[@aria-label='Remove Filter'])[1]"));
        browser.actions().mouseMove(crossBtn).click().perform();
    }


    /**
     * To match the inserted data in column field
     * @param {*} label label of the column field
     * @param {*} value entered value, which we have to match
     */
    this.matchInsertedData = function (label, value) {
        var gridCellElements;
        var isDataMatched = false;
        var isSearchResultEmpty = true;
        if (label == "Status" || label == "Progress(%)") {
            if (label == "Status") {
                gridCellElements = element.all(by.xpath("(//i[@class='pe-7s-clock fa-2x ui-grid-cell-contents ng-scope'])[1]"));
            } else {
                gridCellElements = element.all(by.xpath("(//span[@class='ng-binding ng-scope'])[1]"));
            }
        } else {
            gridCellElements = element.all(by.xpath("//div[@class='ui-grid-cell-contents ng-binding ng-scope']"));
        }
        gridCellElements.then(function (listElements) {
            if (listElements.length > 0) {
                isSearchResultEmpty = false;
                for (var i = 0; i < listElements.length; i++) {
                    if (!isDataMatched) {
                        matchExactValue(listElements[i], value, label, function (isValueMatched) {
                            if (isValueMatched) {
                                isDataMatched = true;
                            }

                        });
                    }
                }
            }

        }).then(label, function (message) {
            if (!isSearchResultEmpty) {
                if (isDataMatched) {
                    message = "Details found with search criteria";
                    //console.log("Details found with search criteria");
                    expect('Details found with search criteria').toEqual(message);
                } else {
                    message = "Details not found with search criteria";
                    //console.log("Details not found with search criteria");
                    expect('Details found with search criteria').toEqual(message);
                    console.log("---------------------- ", label);
                    allure.createStep('Details not found with search criteria for label: ' + label, function () {
                    })();
                }
            }
            else {
                message = "Data not found";
                //console.log("Data not found");
                expect('Data not found').toEqual(message);
            }
        });
    }

    /**
     * To match the exact value from grid cell
     * @param {*} listElement grid cell element
     * @param {*} value entered value, which we have to match in the grid cell
     * @param {*} label label of the column field
     * @param {*} callback result as isDataMatched provides value matched or not
     */
    function matchExactValue(listElement, value, label, callback) {
        var cellText;
        if (label == "Status") {
            cellText = listElement.getAttribute("title");
        } else {
            cellText = listElement.getText();
        }
        cellText.then(function (text) {
            if (text == value) {
                isDataMatched = true;
                callback(isDataMatched);
            } else {
                isDataMatched = false;
                callback(isDataMatched);
            }

        });
    }

    /**
     * To get the absolute path of the file available in testdata
     * @param {*} filename name of the file
     * @param {*} callback result as absolute path of the file
     */
    this.createAbsolutePath = function (filename, callback) {
        var path = require('path');
        var dirname = process.cwd();
        var fileToUpload = "./testdata/" + filename + ".xlsx";
        var absolutePath = path.resolve(dirname, fileToUpload);
        callback(absolutePath);
    }

    /**
     * To get the current date
     * @param {*} callback result as current date in format dd-mm-yyyy
     */
    this.getCurrentDDMMYYYY = function (callback) {
        var currentDate = new Date(Date.now());
        var dd = (currentDate.getDate() < 10 ? '0' : '') + currentDate.getDate();
        var MM = ((currentDate.getMonth() + 1) < 10 ? '0' : '') + (currentDate.getMonth() + 1);
        var yyyy = currentDate.getFullYear();
        var date = dd + "-" + MM + "-" + yyyy;
        //console.log(date);
        callback(date);
    }

    this.CheckElementIsPresent = function (ele, callback) {
        if (ele == undefined) {
            callback(false);
        } else {
            ele.isPresent().then(function (isPresent) {
                callback(isPresent);
            });
        }
    }

    this.getReportTitle = function (callback) {
        var reportTitle = element(by.xpath("//img[@src='theme/images/icons/iconExcel.svg']//preceding::div[@class='reportTitle'][1]"));
        reportTitle.getText().then(function (reportTitle1) {
            console.log("This is the Report Title" + reportTitle1);
            var a = reportTitle1;
            callback(a)
            return a;
        });
    }
};
module.exports = new Helper();
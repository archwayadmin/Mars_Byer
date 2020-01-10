var app = angular.module('reportingApp', []);

//<editor-fold desc="global helpers">

var isValueAnArray = function (val) {
    return Array.isArray(val);
};

var getSpec = function (str) {
    var describes = str.split('|');
    return describes[describes.length - 1];
};
var checkIfShouldDisplaySpecName = function (prevItem, item) {
    if (!prevItem) {
        item.displaySpecName = true;
    } else if (getSpec(item.description) !== getSpec(prevItem.description)) {
        item.displaySpecName = true;
    }
};

var getParent = function (str) {
    var arr = str.split('|');
    str = "";
    for (var i = arr.length - 2; i > 0; i--) {
        str += arr[i] + " > ";
    }
    return str.slice(0, -3);
};

var getShortDescription = function (str) {
    return str.split('|')[0];
};

var countLogMessages = function (item) {
    if ((!item.logWarnings || !item.logErrors) && item.browserLogs && item.browserLogs.length > 0) {
        item.logWarnings = 0;
        item.logErrors = 0;
        for (var logNumber = 0; logNumber < item.browserLogs.length; logNumber++) {
            var logEntry = item.browserLogs[logNumber];
            if (logEntry.level === 'SEVERE') {
                item.logErrors++;
            }
            if (logEntry.level === 'WARNING') {
                item.logWarnings++;
            }
        }
    }
};

var convertTimestamp = function (timestamp) {
    var d = new Date(timestamp),
        yyyy = d.getFullYear(),
        mm = ('0' + (d.getMonth() + 1)).slice(-2),
        dd = ('0' + d.getDate()).slice(-2),
        hh = d.getHours(),
        h = hh,
        min = ('0' + d.getMinutes()).slice(-2),
        ampm = 'AM',
        time;

    if (hh > 12) {
        h = hh - 12;
        ampm = 'PM';
    } else if (hh === 12) {
        h = 12;
        ampm = 'PM';
    } else if (hh === 0) {
        h = 12;
    }

    // ie: 2013-02-18, 8:35 AM
    time = yyyy + '-' + mm + '-' + dd + ', ' + h + ':' + min + ' ' + ampm;

    return time;
};

var defaultSortFunction = function sortFunction(a, b) {
    if (a.sessionId < b.sessionId) {
        return -1;
    } else if (a.sessionId > b.sessionId) {
        return 1;
    }

    if (a.timestamp < b.timestamp) {
        return -1;
    } else if (a.timestamp > b.timestamp) {
        return 1;
    }

    return 0;
};

//</editor-fold>

app.controller('ScreenshotReportController', ['$scope', '$http', 'TitleService', function ($scope, $http, titleService) {
    var that = this;
    var clientDefaults = {};

    $scope.searchSettings = Object.assign({
        description: '',
        allselected: true,
        passed: true,
        failed: true,
        pending: true,
        withLog: true
    }, clientDefaults.searchSettings || {}); // enable customisation of search settings on first page hit

    this.warningTime = 1400;
    this.dangerTime = 1900;
    this.totalDurationFormat = clientDefaults.totalDurationFormat;
    this.showTotalDurationIn = clientDefaults.showTotalDurationIn;

    var initialColumnSettings = clientDefaults.columnSettings; // enable customisation of visible columns on first page hit
    if (initialColumnSettings) {
        if (initialColumnSettings.displayTime !== undefined) {
            // initial settings have be inverted because the html bindings are inverted (e.g. !ctrl.displayTime)
            this.displayTime = !initialColumnSettings.displayTime;
        }
        if (initialColumnSettings.displayBrowser !== undefined) {
            this.displayBrowser = !initialColumnSettings.displayBrowser; // same as above
        }
        if (initialColumnSettings.displaySessionId !== undefined) {
            this.displaySessionId = !initialColumnSettings.displaySessionId; // same as above
        }
        if (initialColumnSettings.displayOS !== undefined) {
            this.displayOS = !initialColumnSettings.displayOS; // same as above
        }
        if (initialColumnSettings.inlineScreenshots !== undefined) {
            this.inlineScreenshots = initialColumnSettings.inlineScreenshots; // this setting does not have to be inverted
        } else {
            this.inlineScreenshots = false;
        }
        if (initialColumnSettings.warningTime) {
            this.warningTime = initialColumnSettings.warningTime;
        }
        if (initialColumnSettings.dangerTime) {
            this.dangerTime = initialColumnSettings.dangerTime;
        }
    }


    this.chooseAllTypes = function () {
        var value = true;
        $scope.searchSettings.allselected = !$scope.searchSettings.allselected;
        if (!$scope.searchSettings.allselected) {
            value = false;
        }

        $scope.searchSettings.passed = value;
        $scope.searchSettings.failed = value;
        $scope.searchSettings.pending = value;
        $scope.searchSettings.withLog = value;
    };

    this.isValueAnArray = function (val) {
        return isValueAnArray(val);
    };

    this.getParent = function (str) {
        return getParent(str);
    };

    this.getSpec = function (str) {
        return getSpec(str);
    };

    this.getShortDescription = function (str) {
        return getShortDescription(str);
    };
    this.hasNextScreenshot = function (index) {
        var old = index;
        return old !== this.getNextScreenshotIdx(index);
    };

    this.hasPreviousScreenshot = function (index) {
        var old = index;
        return old !== this.getPreviousScreenshotIdx(index);
    };
    this.getNextScreenshotIdx = function (index) {
        var next = index;
        var hit = false;
        while (next + 2 < this.results.length) {
            next++;
            if (this.results[next].screenShotFile && !this.results[next].pending) {
                hit = true;
                break;
            }
        }
        return hit ? next : index;
    };

    this.getPreviousScreenshotIdx = function (index) {
        var prev = index;
        var hit = false;
        while (prev > 0) {
            prev--;
            if (this.results[prev].screenShotFile && !this.results[prev].pending) {
                hit = true;
                break;
            }
        }
        return hit ? prev : index;
    };

    this.convertTimestamp = convertTimestamp;


    this.round = function (number, roundVal) {
        return (parseFloat(number) / 1000).toFixed(roundVal);
    };


    this.passCount = function () {
        var passCount = 0;
        for (var i in this.results) {
            var result = this.results[i];
            if (result.passed) {
                passCount++;
            }
        }
        return passCount;
    };


    this.pendingCount = function () {
        var pendingCount = 0;
        for (var i in this.results) {
            var result = this.results[i];
            if (result.pending) {
                pendingCount++;
            }
        }
        return pendingCount;
    };

    this.failCount = function () {
        var failCount = 0;
        for (var i in this.results) {
            var result = this.results[i];
            if (!result.passed && !result.pending) {
                failCount++;
            }
        }
        return failCount;
    };

    this.totalDuration = function () {
        var sum = 0;
        for (var i in this.results) {
            var result = this.results[i];
            if (result.duration) {
                sum += result.duration;
            }
        }
        return sum;
    };

    this.passPerc = function () {
        return (this.passCount() / this.totalCount()) * 100;
    };
    this.pendingPerc = function () {
        return (this.pendingCount() / this.totalCount()) * 100;
    };
    this.failPerc = function () {
        return (this.failCount() / this.totalCount()) * 100;
    };
    this.totalCount = function () {
        return this.passCount() + this.failCount() + this.pendingCount();
    };


    var results = [
    {
        "description": "should login the user|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 8204,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "00b300b9-0048-004c-00c5-00c600dc00f0.png",
        "timestamp": 1578402401212,
        "duration": 15232
    },
    {
        "description": "Forgot password link present on the Login page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 8204,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "003b00ee-00dd-0000-006b-00eb001c0039.png",
        "timestamp": 1578402416980,
        "duration": 56
    },
    {
        "description": "Create Account link present on the Login page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 8204,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00f10056-00d3-0045-00eb-00ff00af00a3.png",
        "timestamp": 1578402417400,
        "duration": 48
    },
    {
        "description": "Contact Us  link present on the Login Page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 8204,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00d100e7-004f-008f-0000-007c008200a5.png",
        "timestamp": 1578402417789,
        "duration": 83
    },
    {
        "description": "Verify comapny copyright text at the footer of the login page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 8204,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "00970027-002b-00ee-0029-00c500d400a3.png",
        "timestamp": 1578402418234,
        "duration": 30
    },
    {
        "description": "Verify Username labeling is preseet|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 8204,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "0087008e-00df-0048-00c6-00ba00e000d3.png",
        "timestamp": 1578402418619,
        "duration": 4
    },
    {
        "description": "Verify password label is present|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 8204,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "009000da-000b-00c0-007c-0037007a00d9.png",
        "timestamp": 1578402418991,
        "duration": 3
    },
    {
        "description": "Verify Remember Me check box|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 8204,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "0056001f-009e-001a-005c-008a003f007a.png",
        "timestamp": 1578402419345,
        "duration": 44
    },
    {
        "description": "verify the title of the Page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 8204,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "0019009a-0072-008d-005e-001900ef00e5.png",
        "timestamp": 1578402419740,
        "duration": 13
    },
    {
        "description": "veriy all links present on page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 8204,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "00c60024-00b5-007b-0035-00bf00c7001b.png",
        "timestamp": 1578402420147,
        "duration": 79
    },
    {
        "description": "User Login successfully |Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 8204,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00bc0054-00b9-002b-00b1-00c8007e00db.png",
        "timestamp": 1578402420595,
        "duration": 19553
    },
    {
        "description": "Quick Add : Enter product and quantity successfully|Add Item to cart by  Quick Add and verify contents present on page ",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 8204,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed",
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "https://archway-forduaw-qa.azurewebsites.net/products?pageSize=15&sortBy=ID - [DOM] Found 15 elements with non-unique id #quantity: (More info: https://goo.gl/9p2vKq) %o %o %o %o %o %o %o %o %o %o %o %o %o %o %o",
                "timestamp": 1578402452699,
                "type": ""
            }
        ],
        "screenShotFile": "00c100ba-00ae-0098-006c-008c00f800f9.png",
        "timestamp": 1578402440492,
        "duration": 12193
    },
    {
        "description": "should pan plots when you click and drag|Add Item to cart by  Quick Add and verify contents present on page ",
        "passed": false,
        "pending": true,
        "os": "Windows",
        "instanceId": 8204,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Temporarily disabled with xit",
        "browserLogs": [],
        "screenShotFile": "0002000d-00d9-0007-0042-005400c10017.png",
        "timestamp": 1578402453109,
        "duration": 0
    },
    {
        "description": "verify Sort option is present on Add To Cart screen |Add Item to cart by  Quick Add and verify contents present on page ",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 8204,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "https://archway-forduaw-qa.azurewebsites.net/products?pageSize=15&sortBy=ID - [DOM] Found 15 elements with non-unique id #quantity: (More info: https://goo.gl/9p2vKq) %o %o %o %o %o %o %o %o %o %o %o %o %o %o %o",
                "timestamp": 1578402453265,
                "type": ""
            }
        ],
        "screenShotFile": "003f00b4-0049-0019-001d-001500e6006b.png",
        "timestamp": 1578402453148,
        "duration": 172
    },
    {
        "description": "verify Refine By text on Add To Cart screen|Add Item to cart by  Quick Add and verify contents present on page ",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 8204,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "https://archway-forduaw-qa.azurewebsites.net/products?pageSize=15&sortBy=ID - [DOM] Found 15 elements with non-unique id #quantity: (More info: https://goo.gl/9p2vKq) %o %o %o %o %o %o %o %o %o %o %o %o %o %o %o",
                "timestamp": 1578402453950,
                "type": ""
            }
        ],
        "screenShotFile": "006c004e-0074-0085-00f1-00e1001a0029.png",
        "timestamp": 1578402453786,
        "duration": 172
    },
    {
        "description": "verify My Favorites link|Add Item to cart by  Quick Add and verify contents present on page ",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 8204,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00f300fa-00da-0045-000f-00b600f300f7.png",
        "timestamp": 1578402454368,
        "duration": 167
    },
    {
        "description": "Verify Quick Add Header label text|Add Item to cart by  Quick Add and verify contents present on page ",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 8204,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "005600b5-00a8-00e4-00ce-00dc00a60090.png",
        "timestamp": 1578402454943,
        "duration": 82
    },
    {
        "description": "Verify lable of item |Add Item to cart by  Quick Add and verify contents present on page ",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 8204,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "007d009e-0018-00f1-0049-000600e0005b.png",
        "timestamp": 1578402455381,
        "duration": 119
    },
    {
        "description": "Verify lable of qty |Add Item to cart by  Quick Add and verify contents present on page ",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 8204,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "007f0054-00c5-0084-0056-00ed00700032.png",
        "timestamp": 1578402455875,
        "duration": 75
    },
    {
        "description": "TC_004:Verify Add to Cart button is present on the page|Add Item to cart by  Quick Add and verify contents present on page ",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 8204,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "008b005a-00cb-002d-0087-00ac008d009b.png",
        "timestamp": 1578402456322,
        "duration": 37
    },
    {
        "description": "Verify Add item and Quantity and click on checkout|Add Item to cart by  Quick Add and verify contents present on page ",
        "passed": false,
        "pending": false,
        "os": "Windows",
        "instanceId": 8204,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": [
            "Failed: No element found using locator: By(xpath, //div[1]/div[1]/ngb-typeahead-window[1]/button[1]/ngb-highlight[1])"
        ],
        "trace": [
            "NoSuchElementError: No element found using locator: By(xpath, //div[1]/div[1]/ngb-typeahead-window[1]/button[1]/ngb-highlight[1])\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:814:27\n    at ManagedPromise.invokeCallback_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\n    at processTicksAndRejections (internal/process/task_queues.js:93:5)Error\n    at ElementArrayFinder.applyAction_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:459:27)\n    at ElementArrayFinder.<computed> [as click] (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:91:29)\n    at ElementFinder.<computed> [as click] (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:831:22)\n    at addtoCart.clickonfirstHighlightItem (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars\\pageobjects\\AddItem\\AddItem.js:608:22)\n    at UserContext.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars\\specs\\AddItem\\AddItem_quickadd_spec.js:382:19)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\nFrom: Task: Run it(\"Verify Add item and Quantity and click on checkout\") in control flow\n    at UserContext.<anonymous> (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:94:19)\n    at attempt (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4297:26)\n    at QueueRunner.run (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4217:20)\n    at runNext (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4257:20)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4264:13\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4172:9\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:64:48\n    at ControlFlow.emit (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\events.js:62:21)\n    at ControlFlow.shutdown_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2674:10)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2599:53\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars\\specs\\AddItem\\AddItem_quickadd_spec.js:222:2)\n    at addSpecsToSuite (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars\\specs\\AddItem\\AddItem_quickadd_spec.js:16:1)\n    at Module._compile (internal/modules/cjs/loader.js:956:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:973:10)\n    at Module.load (internal/modules/cjs/loader.js:812:32)\n    at Function.Module._load (internal/modules/cjs/loader.js:724:14)"
        ],
        "browserLogs": [],
        "screenShotFile": "000a004a-0039-007e-00d9-005f004f0096.png",
        "timestamp": 1578402456736,
        "duration": 6988
    },
    {
        "description": "should login the user|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 9104,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "00820027-005e-0072-0092-00d30018001e.png",
        "timestamp": 1578402481069,
        "duration": 15691
    },
    {
        "description": "Forgot password link present on the Login page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 9104,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00b700ef-0003-006b-004b-007e00c400a0.png",
        "timestamp": 1578402497248,
        "duration": 76
    },
    {
        "description": "Create Account link present on the Login page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 9104,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00b700f3-00a2-00c1-00de-00b5002a0043.png",
        "timestamp": 1578402497671,
        "duration": 51
    },
    {
        "description": "Contact Us  link present on the Login Page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 9104,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00080088-009c-00e4-006e-006000c80086.png",
        "timestamp": 1578402498082,
        "duration": 50
    },
    {
        "description": "Verify comapny copyright text at the footer of the login page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 9104,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "001d00a1-0006-0093-002c-008d0077009d.png",
        "timestamp": 1578402498496,
        "duration": 20
    },
    {
        "description": "Verify Username labeling is preseet|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 9104,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "003200cd-00da-0043-0031-007e0095008b.png",
        "timestamp": 1578402498866,
        "duration": 3
    },
    {
        "description": "Verify password label is present|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 9104,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "0005003c-00c5-00e1-00e2-000a00440048.png",
        "timestamp": 1578402499231,
        "duration": 3
    },
    {
        "description": "Verify Remember Me check box|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 9104,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "0011001f-0063-0091-00bd-00d6000c00ca.png",
        "timestamp": 1578402499593,
        "duration": 33
    },
    {
        "description": "verify the title of the Page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 9104,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00f40047-000c-0030-0003-00d0005700f4.png",
        "timestamp": 1578402499990,
        "duration": 14
    },
    {
        "description": "veriy all links present on page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 9104,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "006900c6-00d0-0016-0054-0071003200a4.png",
        "timestamp": 1578402500347,
        "duration": 41
    },
    {
        "description": "User Login successfully |Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 9104,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "006800ae-00cd-0057-00d7-001b0092004b.png",
        "timestamp": 1578402500762,
        "duration": 19593
    },
    {
        "description": "Quick Add : Enter product and quantity successfully|Add Item to cart by  Quick Add and verify contents present on page ",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 9104,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "00aa00c4-0000-00c2-00ba-00e800040068.png",
        "timestamp": 1578402520707,
        "duration": 12197
    },
    {
        "description": "should pan plots when you click and drag|Add Item to cart by  Quick Add and verify contents present on page ",
        "passed": false,
        "pending": true,
        "os": "Windows",
        "instanceId": 9104,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Temporarily disabled with xit",
        "browserLogs": [],
        "screenShotFile": "00e400d3-009b-0027-008c-00a700870041.png",
        "timestamp": 1578402533264,
        "duration": 0
    },
    {
        "description": "verify Sort option is present on Add To Cart screen |Add Item to cart by  Quick Add and verify contents present on page ",
        "passed": false,
        "pending": false,
        "os": "Windows",
        "instanceId": 9104,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": [
            "Failed: No element found using locator: By(xpath, //label[@class='pt-1 pr-1 d-none d-md-block'][contains(text(),'Sort By')])"
        ],
        "trace": [
            "NoSuchElementError: No element found using locator: By(xpath, //label[@class='pt-1 pr-1 d-none d-md-block'][contains(text(),'Sort By')])\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:814:27\n    at ManagedPromise.invokeCallback_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\n    at processTicksAndRejections (internal/process/task_queues.js:93:5)Error\n    at ElementArrayFinder.applyAction_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:459:27)\n    at ElementArrayFinder.<computed> [as isDisplayed] (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:91:29)\n    at ElementFinder.<computed> [as isDisplayed] (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:831:22)\n    at UserContext.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars\\specs\\AddItem\\AddItem_quickadd_spec.js:77:21)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\nFrom: Task: Run it(\"verify Sort option is present on Add To Cart screen \") in control flow\n    at UserContext.<anonymous> (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:94:19)\n    at attempt (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4297:26)\n    at QueueRunner.run (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4217:20)\n    at runNext (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4257:20)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4264:13\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4172:9\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:64:48\n    at ControlFlow.emit (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\events.js:62:21)\n    at ControlFlow.shutdown_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2674:10)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2599:53\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars\\specs\\AddItem\\AddItem_quickadd_spec.js:72:3)\n    at addSpecsToSuite (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars\\specs\\AddItem\\AddItem_quickadd_spec.js:16:1)\n    at Module._compile (internal/modules/cjs/loader.js:956:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:973:10)\n    at Module.load (internal/modules/cjs/loader.js:812:32)\n    at Function.Module._load (internal/modules/cjs/loader.js:724:14)"
        ],
        "browserLogs": [],
        "screenShotFile": "006b00fb-0060-00c9-0027-00820026008f.png",
        "timestamp": 1578402533280,
        "duration": 34
    },
    {
        "description": "verify Refine By text on Add To Cart screen|Add Item to cart by  Quick Add and verify contents present on page ",
        "passed": false,
        "pending": false,
        "os": "Windows",
        "instanceId": 9104,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": [
            "Failed: No element found using locator: By(xpath, //strong[contains(text(),'Refine By')])"
        ],
        "trace": [
            "NoSuchElementError: No element found using locator: By(xpath, //strong[contains(text(),'Refine By')])\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:814:27\n    at ManagedPromise.invokeCallback_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\n    at processTicksAndRejections (internal/process/task_queues.js:93:5)Error\n    at ElementArrayFinder.applyAction_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:459:27)\n    at ElementArrayFinder.<computed> [as isDisplayed] (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:91:29)\n    at ElementFinder.<computed> [as isDisplayed] (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:831:22)\n    at UserContext.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars\\specs\\AddItem\\AddItem_quickadd_spec.js:100:20)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\nFrom: Task: Run it(\"verify Refine By text on Add To Cart screen\") in control flow\n    at UserContext.<anonymous> (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:94:19)\n    at attempt (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4297:26)\n    at QueueRunner.run (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4217:20)\n    at runNext (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4257:20)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4264:13\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4172:9\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:64:48\n    at ControlFlow.emit (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\events.js:62:21)\n    at ControlFlow.shutdown_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2674:10)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2599:53\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars\\specs\\AddItem\\AddItem_quickadd_spec.js:95:6)\n    at addSpecsToSuite (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars\\specs\\AddItem\\AddItem_quickadd_spec.js:16:1)\n    at Module._compile (internal/modules/cjs/loader.js:956:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:973:10)\n    at Module.load (internal/modules/cjs/loader.js:812:32)\n    at Function.Module._load (internal/modules/cjs/loader.js:724:14)"
        ],
        "browserLogs": [],
        "screenShotFile": "00d500a2-007a-00c4-00d1-003a001d00b5.png",
        "timestamp": 1578402533678,
        "duration": 25
    },
    {
        "description": "verify My Favorites link|Add Item to cart by  Quick Add and verify contents present on page ",
        "passed": false,
        "pending": false,
        "os": "Windows",
        "instanceId": 9104,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": [
            "Failed: No element found using locator: By(xpath, //label[contains(text(),'My Favorites')])"
        ],
        "trace": [
            "NoSuchElementError: No element found using locator: By(xpath, //label[contains(text(),'My Favorites')])\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:814:27\n    at ManagedPromise.invokeCallback_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\n    at processTicksAndRejections (internal/process/task_queues.js:93:5)Error\n    at ElementArrayFinder.applyAction_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:459:27)\n    at ElementArrayFinder.<computed> [as isDisplayed] (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:91:29)\n    at ElementFinder.<computed> [as isDisplayed] (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:831:22)\n    at UserContext.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars\\specs\\AddItem\\AddItem_quickadd_spec.js:122:20)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\nFrom: Task: Run it(\"verify My Favorites link\") in control flow\n    at UserContext.<anonymous> (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:94:19)\n    at attempt (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4297:26)\n    at QueueRunner.run (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4217:20)\n    at runNext (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4257:20)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4264:13\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4172:9\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:64:48\n    at ControlFlow.emit (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\events.js:62:21)\n    at ControlFlow.shutdown_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2674:10)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2599:53\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars\\specs\\AddItem\\AddItem_quickadd_spec.js:117:6)\n    at addSpecsToSuite (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars\\specs\\AddItem\\AddItem_quickadd_spec.js:16:1)\n    at Module._compile (internal/modules/cjs/loader.js:956:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:973:10)\n    at Module.load (internal/modules/cjs/loader.js:812:32)\n    at Function.Module._load (internal/modules/cjs/loader.js:724:14)"
        ],
        "browserLogs": [],
        "screenShotFile": "00d300a9-00bd-00b5-0059-000700250070.png",
        "timestamp": 1578402534074,
        "duration": 27
    },
    {
        "description": "Verify Quick Add Header label text|Add Item to cart by  Quick Add and verify contents present on page ",
        "passed": false,
        "pending": false,
        "os": "Windows",
        "instanceId": 9104,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": [
            "Failed: No element found using locator: By(xpath, //div[@class='col-md-4 col-lg-3 d-md-block d-sm-none d-none']//strong[contains(text(),'Quick Add')])"
        ],
        "trace": [
            "NoSuchElementError: No element found using locator: By(xpath, //div[@class='col-md-4 col-lg-3 d-md-block d-sm-none d-none']//strong[contains(text(),'Quick Add')])\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:814:27\n    at ManagedPromise.invokeCallback_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\n    at processTicksAndRejections (internal/process/task_queues.js:93:5)Error\n    at ElementArrayFinder.applyAction_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:459:27)\n    at ElementArrayFinder.<computed> [as getText] (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:91:29)\n    at ElementFinder.<computed> [as getText] (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:831:22)\n    at UserContext.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars\\specs\\AddItem\\AddItem_quickadd_spec.js:145:24)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\nFrom: Task: Run it(\"Verify Quick Add Header label text\") in control flow\n    at UserContext.<anonymous> (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:94:19)\n    at attempt (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4297:26)\n    at QueueRunner.run (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4217:20)\n    at runNext (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4257:20)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4264:13\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4172:9\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:64:48\n    at ControlFlow.emit (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\events.js:62:21)\n    at ControlFlow.shutdown_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2674:10)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2599:53\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars\\specs\\AddItem\\AddItem_quickadd_spec.js:140:6)\n    at addSpecsToSuite (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars\\specs\\AddItem\\AddItem_quickadd_spec.js:16:1)\n    at Module._compile (internal/modules/cjs/loader.js:956:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:973:10)\n    at Module.load (internal/modules/cjs/loader.js:812:32)\n    at Function.Module._load (internal/modules/cjs/loader.js:724:14)"
        ],
        "browserLogs": [],
        "screenShotFile": "0072000f-0068-0083-00de-001e006900b8.png",
        "timestamp": 1578402534467,
        "duration": 22
    },
    {
        "description": "Verify lable of item |Add Item to cart by  Quick Add and verify contents present on page ",
        "passed": false,
        "pending": false,
        "os": "Windows",
        "instanceId": 9104,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": [
            "Expected false to be truthy.",
            "Failed: No element found using locator: By(xpath, //div[@class='col-md-4 col-lg-3 d-md-block d-sm-none d-none']//b[contains(text(),'Item')])"
        ],
        "trace": [
            "Error: Failed expectation\n    at UserContext.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars\\specs\\AddItem\\AddItem_quickadd_spec.js:182:37)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2974:25\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7",
            "NoSuchElementError: No element found using locator: By(xpath, //div[@class='col-md-4 col-lg-3 d-md-block d-sm-none d-none']//b[contains(text(),'Item')])\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:814:27\n    at ManagedPromise.invokeCallback_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\n    at processTicksAndRejections (internal/process/task_queues.js:93:5)Error\n    at ElementArrayFinder.applyAction_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:459:27)\n    at ElementArrayFinder.<computed> [as getText] (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:91:29)\n    at ElementFinder.<computed> [as getText] (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:831:22)\n    at UserContext.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars\\specs\\AddItem\\AddItem_quickadd_spec.js:184:17)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\nFrom: Task: Run it(\"Verify lable of item \") in control flow\n    at UserContext.<anonymous> (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:94:19)\n    at attempt (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4297:26)\n    at QueueRunner.run (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4217:20)\n    at runNext (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4257:20)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4264:13\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4172:9\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:64:48\n    at ControlFlow.emit (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\events.js:62:21)\n    at ControlFlow.shutdown_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2674:10)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2599:53\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars\\specs\\AddItem\\AddItem_quickadd_spec.js:178:2)\n    at addSpecsToSuite (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars\\specs\\AddItem\\AddItem_quickadd_spec.js:16:1)\n    at Module._compile (internal/modules/cjs/loader.js:956:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:973:10)\n    at Module.load (internal/modules/cjs/loader.js:812:32)\n    at Function.Module._load (internal/modules/cjs/loader.js:724:14)"
        ],
        "browserLogs": [],
        "screenShotFile": "00c10098-0007-00da-007e-00e700b9005f.png",
        "timestamp": 1578402534837,
        "duration": 39
    },
    {
        "description": "Verify lable of qty |Add Item to cart by  Quick Add and verify contents present on page ",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 9104,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "https://archway-forduaw-qa.azurewebsites.net/products?pageSize=15&sortBy=ID - [DOM] Found 15 elements with non-unique id #quantity: (More info: https://goo.gl/9p2vKq) %o %o %o %o %o %o %o %o %o %o %o %o %o %o %o",
                "timestamp": 1578402535346,
                "type": ""
            }
        ],
        "screenShotFile": "003c00ea-007a-0078-0051-006200c80066.png",
        "timestamp": 1578402535679,
        "duration": 121
    },
    {
        "description": "TC_004:Verify Add to Cart button is present on the page|Add Item to cart by  Quick Add and verify contents present on page ",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 9104,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "009500d6-0022-00ca-0044-005c00d30080.png",
        "timestamp": 1578402536151,
        "duration": 45
    },
    {
        "description": "Verify Add item and Quantity and click on checkout|Add Item to cart by  Quick Add and verify contents present on page ",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 9104,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed",
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "https://archway-forduaw-qa.azurewebsites.net/products?pageSize=15&sortBy=ID - [DOM] Found 15 elements with non-unique id #quantity: (More info: https://goo.gl/9p2vKq) %o %o %o %o %o %o %o %o %o %o %o %o %o %o %o",
                "timestamp": 1578402538625,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://archway-forduaw-qa.azurewebsites.net/products?pageSize=15&sortBy=ID - [DOM] Found 15 elements with non-unique id #quantity: (More info: https://goo.gl/9p2vKq) %o %o %o %o %o %o %o %o %o %o %o %o %o %o %o",
                "timestamp": 1578402538626,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://archway-forduaw-qa.azurewebsites.net/main.8135115ee1375ec49609.js 0 /deep/ combinator is no longer supported in CSS dynamic profile. It is now effectively no-op, acting as if it were a descendant combinator. /deep/ combinator will be removed, and will be invalid at M65. You should remove it. See https://www.chromestatus.com/features/4964279606312960 for more details.",
                "timestamp": 1578402565072,
                "type": ""
            }
        ],
        "screenShotFile": "003c004f-0065-00e1-0039-00bb003c0007.png",
        "timestamp": 1578402536580,
        "duration": 28703
    },
    {
        "description": "should login the user|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 1468,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "00be0064-0028-002d-00ab-009a001b00d6.png",
        "timestamp": 1578403854338,
        "duration": 15435
    },
    {
        "description": "Forgot password link present on the Login page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 1468,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "003b0068-00b9-00d4-0020-00ab008000e5.png",
        "timestamp": 1578403870197,
        "duration": 64
    },
    {
        "description": "Create Account link present on the Login page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 1468,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "003a001d-00f1-005e-0001-0053002c001f.png",
        "timestamp": 1578403870630,
        "duration": 47
    },
    {
        "description": "Contact Us  link present on the Login Page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 1468,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "005000a9-007a-0069-003b-0057004200c9.png",
        "timestamp": 1578403871056,
        "duration": 45
    },
    {
        "description": "Verify comapny copyright text at the footer of the login page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 1468,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "002300d4-0020-009f-0080-00b50084001c.png",
        "timestamp": 1578403871464,
        "duration": 23
    },
    {
        "description": "Verify Username labeling is preseet|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 1468,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00830071-001d-0072-006d-00ff006e0046.png",
        "timestamp": 1578403871855,
        "duration": 4
    },
    {
        "description": "Verify password label is present|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 1468,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "003500e0-0064-00ca-002a-009f005f0015.png",
        "timestamp": 1578403872219,
        "duration": 4
    },
    {
        "description": "Verify Remember Me check box|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 1468,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "008000f3-0018-0021-0007-002500c80057.png",
        "timestamp": 1578403872577,
        "duration": 43
    },
    {
        "description": "verify the title of the Page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 1468,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "0039007b-0055-0019-00ca-002d00d5006a.png",
        "timestamp": 1578403872977,
        "duration": 13
    },
    {
        "description": "veriy all links present on page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 1468,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "00e9004f-0076-00e4-00ef-00650098008f.png",
        "timestamp": 1578403873339,
        "duration": 45
    },
    {
        "description": "User Login successfully |Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 1468,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "https://archway-forduaw-qa.azurewebsites.net/main.8135115ee1375ec49609.js 0 /deep/ combinator is no longer supported in CSS dynamic profile. It is now effectively no-op, acting as if it were a descendant combinator. /deep/ combinator will be removed, and will be invalid at M65. You should remove it. See https://www.chromestatus.com/features/4964279606312960 for more details.",
                "timestamp": 1578403893270,
                "type": ""
            }
        ],
        "screenShotFile": "003800fc-002c-007f-002a-00a600b300a0.png",
        "timestamp": 1578403873740,
        "duration": 19539
    },
    {
        "description": "Quick Add : Enter product and quantity successfully|Add Item to cart by  Quick Add and verify contents present on page ",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 1468,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed",
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "https://archway-forduaw-qa.azurewebsites.net/products?pageSize=15&sortBy=ID - [DOM] Found 15 elements with non-unique id #quantity: (More info: https://goo.gl/9p2vKq) %o %o %o %o %o %o %o %o %o %o %o %o %o %o %o",
                "timestamp": 1578403905804,
                "type": ""
            }
        ],
        "screenShotFile": "004800c7-0074-006b-00a2-0002001c00f5.png",
        "timestamp": 1578403893635,
        "duration": 12158
    },
    {
        "description": "should pan plots when you click and drag|Add Item to cart by  Quick Add and verify contents present on page ",
        "passed": false,
        "pending": true,
        "os": "Windows",
        "instanceId": 1468,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Temporarily disabled with xit",
        "browserLogs": [],
        "screenShotFile": "001f0075-00fb-00fa-0054-001e00060092.png",
        "timestamp": 1578403906338,
        "duration": 0
    },
    {
        "description": "verify Sort option is present on Add To Cart screen |Add Item to cart by  Quick Add and verify contents present on page ",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 1468,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00490051-005a-009b-00cf-00f000a600b3.png",
        "timestamp": 1578403906360,
        "duration": 125
    },
    {
        "description": "verify Refine By text on Add To Cart screen|Add Item to cart by  Quick Add and verify contents present on page ",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 1468,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "0047009b-00e2-009a-0051-00e300d00007.png",
        "timestamp": 1578403906846,
        "duration": 297
    },
    {
        "description": "verify My Favorites link|Add Item to cart by  Quick Add and verify contents present on page ",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 1468,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "https://archway-forduaw-qa.azurewebsites.net/products?pageSize=15&sortBy=ID - [DOM] Found 15 elements with non-unique id #quantity: (More info: https://goo.gl/9p2vKq) %o %o %o %o %o %o %o %o %o %o %o %o %o %o %o",
                "timestamp": 1578403907248,
                "type": ""
            }
        ],
        "screenShotFile": "00350084-005b-0016-005c-00ea001e0060.png",
        "timestamp": 1578403907534,
        "duration": 289
    },
    {
        "description": "Verify Quick Add Header label text|Add Item to cart by  Quick Add and verify contents present on page ",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 1468,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "https://archway-forduaw-qa.azurewebsites.net/products?pageSize=15&sortBy=ID - [DOM] Found 15 elements with non-unique id #quantity: (More info: https://goo.gl/9p2vKq) %o %o %o %o %o %o %o %o %o %o %o %o %o %o %o",
                "timestamp": 1578403907972,
                "type": ""
            }
        ],
        "screenShotFile": "00be00d8-00e9-00c6-00c8-00f200e60009.png",
        "timestamp": 1578403908200,
        "duration": 141
    },
    {
        "description": "Verify lable of item |Add Item to cart by  Quick Add and verify contents present on page ",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 1468,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00e50080-00c6-00cd-00ae-00bb00fc0073.png",
        "timestamp": 1578403908744,
        "duration": 78
    },
    {
        "description": "Verify lable of qty |Add Item to cart by  Quick Add and verify contents present on page ",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 1468,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00b30031-0039-006a-008b-0051001b0000.png",
        "timestamp": 1578403909199,
        "duration": 133
    },
    {
        "description": "TC_004:Verify Add to Cart button is present on the page|Add Item to cart by  Quick Add and verify contents present on page ",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 1468,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00ea00bb-001b-0035-0061-006200e100b1.png",
        "timestamp": 1578403909732,
        "duration": 44
    },
    {
        "description": "Verify Add item and Quantity and click on checkout|Add Item to cart by  Quick Add and verify contents present on page ",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 1468,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "00ec0015-00cb-00d2-00fa-00f2007c00fc.png",
        "timestamp": 1578403910157,
        "duration": 29005
    },
    {
        "description": "should login the user|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 8380,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "001f00ac-00f5-004c-00ec-0031008b002e.png",
        "timestamp": 1578404664362,
        "duration": 15522
    },
    {
        "description": "Forgot password link present on the Login page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 8380,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00ff003b-0012-00a5-00aa-00de00a00022.png",
        "timestamp": 1578404680328,
        "duration": 56
    },
    {
        "description": "Create Account link present on the Login page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 8380,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "009100ee-00ec-008f-00c8-00eb00670066.png",
        "timestamp": 1578404680746,
        "duration": 54
    },
    {
        "description": "Contact Us  link present on the Login Page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 8380,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "005a00dc-0064-00ed-00fe-0089001d002c.png",
        "timestamp": 1578404681170,
        "duration": 55
    },
    {
        "description": "Verify comapny copyright text at the footer of the login page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 8380,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "002600bc-0044-00c8-00fc-000b00c40089.png",
        "timestamp": 1578404681579,
        "duration": 4023
    },
    {
        "description": "Verify Username labeling is preseet|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 8380,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "002700b0-00ab-008c-008c-001a007f0068.png",
        "timestamp": 1578404685965,
        "duration": 3
    },
    {
        "description": "Verify password label is present|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 8380,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00d20099-0067-00be-00cf-001800e70071.png",
        "timestamp": 1578404686325,
        "duration": 4
    },
    {
        "description": "Verify Remember Me check box|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 8380,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "003f003f-0013-0066-0005-00fb00320060.png",
        "timestamp": 1578404686674,
        "duration": 34
    },
    {
        "description": "verify the title of the Page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 8380,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "008600b9-00a9-0098-006b-009a00ef00bb.png",
        "timestamp": 1578404687054,
        "duration": 11
    },
    {
        "description": "veriy all links present on page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 8380,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "000d0097-00c6-0082-0065-00b0000f0077.png",
        "timestamp": 1578404687437,
        "duration": 41
    },
    {
        "description": "User Login successfully |Verify Login",
        "passed": false,
        "pending": false,
        "os": "Windows",
        "instanceId": 8380,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": [
            "Expected 'https://archway-forduaw-qa.azurewebsites.net/login' to contain 'https://archway-forduaw-qa.azurewebsites.net/home'."
        ],
        "trace": [
            "Error: Failed expectation\n    at UserContext.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars\\specs\\LoginPage\\LoginPage_spec.js:220:19)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2974:25\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7"
        ],
        "browserLogs": [],
        "screenShotFile": "00bc0096-009c-0065-0018-003f00aa00f7.png",
        "timestamp": 1578404687825,
        "duration": 19626
    },
    {
        "description": "Add Multiple Products successfully| Multiple Products ",
        "passed": false,
        "pending": false,
        "os": "Windows",
        "instanceId": 8380,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": [
            "Failed: No element found using locator: By(xpath, //input[@id='typeahead-basic'])"
        ],
        "trace": [
            "NoSuchElementError: No element found using locator: By(xpath, //input[@id='typeahead-basic'])\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:814:27\n    at ManagedPromise.invokeCallback_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\n    at processTicksAndRejections (internal/process/task_queues.js:93:5)Error\n    at ElementArrayFinder.applyAction_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:459:27)\n    at ElementArrayFinder.<computed> [as clear] (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:91:29)\n    at ElementFinder.<computed> [as clear] (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:831:22)\n    at addtoCart.enterItem (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars\\pageobjects\\AddItem\\AddItem.js:692:8)\n    at UserContext.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars\\specs\\AddItem\\AddMultipleProduct.js:52:16)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\nFrom: Task: Run it(\"Add Multiple Products successfully\") in control flow\n    at UserContext.<anonymous> (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:94:19)\n    at attempt (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4297:26)\n    at QueueRunner.run (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4217:20)\n    at runNext (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4257:20)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4264:13\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4172:9\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:64:48\n    at ControlFlow.emit (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\events.js:62:21)\n    at ControlFlow.shutdown_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2674:10)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2599:53\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars\\specs\\AddItem\\AddMultipleProduct.js:37:2)\n    at addSpecsToSuite (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars\\specs\\AddItem\\AddMultipleProduct.js:21:1)\n    at Module._compile (internal/modules/cjs/loader.js:956:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:973:10)\n    at Module.load (internal/modules/cjs/loader.js:812:32)\n    at Function.Module._load (internal/modules/cjs/loader.js:724:14)"
        ],
        "browserLogs": [],
        "screenShotFile": "00cb0074-0096-00a9-00a5-003700600011.png",
        "timestamp": 1578404707866,
        "duration": 19206
    },
    {
        "description": "Verify total item present in cart and Order Summary are same| Multiple Products ",
        "passed": false,
        "pending": false,
        "os": "Windows",
        "instanceId": 8380,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": [
            "Failed: No element found using locator: By(xpath, //span[@class='fa-layers-counter'])"
        ],
        "trace": [
            "NoSuchElementError: No element found using locator: By(xpath, //span[@class='fa-layers-counter'])\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:814:27\n    at ManagedPromise.invokeCallback_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\n    at processTicksAndRejections (internal/process/task_queues.js:93:5)Error\n    at ElementArrayFinder.applyAction_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:459:27)\n    at ElementArrayFinder.<computed> [as getText] (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:91:29)\n    at ElementFinder.<computed> [as getText] (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:831:22)\n    at UserContext.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars\\specs\\AddItem\\AddMultipleProduct.js:88:16)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\nFrom: Task: Run it(\"Verify total item present in cart and Order Summary are same\") in control flow\n    at UserContext.<anonymous> (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:94:19)\n    at attempt (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4297:26)\n    at QueueRunner.run (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4217:20)\n    at runNext (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4257:20)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4264:13\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4172:9\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:64:48\n    at ControlFlow.emit (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\events.js:62:21)\n    at ControlFlow.shutdown_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2674:10)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2599:53\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars\\specs\\AddItem\\AddMultipleProduct.js:81:3)\n    at addSpecsToSuite (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars\\specs\\AddItem\\AddMultipleProduct.js:21:1)\n    at Module._compile (internal/modules/cjs/loader.js:956:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:973:10)\n    at Module.load (internal/modules/cjs/loader.js:812:32)\n    at Function.Module._load (internal/modules/cjs/loader.js:724:14)"
        ],
        "browserLogs": [],
        "screenShotFile": "007f00c0-00ff-00eb-004a-00f700f700f0.png",
        "timestamp": 1578404727405,
        "duration": 4074
    },
    {
        "description": "should login the user|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 11516,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "00300046-0089-00c3-00f8-0074005e00f0.png",
        "timestamp": 1578405031329,
        "duration": 15187
    },
    {
        "description": "Forgot password link present on the Login page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 11516,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00b60037-00db-0097-0056-000b002a0020.png",
        "timestamp": 1578405046981,
        "duration": 69
    },
    {
        "description": "Create Account link present on the Login page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 11516,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "009c0007-005d-008e-006d-009b007d0045.png",
        "timestamp": 1578405047416,
        "duration": 58
    },
    {
        "description": "Contact Us  link present on the Login Page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 11516,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "006200ca-00b3-0048-00cf-00a4001100c9.png",
        "timestamp": 1578405047872,
        "duration": 51
    },
    {
        "description": "Verify comapny copyright text at the footer of the login page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 11516,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "005e00a1-00ec-008a-00b3-006c007c001f.png",
        "timestamp": 1578405048318,
        "duration": 4018
    },
    {
        "description": "Verify Username labeling is preseet|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 11516,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00fa00ac-001a-00be-00df-00ba00d400a4.png",
        "timestamp": 1578405052682,
        "duration": 3
    },
    {
        "description": "Verify password label is present|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 11516,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "0083003e-005c-005c-000c-00ca0039001c.png",
        "timestamp": 1578405053036,
        "duration": 5
    },
    {
        "description": "Verify Remember Me check box|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 11516,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "003700bd-0079-0087-00e1-000f0028009f.png",
        "timestamp": 1578405053403,
        "duration": 42
    },
    {
        "description": "verify the title of the Page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 11516,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "005d00ec-0046-002c-006c-00e0002c0070.png",
        "timestamp": 1578405053795,
        "duration": 13
    },
    {
        "description": "veriy all links present on page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 11516,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "005f00fc-00d9-00ae-0030-007000c8008e.png",
        "timestamp": 1578405054158,
        "duration": 44
    },
    {
        "description": "User Login successfully |Verify Login",
        "passed": false,
        "pending": false,
        "os": "Windows",
        "instanceId": 11516,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": [
            "Expected 'https://archway-forduaw-qa.azurewebsites.net/login' to contain 'https://archway-forduaw-qa.azurewebsites.net/home'."
        ],
        "trace": [
            "Error: Failed expectation\n    at UserContext.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars\\specs\\LoginPage\\LoginPage_spec.js:220:19)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2974:25\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7"
        ],
        "browserLogs": [],
        "screenShotFile": "003a005a-00f2-006c-00d3-001c00ea0080.png",
        "timestamp": 1578405054558,
        "duration": 19571
    },
    {
        "description": "Add Multiple Products successfully| Multiple Products ",
        "passed": false,
        "pending": false,
        "os": "Windows",
        "instanceId": 11516,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": [
            "Failed: No element found using locator: By(xpath, //div[1]/div[1]/ngb-typeahead-window[1]/button[1]/ngb-highlight[1])"
        ],
        "trace": [
            "NoSuchElementError: No element found using locator: By(xpath, //div[1]/div[1]/ngb-typeahead-window[1]/button[1]/ngb-highlight[1])\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:814:27\n    at ManagedPromise.invokeCallback_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\n    at processTicksAndRejections (internal/process/task_queues.js:93:5)Error\n    at ElementArrayFinder.applyAction_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:459:27)\n    at ElementArrayFinder.<computed> [as click] (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:91:29)\n    at ElementFinder.<computed> [as click] (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:831:22)\n    at addtoCart.clickonfirstHighlightItem (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars\\pageobjects\\AddItem\\AddItem.js:608:22)\n    at UserContext.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars\\specs\\AddItem\\AddMultipleProduct.js:56:16)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\nFrom: Task: Run it(\"Add Multiple Products successfully\") in control flow\n    at UserContext.<anonymous> (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:94:19)\n    at attempt (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4297:26)\n    at QueueRunner.run (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4217:20)\n    at runNext (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4257:20)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4264:13\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4172:9\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:64:48\n    at ControlFlow.emit (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\events.js:62:21)\n    at ControlFlow.shutdown_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2674:10)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2599:53\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars\\specs\\AddItem\\AddMultipleProduct.js:37:2)\n    at addSpecsToSuite (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars\\specs\\AddItem\\AddMultipleProduct.js:21:1)\n    at Module._compile (internal/modules/cjs/loader.js:956:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:973:10)\n    at Module.load (internal/modules/cjs/loader.js:812:32)\n    at Function.Module._load (internal/modules/cjs/loader.js:724:14)"
        ],
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "https://archway-forduaw-qa.azurewebsites.net/main.8135115ee1375ec49609.js 0 /deep/ combinator is no longer supported in CSS dynamic profile. It is now effectively no-op, acting as if it were a descendant combinator. /deep/ combinator will be removed, and will be invalid at M65. You should remove it. See https://www.chromestatus.com/features/4964279606312960 for more details.",
                "timestamp": 1578405077273,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://archway-forduaw-qa.azurewebsites.net/products?pageSize=15&sortBy=ID - [DOM] Found 15 elements with non-unique id #quantity: (More info: https://goo.gl/9p2vKq) %o %o %o %o %o %o %o %o %o %o %o %o %o %o %o",
                "timestamp": 1578405086976,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://archway-forduaw-qa.azurewebsites.net/products?pageSize=15&sortBy=ID - [DOM] Found 15 elements with non-unique id #quantity: (More info: https://goo.gl/9p2vKq) %o %o %o %o %o %o %o %o %o %o %o %o %o %o %o",
                "timestamp": 1578405089156,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://archway-forduaw-qa.azurewebsites.net/products?pageSize=15&sortBy=ID - [DOM] Found 15 elements with non-unique id #quantity: (More info: https://goo.gl/9p2vKq) %o %o %o %o %o %o %o %o %o %o %o %o %o %o %o",
                "timestamp": 1578405089157,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://archway-forduaw-qa.azurewebsites.net/products - [DOM] Found 15 elements with non-unique id #quantity: (More info: https://goo.gl/9p2vKq) %o %o %o %o %o %o %o %o %o %o %o %o %o %o %o",
                "timestamp": 1578405108571,
                "type": ""
            }
        ],
        "screenShotFile": "009900fc-0093-0088-00fc-00ab00a80036.png",
        "timestamp": 1578405074515,
        "duration": 69097
    },
    {
        "description": "Verify total item present in cart and Order Summary are same| Multiple Products ",
        "passed": false,
        "pending": false,
        "os": "Windows",
        "instanceId": 11516,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": [
            "Failed: No element found using locator: By(xpath, //h6[@class='card-title'])"
        ],
        "trace": [
            "NoSuchElementError: No element found using locator: By(xpath, //h6[@class='card-title'])\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:814:27\n    at ManagedPromise.invokeCallback_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\n    at processTicksAndRejections (internal/process/task_queues.js:93:5)Error\n    at ElementArrayFinder.applyAction_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:459:27)\n    at ElementArrayFinder.<computed> [as getText] (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:91:29)\n    at ElementFinder.<computed> [as getText] (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:831:22)\n    at UserContext.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars\\specs\\AddItem\\AddMultipleProduct.js:100:16)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\nFrom: Task: Run it(\"Verify total item present in cart and Order Summary are same\") in control flow\n    at UserContext.<anonymous> (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:94:19)\n    at attempt (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4297:26)\n    at QueueRunner.run (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4217:20)\n    at runNext (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4257:20)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4264:13\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4172:9\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:64:48\n    at ControlFlow.emit (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\events.js:62:21)\n    at ControlFlow.shutdown_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2674:10)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2599:53\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars\\specs\\AddItem\\AddMultipleProduct.js:81:3)\n    at addSpecsToSuite (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars\\specs\\AddItem\\AddMultipleProduct.js:21:1)\n    at Module._compile (internal/modules/cjs/loader.js:956:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:973:10)\n    at Module.load (internal/modules/cjs/loader.js:812:32)\n    at Function.Module._load (internal/modules/cjs/loader.js:724:14)"
        ],
        "browserLogs": [],
        "screenShotFile": "00ec00c0-008b-0036-00fc-00ad002500f9.png",
        "timestamp": 1578405144015,
        "duration": 4059
    },
    {
        "description": "should login the user|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 6632,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "00740083-0036-0075-00df-009800f6009b.png",
        "timestamp": 1578405432107,
        "duration": 15458
    },
    {
        "description": "Forgot password link present on the Login page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 6632,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00fb00de-0095-00bc-00b1-00b9005f0099.png",
        "timestamp": 1578405448010,
        "duration": 61
    },
    {
        "description": "Create Account link present on the Login page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 6632,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00ff00eb-00fc-0009-00aa-00fb0035005d.png",
        "timestamp": 1578405448448,
        "duration": 44
    },
    {
        "description": "Contact Us  link present on the Login Page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 6632,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "0089006a-0027-00c5-0059-00a100ba005e.png",
        "timestamp": 1578405448865,
        "duration": 39
    },
    {
        "description": "Verify comapny copyright text at the footer of the login page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 6632,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "00ed007f-008d-0092-002d-005b00ac00be.png",
        "timestamp": 1578405449260,
        "duration": 4046
    },
    {
        "description": "Verify Username labeling is preseet|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 6632,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "006a001e-00e4-003f-00c4-00c800c400c2.png",
        "timestamp": 1578405453680,
        "duration": 3
    },
    {
        "description": "Verify password label is present|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 6632,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00aa0049-0026-000a-0096-00ba0072008f.png",
        "timestamp": 1578405454034,
        "duration": 5
    },
    {
        "description": "Verify Remember Me check box|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 6632,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00cd008b-0090-0027-00d6-00a500fb00e1.png",
        "timestamp": 1578405454374,
        "duration": 33
    },
    {
        "description": "verify the title of the Page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 6632,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "002700c3-0053-00e1-0006-002300080016.png",
        "timestamp": 1578405454749,
        "duration": 12
    },
    {
        "description": "veriy all links present on page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 6632,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "009800c5-0057-005b-0001-00280028003e.png",
        "timestamp": 1578405455107,
        "duration": 49
    },
    {
        "description": "User Login successfully |Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 6632,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "https://archway-forduaw-qa.azurewebsites.net/main.8135115ee1375ec49609.js 0 /deep/ combinator is no longer supported in CSS dynamic profile. It is now effectively no-op, acting as if it were a descendant combinator. /deep/ combinator will be removed, and will be invalid at M65. You should remove it. See https://www.chromestatus.com/features/4964279606312960 for more details.",
                "timestamp": 1578405475092,
                "type": ""
            }
        ],
        "screenShotFile": "002b00c1-00e7-0048-0063-004e005e002e.png",
        "timestamp": 1578405455496,
        "duration": 19611
    },
    {
        "description": "Add Multiple Products successfully| Multiple Products ",
        "passed": false,
        "pending": false,
        "os": "Windows",
        "instanceId": 6632,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": [
            "Failed: No element found using locator: By(xpath, //div[1]/div[1]/ngb-typeahead-window[1]/button[1]/ngb-highlight[1])"
        ],
        "trace": [
            "NoSuchElementError: No element found using locator: By(xpath, //div[1]/div[1]/ngb-typeahead-window[1]/button[1]/ngb-highlight[1])\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:814:27\n    at ManagedPromise.invokeCallback_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\n    at processTicksAndRejections (internal/process/task_queues.js:93:5)Error\n    at ElementArrayFinder.applyAction_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:459:27)\n    at ElementArrayFinder.<computed> [as click] (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:91:29)\n    at ElementFinder.<computed> [as click] (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:831:22)\n    at addtoCart.clickonfirstHighlightItem (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars\\pageobjects\\AddItem\\AddItem.js:608:22)\n    at UserContext.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars\\specs\\AddItem\\AddMultipleProduct.js:56:16)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\nFrom: Task: Run it(\"Add Multiple Products successfully\") in control flow\n    at UserContext.<anonymous> (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:94:19)\n    at attempt (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4297:26)\n    at QueueRunner.run (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4217:20)\n    at runNext (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4257:20)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4264:13\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4172:9\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:64:48\n    at ControlFlow.emit (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\events.js:62:21)\n    at ControlFlow.shutdown_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2674:10)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2599:53\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars\\specs\\AddItem\\AddMultipleProduct.js:37:2)\n    at addSpecsToSuite (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars\\specs\\AddItem\\AddMultipleProduct.js:21:1)\n    at Module._compile (internal/modules/cjs/loader.js:956:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:973:10)\n    at Module.load (internal/modules/cjs/loader.js:812:32)\n    at Function.Module._load (internal/modules/cjs/loader.js:724:14)"
        ],
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "https://archway-forduaw-qa.azurewebsites.net/products?pageSize=15&sortBy=ID - [DOM] Found 15 elements with non-unique id #quantity: (More info: https://goo.gl/9p2vKq) %o %o %o %o %o %o %o %o %o %o %o %o %o %o %o",
                "timestamp": 1578405483549,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://archway-forduaw-qa.azurewebsites.net/products?pageSize=15&sortBy=ID - [DOM] Found 15 elements with non-unique id #quantity: (More info: https://goo.gl/9p2vKq) %o %o %o %o %o %o %o %o %o %o %o %o %o %o %o",
                "timestamp": 1578405485694,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://archway-forduaw-qa.azurewebsites.net/products?pageSize=15&sortBy=ID - [DOM] Found 15 elements with non-unique id #quantity: (More info: https://goo.gl/9p2vKq) %o %o %o %o %o %o %o %o %o %o %o %o %o %o %o",
                "timestamp": 1578405485694,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://archway-forduaw-qa.azurewebsites.net/products - [DOM] Found 15 elements with non-unique id #quantity: (More info: https://goo.gl/9p2vKq) %o %o %o %o %o %o %o %o %o %o %o %o %o %o %o",
                "timestamp": 1578405504881,
                "type": ""
            }
        ],
        "screenShotFile": "0007006f-00f8-008d-00e7-003800280022.png",
        "timestamp": 1578405475539,
        "duration": 64189
    },
    {
        "description": "Verify total item present in cart and Order Summary are same| Multiple Products ",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 6632,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "00aa00cb-00ba-00b0-0079-009400da00c0.png",
        "timestamp": 1578405540170,
        "duration": 48
    },
    {
        "description": "should login the user|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 5672,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "003b0056-00f7-004f-006e-00c1007f00e9.png",
        "timestamp": 1578405795318,
        "duration": 15370
    },
    {
        "description": "Forgot password link present on the Login page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 5672,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00b800da-00f7-000c-0086-00eb00910067.png",
        "timestamp": 1578405811110,
        "duration": 57
    },
    {
        "description": "Create Account link present on the Login page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 5672,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00810018-0031-0005-0051-00f300e000e6.png",
        "timestamp": 1578405811509,
        "duration": 45
    },
    {
        "description": "Contact Us  link present on the Login Page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 5672,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00da009f-004c-0075-008c-008f005d004a.png",
        "timestamp": 1578405811925,
        "duration": 50
    },
    {
        "description": "Verify comapny copyright text at the footer of the login page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 5672,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "0032007a-0047-00da-009a-0001005b002c.png",
        "timestamp": 1578405812313,
        "duration": 24
    },
    {
        "description": "Verify Username labeling is preseet|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 5672,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00c60017-0040-000c-0065-002d007c00d3.png",
        "timestamp": 1578405812696,
        "duration": 3
    },
    {
        "description": "Verify password label is present|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 5672,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00f90055-001d-0011-0017-004b00e90027.png",
        "timestamp": 1578405813053,
        "duration": 4
    },
    {
        "description": "Verify Remember Me check box|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 5672,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "000e009d-0036-00d3-0065-009a00b0002f.png",
        "timestamp": 1578405813423,
        "duration": 41
    },
    {
        "description": "verify the title of the Page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 5672,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "004e00c7-0067-0045-0037-00bb00d700a3.png",
        "timestamp": 1578405813838,
        "duration": 15
    },
    {
        "description": "veriy all links present on page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 5672,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "0084000e-00a4-00af-0034-004e009b00fd.png",
        "timestamp": 1578405814211,
        "duration": 53
    },
    {
        "description": "User Login successfully |Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 5672,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "https://archway-forduaw-qa.azurewebsites.net/main.8135115ee1375ec49609.js 0 /deep/ combinator is no longer supported in CSS dynamic profile. It is now effectively no-op, acting as if it were a descendant combinator. /deep/ combinator will be removed, and will be invalid at M65. You should remove it. See https://www.chromestatus.com/features/4964279606312960 for more details.",
                "timestamp": 1578405834266,
                "type": ""
            }
        ],
        "screenShotFile": "004c0085-00ac-00e0-0098-000a00c700a4.png",
        "timestamp": 1578405814624,
        "duration": 19657
    },
    {
        "description": "should find all links on Home Page| Verifying Home Page ",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 5672,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "008400af-004f-005e-000e-005d003a003c.png",
        "timestamp": 1578405834667,
        "duration": 2372
    },
    {
        "description": "Verify Presence of Logo| Verifying Home Page ",
        "passed": false,
        "pending": true,
        "os": "Windows",
        "instanceId": 5672,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Temporarily disabled with xit",
        "browserLogs": [],
        "screenShotFile": "00ff0028-0075-00ab-0060-0001007b003d.png",
        "timestamp": 1578405837432,
        "duration": 0
    },
    {
        "description": "Verify URL of the Home page once user is logged successfully | Verifying Home Page ",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 5672,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00f10021-0053-00a6-00bc-001e004e0037.png",
        "timestamp": 1578405837456,
        "duration": 9
    },
    {
        "description": "Verify Home icon is present on the Landing/Home page after Login| Verifying Home Page ",
        "passed": false,
        "pending": true,
        "os": "Windows",
        "instanceId": 5672,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Temporarily disabled with xit",
        "browserLogs": [],
        "screenShotFile": "0053000c-00ce-00c9-00af-00e500b600c7.png",
        "timestamp": 1578405837844,
        "duration": 0
    },
    {
        "description": "Verify BrowseProduct icon is present on the Landing/Home page after Login| Verifying Home Page ",
        "passed": false,
        "pending": false,
        "os": "Windows",
        "instanceId": 5672,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": [
            "Expected 'BROWSE PRODUCTS' to contain ' Browse Products '."
        ],
        "trace": [
            "Error: Failed expectation\n    at C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars\\specs\\HomePage\\HomePage_spec.js:106:21\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:804:32\n    at ManagedPromise.invokeCallback_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\n    at processTicksAndRejections (internal/process/task_queues.js:93:5)"
        ],
        "browserLogs": [],
        "screenShotFile": "00b50091-007b-00f4-00d5-008200ef00da.png",
        "timestamp": 1578405837864,
        "duration": 128
    },
    {
        "description": "Verify MyOrders icon is present on the Landing/Home page after Login| Verifying Home Page ",
        "passed": false,
        "pending": true,
        "os": "Windows",
        "instanceId": 5672,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Temporarily disabled with xit",
        "browserLogs": [],
        "screenShotFile": "000f005b-00d2-0012-0016-003a000d0027.png",
        "timestamp": 1578405838365,
        "duration": 0
    },
    {
        "description": "Verify Report icon is present on the Landing/Home page after Login| Verifying Home Page ",
        "passed": false,
        "pending": false,
        "os": "Windows",
        "instanceId": 5672,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": [
            "Expected 'REPORTS' to contain 'Reports'."
        ],
        "trace": [
            "Error: Failed expectation\n    at C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars\\specs\\HomePage\\HomePage_spec.js:148:21\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:804:32\n    at ManagedPromise.invokeCallback_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\n    at processTicksAndRejections (internal/process/task_queues.js:93:5)"
        ],
        "browserLogs": [],
        "screenShotFile": "00350039-002f-00ee-00d4-0046000a00fb.png",
        "timestamp": 1578405838390,
        "duration": 103
    },
    {
        "description": "Verify for Featured Products on Home Page|Verify Featured Products Text is present on Home Page | Verifying Home Page ",
        "passed": false,
        "pending": true,
        "os": "Windows",
        "instanceId": 5672,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Pending",
        "browserLogs": [],
        "screenShotFile": "004b0075-000a-00fb-00bc-002800b00012.png",
        "timestamp": 1578405838886,
        "duration": 0
    },
    {
        "description": "user see about website section|Verify About website section/text is present| Verifying Home Page ",
        "passed": false,
        "pending": true,
        "os": "Windows",
        "instanceId": 5672,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Pending",
        "browserLogs": [],
        "screenShotFile": "00a80080-0026-00bd-00f4-00ce00dd001d.png",
        "timestamp": 1578405838906,
        "duration": 0
    },
    {
        "description": "Verification About website contents|Verify About website section/text is present| Verifying Home Page ",
        "passed": false,
        "pending": true,
        "os": "Windows",
        "instanceId": 5672,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Temporarily disabled with xit",
        "browserLogs": [],
        "screenShotFile": "008300cc-00d3-00ed-0095-007200e600a4.png",
        "timestamp": 1578405838938,
        "duration": 0
    },
    {
        "description": "Verify Order History text is present on the Landing/Home page after Login| Verify Order History Text| Verifying Home Page ",
        "passed": false,
        "pending": true,
        "os": "Windows",
        "instanceId": 5672,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Pending",
        "browserLogs": [],
        "screenShotFile": "00b000fc-0050-00c7-0065-001b00350039.png",
        "timestamp": 1578405838962,
        "duration": 0
    },
    {
        "description": "Verify  Order Summary text is present on the Landing/Home page after Login| Verify Order History Text| Verifying Home Page ",
        "passed": false,
        "pending": true,
        "os": "Windows",
        "instanceId": 5672,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Pending",
        "browserLogs": [],
        "screenShotFile": "0015001e-00fa-00fc-00fc-00a500b20080.png",
        "timestamp": 1578405838986,
        "duration": 0
    },
    {
        "description": "Verify the contents of order history link| Verify Order History Text| Verifying Home Page ",
        "passed": false,
        "pending": true,
        "os": "Windows",
        "instanceId": 5672,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Pending",
        "browserLogs": [],
        "screenShotFile": "0079007f-00bc-0033-0064-00e900030043.png",
        "timestamp": 1578405839008,
        "duration": 0
    },
    {
        "description": "Verify Order date text is present| Verify Order History Text| Verifying Home Page ",
        "passed": false,
        "pending": true,
        "os": "Windows",
        "instanceId": 5672,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Pending",
        "browserLogs": [],
        "screenShotFile": "000b007b-007e-0086-000e-00e100ac0049.png",
        "timestamp": 1578405839030,
        "duration": 0
    },
    {
        "description": "Verify Order Status text is present| Verify Order History Text| Verifying Home Page ",
        "passed": false,
        "pending": true,
        "os": "Windows",
        "instanceId": 5672,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Pending",
        "browserLogs": [],
        "screenShotFile": "002800e6-00b8-0021-0043-006800f000dc.png",
        "timestamp": 1578405839050,
        "duration": 0
    },
    {
        "description": "Verify Status Date text is present| Verify Order History Text| Verifying Home Page ",
        "passed": false,
        "pending": true,
        "os": "Windows",
        "instanceId": 5672,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Pending",
        "browserLogs": [],
        "screenShotFile": "006b0017-0066-0050-0034-0041006a00bf.png",
        "timestamp": 1578405839069,
        "duration": 0
    },
    {
        "description": "Verify Total Items text is present| Verify Order History Text| Verifying Home Page ",
        "passed": false,
        "pending": true,
        "os": "Windows",
        "instanceId": 5672,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Pending",
        "browserLogs": [],
        "screenShotFile": "009000be-0070-0055-0054-00ea007000e3.png",
        "timestamp": 1578405839091,
        "duration": 0
    },
    {
        "description": "Verify Total Cost text is present| Verify Order History Text| Verifying Home Page ",
        "passed": false,
        "pending": true,
        "os": "Windows",
        "instanceId": 5672,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Pending",
        "browserLogs": [],
        "screenShotFile": "00a20046-00b4-00a0-00ef-00a900920036.png",
        "timestamp": 1578405839113,
        "duration": 0
    },
    {
        "description": "Verify Conact US links exist exist in footer|Verify Contact US link| Verifying Home Page ",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 5672,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "002700b4-0057-00c1-0039-000f00d8003f.png",
        "timestamp": 1578405839141,
        "duration": 86
    },
    {
        "description": " Verification of Name text  is present  |Verify Contact US link| Verifying Home Page ",
        "passed": false,
        "pending": true,
        "os": "Windows",
        "instanceId": 5672,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Temporarily disabled with xit",
        "browserLogs": [],
        "screenShotFile": "00fa0025-00c1-0040-0003-00e000dc009a.png",
        "timestamp": 1578405839579,
        "duration": 0
    },
    {
        "description": " Verification Email text is present|Verify Contact US link| Verifying Home Page ",
        "passed": false,
        "pending": true,
        "os": "Windows",
        "instanceId": 5672,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Temporarily disabled with xit",
        "browserLogs": [],
        "screenShotFile": "00560026-005d-00ef-0084-009000e300d4.png",
        "timestamp": 1578405839603,
        "duration": 0
    },
    {
        "description": "Verification Contact  Number text is present|Verify Contact US link| Verifying Home Page ",
        "passed": false,
        "pending": true,
        "os": "Windows",
        "instanceId": 5672,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Temporarily disabled with xit",
        "browserLogs": [],
        "screenShotFile": "00f4007b-00e0-002a-00a3-00ce006000ea.png",
        "timestamp": 1578405839623,
        "duration": 0
    },
    {
        "description": " Verification Message text is present|Verify Contact US link| Verifying Home Page ",
        "passed": false,
        "pending": true,
        "os": "Windows",
        "instanceId": 5672,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Temporarily disabled with xit",
        "browserLogs": [],
        "screenShotFile": "004900f4-0039-00fb-004b-005f00c5004f.png",
        "timestamp": 1578405839646,
        "duration": 0
    },
    {
        "description": "Verify Submit button presence  |Verify Contact US link| Verifying Home Page ",
        "passed": false,
        "pending": true,
        "os": "Windows",
        "instanceId": 5672,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Temporarily disabled with xit",
        "browserLogs": [],
        "screenShotFile": "00530001-00bf-00d4-00a8-0026003c008f.png",
        "timestamp": 1578405839666,
        "duration": 0
    },
    {
        "description": "Verify Cancell Button presence |Verify Contact US link| Verifying Home Page ",
        "passed": false,
        "pending": true,
        "os": "Windows",
        "instanceId": 5672,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Temporarily disabled with xit",
        "browserLogs": [],
        "screenShotFile": "004c0077-007c-005a-008f-00f5005800f9.png",
        "timestamp": 1578405839687,
        "duration": 0
    },
    {
        "description": "Navigating back and refresh the browser|Verify Contact US link| Verifying Home Page ",
        "passed": false,
        "pending": true,
        "os": "Windows",
        "instanceId": 5672,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Temporarily disabled with xit",
        "browserLogs": [],
        "screenShotFile": "00b100bc-0055-0085-00a7-008a000b0062.png",
        "timestamp": 1578405839707,
        "duration": 0
    },
    {
        "description": "verify FAQ link | Verify FAQ| Verifying Home Page ",
        "passed": false,
        "pending": true,
        "os": "Windows",
        "instanceId": 5672,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Pending",
        "browserLogs": [],
        "screenShotFile": "00cd00e7-009c-0036-0056-00b3001b00ff.png",
        "timestamp": 1578405839727,
        "duration": 0
    },
    {
        "description": "Navigating back and refresh the browser| Verify FAQ| Verifying Home Page ",
        "passed": false,
        "pending": true,
        "os": "Windows",
        "instanceId": 5672,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Temporarily disabled with xit",
        "browserLogs": [],
        "screenShotFile": "00e700ee-00b8-00ab-0019-0094009200f3.png",
        "timestamp": 1578405839748,
        "duration": 0
    },
    {
        "description": "Verify Copyright at the Footer| Vevrify Copyright Text| Verifying Home Page ",
        "passed": false,
        "pending": false,
        "os": "Windows",
        "instanceId": 5672,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": [
            "Failed: No element found using locator: By(xpath, //small[contains(text(),'© 2019 ARCHWAY MARKETING SERVICES')])"
        ],
        "trace": [
            "NoSuchElementError: No element found using locator: By(xpath, //small[contains(text(),'© 2019 ARCHWAY MARKETING SERVICES')])\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:814:27\n    at ManagedPromise.invokeCallback_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\n    at processTicksAndRejections (internal/process/task_queues.js:93:5)Error\n    at ElementArrayFinder.applyAction_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:459:27)\n    at ElementArrayFinder.<computed> [as getText] (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:91:29)\n    at ElementFinder.<computed> [as getText] (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:831:22)\n    at UserContext.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars\\specs\\HomePage\\HomePage_spec.js:774:17)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\nFrom: Task: Run it(\"Verify Copyright at the Footer\") in control flow\n    at UserContext.<anonymous> (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:94:19)\n    at attempt (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4297:26)\n    at QueueRunner.run (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4217:20)\n    at runNext (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4257:20)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4264:13\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4172:9\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:64:48\n    at ControlFlow.emit (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\events.js:62:21)\n    at ControlFlow.shutdown_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2674:10)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2599:53\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars\\specs\\HomePage\\HomePage_spec.js:769:3)\n    at addSpecsToSuite (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Suite.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars\\specs\\HomePage\\HomePage_spec.js:767:2)\n    at addSpecsToSuite (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars\\specs\\HomePage\\HomePage_spec.js:14:1)"
        ],
        "browserLogs": [],
        "screenShotFile": "00d70091-00dd-0040-0027-00b200940092.png",
        "timestamp": 1578405839768,
        "duration": 22
    },
    {
        "description": "Verify UserCircle|Verify UserMenu| Verifying Home Page ",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 5672,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "0002001e-00fb-00fa-00de-009f00ea0030.png",
        "timestamp": 1578405840162,
        "duration": 5212
    },
    {
        "description": "Verify presence of User profile|Verify UserMenu| Verifying Home Page ",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 5672,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00f00035-002d-0024-00be-0030001f0094.png",
        "timestamp": 1578405845976,
        "duration": 87
    },
    {
        "description": "Verify presence of user address|Verify UserMenu| Verifying Home Page ",
        "passed": false,
        "pending": true,
        "os": "Windows",
        "instanceId": 5672,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Temporarily disabled with xit",
        "browserLogs": [],
        "screenShotFile": "00cd003d-006e-00a0-0096-00330005005e.png",
        "timestamp": 1578405846619,
        "duration": 0
    },
    {
        "description": "Verify User Logout Option|Verify UserMenu| Verifying Home Page ",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 5672,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "001e0015-006f-006f-0059-007f0032005a.png",
        "timestamp": 1578405846641,
        "duration": 3068
    },
    {
        "description": "Quick Add : Enter product and quantity successfully|Add Item to cart by  Quick Add and verify contents present on page ",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 5672,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed",
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "https://archway-forduaw-qa.azurewebsites.net/products?pageSize=15&sortBy=ID - [DOM] Found 15 elements with non-unique id #quantity: (More info: https://goo.gl/9p2vKq) %o %o %o %o %o %o %o %o %o %o %o %o %o %o %o",
                "timestamp": 1578405862464,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://archway-forduaw-qa.azurewebsites.net/products?pageSize=15&sortBy=ID - [DOM] Found 15 elements with non-unique id #quantity: (More info: https://goo.gl/9p2vKq) %o %o %o %o %o %o %o %o %o %o %o %o %o %o %o",
                "timestamp": 1578405862465,
                "type": ""
            }
        ],
        "screenShotFile": "009d00e8-00a9-00b5-00a0-00e80041006d.png",
        "timestamp": 1578405850279,
        "duration": 12171
    },
    {
        "description": "should pan plots when you click and drag|Add Item to cart by  Quick Add and verify contents present on page ",
        "passed": false,
        "pending": true,
        "os": "Windows",
        "instanceId": 5672,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Temporarily disabled with xit",
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "https://archway-forduaw-qa.azurewebsites.net/products?pageSize=15&sortBy=ID - [DOM] Found 15 elements with non-unique id #quantity: (More info: https://goo.gl/9p2vKq) %o %o %o %o %o %o %o %o %o %o %o %o %o %o %o",
                "timestamp": 1578405862899,
                "type": ""
            }
        ],
        "screenShotFile": "00b00031-0075-00a6-00ce-004f003d006e.png",
        "timestamp": 1578405862955,
        "duration": 0
    },
    {
        "description": "verify Sort option is present on Add To Cart screen |Add Item to cart by  Quick Add and verify contents present on page ",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 5672,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00280028-008c-008e-003b-006e007d0000.png",
        "timestamp": 1578405862986,
        "duration": 125
    },
    {
        "description": "verify Refine By text on Add To Cart screen|Add Item to cart by  Quick Add and verify contents present on page ",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 5672,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "004d0058-002a-0094-0057-007000490050.png",
        "timestamp": 1578405863507,
        "duration": 126
    },
    {
        "description": "verify My Favorites link|Add Item to cart by  Quick Add and verify contents present on page ",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 5672,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00570014-005b-002b-0012-009500c100b3.png",
        "timestamp": 1578405864019,
        "duration": 138
    },
    {
        "description": "Verify Quick Add Header label text|Add Item to cart by  Quick Add and verify contents present on page ",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 5672,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00140040-0050-00ce-00e2-00cb0005004d.png",
        "timestamp": 1578405864526,
        "duration": 79
    },
    {
        "description": "Verify lable of item |Add Item to cart by  Quick Add and verify contents present on page ",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 5672,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "0090003a-0055-00d5-0086-00f8002600f9.png",
        "timestamp": 1578405864989,
        "duration": 98
    },
    {
        "description": "Verify lable of qty |Add Item to cart by  Quick Add and verify contents present on page ",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 5672,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00d200ce-0023-0036-00ff-008100300014.png",
        "timestamp": 1578405865500,
        "duration": 66
    },
    {
        "description": "TC_004:Verify Add to Cart button is present on the page|Add Item to cart by  Quick Add and verify contents present on page ",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 5672,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "000d00e3-00d1-0052-0050-00ff00b60017.png",
        "timestamp": 1578405865948,
        "duration": 34
    },
    {
        "description": "Verify Add item and Quantity and click on checkout|Add Item to cart by  Quick Add and verify contents present on page ",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 5672,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "003f006b-00c2-0081-00ad-008e009500ec.png",
        "timestamp": 1578405866362,
        "duration": 28804
    },
    {
        "description": "checkout case for One time Address|CheckOut Verfication",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 5672,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed",
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "https://archway-forduaw-qa.azurewebsites.net/cart - [DOM] Found 2 elements with non-unique id #quantity: (More info: https://goo.gl/9p2vKq) %o %o",
                "timestamp": 1578405897622,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://archway-forduaw-qa.azurewebsites.net/main.8135115ee1375ec49609.js 0:1503642 \"\\n      It looks like you're using the disabled attribute with a reactive form directive. If you set disabled to true\\n      when you set up this control in your component class, the disabled attribute will actually be set in the DOM for\\n      you. We recommend using this approach to avoid 'changed after checked' errors.\\n       \\n      Example: \\n      form = new FormGroup({\\n        first: new FormControl({value: 'Nancy', disabled: true}, Validators.required),\\n        last: new FormControl('Drew', Validators.required)\\n      });\\n    \"",
                "timestamp": 1578405897788,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://archway-forduaw-qa.azurewebsites.net/main.8135115ee1375ec49609.js 0:1503642 \"\\n      It looks like you're using the disabled attribute with a reactive form directive. If you set disabled to true\\n      when you set up this control in your component class, the disabled attribute will actually be set in the DOM for\\n      you. We recommend using this approach to avoid 'changed after checked' errors.\\n       \\n      Example: \\n      form = new FormGroup({\\n        first: new FormControl({value: 'Nancy', disabled: true}, Validators.required),\\n        last: new FormControl('Drew', Validators.required)\\n      });\\n    \"",
                "timestamp": 1578405897823,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://archway-forduaw-qa.azurewebsites.net/checkout - [DOM] Found 2 elements with non-unique id #search-addon: (More info: https://goo.gl/9p2vKq) %o %o",
                "timestamp": 1578405902875,
                "type": ""
            }
        ],
        "screenShotFile": "00a800c4-0035-0002-0052-002900f6009a.png",
        "timestamp": 1578405895580,
        "duration": 7290
    },
    {
        "description": "checkout process|CheckOut Verfication",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 5672,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "000300ce-0060-0087-003e-000800ce00d0.png",
        "timestamp": 1578405903233,
        "duration": 17417
    },
    {
        "description": "Verify order has submitted|CheckOut Verfication",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 5672,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00c600d2-00ae-00bb-0049-003900200063.png",
        "timestamp": 1578405921022,
        "duration": 43
    },
    {
        "description": "Verify submited order Number |CheckOut Verfication",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 5672,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00df0063-0072-00e4-0085-004000aa001c.png",
        "timestamp": 1578405921428,
        "duration": 49
    },
    {
        "description": "Shipping Method Text is present when order is confirmed|CheckOut Verfication",
        "passed": false,
        "pending": true,
        "os": "Windows",
        "instanceId": 5672,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Temporarily disabled with xit",
        "browserLogs": [],
        "screenShotFile": "00380022-00ee-007d-00df-00ab008800c8.png",
        "timestamp": 1578405921843,
        "duration": 0
    },
    {
        "description": " vrify Shipping Method  is same that user has selected while palcing the order|CheckOut Verfication",
        "passed": false,
        "pending": true,
        "os": "Windows",
        "instanceId": 5672,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Temporarily disabled with xit",
        "browserLogs": [],
        "screenShotFile": "00f00081-0037-009f-00fd-006700d500d0.png",
        "timestamp": 1578405921867,
        "duration": 0
    },
    {
        "description": "Subtotal Text is present when order is confirmed|CheckOut Verfication",
        "passed": false,
        "pending": true,
        "os": "Windows",
        "instanceId": 5672,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Temporarily disabled with xit",
        "browserLogs": [],
        "screenShotFile": "004c009a-0081-00cd-00ad-002a00730098.png",
        "timestamp": 1578405921889,
        "duration": 0
    },
    {
        "description": " verify Subtotal value is correct|CheckOut Verfication",
        "passed": false,
        "pending": true,
        "os": "Windows",
        "instanceId": 5672,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Temporarily disabled with xit",
        "browserLogs": [],
        "screenShotFile": "004700ff-00bd-00a3-0027-00d5008000be.png",
        "timestamp": 1578405921984,
        "duration": 0
    },
    {
        "description": " verify print option|CheckOut Verfication",
        "passed": false,
        "pending": true,
        "os": "Windows",
        "instanceId": 5672,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Temporarily disabled with xit",
        "browserLogs": [],
        "screenShotFile": "00040007-0098-00da-004c-007600990040.png",
        "timestamp": 1578405922009,
        "duration": 0
    },
    {
        "description": "User should log out successfully from application|Log out ",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 5672,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "00de00c9-0021-00e4-00cc-00db00e40099.png",
        "timestamp": 1578405922059,
        "duration": 10120
    },
    {
        "description": "verify successfull Logout|Log out ",
        "passed": false,
        "pending": false,
        "os": "Windows",
        "instanceId": 5672,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": [
            "Failed: <toMatch> : Expected is not a String or a RegExp\nUsage: expect(<expectation>).toMatch(<string> || <regexp>)"
        ],
        "trace": [
            "Error: <toMatch> : Expected is not a String or a RegExp\nUsage: expect(<expectation>).toMatch(<string> || <regexp>)\n    at compare (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:3570:17)\n    at compare (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:284:35)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:269:16\n    at resolveAt (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\maybePromise.js:62:14)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\maybePromise.js:66:16\n    at maybePromise (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\maybePromise.js:43:12)\n    at resolveAt (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\maybePromise.js:64:14)\n    at Function.all (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\maybePromise.js:70:10)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:268:27\n    at ManagedPromise.invokeCallback_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\nFrom: Task: Run it(\"verify successfull Logout\") in control flow\n    at UserContext.<anonymous> (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:94:19)\n    at attempt (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4297:26)\n    at QueueRunner.run (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4217:20)\n    at runNext (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4257:20)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4264:13\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4172:9\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:64:48\n    at ControlFlow.emit (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\events.js:62:21)\n    at ControlFlow.shutdown_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2674:10)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2599:53\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars\\specs\\Logout\\Logout_spec.js:44:2)\n    at addSpecsToSuite (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars\\specs\\Logout\\Logout_spec.js:22:1)\n    at Module._compile (internal/modules/cjs/loader.js:956:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:973:10)\n    at Module.load (internal/modules/cjs/loader.js:812:32)\n    at Function.Module._load (internal/modules/cjs/loader.js:724:14)"
        ],
        "browserLogs": [],
        "screenShotFile": "006900b8-0069-0076-0086-00f100a100e4.png",
        "timestamp": 1578405932604,
        "duration": 18
    },
    {
        "description": "should login the user|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 11312,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "008a0034-00f1-0083-0004-003e006300d4.png",
        "timestamp": 1578407939723,
        "duration": 15386
    },
    {
        "description": "Forgot password link present on the Login page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 11312,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "003e0063-00d5-00f4-0038-005600fc00d5.png",
        "timestamp": 1578407955557,
        "duration": 55
    },
    {
        "description": "Create Account link present on the Login page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 11312,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "000b002e-004d-0087-0024-00480039005d.png",
        "timestamp": 1578407955972,
        "duration": 42
    },
    {
        "description": "Contact Us  link present on the Login Page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 11312,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00fb0030-001c-00fa-000c-004000390081.png",
        "timestamp": 1578407956378,
        "duration": 45
    },
    {
        "description": "Verify comapny copyright text at the footer of the login page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 11312,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "000a0007-0098-00fd-009a-002e00450097.png",
        "timestamp": 1578407956806,
        "duration": 22
    },
    {
        "description": "Verify Username labeling is preseet|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 11312,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00b600a8-0097-00e3-0005-005400e40042.png",
        "timestamp": 1578407957199,
        "duration": 2
    },
    {
        "description": "Verify password label is present|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 11312,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00c100c8-0058-0006-002b-0088004900f4.png",
        "timestamp": 1578407957567,
        "duration": 3
    },
    {
        "description": "Verify Remember Me check box|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 11312,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "006900b5-0025-00ed-000c-005000a200b6.png",
        "timestamp": 1578407957929,
        "duration": 36
    },
    {
        "description": "verify the title of the Page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 11312,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "000a00a7-007e-000b-005b-008e001e00a6.png",
        "timestamp": 1578407958326,
        "duration": 11
    },
    {
        "description": "veriy all links present on page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 11312,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "00aa0082-00bf-00a3-002a-00f5009100e4.png",
        "timestamp": 1578407958692,
        "duration": 42
    },
    {
        "description": "User Login successfully |Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 11312,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00690007-0095-008e-007b-005c000d00b2.png",
        "timestamp": 1578407959107,
        "duration": 19581
    },
    {
        "description": "should find all links on Home Page| Verifying Home Page ",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 11312,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "00800017-0056-0065-009e-009a003e003f.png",
        "timestamp": 1578407979047,
        "duration": 2385
    },
    {
        "description": "Verify Presence of Logo| Verifying Home Page ",
        "passed": false,
        "pending": true,
        "os": "Windows",
        "instanceId": 11312,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Temporarily disabled with xit",
        "browserLogs": [],
        "screenShotFile": "006a00cf-0030-006c-00df-005300d8004b.png",
        "timestamp": 1578407981817,
        "duration": 0
    },
    {
        "description": "Verify URL of the Home page once user is logged successfully | Verifying Home Page ",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 11312,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00860074-0042-00a3-0059-008300130051.png",
        "timestamp": 1578407981855,
        "duration": 28
    },
    {
        "description": "Verify Home icon is present on the Landing/Home page after Login| Verifying Home Page ",
        "passed": false,
        "pending": true,
        "os": "Windows",
        "instanceId": 11312,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Temporarily disabled with xit",
        "browserLogs": [],
        "screenShotFile": "00e30099-0049-00b1-0041-006000cf0031.png",
        "timestamp": 1578407982274,
        "duration": 0
    },
    {
        "description": "Verify BrowseProduct icon is present on the Landing/Home page after Login| Verifying Home Page ",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 11312,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00a6007d-00e2-00bb-00f2-003800100002.png",
        "timestamp": 1578407982305,
        "duration": 134
    },
    {
        "description": "Verify MyOrders icon is present on the Landing/Home page after Login| Verifying Home Page ",
        "passed": false,
        "pending": true,
        "os": "Windows",
        "instanceId": 11312,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Temporarily disabled with xit",
        "browserLogs": [],
        "screenShotFile": "00c90073-0073-002b-00cf-001a00cf00c2.png",
        "timestamp": 1578407982823,
        "duration": 0
    },
    {
        "description": "Verify Report icon is present on the Landing/Home page after Login| Verifying Home Page ",
        "passed": false,
        "pending": false,
        "os": "Windows",
        "instanceId": 11312,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": [
            "Expected 'REPORTS' to contain ''REPORTS'."
        ],
        "trace": [
            "Error: Failed expectation\n    at C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars\\specs\\HomePage\\HomePage_spec.js:148:21\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:804:32\n    at ManagedPromise.invokeCallback_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\n    at processTicksAndRejections (internal/process/task_queues.js:93:5)"
        ],
        "browserLogs": [],
        "screenShotFile": "0017000b-00a4-001b-00f3-000700ca0034.png",
        "timestamp": 1578407982848,
        "duration": 97
    },
    {
        "description": "Verify for Featured Products on Home Page|Verify Featured Products Text is present on Home Page | Verifying Home Page ",
        "passed": false,
        "pending": true,
        "os": "Windows",
        "instanceId": 11312,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Pending",
        "browserLogs": [],
        "screenShotFile": "0060008c-00fb-002c-008b-007700210086.png",
        "timestamp": 1578407983345,
        "duration": 0
    },
    {
        "description": "user see about website section|Verify About website section/text is present| Verifying Home Page ",
        "passed": false,
        "pending": true,
        "os": "Windows",
        "instanceId": 11312,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Pending",
        "browserLogs": [],
        "screenShotFile": "001700ca-009f-0045-004a-0060005a00fc.png",
        "timestamp": 1578407983383,
        "duration": 0
    },
    {
        "description": "Verification About website contents|Verify About website section/text is present| Verifying Home Page ",
        "passed": false,
        "pending": true,
        "os": "Windows",
        "instanceId": 11312,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Temporarily disabled with xit",
        "browserLogs": [],
        "screenShotFile": "00310044-0096-00bb-0090-0007006d00df.png",
        "timestamp": 1578407983411,
        "duration": 0
    },
    {
        "description": "Verify Order History text is present on the Landing/Home page after Login| Verify Order History Text| Verifying Home Page ",
        "passed": false,
        "pending": true,
        "os": "Windows",
        "instanceId": 11312,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Pending",
        "browserLogs": [],
        "screenShotFile": "006e00ea-0044-0074-001e-001700cf00ac.png",
        "timestamp": 1578407983437,
        "duration": 0
    },
    {
        "description": "Verify  Order Summary text is present on the Landing/Home page after Login| Verify Order History Text| Verifying Home Page ",
        "passed": false,
        "pending": true,
        "os": "Windows",
        "instanceId": 11312,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Pending",
        "browserLogs": [],
        "screenShotFile": "00b300ee-008c-000a-00bb-00af005e0040.png",
        "timestamp": 1578407983460,
        "duration": 0
    },
    {
        "description": "Verify the contents of order history link| Verify Order History Text| Verifying Home Page ",
        "passed": false,
        "pending": true,
        "os": "Windows",
        "instanceId": 11312,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Pending",
        "browserLogs": [],
        "screenShotFile": "00a200c4-00a5-0070-00ca-003c00de00fa.png",
        "timestamp": 1578407983485,
        "duration": 0
    },
    {
        "description": "Verify Order date text is present| Verify Order History Text| Verifying Home Page ",
        "passed": false,
        "pending": true,
        "os": "Windows",
        "instanceId": 11312,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Pending",
        "browserLogs": [],
        "screenShotFile": "00a800b9-00c6-003d-009b-009700b7003d.png",
        "timestamp": 1578407983509,
        "duration": 0
    },
    {
        "description": "Verify Order Status text is present| Verify Order History Text| Verifying Home Page ",
        "passed": false,
        "pending": true,
        "os": "Windows",
        "instanceId": 11312,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Pending",
        "browserLogs": [],
        "screenShotFile": "008400fd-0003-004b-00e6-0083000400e9.png",
        "timestamp": 1578407983534,
        "duration": 0
    },
    {
        "description": "Verify Status Date text is present| Verify Order History Text| Verifying Home Page ",
        "passed": false,
        "pending": true,
        "os": "Windows",
        "instanceId": 11312,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Pending",
        "browserLogs": [],
        "screenShotFile": "009f0019-006e-00c0-0042-009800e40024.png",
        "timestamp": 1578407983559,
        "duration": 0
    },
    {
        "description": "Verify Total Items text is present| Verify Order History Text| Verifying Home Page ",
        "passed": false,
        "pending": true,
        "os": "Windows",
        "instanceId": 11312,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Pending",
        "browserLogs": [],
        "screenShotFile": "00d200ae-0059-00fb-0004-00a500eb0087.png",
        "timestamp": 1578407983587,
        "duration": 0
    },
    {
        "description": "Verify Total Cost text is present| Verify Order History Text| Verifying Home Page ",
        "passed": false,
        "pending": true,
        "os": "Windows",
        "instanceId": 11312,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Pending",
        "browserLogs": [],
        "screenShotFile": "00da00fa-0092-009f-004f-0026002f003e.png",
        "timestamp": 1578407983616,
        "duration": 0
    },
    {
        "description": "Verify Conact US links exist exist in footer|Verify Contact US link| Verifying Home Page ",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 11312,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00ff009a-0036-001c-001d-00c000c000a2.png",
        "timestamp": 1578407983640,
        "duration": 100
    },
    {
        "description": " Verification of Name text  is present  |Verify Contact US link| Verifying Home Page ",
        "passed": false,
        "pending": true,
        "os": "Windows",
        "instanceId": 11312,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Temporarily disabled with xit",
        "browserLogs": [],
        "screenShotFile": "00de00c9-00f6-0082-0079-0009005100a4.png",
        "timestamp": 1578407984117,
        "duration": 0
    },
    {
        "description": " Verification Email text is present|Verify Contact US link| Verifying Home Page ",
        "passed": false,
        "pending": true,
        "os": "Windows",
        "instanceId": 11312,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Temporarily disabled with xit",
        "browserLogs": [],
        "screenShotFile": "00b80091-0015-0072-000e-00990066008b.png",
        "timestamp": 1578407984157,
        "duration": 0
    },
    {
        "description": "Verification Contact  Number text is present|Verify Contact US link| Verifying Home Page ",
        "passed": false,
        "pending": true,
        "os": "Windows",
        "instanceId": 11312,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Temporarily disabled with xit",
        "browserLogs": [],
        "screenShotFile": "0091009b-0066-0029-0077-00f0004a00bb.png",
        "timestamp": 1578407984187,
        "duration": 0
    },
    {
        "description": " Verification Message text is present|Verify Contact US link| Verifying Home Page ",
        "passed": false,
        "pending": true,
        "os": "Windows",
        "instanceId": 11312,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Temporarily disabled with xit",
        "browserLogs": [],
        "screenShotFile": "000500e9-00ee-00c2-0052-00a400d4001e.png",
        "timestamp": 1578407984214,
        "duration": 0
    },
    {
        "description": "Verify Submit button presence  |Verify Contact US link| Verifying Home Page ",
        "passed": false,
        "pending": true,
        "os": "Windows",
        "instanceId": 11312,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Temporarily disabled with xit",
        "browserLogs": [],
        "screenShotFile": "00a30067-0020-00d8-0064-002000d000c5.png",
        "timestamp": 1578407984242,
        "duration": 0
    },
    {
        "description": "Verify Cancell Button presence |Verify Contact US link| Verifying Home Page ",
        "passed": false,
        "pending": true,
        "os": "Windows",
        "instanceId": 11312,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Temporarily disabled with xit",
        "browserLogs": [],
        "screenShotFile": "009100c3-0083-0026-009b-008700940020.png",
        "timestamp": 1578407984269,
        "duration": 0
    },
    {
        "description": "Navigating back and refresh the browser|Verify Contact US link| Verifying Home Page ",
        "passed": false,
        "pending": true,
        "os": "Windows",
        "instanceId": 11312,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Temporarily disabled with xit",
        "browserLogs": [],
        "screenShotFile": "00e70073-0011-00d4-0058-001b000a0048.png",
        "timestamp": 1578407984296,
        "duration": 0
    },
    {
        "description": "verify FAQ link | Verify FAQ| Verifying Home Page ",
        "passed": false,
        "pending": true,
        "os": "Windows",
        "instanceId": 11312,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Pending",
        "browserLogs": [],
        "screenShotFile": "000b00ff-00c5-00e4-00d2-005b004e0077.png",
        "timestamp": 1578407984322,
        "duration": 0
    },
    {
        "description": "Navigating back and refresh the browser| Verify FAQ| Verifying Home Page ",
        "passed": false,
        "pending": true,
        "os": "Windows",
        "instanceId": 11312,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Temporarily disabled with xit",
        "browserLogs": [],
        "screenShotFile": "008000e2-00d5-004a-0076-000b00240046.png",
        "timestamp": 1578407984346,
        "duration": 1
    },
    {
        "description": "Verify Copyright at the Footer| Vevrify Copyright Text| Verifying Home Page ",
        "passed": false,
        "pending": false,
        "os": "Windows",
        "instanceId": 11312,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": [
            "Failed: No element found using locator: By(xpath, //small[contains(text(),'© 2019 ARCHWAY MARKETING SERVICES')])"
        ],
        "trace": [
            "NoSuchElementError: No element found using locator: By(xpath, //small[contains(text(),'© 2019 ARCHWAY MARKETING SERVICES')])\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:814:27\n    at ManagedPromise.invokeCallback_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\n    at processTicksAndRejections (internal/process/task_queues.js:93:5)Error\n    at ElementArrayFinder.applyAction_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:459:27)\n    at ElementArrayFinder.<computed> [as getText] (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:91:29)\n    at ElementFinder.<computed> [as getText] (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:831:22)\n    at UserContext.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars\\specs\\HomePage\\HomePage_spec.js:774:17)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\nFrom: Task: Run it(\"Verify Copyright at the Footer\") in control flow\n    at UserContext.<anonymous> (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:94:19)\n    at attempt (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4297:26)\n    at QueueRunner.run (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4217:20)\n    at runNext (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4257:20)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4264:13\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4172:9\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:64:48\n    at ControlFlow.emit (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\events.js:62:21)\n    at ControlFlow.shutdown_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2674:10)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2599:53\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars\\specs\\HomePage\\HomePage_spec.js:769:3)\n    at addSpecsToSuite (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Suite.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars\\specs\\HomePage\\HomePage_spec.js:767:2)\n    at addSpecsToSuite (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars\\specs\\HomePage\\HomePage_spec.js:14:1)"
        ],
        "browserLogs": [],
        "screenShotFile": "009e00e2-00db-007f-0073-0004005b00b5.png",
        "timestamp": 1578407984371,
        "duration": 23
    },
    {
        "description": "Verify UserCircle|Verify UserMenu| Verifying Home Page ",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 11312,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00d100e6-0088-00b3-0003-006700f500ef.png",
        "timestamp": 1578407984787,
        "duration": 5212
    },
    {
        "description": "Verify presence of User profile|Verify UserMenu| Verifying Home Page ",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 11312,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "0093002e-00c8-00db-008f-00480073009f.png",
        "timestamp": 1578407990631,
        "duration": 91
    },
    {
        "description": "Verify presence of user address|Verify UserMenu| Verifying Home Page ",
        "passed": false,
        "pending": true,
        "os": "Windows",
        "instanceId": 11312,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Temporarily disabled with xit",
        "browserLogs": [],
        "screenShotFile": "00940028-00ed-002d-0018-007b00d5001b.png",
        "timestamp": 1578407991526,
        "duration": 0
    },
    {
        "description": "Verify User Logout Option|Verify UserMenu| Verifying Home Page ",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 11312,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00610007-0015-0062-006a-006e004600f6.png",
        "timestamp": 1578407991595,
        "duration": 3123
    },
    {
        "description": "Quick Add : Enter product and quantity successfully|Add Item to cart by  Quick Add and verify contents present on page ",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 11312,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed",
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "https://archway-forduaw-qa.azurewebsites.net/products?pageSize=15&sortBy=ID - [DOM] Found 15 elements with non-unique id #quantity: (More info: https://goo.gl/9p2vKq) %o %o %o %o %o %o %o %o %o %o %o %o %o %o %o",
                "timestamp": 1578408007384,
                "type": ""
            }
        ],
        "screenShotFile": "00680047-002c-00ee-0066-007600ec005c.png",
        "timestamp": 1578407995212,
        "duration": 12167
    },
    {
        "description": "should pan plots when you click and drag|Add Item to cart by  Quick Add and verify contents present on page ",
        "passed": false,
        "pending": true,
        "os": "Windows",
        "instanceId": 11312,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Temporarily disabled with xit",
        "browserLogs": [],
        "screenShotFile": "00700089-0005-00c4-00a2-00c600c20014.png",
        "timestamp": 1578408007801,
        "duration": 0
    },
    {
        "description": "verify Sort option is present on Add To Cart screen |Add Item to cart by  Quick Add and verify contents present on page ",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 11312,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "https://archway-forduaw-qa.azurewebsites.net/products?pageSize=15&sortBy=ID - [DOM] Found 15 elements with non-unique id #quantity: (More info: https://goo.gl/9p2vKq) %o %o %o %o %o %o %o %o %o %o %o %o %o %o %o",
                "timestamp": 1578408007838,
                "type": ""
            }
        ],
        "screenShotFile": "00cf00b8-0068-006f-0099-00f400a20034.png",
        "timestamp": 1578408007834,
        "duration": 261
    },
    {
        "description": "verify Refine By text on Add To Cart screen|Add Item to cart by  Quick Add and verify contents present on page ",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 11312,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "https://archway-forduaw-qa.azurewebsites.net/products?pageSize=15&sortBy=ID - [DOM] Found 15 elements with non-unique id #quantity: (More info: https://goo.gl/9p2vKq) %o %o %o %o %o %o %o %o %o %o %o %o %o %o %o",
                "timestamp": 1578408008202,
                "type": ""
            }
        ],
        "screenShotFile": "00a30074-0069-0084-002b-009d00ae0091.png",
        "timestamp": 1578408008481,
        "duration": 123
    },
    {
        "description": "verify My Favorites link|Add Item to cart by  Quick Add and verify contents present on page ",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 11312,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00000000-00d3-005a-0022-00fc00cc00dc.png",
        "timestamp": 1578408009037,
        "duration": 136
    },
    {
        "description": "Verify Quick Add Header label text|Add Item to cart by  Quick Add and verify contents present on page ",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 11312,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "001e0088-009d-005e-008f-0027001d0000.png",
        "timestamp": 1578408009586,
        "duration": 77
    },
    {
        "description": "Verify lable of item |Add Item to cart by  Quick Add and verify contents present on page ",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 11312,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "003c00bb-00ba-0058-00ce-007000ee00f0.png",
        "timestamp": 1578408010135,
        "duration": 95
    },
    {
        "description": "Verify lable of qty |Add Item to cart by  Quick Add and verify contents present on page ",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 11312,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00e80056-00be-00ee-0044-005000ae0072.png",
        "timestamp": 1578408010671,
        "duration": 69
    },
    {
        "description": "TC_004:Verify Add to Cart button is present on the page|Add Item to cart by  Quick Add and verify contents present on page ",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 11312,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "004500d4-00a3-0004-003c-003800040079.png",
        "timestamp": 1578408011145,
        "duration": 33
    },
    {
        "description": "Verify Add item and Quantity and click on checkout|Add Item to cart by  Quick Add and verify contents present on page ",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 11312,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed",
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "https://archway-forduaw-qa.azurewebsites.net/main.8135115ee1375ec49609.js 0 /deep/ combinator is no longer supported in CSS dynamic profile. It is now effectively no-op, acting as if it were a descendant combinator. /deep/ combinator will be removed, and will be invalid at M65. You should remove it. See https://www.chromestatus.com/features/4964279606312960 for more details.",
                "timestamp": 1578408040231,
                "type": ""
            }
        ],
        "screenShotFile": "00a80099-00b5-008d-002d-003700a2009f.png",
        "timestamp": 1578408011562,
        "duration": 28876
    },
    {
        "description": "checkout case for One time Address|CheckOut Verfication",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 11312,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed",
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "https://archway-forduaw-qa.azurewebsites.net/main.8135115ee1375ec49609.js 0:1503642 \"\\n      It looks like you're using the disabled attribute with a reactive form directive. If you set disabled to true\\n      when you set up this control in your component class, the disabled attribute will actually be set in the DOM for\\n      you. We recommend using this approach to avoid 'changed after checked' errors.\\n       \\n      Example: \\n      form = new FormGroup({\\n        first: new FormControl({value: 'Nancy', disabled: true}, Validators.required),\\n        last: new FormControl('Drew', Validators.required)\\n      });\\n    \"",
                "timestamp": 1578408043101,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://archway-forduaw-qa.azurewebsites.net/main.8135115ee1375ec49609.js 0:1503642 \"\\n      It looks like you're using the disabled attribute with a reactive form directive. If you set disabled to true\\n      when you set up this control in your component class, the disabled attribute will actually be set in the DOM for\\n      you. We recommend using this approach to avoid 'changed after checked' errors.\\n       \\n      Example: \\n      form = new FormGroup({\\n        first: new FormControl({value: 'Nancy', disabled: true}, Validators.required),\\n        last: new FormControl('Drew', Validators.required)\\n      });\\n    \"",
                "timestamp": 1578408043141,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://archway-forduaw-qa.azurewebsites.net/checkout - [DOM] Found 2 elements with non-unique id #search-addon: (More info: https://goo.gl/9p2vKq) %o %o",
                "timestamp": 1578408048216,
                "type": ""
            }
        ],
        "screenShotFile": "008b0080-00bb-00e2-0059-00b000390080.png",
        "timestamp": 1578408040866,
        "duration": 7344
    },
    {
        "description": "checkout process|CheckOut Verfication",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 11312,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "005a0046-00f7-00b9-00f6-00af00450041.png",
        "timestamp": 1578408048580,
        "duration": 17431
    },
    {
        "description": "Verify order has submitted|CheckOut Verfication",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 11312,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "0089007a-005d-00b7-00e2-00d800f30081.png",
        "timestamp": 1578408066399,
        "duration": 56
    },
    {
        "description": "Verify submited order Number |CheckOut Verfication",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 11312,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "0030002f-0094-00c6-0064-00e900b40092.png",
        "timestamp": 1578408066848,
        "duration": 53
    },
    {
        "description": "Shipping Method Text is present when order is confirmed|CheckOut Verfication",
        "passed": false,
        "pending": true,
        "os": "Windows",
        "instanceId": 11312,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Temporarily disabled with xit",
        "browserLogs": [],
        "screenShotFile": "009d008f-003d-0097-00f5-001800c800e9.png",
        "timestamp": 1578408067274,
        "duration": 0
    },
    {
        "description": " vrify Shipping Method  is same that user has selected while palcing the order|CheckOut Verfication",
        "passed": false,
        "pending": true,
        "os": "Windows",
        "instanceId": 11312,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Temporarily disabled with xit",
        "browserLogs": [],
        "screenShotFile": "0030006a-0045-00b5-00d7-008f00a10099.png",
        "timestamp": 1578408067300,
        "duration": 0
    },
    {
        "description": "Subtotal Text is present when order is confirmed|CheckOut Verfication",
        "passed": false,
        "pending": true,
        "os": "Windows",
        "instanceId": 11312,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Temporarily disabled with xit",
        "browserLogs": [],
        "screenShotFile": "00f30090-0067-0065-001d-00ec00a90097.png",
        "timestamp": 1578408067344,
        "duration": 0
    },
    {
        "description": " verify Subtotal value is correct|CheckOut Verfication",
        "passed": false,
        "pending": true,
        "os": "Windows",
        "instanceId": 11312,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Temporarily disabled with xit",
        "browserLogs": [],
        "screenShotFile": "008900e2-0088-002d-0073-00460029007c.png",
        "timestamp": 1578408067375,
        "duration": 0
    },
    {
        "description": " verify print option|CheckOut Verfication",
        "passed": false,
        "pending": true,
        "os": "Windows",
        "instanceId": 11312,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Temporarily disabled with xit",
        "browserLogs": [],
        "screenShotFile": "0034002f-000c-00b3-0018-00a000740077.png",
        "timestamp": 1578408067404,
        "duration": 0
    },
    {
        "description": "User should log out successfully from application|Log out ",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 11312,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "0012000c-0083-0098-00b7-00aa00a50001.png",
        "timestamp": 1578408067429,
        "duration": 10268
    },
    {
        "description": "verify successfull Logout|Log out ",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 11312,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00240066-0041-0003-00d8-0004001000fb.png",
        "timestamp": 1578408078107,
        "duration": 30
    },
    {
        "description": "should login the user|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 8356,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "00810026-00c4-0044-0023-00b3004f0067.png",
        "timestamp": 1578408165073,
        "duration": 14879
    },
    {
        "description": "Forgot password link present on the Login page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 8356,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "002b001e-0085-0023-007f-0050008900c9.png",
        "timestamp": 1578408180383,
        "duration": 66
    },
    {
        "description": "Create Account link present on the Login page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 8356,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "000b0002-0081-003f-00e4-003500960034.png",
        "timestamp": 1578408180834,
        "duration": 53
    },
    {
        "description": "Contact Us  link present on the Login Page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 8356,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00ea0035-009f-00ae-00f3-004f00c0004e.png",
        "timestamp": 1578408181267,
        "duration": 36
    },
    {
        "description": "Verify comapny copyright text at the footer of the login page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 8356,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "008f0067-0082-0027-00d8-00a400ac009e.png",
        "timestamp": 1578408181668,
        "duration": 20
    },
    {
        "description": "Verify Username labeling is preseet|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 8356,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00be0096-00a1-0024-0012-003200f000fd.png",
        "timestamp": 1578408182051,
        "duration": 3
    },
    {
        "description": "Verify password label is present|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 8356,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "002c0042-0099-0021-00a8-00fc00750004.png",
        "timestamp": 1578408182400,
        "duration": 4
    },
    {
        "description": "Verify Remember Me check box|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 8356,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00b400d3-003c-0066-0078-00470038002c.png",
        "timestamp": 1578408182793,
        "duration": 37
    },
    {
        "description": "verify the title of the Page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 8356,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00df003a-002c-0039-00a6-006200ed008e.png",
        "timestamp": 1578408183195,
        "duration": 11
    },
    {
        "description": "veriy all links present on page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 8356,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "00790058-00bd-0003-0098-008e00ca00b1.png",
        "timestamp": 1578408183542,
        "duration": 42
    },
    {
        "description": "User Login successfully |Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 8356,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00980011-0048-00ec-00eb-00c300d300d7.png",
        "timestamp": 1578408183972,
        "duration": 19602
    },
    {
        "description": "should find all links on Home Page| Verifying Home Page ",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 8356,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "008800a6-00f5-0029-000d-007000070090.png",
        "timestamp": 1578408203950,
        "duration": 2376
    },
    {
        "description": "Verify Presence of Logo| Verifying Home Page ",
        "passed": false,
        "pending": true,
        "os": "Windows",
        "instanceId": 8356,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Temporarily disabled with xit",
        "browserLogs": [],
        "screenShotFile": "006100b2-006c-0050-0094-004200510048.png",
        "timestamp": 1578408206699,
        "duration": 0
    },
    {
        "description": "Verify URL of the Home page once user is logged successfully | Verifying Home Page ",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 8356,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00c60074-0013-002b-0042-000200a80029.png",
        "timestamp": 1578408206731,
        "duration": 12
    },
    {
        "description": "Verify Home icon is present on the Landing/Home page after Login| Verifying Home Page ",
        "passed": false,
        "pending": true,
        "os": "Windows",
        "instanceId": 8356,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Temporarily disabled with xit",
        "browserLogs": [],
        "screenShotFile": "0079001a-00a8-0076-0021-0036002600f5.png",
        "timestamp": 1578408207107,
        "duration": 0
    },
    {
        "description": "Verify BrowseProduct icon is present on the Landing/Home page after Login| Verifying Home Page ",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 8356,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "007000a3-0046-00c1-00a6-007500d40079.png",
        "timestamp": 1578408207136,
        "duration": 131
    },
    {
        "description": "Verify MyOrders icon is present on the Landing/Home page after Login| Verifying Home Page ",
        "passed": false,
        "pending": true,
        "os": "Windows",
        "instanceId": 8356,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Temporarily disabled with xit",
        "browserLogs": [],
        "screenShotFile": "00f8006f-0059-0028-0008-0054004c008c.png",
        "timestamp": 1578408207677,
        "duration": 0
    },
    {
        "description": "Verify Report icon is present on the Landing/Home page after Login| Verifying Home Page ",
        "passed": false,
        "pending": false,
        "os": "Windows",
        "instanceId": 8356,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": [
            "Expected 'REPORTS' to contain ''REPORTS'."
        ],
        "trace": [
            "Error: Failed expectation\n    at C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars\\specs\\HomePage\\HomePage_spec.js:148:21\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:804:32\n    at ManagedPromise.invokeCallback_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\n    at processTicksAndRejections (internal/process/task_queues.js:93:5)"
        ],
        "browserLogs": [],
        "screenShotFile": "00cd0062-0029-00c8-00b8-0054003f00a3.png",
        "timestamp": 1578408207717,
        "duration": 124
    },
    {
        "description": "Verify for Featured Products on Home Page|Verify Featured Products Text is present on Home Page | Verifying Home Page ",
        "passed": false,
        "pending": true,
        "os": "Windows",
        "instanceId": 8356,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Pending",
        "browserLogs": [],
        "screenShotFile": "00310038-001d-000d-00c1-007900470010.png",
        "timestamp": 1578408208242,
        "duration": 0
    },
    {
        "description": "user see about website section|Verify About website section/text is present| Verifying Home Page ",
        "passed": false,
        "pending": true,
        "os": "Windows",
        "instanceId": 8356,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Pending",
        "browserLogs": [],
        "screenShotFile": "00a8008e-0057-00ba-00e4-0097008b0025.png",
        "timestamp": 1578408208271,
        "duration": 0
    },
    {
        "description": "Verification About website contents|Verify About website section/text is present| Verifying Home Page ",
        "passed": false,
        "pending": true,
        "os": "Windows",
        "instanceId": 8356,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Temporarily disabled with xit",
        "browserLogs": [],
        "screenShotFile": "009b0007-00cd-003b-00a0-0037005600a2.png",
        "timestamp": 1578408208300,
        "duration": 0
    },
    {
        "description": "Verify Order History text is present on the Landing/Home page after Login| Verify Order History Text| Verifying Home Page ",
        "passed": false,
        "pending": true,
        "os": "Windows",
        "instanceId": 8356,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Pending",
        "browserLogs": [],
        "screenShotFile": "003800aa-004f-00d2-004e-00aa007a0057.png",
        "timestamp": 1578408208327,
        "duration": 0
    },
    {
        "description": "Verify  Order Summary text is present on the Landing/Home page after Login| Verify Order History Text| Verifying Home Page ",
        "passed": false,
        "pending": true,
        "os": "Windows",
        "instanceId": 8356,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Pending",
        "browserLogs": [],
        "screenShotFile": "001100bb-0087-000e-00ba-003500de00cc.png",
        "timestamp": 1578408208354,
        "duration": 0
    },
    {
        "description": "Verify the contents of order history link| Verify Order History Text| Verifying Home Page ",
        "passed": false,
        "pending": true,
        "os": "Windows",
        "instanceId": 8356,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Pending",
        "browserLogs": [],
        "screenShotFile": "00a700da-00e6-001e-00bf-007200a6002a.png",
        "timestamp": 1578408208381,
        "duration": 0
    },
    {
        "description": "Verify Order date text is present| Verify Order History Text| Verifying Home Page ",
        "passed": false,
        "pending": true,
        "os": "Windows",
        "instanceId": 8356,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Pending",
        "browserLogs": [],
        "screenShotFile": "002500eb-00f6-00d6-00e1-00bb00ec005d.png",
        "timestamp": 1578408208410,
        "duration": 0
    },
    {
        "description": "Verify Order Status text is present| Verify Order History Text| Verifying Home Page ",
        "passed": false,
        "pending": true,
        "os": "Windows",
        "instanceId": 8356,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Pending",
        "browserLogs": [],
        "screenShotFile": "003000cc-004d-007d-0039-00b400d90039.png",
        "timestamp": 1578408208440,
        "duration": 0
    },
    {
        "description": "Verify Status Date text is present| Verify Order History Text| Verifying Home Page ",
        "passed": false,
        "pending": true,
        "os": "Windows",
        "instanceId": 8356,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Pending",
        "browserLogs": [],
        "screenShotFile": "0035003d-00ba-007a-00ee-00d20067005d.png",
        "timestamp": 1578408208466,
        "duration": 1
    },
    {
        "description": "Verify Total Items text is present| Verify Order History Text| Verifying Home Page ",
        "passed": false,
        "pending": true,
        "os": "Windows",
        "instanceId": 8356,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Pending",
        "browserLogs": [],
        "screenShotFile": "00e900b9-006c-00b9-0005-0038009800fc.png",
        "timestamp": 1578408208495,
        "duration": 0
    },
    {
        "description": "Verify Total Cost text is present| Verify Order History Text| Verifying Home Page ",
        "passed": false,
        "pending": true,
        "os": "Windows",
        "instanceId": 8356,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Pending",
        "browserLogs": [],
        "screenShotFile": "00a70060-0067-0022-0038-0087003700f9.png",
        "timestamp": 1578408208543,
        "duration": 0
    },
    {
        "description": "Verify Conact US links exist exist in footer|Verify Contact US link| Verifying Home Page ",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 8356,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "004f00ab-0021-00b9-00f3-004a002900a4.png",
        "timestamp": 1578408208570,
        "duration": 82
    },
    {
        "description": " Verification of Name text  is present  |Verify Contact US link| Verifying Home Page ",
        "passed": false,
        "pending": true,
        "os": "Windows",
        "instanceId": 8356,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Temporarily disabled with xit",
        "browserLogs": [],
        "screenShotFile": "00510093-00f2-007d-008e-002f000100af.png",
        "timestamp": 1578408209019,
        "duration": 0
    },
    {
        "description": " Verification Email text is present|Verify Contact US link| Verifying Home Page ",
        "passed": false,
        "pending": true,
        "os": "Windows",
        "instanceId": 8356,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Temporarily disabled with xit",
        "browserLogs": [],
        "screenShotFile": "00230089-0055-0099-0009-00e700e6004b.png",
        "timestamp": 1578408209049,
        "duration": 0
    },
    {
        "description": "Verification Contact  Number text is present|Verify Contact US link| Verifying Home Page ",
        "passed": false,
        "pending": true,
        "os": "Windows",
        "instanceId": 8356,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Temporarily disabled with xit",
        "browserLogs": [],
        "screenShotFile": "00560053-0029-0094-00b3-00f600200095.png",
        "timestamp": 1578408209080,
        "duration": 0
    },
    {
        "description": " Verification Message text is present|Verify Contact US link| Verifying Home Page ",
        "passed": false,
        "pending": true,
        "os": "Windows",
        "instanceId": 8356,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Temporarily disabled with xit",
        "browserLogs": [],
        "screenShotFile": "00c800a3-00b2-00f6-00df-0032004f00f0.png",
        "timestamp": 1578408209109,
        "duration": 0
    },
    {
        "description": "Verify Submit button presence  |Verify Contact US link| Verifying Home Page ",
        "passed": false,
        "pending": true,
        "os": "Windows",
        "instanceId": 8356,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Temporarily disabled with xit",
        "browserLogs": [],
        "screenShotFile": "00e6000c-00d7-002d-0019-001800bc008a.png",
        "timestamp": 1578408209142,
        "duration": 0
    },
    {
        "description": "Verify Cancell Button presence |Verify Contact US link| Verifying Home Page ",
        "passed": false,
        "pending": true,
        "os": "Windows",
        "instanceId": 8356,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Temporarily disabled with xit",
        "browserLogs": [],
        "screenShotFile": "00b40005-00a2-0088-00c6-006900d1001d.png",
        "timestamp": 1578408209170,
        "duration": 1
    },
    {
        "description": "Navigating back and refresh the browser|Verify Contact US link| Verifying Home Page ",
        "passed": false,
        "pending": true,
        "os": "Windows",
        "instanceId": 8356,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Temporarily disabled with xit",
        "browserLogs": [],
        "screenShotFile": "009b0021-0088-00f7-004d-00b000850053.png",
        "timestamp": 1578408209202,
        "duration": 0
    },
    {
        "description": "verify FAQ link | Verify FAQ| Verifying Home Page ",
        "passed": false,
        "pending": true,
        "os": "Windows",
        "instanceId": 8356,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Pending",
        "browserLogs": [],
        "screenShotFile": "00f30017-0019-00b3-00af-000200ba00d1.png",
        "timestamp": 1578408209232,
        "duration": 0
    },
    {
        "description": "Navigating back and refresh the browser| Verify FAQ| Verifying Home Page ",
        "passed": false,
        "pending": true,
        "os": "Windows",
        "instanceId": 8356,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Temporarily disabled with xit",
        "browserLogs": [],
        "screenShotFile": "004d001c-00a6-008f-00c8-00a700bc001d.png",
        "timestamp": 1578408209259,
        "duration": 0
    },
    {
        "description": "Verify Copyright at the Footer| Vevrify Copyright Text| Verifying Home Page ",
        "passed": false,
        "pending": false,
        "os": "Windows",
        "instanceId": 8356,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": [
            "Failed: No element found using locator: By(xpath, //small[contains(text(),'© 2019 ARCHWAY MARKETING SERVICES')])"
        ],
        "trace": [
            "NoSuchElementError: No element found using locator: By(xpath, //small[contains(text(),'© 2019 ARCHWAY MARKETING SERVICES')])\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:814:27\n    at ManagedPromise.invokeCallback_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\n    at processTicksAndRejections (internal/process/task_queues.js:93:5)Error\n    at ElementArrayFinder.applyAction_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:459:27)\n    at ElementArrayFinder.<computed> [as getText] (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:91:29)\n    at ElementFinder.<computed> [as getText] (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:831:22)\n    at UserContext.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars\\specs\\HomePage\\HomePage_spec.js:774:17)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\nFrom: Task: Run it(\"Verify Copyright at the Footer\") in control flow\n    at UserContext.<anonymous> (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:94:19)\n    at attempt (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4297:26)\n    at QueueRunner.run (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4217:20)\n    at runNext (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4257:20)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4264:13\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4172:9\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:64:48\n    at ControlFlow.emit (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\events.js:62:21)\n    at ControlFlow.shutdown_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2674:10)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2599:53\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars\\specs\\HomePage\\HomePage_spec.js:769:3)\n    at addSpecsToSuite (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Suite.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars\\specs\\HomePage\\HomePage_spec.js:767:2)\n    at addSpecsToSuite (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars\\specs\\HomePage\\HomePage_spec.js:14:1)"
        ],
        "browserLogs": [],
        "screenShotFile": "006c009b-0011-0032-00b4-00ca00dc007a.png",
        "timestamp": 1578408209309,
        "duration": 23
    },
    {
        "description": "Verify UserCircle|Verify UserMenu| Verifying Home Page ",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 8356,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "003a00c2-0096-00c5-00c1-0045003b00bc.png",
        "timestamp": 1578408209717,
        "duration": 5166
    },
    {
        "description": "Verify presence of User profile|Verify UserMenu| Verifying Home Page ",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 8356,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "000500ac-00a7-003b-000a-008b003c002a.png",
        "timestamp": 1578408215482,
        "duration": 75
    },
    {
        "description": "Verify presence of user address|Verify UserMenu| Verifying Home Page ",
        "passed": false,
        "pending": true,
        "os": "Windows",
        "instanceId": 8356,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Temporarily disabled with xit",
        "browserLogs": [],
        "screenShotFile": "005f0001-004a-00f3-0087-0093003a0079.png",
        "timestamp": 1578408216130,
        "duration": 0
    },
    {
        "description": "Verify User Logout Option|Verify UserMenu| Verifying Home Page ",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 8356,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00e60059-0075-0053-008f-003d00d800b7.png",
        "timestamp": 1578408216157,
        "duration": 3070
    },
    {
        "description": "Quick Add : Enter product and quantity successfully|Add Item to cart by  Quick Add and verify contents present on page ",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 8356,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "00b0004d-0048-007b-00e8-008800f2008e.png",
        "timestamp": 1578408219794,
        "duration": 12177
    },
    {
        "description": "should pan plots when you click and drag|Add Item to cart by  Quick Add and verify contents present on page ",
        "passed": false,
        "pending": true,
        "os": "Windows",
        "instanceId": 8356,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Temporarily disabled with xit",
        "browserLogs": [],
        "screenShotFile": "00bf007c-0016-002e-00a9-0027004a00e3.png",
        "timestamp": 1578408232339,
        "duration": 0
    },
    {
        "description": "verify Sort option is present on Add To Cart screen |Add Item to cart by  Quick Add and verify contents present on page ",
        "passed": false,
        "pending": false,
        "os": "Windows",
        "instanceId": 8356,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": [
            "Failed: No element found using locator: By(xpath, //label[@class='pt-1 pr-1 d-none d-md-block'][contains(text(),'Sort By')])"
        ],
        "trace": [
            "NoSuchElementError: No element found using locator: By(xpath, //label[@class='pt-1 pr-1 d-none d-md-block'][contains(text(),'Sort By')])\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:814:27\n    at ManagedPromise.invokeCallback_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\n    at runMicrotasks (<anonymous>)\n    at processTicksAndRejections (internal/process/task_queues.js:93:5)Error\n    at ElementArrayFinder.applyAction_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:459:27)\n    at ElementArrayFinder.<computed> [as isDisplayed] (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:91:29)\n    at ElementFinder.<computed> [as isDisplayed] (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:831:22)\n    at UserContext.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars\\specs\\AddItem\\AddItem_quickadd_spec.js:77:21)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\nFrom: Task: Run it(\"verify Sort option is present on Add To Cart screen \") in control flow\n    at UserContext.<anonymous> (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:94:19)\n    at attempt (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4297:26)\n    at QueueRunner.run (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4217:20)\n    at runNext (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4257:20)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4264:13\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4172:9\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:64:48\n    at ControlFlow.emit (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\events.js:62:21)\n    at ControlFlow.shutdown_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2674:10)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2599:53\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars\\specs\\AddItem\\AddItem_quickadd_spec.js:72:3)\n    at addSpecsToSuite (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars\\specs\\AddItem\\AddItem_quickadd_spec.js:16:1)\n    at Module._compile (internal/modules/cjs/loader.js:956:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:973:10)\n    at Module.load (internal/modules/cjs/loader.js:812:32)\n    at Function.Module._load (internal/modules/cjs/loader.js:724:14)"
        ],
        "browserLogs": [],
        "screenShotFile": "00f300a9-00f3-008f-001f-001d00d60050.png",
        "timestamp": 1578408232376,
        "duration": 29
    },
    {
        "description": "verify Refine By text on Add To Cart screen|Add Item to cart by  Quick Add and verify contents present on page ",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 8356,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "https://archway-forduaw-qa.azurewebsites.net/products?pageSize=15&sortBy=ID - [DOM] Found 15 elements with non-unique id #quantity: (More info: https://goo.gl/9p2vKq) %o %o %o %o %o %o %o %o %o %o %o %o %o %o %o",
                "timestamp": 1578408233228,
                "type": ""
            }
        ],
        "screenShotFile": "0007004b-0039-0015-00e2-002700c30030.png",
        "timestamp": 1578408232790,
        "duration": 757
    },
    {
        "description": "verify My Favorites link|Add Item to cart by  Quick Add and verify contents present on page ",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 8356,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "https://archway-forduaw-qa.azurewebsites.net/products?pageSize=15&sortBy=ID - [DOM] Found 15 elements with non-unique id #quantity: (More info: https://goo.gl/9p2vKq) %o %o %o %o %o %o %o %o %o %o %o %o %o %o %o",
                "timestamp": 1578408234110,
                "type": ""
            }
        ],
        "screenShotFile": "00330019-0085-00c4-0078-00a8001d008a.png",
        "timestamp": 1578408233975,
        "duration": 328
    },
    {
        "description": "Verify Quick Add Header label text|Add Item to cart by  Quick Add and verify contents present on page ",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 8356,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00a8004e-00c9-0074-0074-001c00e80095.png",
        "timestamp": 1578408234802,
        "duration": 94
    },
    {
        "description": "Verify lable of item |Add Item to cart by  Quick Add and verify contents present on page ",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 8356,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00380005-00b3-007b-0066-006e006000be.png",
        "timestamp": 1578408235311,
        "duration": 74
    },
    {
        "description": "Verify lable of qty |Add Item to cart by  Quick Add and verify contents present on page ",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 8356,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "0099002b-00f6-006d-00e1-00ac00ba0062.png",
        "timestamp": 1578408235772,
        "duration": 79
    },
    {
        "description": "TC_004:Verify Add to Cart button is present on the page|Add Item to cart by  Quick Add and verify contents present on page ",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 8356,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00290089-001d-0082-00c9-007b00d10021.png",
        "timestamp": 1578408236253,
        "duration": 38
    },
    {
        "description": "Verify Add item and Quantity and click on checkout|Add Item to cart by  Quick Add and verify contents present on page ",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 8356,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed",
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "https://archway-forduaw-qa.azurewebsites.net/main.8135115ee1375ec49609.js 0 /deep/ combinator is no longer supported in CSS dynamic profile. It is now effectively no-op, acting as if it were a descendant combinator. /deep/ combinator will be removed, and will be invalid at M65. You should remove it. See https://www.chromestatus.com/features/4964279606312960 for more details.",
                "timestamp": 1578408263252,
                "type": ""
            }
        ],
        "screenShotFile": "00bf0051-0088-00cf-00b5-00c600a700a0.png",
        "timestamp": 1578408236691,
        "duration": 28774
    },
    {
        "description": "checkout case for One time Address|CheckOut Verfication",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 8356,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed",
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "https://archway-forduaw-qa.azurewebsites.net/main.8135115ee1375ec49609.js 0:1503642 \"\\n      It looks like you're using the disabled attribute with a reactive form directive. If you set disabled to true\\n      when you set up this control in your component class, the disabled attribute will actually be set in the DOM for\\n      you. We recommend using this approach to avoid 'changed after checked' errors.\\n       \\n      Example: \\n      form = new FormGroup({\\n        first: new FormControl({value: 'Nancy', disabled: true}, Validators.required),\\n        last: new FormControl('Drew', Validators.required)\\n      });\\n    \"",
                "timestamp": 1578408268079,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://archway-forduaw-qa.azurewebsites.net/main.8135115ee1375ec49609.js 0:1503642 \"\\n      It looks like you're using the disabled attribute with a reactive form directive. If you set disabled to true\\n      when you set up this control in your component class, the disabled attribute will actually be set in the DOM for\\n      you. We recommend using this approach to avoid 'changed after checked' errors.\\n       \\n      Example: \\n      form = new FormGroup({\\n        first: new FormControl({value: 'Nancy', disabled: true}, Validators.required),\\n        last: new FormControl('Drew', Validators.required)\\n      });\\n    \"",
                "timestamp": 1578408268116,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://archway-forduaw-qa.azurewebsites.net/checkout - [DOM] Found 2 elements with non-unique id #search-addon: (More info: https://goo.gl/9p2vKq) %o %o",
                "timestamp": 1578408273169,
                "type": ""
            }
        ],
        "screenShotFile": "00ad0066-0030-0028-00ba-007f00670044.png",
        "timestamp": 1578408265884,
        "duration": 7278
    },
    {
        "description": "checkout process|CheckOut Verfication",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 8356,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "00750066-00b9-001f-00a4-0063001200e2.png",
        "timestamp": 1578408273536,
        "duration": 17325
    },
    {
        "description": "Verify order has submitted|CheckOut Verfication",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 8356,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00fd00b8-0077-0071-0061-0041002f00ca.png",
        "timestamp": 1578408291261,
        "duration": 48
    },
    {
        "description": "Verify submited order Number |CheckOut Verfication",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 8356,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "006d0047-004b-0095-003a-002000d60037.png",
        "timestamp": 1578408291691,
        "duration": 49
    },
    {
        "description": "Shipping Method Text is present when order is confirmed|CheckOut Verfication",
        "passed": false,
        "pending": true,
        "os": "Windows",
        "instanceId": 8356,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Temporarily disabled with xit",
        "browserLogs": [],
        "screenShotFile": "00d3001c-00d6-0078-007c-008000c800f3.png",
        "timestamp": 1578408292117,
        "duration": 0
    },
    {
        "description": " vrify Shipping Method  is same that user has selected while palcing the order|CheckOut Verfication",
        "passed": false,
        "pending": true,
        "os": "Windows",
        "instanceId": 8356,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Temporarily disabled with xit",
        "browserLogs": [],
        "screenShotFile": "00c50062-000e-00c3-008b-00b500f700c4.png",
        "timestamp": 1578408292148,
        "duration": 0
    },
    {
        "description": "Subtotal Text is present when order is confirmed|CheckOut Verfication",
        "passed": false,
        "pending": true,
        "os": "Windows",
        "instanceId": 8356,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Temporarily disabled with xit",
        "browserLogs": [],
        "screenShotFile": "00ff00bb-0045-0074-0065-004700bc00d6.png",
        "timestamp": 1578408292181,
        "duration": 0
    },
    {
        "description": " verify Subtotal value is correct|CheckOut Verfication",
        "passed": false,
        "pending": true,
        "os": "Windows",
        "instanceId": 8356,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Temporarily disabled with xit",
        "browserLogs": [],
        "screenShotFile": "0076004f-0093-00d2-00c2-00eb003e0011.png",
        "timestamp": 1578408292220,
        "duration": 0
    },
    {
        "description": " verify print option|CheckOut Verfication",
        "passed": false,
        "pending": true,
        "os": "Windows",
        "instanceId": 8356,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Temporarily disabled with xit",
        "browserLogs": [],
        "screenShotFile": "009900ce-00ab-0056-00a8-00c500ff00f1.png",
        "timestamp": 1578408292265,
        "duration": 0
    },
    {
        "description": "User should log out successfully from application|Log out ",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 8356,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "00b8006e-0083-0093-0093-003d009600c8.png",
        "timestamp": 1578408292302,
        "duration": 10767
    },
    {
        "description": "verify successfull Logout|Log out ",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 8356,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "009100fa-0065-00d1-00dd-00ef00350037.png",
        "timestamp": 1578408303519,
        "duration": 26
    },
    {
        "description": "should login the user|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 9676,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "002200cb-0054-0081-0031-002900d2001b.png",
        "timestamp": 1578410687525,
        "duration": 17972
    },
    {
        "description": "Forgot password link present on the Login page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 9676,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "0058008f-00a1-00bd-0011-00e300f1003f.png",
        "timestamp": 1578410706161,
        "duration": 118
    },
    {
        "description": "Create Account link present on the Login page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 9676,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00eb0043-00c1-0030-007d-00e000240096.png",
        "timestamp": 1578410706724,
        "duration": 101
    },
    {
        "description": "Contact Us  link present on the Login Page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 9676,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "0073005b-00b5-00dd-00fc-00ab00f40001.png",
        "timestamp": 1578410707274,
        "duration": 81
    },
    {
        "description": "Verify comapny copyright text at the footer of the login page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 9676,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "007e0093-00f1-00e0-0069-003700ad00c1.png",
        "timestamp": 1578410707823,
        "duration": 61
    },
    {
        "description": "Verify Username labeling is preseet|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 9676,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00ca0089-00fa-00d7-0069-004c002e005c.png",
        "timestamp": 1578410708326,
        "duration": 6
    },
    {
        "description": "Verify password label is present|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 9676,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00bf00fe-00c8-00a8-008b-0005009f001b.png",
        "timestamp": 1578410708792,
        "duration": 6
    },
    {
        "description": "Verify Remember Me check box|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 9676,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00530070-00ba-00f0-00d0-005a009500e4.png",
        "timestamp": 1578410709224,
        "duration": 61
    },
    {
        "description": "verify the title of the Page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 9676,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00010035-003d-00e9-007d-0028004a00fb.png",
        "timestamp": 1578410709730,
        "duration": 51
    },
    {
        "description": "veriy all links present on page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 9676,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "005b00a5-00da-007d-00ca-00df006e00de.png",
        "timestamp": 1578410710216,
        "duration": 87
    },
    {
        "description": "User Login successfully |Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 9676,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "002e00e8-00af-005c-00e3-00f700b300f2.png",
        "timestamp": 1578410710752,
        "duration": 4
    },
    {
        "description": "should login the user|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 9492,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "00e700f9-0077-006b-0078-002600d5006f.png",
        "timestamp": 1578410878794,
        "duration": 16651
    },
    {
        "description": "Forgot password link present on the Login page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 9492,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00460001-0065-00fd-0096-00fc00f700c3.png",
        "timestamp": 1578410896014,
        "duration": 92
    },
    {
        "description": "Create Account link present on the Login page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 9492,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00e40000-00dd-0024-000b-004b00110052.png",
        "timestamp": 1578410896511,
        "duration": 72
    },
    {
        "description": "Contact Us  link present on the Login Page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 9492,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "008a0073-0037-00ae-0053-001900b400af.png",
        "timestamp": 1578410897013,
        "duration": 57
    },
    {
        "description": "Verify comapny copyright text at the footer of the login page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 9492,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "00690073-0090-0057-00f3-003d0041008d.png",
        "timestamp": 1578410897439,
        "duration": 56
    },
    {
        "description": "Verify Username labeling is preseet|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 9492,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "009e003b-00dc-0041-00ac-00450044004c.png",
        "timestamp": 1578410897887,
        "duration": 4
    },
    {
        "description": "Verify password label is present|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 9492,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00670037-0001-00dd-009a-0074004200c4.png",
        "timestamp": 1578410898306,
        "duration": 4
    },
    {
        "description": "Verify Remember Me check box|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 9492,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "001c00f3-0029-0034-00df-000b00730033.png",
        "timestamp": 1578410898683,
        "duration": 53
    },
    {
        "description": "verify the title of the Page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 9492,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "007800a9-00b1-0020-00ac-0045006900a5.png",
        "timestamp": 1578410899138,
        "duration": 29
    },
    {
        "description": "veriy all links present on page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 9492,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "003200a5-00a0-00f8-00a0-00ae00bf00f6.png",
        "timestamp": 1578410899553,
        "duration": 75
    },
    {
        "description": "User Login successfully |Verify Login",
        "passed": false,
        "pending": false,
        "os": "Windows",
        "instanceId": 9492,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": [
            "Failed: No element found using locator: By(xpath, //div[@id='toast-container'])"
        ],
        "trace": [
            "NoSuchElementError: No element found using locator: By(xpath, //div[@id='toast-container'])\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:814:27\n    at ManagedPromise.invokeCallback_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\n    at processTicksAndRejections (internal/process/task_queues.js:93:5)Error\n    at ElementArrayFinder.applyAction_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:459:27)\n    at ElementArrayFinder.<computed> [as getText] (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:91:29)\n    at ElementFinder.<computed> [as getText] (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:831:22)\n    at UserContext.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars\\specs\\LoginPage\\LoginPage_spec.js:235:15)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\nFrom: Task: Run it(\"User Login successfully \") in control flow\n    at UserContext.<anonymous> (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:94:19)\n    at attempt (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4297:26)\n    at QueueRunner.run (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4217:20)\n    at runNext (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4257:20)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4264:13\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4172:9\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:64:48\n    at ControlFlow.emit (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\events.js:62:21)\n    at ControlFlow.shutdown_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2674:10)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2599:53\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars\\specs\\LoginPage\\LoginPage_spec.js:198:5)\n    at addSpecsToSuite (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars\\specs\\LoginPage\\LoginPage_spec.js:13:1)\n    at Module._compile (internal/modules/cjs/loader.js:956:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:973:10)\n    at Module.load (internal/modules/cjs/loader.js:812:32)\n    at Function.Module._load (internal/modules/cjs/loader.js:724:14)"
        ],
        "browserLogs": [],
        "screenShotFile": "00a80070-00da-0059-0008-0067002600f6.png",
        "timestamp": 1578410899999,
        "duration": 45
    },
    {
        "description": "should login the user|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 11300,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "008d0031-0026-008a-0053-0013009200e4.png",
        "timestamp": 1578410926088,
        "duration": 15299
    },
    {
        "description": "Forgot password link present on the Login page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 11300,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "003900ea-002b-001b-00a3-00a8003a00ff.png",
        "timestamp": 1578410941861,
        "duration": 89
    },
    {
        "description": "Create Account link present on the Login page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 11300,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00580098-00a5-00e9-00d5-00e1009b00e6.png",
        "timestamp": 1578410942362,
        "duration": 69
    },
    {
        "description": "Contact Us  link present on the Login Page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 11300,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00c1005c-0024-009f-0055-0036005b0043.png",
        "timestamp": 1578410942852,
        "duration": 73
    },
    {
        "description": "Verify comapny copyright text at the footer of the login page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 11300,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "00f500c8-00f2-0074-00af-009100280087.png",
        "timestamp": 1578410943305,
        "duration": 37
    },
    {
        "description": "Verify Username labeling is preseet|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 11300,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "005500ec-007e-00ed-00d6-009100d300d0.png",
        "timestamp": 1578410943763,
        "duration": 6
    },
    {
        "description": "Verify password label is present|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 11300,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00830062-0086-00da-00ec-006f00250090.png",
        "timestamp": 1578410944153,
        "duration": 5
    },
    {
        "description": "Verify Remember Me check box|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 11300,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "007e002d-006c-0085-0014-009a005a0050.png",
        "timestamp": 1578410944561,
        "duration": 61
    },
    {
        "description": "verify the title of the Page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 11300,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00a60025-009c-00ba-006d-003a00ac0030.png",
        "timestamp": 1578410945017,
        "duration": 30
    },
    {
        "description": "veriy all links present on page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 11300,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "006b005c-00a0-0089-009d-002600b000ca.png",
        "timestamp": 1578410945410,
        "duration": 62
    },
    {
        "description": "User Login successfully |Verify Login",
        "passed": false,
        "pending": false,
        "os": "Windows",
        "instanceId": 11300,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": [
            "Failed: No element found using locator: By(xpath, //div[@id='toast-container'])"
        ],
        "trace": [
            "NoSuchElementError: No element found using locator: By(xpath, //div[@id='toast-container'])\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:814:27\n    at ManagedPromise.invokeCallback_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\n    at processTicksAndRejections (internal/process/task_queues.js:93:5)Error\n    at ElementArrayFinder.applyAction_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:459:27)\n    at ElementArrayFinder.<computed> [as getText] (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:91:29)\n    at ElementFinder.<computed> [as getText] (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:831:22)\n    at UserContext.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars\\specs\\LoginPage\\LoginPage_spec.js:235:15)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\nFrom: Task: Run it(\"User Login successfully \") in control flow\n    at UserContext.<anonymous> (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:94:19)\n    at attempt (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4297:26)\n    at QueueRunner.run (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4217:20)\n    at runNext (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4257:20)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4264:13\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4172:9\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:64:48\n    at ControlFlow.emit (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\events.js:62:21)\n    at ControlFlow.shutdown_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2674:10)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2599:53\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars\\specs\\LoginPage\\LoginPage_spec.js:198:5)\n    at addSpecsToSuite (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars\\specs\\LoginPage\\LoginPage_spec.js:13:1)\n    at Module._compile (internal/modules/cjs/loader.js:956:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:973:10)\n    at Module.load (internal/modules/cjs/loader.js:812:32)\n    at Function.Module._load (internal/modules/cjs/loader.js:724:14)"
        ],
        "browserLogs": [],
        "screenShotFile": "0099003d-0003-00a6-00cf-006f00f7000e.png",
        "timestamp": 1578410945829,
        "duration": 42
    },
    {
        "description": "should login the user|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 12216,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "00cf00f8-0069-008e-0051-002300b400a9.png",
        "timestamp": 1578410976915,
        "duration": 18067
    },
    {
        "description": "Forgot password link present on the Login page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 12216,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00dd0055-00e3-0013-00dc-0096000800bd.png",
        "timestamp": 1578410995463,
        "duration": 98
    },
    {
        "description": "Create Account link present on the Login page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 12216,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00000077-0035-002f-0081-008600af000a.png",
        "timestamp": 1578410995980,
        "duration": 71
    },
    {
        "description": "Contact Us  link present on the Login Page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 12216,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00ed00d4-0071-00b6-0031-00ef0060009c.png",
        "timestamp": 1578410996458,
        "duration": 80
    },
    {
        "description": "Verify comapny copyright text at the footer of the login page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 12216,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "00ee00e6-00f4-0086-008e-000300190096.png",
        "timestamp": 1578410996945,
        "duration": 43
    },
    {
        "description": "Verify Username labeling is preseet|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 12216,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "0000005a-003d-000b-0052-00b700b5002b.png",
        "timestamp": 1578410997392,
        "duration": 5
    },
    {
        "description": "Verify password label is present|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 12216,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "008e0042-00e6-006e-0054-0061002200ad.png",
        "timestamp": 1578410997800,
        "duration": 3
    },
    {
        "description": "Verify Remember Me check box|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 12216,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00910043-0085-0094-0060-00e6008100c5.png",
        "timestamp": 1578410998206,
        "duration": 63
    },
    {
        "description": "verify the title of the Page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 12216,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00f50036-006f-00f9-0029-008a009e004d.png",
        "timestamp": 1578410998655,
        "duration": 28
    },
    {
        "description": "veriy all links present on page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 12216,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "00bf00cb-00e3-008e-0045-006e00c7004d.png",
        "timestamp": 1578410999061,
        "duration": 72
    },
    {
        "description": "User Login successfully |Verify Login",
        "passed": false,
        "pending": false,
        "os": "Windows",
        "instanceId": 12216,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": [
            "Failed: No element found using locator: By(xpath, //div[@id='toast-container'])"
        ],
        "trace": [
            "NoSuchElementError: No element found using locator: By(xpath, //div[@id='toast-container'])\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:814:27\n    at ManagedPromise.invokeCallback_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\n    at processTicksAndRejections (internal/process/task_queues.js:93:5)Error\n    at ElementArrayFinder.applyAction_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:459:27)\n    at ElementArrayFinder.<computed> [as getText] (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:91:29)\n    at ElementFinder.<computed> [as getText] (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:831:22)\n    at UserContext.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars\\specs\\LoginPage\\LoginPage_spec.js:235:15)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\nFrom: Task: Run it(\"User Login successfully \") in control flow\n    at UserContext.<anonymous> (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:94:19)\n    at attempt (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4297:26)\n    at QueueRunner.run (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4217:20)\n    at runNext (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4257:20)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4264:13\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4172:9\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:64:48\n    at ControlFlow.emit (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\events.js:62:21)\n    at ControlFlow.shutdown_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2674:10)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2599:53\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars\\specs\\LoginPage\\LoginPage_spec.js:198:5)\n    at addSpecsToSuite (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars\\specs\\LoginPage\\LoginPage_spec.js:13:1)\n    at Module._compile (internal/modules/cjs/loader.js:956:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:973:10)\n    at Module.load (internal/modules/cjs/loader.js:812:32)\n    at Function.Module._load (internal/modules/cjs/loader.js:724:14)"
        ],
        "browserLogs": [],
        "screenShotFile": "00140093-002e-00f6-00a2-001600b400de.png",
        "timestamp": 1578410999521,
        "duration": 44
    },
    {
        "description": "should login the user|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 6256,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "00a800e2-00e7-00c6-00b5-007c00360000.png",
        "timestamp": 1578411030330,
        "duration": 17178
    },
    {
        "description": "Forgot password link present on the Login page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 6256,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "001800dd-0063-000b-0022-0072002c00e8.png",
        "timestamp": 1578411048047,
        "duration": 112
    },
    {
        "description": "Create Account link present on the Login page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 6256,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "009c00f9-0065-0028-001c-00a5002c0025.png",
        "timestamp": 1578411048567,
        "duration": 72
    },
    {
        "description": "Contact Us  link present on the Login Page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 6256,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "008b0088-00b4-00bd-00ac-00530009008e.png",
        "timestamp": 1578411049049,
        "duration": 91
    },
    {
        "description": "Verify comapny copyright text at the footer of the login page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 6256,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "00db0071-0095-0044-0096-007600e200b8.png",
        "timestamp": 1578411049543,
        "duration": 52
    },
    {
        "description": "Verify Username labeling is preseet|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 6256,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00f200fb-0035-0054-00f7-0098004a0030.png",
        "timestamp": 1578411049980,
        "duration": 3
    },
    {
        "description": "Verify password label is present|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 6256,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "008f00da-00ce-00f0-00b3-00b2006a00a2.png",
        "timestamp": 1578411050365,
        "duration": 4
    },
    {
        "description": "Verify Remember Me check box|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 6256,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00010018-00ca-0060-00eb-00f700ed00b0.png",
        "timestamp": 1578411050758,
        "duration": 64
    },
    {
        "description": "verify the title of the Page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 6256,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "009200cc-0064-00ba-0064-0017009600b7.png",
        "timestamp": 1578411051211,
        "duration": 33
    },
    {
        "description": "veriy all links present on page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 6256,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "006f00e7-00a9-0064-00f8-008b00f8003e.png",
        "timestamp": 1578411051622,
        "duration": 89
    },
    {
        "description": "User Login successfully |Verify Login",
        "passed": false,
        "pending": false,
        "os": "Windows",
        "instanceId": 6256,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": [
            "Failed: No element found using locator: By(xpath, //div[@id='toast-container'])"
        ],
        "trace": [
            "NoSuchElementError: No element found using locator: By(xpath, //div[@id='toast-container'])\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:814:27\n    at ManagedPromise.invokeCallback_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\n    at processTicksAndRejections (internal/process/task_queues.js:93:5)Error\n    at ElementArrayFinder.applyAction_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:459:27)\n    at ElementArrayFinder.<computed> [as getText] (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:91:29)\n    at ElementFinder.<computed> [as getText] (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:831:22)\n    at UserContext.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars\\specs\\LoginPage\\LoginPage_spec.js:235:15)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\nFrom: Task: Run it(\"User Login successfully \") in control flow\n    at UserContext.<anonymous> (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:94:19)\n    at attempt (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4297:26)\n    at QueueRunner.run (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4217:20)\n    at runNext (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4257:20)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4264:13\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4172:9\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:64:48\n    at ControlFlow.emit (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\events.js:62:21)\n    at ControlFlow.shutdown_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2674:10)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2599:53\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars\\specs\\LoginPage\\LoginPage_spec.js:198:5)\n    at addSpecsToSuite (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars\\specs\\LoginPage\\LoginPage_spec.js:13:1)\n    at Module._compile (internal/modules/cjs/loader.js:956:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:973:10)\n    at Module.load (internal/modules/cjs/loader.js:812:32)\n    at Function.Module._load (internal/modules/cjs/loader.js:724:14)"
        ],
        "browserLogs": [],
        "screenShotFile": "00b1009a-00d5-0002-0025-0017009f00cc.png",
        "timestamp": 1578411052089,
        "duration": 52
    },
    {
        "description": "should login the user|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 6760,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "00bb00d4-00a6-005a-009c-002700a40063.png",
        "timestamp": 1578411084164,
        "duration": 18718
    },
    {
        "description": "Forgot password link present on the Login page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 6760,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00a000ac-0012-00a9-0087-003e00110060.png",
        "timestamp": 1578411103386,
        "duration": 84
    },
    {
        "description": "Create Account link present on the Login page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 6760,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00eb00f0-0049-00ac-00d5-005200000066.png",
        "timestamp": 1578411103876,
        "duration": 74
    },
    {
        "description": "Contact Us  link present on the Login Page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 6760,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00000097-0022-0041-0035-001e000200d9.png",
        "timestamp": 1578411104363,
        "duration": 78
    },
    {
        "description": "Verify comapny copyright text at the footer of the login page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 6760,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "00ed00e9-00b6-00e8-00e1-00a7004700cd.png",
        "timestamp": 1578411104879,
        "duration": 40
    },
    {
        "description": "Verify Username labeling is preseet|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 6760,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "002200e6-0001-0007-0029-0038002b00b1.png",
        "timestamp": 1578411105301,
        "duration": 5
    },
    {
        "description": "Verify password label is present|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 6760,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00400059-0022-00e0-0048-00d200e20090.png",
        "timestamp": 1578411105678,
        "duration": 3
    },
    {
        "description": "Verify Remember Me check box|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 6760,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "003300e5-0058-00e7-0025-009900f200b0.png",
        "timestamp": 1578411106091,
        "duration": 54
    },
    {
        "description": "verify the title of the Page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 6760,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "008900c8-0075-0022-0093-00ac00bf008b.png",
        "timestamp": 1578411106543,
        "duration": 29
    },
    {
        "description": "veriy all links present on page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 6760,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "0020004d-00f9-0049-00e7-008900700095.png",
        "timestamp": 1578411106970,
        "duration": 75
    },
    {
        "description": "User Login successfully |Verify Login",
        "passed": false,
        "pending": false,
        "os": "Windows",
        "instanceId": 6760,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": [
            "Failed: No element found using locator: By(xpath, //div[@id='toast-container'])"
        ],
        "trace": [
            "NoSuchElementError: No element found using locator: By(xpath, //div[@id='toast-container'])\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:814:27\n    at ManagedPromise.invokeCallback_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\n    at processTicksAndRejections (internal/process/task_queues.js:93:5)Error\n    at ElementArrayFinder.applyAction_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:459:27)\n    at ElementArrayFinder.<computed> [as getText] (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:91:29)\n    at ElementFinder.<computed> [as getText] (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:831:22)\n    at UserContext.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars\\specs\\LoginPage\\LoginPage_spec.js:235:15)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\nFrom: Task: Run it(\"User Login successfully \") in control flow\n    at UserContext.<anonymous> (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:94:19)\n    at attempt (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4297:26)\n    at QueueRunner.run (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4217:20)\n    at runNext (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4257:20)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4264:13\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4172:9\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:64:48\n    at ControlFlow.emit (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\events.js:62:21)\n    at ControlFlow.shutdown_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2674:10)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2599:53\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars\\specs\\LoginPage\\LoginPage_spec.js:198:5)\n    at addSpecsToSuite (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars\\specs\\LoginPage\\LoginPage_spec.js:13:1)\n    at Module._compile (internal/modules/cjs/loader.js:956:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:973:10)\n    at Module.load (internal/modules/cjs/loader.js:812:32)\n    at Function.Module._load (internal/modules/cjs/loader.js:724:14)"
        ],
        "browserLogs": [],
        "screenShotFile": "00eb00de-0053-00cc-0001-00dd0009000d.png",
        "timestamp": 1578411107435,
        "duration": 47
    },
    {
        "description": "should login the user|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 11052,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "00a1003c-00dd-0051-008e-00d2001c0080.png",
        "timestamp": 1578411200972,
        "duration": 16558
    },
    {
        "description": "Forgot password link present on the Login page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 11052,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00b00069-0070-0024-00c7-002c00a90063.png",
        "timestamp": 1578411218094,
        "duration": 110
    },
    {
        "description": "Create Account link present on the Login page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 11052,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "006100ff-00d2-007e-006e-00e0004f0078.png",
        "timestamp": 1578411218683,
        "duration": 99
    },
    {
        "description": "Contact Us  link present on the Login Page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 11052,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "000400f8-0024-008d-0004-003d003c0009.png",
        "timestamp": 1578411219209,
        "duration": 120
    },
    {
        "description": "Verify comapny copyright text at the footer of the login page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 11052,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "0077005f-0095-00fa-0049-00aa00f800aa.png",
        "timestamp": 1578411219731,
        "duration": 51
    },
    {
        "description": "Verify Username labeling is preseet|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 11052,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00ff0036-0006-003a-00b6-00dd0096008f.png",
        "timestamp": 1578411220189,
        "duration": 6
    },
    {
        "description": "Verify password label is present|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 11052,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "009d0094-00a3-007f-00b2-005c00070058.png",
        "timestamp": 1578411220618,
        "duration": 2
    },
    {
        "description": "Verify Remember Me check box|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 11052,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00770095-00c8-00fe-0025-0058003900e3.png",
        "timestamp": 1578411221034,
        "duration": 71
    },
    {
        "description": "verify the title of the Page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 11052,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00fa001a-0017-002d-0050-006a004900f7.png",
        "timestamp": 1578411221505,
        "duration": 37
    },
    {
        "description": "veriy all links present on page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 11052,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "00980056-00d3-009f-00d5-00f400cb00cb.png",
        "timestamp": 1578411221953,
        "duration": 90
    },
    {
        "description": "User Login successfully |Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 11052,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "004d008a-00c0-0048-00b9-002700910059.png",
        "timestamp": 1578411222445,
        "duration": 6
    },
    {
        "description": "should login the user|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 11868,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "009800ac-00e6-0063-004b-0054004d006e.png",
        "timestamp": 1578411254408,
        "duration": 17053
    },
    {
        "description": "Forgot password link present on the Login page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 11868,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "003400d1-00bd-004e-0083-00e800e50020.png",
        "timestamp": 1578411271942,
        "duration": 92
    },
    {
        "description": "Create Account link present on the Login page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 11868,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00330029-003f-009b-00d0-00b5003e00c6.png",
        "timestamp": 1578411272431,
        "duration": 75
    },
    {
        "description": "Contact Us  link present on the Login Page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 11868,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "008200a6-00e0-0030-00d9-001800ca0010.png",
        "timestamp": 1578411272915,
        "duration": 89
    },
    {
        "description": "Verify comapny copyright text at the footer of the login page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 11868,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "000900fb-0074-00c8-00f6-001200ff003c.png",
        "timestamp": 1578411273373,
        "duration": 47
    },
    {
        "description": "Verify Username labeling is preseet|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 11868,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00fe00a1-004c-00be-0088-00d10025000f.png",
        "timestamp": 1578411273809,
        "duration": 4
    },
    {
        "description": "Verify password label is present|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 11868,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00c1003a-003d-0034-005b-00e900830000.png",
        "timestamp": 1578411274217,
        "duration": 3
    },
    {
        "description": "Verify Remember Me check box|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 11868,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00600012-006b-0069-0026-0025005b0075.png",
        "timestamp": 1578411274603,
        "duration": 67
    },
    {
        "description": "verify the title of the Page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 11868,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00f40047-00f2-00d4-0067-00eb004500be.png",
        "timestamp": 1578411275063,
        "duration": 25
    },
    {
        "description": "veriy all links present on page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 11868,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "00d300ed-0011-003c-0095-009000000064.png",
        "timestamp": 1578411275466,
        "duration": 71
    },
    {
        "description": "User Login successfully |Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 11868,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "00d100d6-003c-0050-0030-00f300ba0071.png",
        "timestamp": 1578411275922,
        "duration": 6
    },
    {
        "description": "should login the user|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 7212,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "002f0088-0052-002e-00e5-006600ac005a.png",
        "timestamp": 1578411415427,
        "duration": 17516
    },
    {
        "description": "Forgot password link present on the Login page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 7212,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00270047-0054-0052-0058-004800270080.png",
        "timestamp": 1578411433434,
        "duration": 78
    },
    {
        "description": "Create Account link present on the Login page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 7212,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00430039-005b-009b-0056-00ad00c600a5.png",
        "timestamp": 1578411433914,
        "duration": 69
    },
    {
        "description": "Contact Us  link present on the Login Page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 7212,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "005e00f1-0033-0018-006d-00f500a000ba.png",
        "timestamp": 1578411434374,
        "duration": 68
    },
    {
        "description": "Verify comapny copyright text at the footer of the login page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 7212,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "00050020-00aa-0042-00bf-00750006000f.png",
        "timestamp": 1578411434811,
        "duration": 38
    },
    {
        "description": "Verify Username labeling is preseet|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 7212,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00ad00ea-007c-003b-00db-00f700470029.png",
        "timestamp": 1578411435242,
        "duration": 4
    },
    {
        "description": "Verify password label is present|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 7212,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "003b00b9-008c-00d3-008c-008600c400b1.png",
        "timestamp": 1578411435634,
        "duration": 3
    },
    {
        "description": "Verify Remember Me check box|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 7212,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00e000b8-007b-0067-0037-00ce000f00c8.png",
        "timestamp": 1578411436039,
        "duration": 54
    },
    {
        "description": "verify the title of the Page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 7212,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00cf00e9-00cb-006a-0068-0093003600f3.png",
        "timestamp": 1578411436473,
        "duration": 30
    },
    {
        "description": "veriy all links present on page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 7212,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "00530091-00a4-0096-00f1-008f002d00e0.png",
        "timestamp": 1578411436888,
        "duration": 66
    },
    {
        "description": "User Login successfully |Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 7212,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "https://auth.ordercloud.io/oauth/token - Failed to load resource: the server responded with a status of 400 (Bad Request)",
                "timestamp": 1578411454160,
                "type": ""
            }
        ],
        "screenShotFile": "009700e9-00c3-00ce-0084-0037005b00f9.png",
        "timestamp": 1578411437337,
        "duration": 16902
    },
    {
        "description": "should login the user|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 11624,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "0047004b-000e-0060-0019-000300920063.png",
        "timestamp": 1578470780977,
        "duration": 14181
    },
    {
        "description": "Forgot password link present on the Login page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 11624,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "008600ce-00de-0044-0037-003100a9000c.png",
        "timestamp": 1578470795753,
        "duration": 74
    },
    {
        "description": "Create Account link present on the Login page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 11624,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00810032-004e-0040-001f-00be00ab001b.png",
        "timestamp": 1578470796221,
        "duration": 52
    },
    {
        "description": "Contact Us  link present on the Login Page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 11624,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00980061-004a-009d-004e-00d6006e001f.png",
        "timestamp": 1578470796663,
        "duration": 65
    },
    {
        "description": "Verify comapny copyright text at the footer of the login page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 11624,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "008e00cf-0016-009a-00e4-0029003d0076.png",
        "timestamp": 1578470797121,
        "duration": 34
    },
    {
        "description": "Verify Username labeling is preseet|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 11624,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "001200e3-005c-0062-0053-007a00dc00c2.png",
        "timestamp": 1578470797556,
        "duration": 4
    },
    {
        "description": "Verify password label is present|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 11624,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00b9008f-007d-0047-00d0-006100ce0077.png",
        "timestamp": 1578470797949,
        "duration": 2
    },
    {
        "description": "Verify Remember Me check box|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 11624,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "0008000e-00fe-00e7-00b9-009d005400d5.png",
        "timestamp": 1578470798336,
        "duration": 46
    },
    {
        "description": "verify the title of the Page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 11624,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00730022-007b-00b7-0075-000000ca0098.png",
        "timestamp": 1578470798764,
        "duration": 27
    },
    {
        "description": "veriy all links present on page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 11624,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "002600d8-0006-00a5-00d7-00aa00e50040.png",
        "timestamp": 1578470799176,
        "duration": 55
    },
    {
        "description": "User Login successfully |Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 11624,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "https://auth.ordercloud.io/oauth/token - Failed to load resource: the server responded with a status of 400 (Bad Request)",
                "timestamp": 1578470816372,
                "type": ""
            }
        ],
        "screenShotFile": "00ec001d-00f6-0056-0011-00cb00f60040.png",
        "timestamp": 1578470799618,
        "duration": 16825
    },
    {
        "description": "should login the user|Verify Login",
        "passed": false,
        "pending": false,
        "os": "Windows",
        "instanceId": 8592,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": [
            "Error: Timeout - Async callback was not invoked within timeout specified by jasmine.DEFAULT_TIMEOUT_INTERVAL."
        ],
        "trace": [
            "Error: Timeout - Async callback was not invoked within timeout specified by jasmine.DEFAULT_TIMEOUT_INTERVAL.\n    at Timeout._onTimeout (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4281:23)\n    at listOnTimeout (internal/timers.js:531:17)\n    at processTimers (internal/timers.js:475:7)"
        ],
        "browserLogs": [],
        "screenShotFile": "009a007f-00aa-001a-00d0-005100020064.png",
        "timestamp": 1578471010124,
        "duration": 31280
    },
    {
        "description": "Forgot password link present on the Login page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 8592,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "007700fe-002a-0048-00b8-006d00800024.png",
        "timestamp": 1578471041864,
        "duration": 78
    },
    {
        "description": "Create Account link present on the Login page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 8592,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00ec005a-00b9-0061-00b1-00090014001d.png",
        "timestamp": 1578471042322,
        "duration": 57
    },
    {
        "description": "Contact Us  link present on the Login Page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 8592,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00da00ef-008d-00f2-0000-007d00bc0058.png",
        "timestamp": 1578471042810,
        "duration": 74
    },
    {
        "description": "Verify comapny copyright text at the footer of the login page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 8592,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "00e80053-006f-000d-00cf-004800e500d2.png",
        "timestamp": 1578471043265,
        "duration": 32
    },
    {
        "description": "Verify Username labeling is preseet|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 8592,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "002f00df-001f-00fd-00f9-00a200480043.png",
        "timestamp": 1578471043674,
        "duration": 4
    },
    {
        "description": "Verify password label is present|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 8592,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "001c00ae-00f5-00c1-0059-00d4002b009c.png",
        "timestamp": 1578471044054,
        "duration": 3
    },
    {
        "description": "Verify Remember Me check box|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 8592,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "0061008d-0064-0040-0087-00f90031006b.png",
        "timestamp": 1578471044448,
        "duration": 46
    },
    {
        "description": "verify the title of the Page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 8592,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "000c005e-0033-0072-0096-00220062009b.png",
        "timestamp": 1578471044871,
        "duration": 22
    },
    {
        "description": "veriy all links present on page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 8592,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "000f00e3-0027-00d3-00ba-00a500640006.png",
        "timestamp": 1578471045266,
        "duration": 54
    },
    {
        "description": "should login the user|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 11964,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "00c20010-0000-0045-00d0-00d5008700bf.png",
        "timestamp": 1578474822046,
        "duration": 16493
    },
    {
        "description": "Forgot password link present on the Login page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 11964,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00b80046-007d-00af-00aa-001d00c6004c.png",
        "timestamp": 1578474839006,
        "duration": 63
    },
    {
        "description": "Create Account link present on the Login page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 11964,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00df00eb-005f-0051-00fc-006900d500db.png",
        "timestamp": 1578474839500,
        "duration": 53
    },
    {
        "description": "Contact Us  link present on the Login Page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 11964,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "001a0023-00fb-0015-00ed-0040009f00ae.png",
        "timestamp": 1578474839935,
        "duration": 60
    },
    {
        "description": "Verify comapny copyright text at the footer of the login page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 11964,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "00230073-0067-0089-00d2-006800fd002e.png",
        "timestamp": 1578474840382,
        "duration": 25
    },
    {
        "description": "Verify Username labeling is preseet|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 11964,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00e70092-00f2-006b-0047-00f400e200f3.png",
        "timestamp": 1578474840811,
        "duration": 3
    },
    {
        "description": "Verify password label is present|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 11964,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00b400da-00fe-005d-0065-008e00c80000.png",
        "timestamp": 1578474841197,
        "duration": 3
    },
    {
        "description": "Verify Remember Me check box|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 11964,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "002c00f5-00b7-00a5-00f8-000500180085.png",
        "timestamp": 1578474841561,
        "duration": 35
    },
    {
        "description": "verify the title of the Page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 11964,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00ad0003-0020-00bf-0063-005200f70092.png",
        "timestamp": 1578474841986,
        "duration": 12
    },
    {
        "description": "veriy all links present on page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 11964,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "0033005f-008e-0081-00d4-00e800cb0010.png",
        "timestamp": 1578474842372,
        "duration": 47
    },
    {
        "description": "User Login successfully |Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 11964,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "https://archway-forduaw-qa.azurewebsites.net/main.8135115ee1375ec49609.js 0 /deep/ combinator is no longer supported in CSS dynamic profile. It is now effectively no-op, acting as if it were a descendant combinator. /deep/ combinator will be removed, and will be invalid at M65. You should remove it. See https://www.chromestatus.com/features/4964279606312960 for more details.",
                "timestamp": 1578474859388,
                "type": ""
            }
        ],
        "screenShotFile": "007e00a2-006f-005e-007e-001c00130024.png",
        "timestamp": 1578474842801,
        "duration": 16602
    },
    {
        "description": "should find all links on Home Page| Verifying Home Page ",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 11964,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "004a0072-00aa-00c3-007e-00d700050023.png",
        "timestamp": 1578474859818,
        "duration": 2374
    },
    {
        "description": "Verify Presence of Logo| Verifying Home Page ",
        "passed": false,
        "pending": true,
        "os": "Windows",
        "instanceId": 11964,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Temporarily disabled with xit",
        "browserLogs": [],
        "screenShotFile": "00e70048-0050-00c2-0078-006900e200ec.png",
        "timestamp": 1578474862590,
        "duration": 0
    },
    {
        "description": "Verify URL of the Home page once user is logged successfully | Verifying Home Page ",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 11964,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00900064-00f5-0032-00aa-00d900f400cd.png",
        "timestamp": 1578474862629,
        "duration": 21
    },
    {
        "description": "Verify Home icon is present on the Landing/Home page after Login| Verifying Home Page ",
        "passed": false,
        "pending": true,
        "os": "Windows",
        "instanceId": 11964,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Temporarily disabled with xit",
        "browserLogs": [],
        "screenShotFile": "00c70049-00de-002a-0026-009e00e000ab.png",
        "timestamp": 1578474863039,
        "duration": 0
    },
    {
        "description": "Verify BrowseProduct icon is present on the Landing/Home page after Login| Verifying Home Page ",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 11964,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00420062-002d-0062-0080-007200180036.png",
        "timestamp": 1578474863084,
        "duration": 127
    },
    {
        "description": "Verify MyOrders icon is present on the Landing/Home page after Login| Verifying Home Page ",
        "passed": false,
        "pending": true,
        "os": "Windows",
        "instanceId": 11964,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Temporarily disabled with xit",
        "browserLogs": [],
        "screenShotFile": "002c00c6-00b1-008d-00b9-009500b1003d.png",
        "timestamp": 1578474863605,
        "duration": 0
    },
    {
        "description": "Verify Report icon is present on the Landing/Home page after Login| Verifying Home Page ",
        "passed": false,
        "pending": false,
        "os": "Windows",
        "instanceId": 11964,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": [
            "Expected 'REPORTS' to contain ''REPORTS'."
        ],
        "trace": [
            "Error: Failed expectation\n    at C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars_Byer\\specs\\HomePage\\HomePage_spec.js:148:21\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:804:32\n    at ManagedPromise.invokeCallback_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\n    at processTicksAndRejections (internal/process/task_queues.js:93:5)"
        ],
        "browserLogs": [],
        "screenShotFile": "005a00a6-0054-00ad-0060-008200cc0054.png",
        "timestamp": 1578474863647,
        "duration": 97
    },
    {
        "description": "Verify for Featured Products on Home Page|Verify Featured Products Text is present on Home Page | Verifying Home Page ",
        "passed": false,
        "pending": true,
        "os": "Windows",
        "instanceId": 11964,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Pending",
        "browserLogs": [],
        "screenShotFile": "002300f1-009d-0093-0017-001300090071.png",
        "timestamp": 1578474864124,
        "duration": 0
    },
    {
        "description": "user see about website section|Verify About website section/text is present| Verifying Home Page ",
        "passed": false,
        "pending": true,
        "os": "Windows",
        "instanceId": 11964,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Pending",
        "browserLogs": [],
        "screenShotFile": "009400f1-0052-00e1-0004-008e00ad0051.png",
        "timestamp": 1578474864167,
        "duration": 0
    },
    {
        "description": "Verification About website contents|Verify About website section/text is present| Verifying Home Page ",
        "passed": false,
        "pending": true,
        "os": "Windows",
        "instanceId": 11964,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Temporarily disabled with xit",
        "browserLogs": [],
        "screenShotFile": "00b7007e-00d9-00ad-0025-0083008c00f5.png",
        "timestamp": 1578474864209,
        "duration": 0
    },
    {
        "description": "Verify Order History text is present on the Landing/Home page after Login| Verify Order History Text| Verifying Home Page ",
        "passed": false,
        "pending": true,
        "os": "Windows",
        "instanceId": 11964,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Pending",
        "browserLogs": [],
        "screenShotFile": "00f300c0-006c-00ab-008f-006c009b00ab.png",
        "timestamp": 1578474864251,
        "duration": 0
    },
    {
        "description": "Verify  Order Summary text is present on the Landing/Home page after Login| Verify Order History Text| Verifying Home Page ",
        "passed": false,
        "pending": true,
        "os": "Windows",
        "instanceId": 11964,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Pending",
        "browserLogs": [],
        "screenShotFile": "005d0055-009e-009c-0096-007700950056.png",
        "timestamp": 1578474864289,
        "duration": 0
    },
    {
        "description": "Verify the contents of order history link| Verify Order History Text| Verifying Home Page ",
        "passed": false,
        "pending": true,
        "os": "Windows",
        "instanceId": 11964,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Pending",
        "browserLogs": [],
        "screenShotFile": "00470000-0043-00c2-0079-00f8004900a1.png",
        "timestamp": 1578474864344,
        "duration": 0
    },
    {
        "description": "Verify Order date text is present| Verify Order History Text| Verifying Home Page ",
        "passed": false,
        "pending": true,
        "os": "Windows",
        "instanceId": 11964,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Pending",
        "browserLogs": [],
        "screenShotFile": "00650057-00e7-00f9-00b2-00cf0036008d.png",
        "timestamp": 1578474864385,
        "duration": 1
    },
    {
        "description": "Verify Order Status text is present| Verify Order History Text| Verifying Home Page ",
        "passed": false,
        "pending": true,
        "os": "Windows",
        "instanceId": 11964,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Pending",
        "browserLogs": [],
        "screenShotFile": "00be004b-0006-005d-005b-00ad00940077.png",
        "timestamp": 1578474864425,
        "duration": 0
    },
    {
        "description": "Verify Status Date text is present| Verify Order History Text| Verifying Home Page ",
        "passed": false,
        "pending": true,
        "os": "Windows",
        "instanceId": 11964,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Pending",
        "browserLogs": [],
        "screenShotFile": "002a0003-008e-009c-0079-00ae002400ad.png",
        "timestamp": 1578474864468,
        "duration": 0
    },
    {
        "description": "Verify Total Items text is present| Verify Order History Text| Verifying Home Page ",
        "passed": false,
        "pending": true,
        "os": "Windows",
        "instanceId": 11964,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Pending",
        "browserLogs": [],
        "screenShotFile": "00d500a0-00a8-001e-002c-00ad00460081.png",
        "timestamp": 1578474864508,
        "duration": 0
    },
    {
        "description": "Verify Total Cost text is present| Verify Order History Text| Verifying Home Page ",
        "passed": false,
        "pending": true,
        "os": "Windows",
        "instanceId": 11964,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Pending",
        "browserLogs": [],
        "screenShotFile": "000b004d-00f6-0019-00e4-008100f900e6.png",
        "timestamp": 1578474864549,
        "duration": 1
    },
    {
        "description": "Verify Conact US links exist exist in footer|Verify Contact US link| Verifying Home Page ",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 11964,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00a50003-0069-00cf-004a-004500b0006b.png",
        "timestamp": 1578474864590,
        "duration": 89
    },
    {
        "description": " Verification of Name text  is present  |Verify Contact US link| Verifying Home Page ",
        "passed": false,
        "pending": true,
        "os": "Windows",
        "instanceId": 11964,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Temporarily disabled with xit",
        "browserLogs": [],
        "screenShotFile": "000600f0-005f-00f1-0087-0091002400ab.png",
        "timestamp": 1578474865053,
        "duration": 0
    },
    {
        "description": " Verification Email text is present|Verify Contact US link| Verifying Home Page ",
        "passed": false,
        "pending": true,
        "os": "Windows",
        "instanceId": 11964,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Temporarily disabled with xit",
        "browserLogs": [],
        "screenShotFile": "00070087-00e0-0031-0025-008a006a00a0.png",
        "timestamp": 1578474865094,
        "duration": 0
    },
    {
        "description": "Verification Contact  Number text is present|Verify Contact US link| Verifying Home Page ",
        "passed": false,
        "pending": true,
        "os": "Windows",
        "instanceId": 11964,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Temporarily disabled with xit",
        "browserLogs": [],
        "screenShotFile": "001e00f1-005a-00a8-006b-0096003000d8.png",
        "timestamp": 1578474865135,
        "duration": 0
    },
    {
        "description": " Verification Message text is present|Verify Contact US link| Verifying Home Page ",
        "passed": false,
        "pending": true,
        "os": "Windows",
        "instanceId": 11964,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Temporarily disabled with xit",
        "browserLogs": [],
        "screenShotFile": "0041009c-00aa-0028-006a-00b3002c00f1.png",
        "timestamp": 1578474865173,
        "duration": 0
    },
    {
        "description": "Verify Submit button presence  |Verify Contact US link| Verifying Home Page ",
        "passed": false,
        "pending": true,
        "os": "Windows",
        "instanceId": 11964,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Temporarily disabled with xit",
        "browserLogs": [],
        "screenShotFile": "00dc00fc-0022-004c-0098-007c006e00ce.png",
        "timestamp": 1578474865215,
        "duration": 0
    },
    {
        "description": "Verify Cancell Button presence |Verify Contact US link| Verifying Home Page ",
        "passed": false,
        "pending": true,
        "os": "Windows",
        "instanceId": 11964,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Temporarily disabled with xit",
        "browserLogs": [],
        "screenShotFile": "00d40081-0066-0005-003e-0080008100bc.png",
        "timestamp": 1578474865275,
        "duration": 0
    },
    {
        "description": "Navigating back and refresh the browser|Verify Contact US link| Verifying Home Page ",
        "passed": false,
        "pending": true,
        "os": "Windows",
        "instanceId": 11964,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Temporarily disabled with xit",
        "browserLogs": [],
        "screenShotFile": "009000f0-0028-0064-006e-00ff004100e9.png",
        "timestamp": 1578474865314,
        "duration": 0
    },
    {
        "description": "verify FAQ link | Verify FAQ| Verifying Home Page ",
        "passed": false,
        "pending": true,
        "os": "Windows",
        "instanceId": 11964,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Pending",
        "browserLogs": [],
        "screenShotFile": "00910074-00b2-0055-00bd-00c9006f00d8.png",
        "timestamp": 1578474865355,
        "duration": 0
    },
    {
        "description": "Navigating back and refresh the browser| Verify FAQ| Verifying Home Page ",
        "passed": false,
        "pending": true,
        "os": "Windows",
        "instanceId": 11964,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Temporarily disabled with xit",
        "browserLogs": [],
        "screenShotFile": "004a0023-0045-0085-0056-0053001e0011.png",
        "timestamp": 1578474865400,
        "duration": 0
    },
    {
        "description": "Verify Copyright at the Footer| Vevrify Copyright Text| Verifying Home Page ",
        "passed": false,
        "pending": false,
        "os": "Windows",
        "instanceId": 11964,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": [
            "Failed: No element found using locator: By(xpath, //small[contains(text(),'© 2019 ARCHWAY MARKETING SERVICES')])"
        ],
        "trace": [
            "NoSuchElementError: No element found using locator: By(xpath, //small[contains(text(),'© 2019 ARCHWAY MARKETING SERVICES')])\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:814:27\n    at ManagedPromise.invokeCallback_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\n    at processTicksAndRejections (internal/process/task_queues.js:93:5)Error\n    at ElementArrayFinder.applyAction_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:459:27)\n    at ElementArrayFinder.<computed> [as getText] (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:91:29)\n    at ElementFinder.<computed> [as getText] (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:831:22)\n    at UserContext.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars_Byer\\specs\\HomePage\\HomePage_spec.js:774:17)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\nFrom: Task: Run it(\"Verify Copyright at the Footer\") in control flow\n    at UserContext.<anonymous> (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:94:19)\n    at attempt (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4297:26)\n    at QueueRunner.run (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4217:20)\n    at runNext (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4257:20)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4264:13\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4172:9\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:64:48\n    at ControlFlow.emit (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\events.js:62:21)\n    at ControlFlow.shutdown_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2674:10)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2599:53\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars_Byer\\specs\\HomePage\\HomePage_spec.js:769:3)\n    at addSpecsToSuite (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Suite.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars_Byer\\specs\\HomePage\\HomePage_spec.js:767:2)\n    at addSpecsToSuite (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars_Byer\\specs\\HomePage\\HomePage_spec.js:14:1)"
        ],
        "browserLogs": [],
        "screenShotFile": "005900d3-0081-006e-00ce-007f003200de.png",
        "timestamp": 1578474865442,
        "duration": 55
    },
    {
        "description": "Verify UserCircle|Verify UserMenu| Verifying Home Page ",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 11964,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00df00e3-0023-0084-00c1-008f001a006c.png",
        "timestamp": 1578474865903,
        "duration": 5191
    },
    {
        "description": "Verify presence of User profile|Verify UserMenu| Verifying Home Page ",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 11964,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00a4001c-0041-00d3-008f-00c400de0002.png",
        "timestamp": 1578474871719,
        "duration": 67
    },
    {
        "description": "Verify presence of user address|Verify UserMenu| Verifying Home Page ",
        "passed": false,
        "pending": true,
        "os": "Windows",
        "instanceId": 11964,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Temporarily disabled with xit",
        "browserLogs": [],
        "screenShotFile": "00470096-003e-007e-0045-00c900e40095.png",
        "timestamp": 1578474872378,
        "duration": 0
    },
    {
        "description": "Verify User Logout Option|Verify UserMenu| Verifying Home Page ",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 11964,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "004000c3-0048-008f-0083-00330016000e.png",
        "timestamp": 1578474872418,
        "duration": 3069
    },
    {
        "description": "Quick Add : Enter product and quantity successfully|Add Item to cart by  Quick Add and verify contents present on page ",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 11964,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed",
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "https://archway-forduaw-qa.azurewebsites.net/products?pageSize=15&sortBy=ID - [DOM] Found 15 elements with non-unique id #quantity: (More info: https://goo.gl/9p2vKq) %o %o %o %o %o %o %o %o %o %o %o %o %o %o %o",
                "timestamp": 1578474888265,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://archway-forduaw-qa.azurewebsites.net/products?pageSize=15&sortBy=ID - [DOM] Found 15 elements with non-unique id #quantity: (More info: https://goo.gl/9p2vKq) %o %o %o %o %o %o %o %o %o %o %o %o %o %o %o",
                "timestamp": 1578474888265,
                "type": ""
            }
        ],
        "screenShotFile": "00710062-0099-0031-0092-0027000b0055.png",
        "timestamp": 1578474876077,
        "duration": 12181
    },
    {
        "description": "should pan plots when you click and drag|Add Item to cart by  Quick Add and verify contents present on page ",
        "passed": false,
        "pending": true,
        "os": "Windows",
        "instanceId": 11964,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Temporarily disabled with xit",
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "https://archway-forduaw-qa.azurewebsites.net/products?pageSize=15&sortBy=ID - [DOM] Found 15 elements with non-unique id #quantity: (More info: https://goo.gl/9p2vKq) %o %o %o %o %o %o %o %o %o %o %o %o %o %o %o",
                "timestamp": 1578474888646,
                "type": ""
            }
        ],
        "screenShotFile": "00a700ca-0008-00d8-0013-007f002b00f5.png",
        "timestamp": 1578474888812,
        "duration": 0
    },
    {
        "description": "verify Sort option is present on Add To Cart screen |Add Item to cart by  Quick Add and verify contents present on page ",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 11964,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00cc00d7-0066-0094-0009-0097005900bb.png",
        "timestamp": 1578474888859,
        "duration": 111
    },
    {
        "description": "verify Refine By text on Add To Cart screen|Add Item to cart by  Quick Add and verify contents present on page ",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 11964,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00e1002e-004d-006d-00f5-00f000620091.png",
        "timestamp": 1578474889414,
        "duration": 115
    },
    {
        "description": "verify My Favorites link|Add Item to cart by  Quick Add and verify contents present on page ",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 11964,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "000a0040-005e-0029-004e-0069009100de.png",
        "timestamp": 1578474889953,
        "duration": 250
    },
    {
        "description": "Verify Quick Add Header label text|Add Item to cart by  Quick Add and verify contents present on page ",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 11964,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00250054-001e-0033-006d-009a007e00e4.png",
        "timestamp": 1578474890636,
        "duration": 82
    },
    {
        "description": "Verify lable of item |Add Item to cart by  Quick Add and verify contents present on page ",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 11964,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00b80022-00e5-0075-0093-002a002d00f6.png",
        "timestamp": 1578474891141,
        "duration": 79
    },
    {
        "description": "Verify lable of qty |Add Item to cart by  Quick Add and verify contents present on page ",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 11964,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00d60093-00a5-0068-0028-007300d40020.png",
        "timestamp": 1578474891624,
        "duration": 72
    },
    {
        "description": "TC_004:Verify Add to Cart button is present on the page|Add Item to cart by  Quick Add and verify contents present on page ",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 11964,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00fe001e-0066-0013-006f-001000630018.png",
        "timestamp": 1578474892100,
        "duration": 35
    },
    {
        "description": "Verify Add item and Quantity and click on checkout|Add Item to cart by  Quick Add and verify contents present on page ",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 11964,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "004e0085-0081-007b-00e1-00ee00ff0016.png",
        "timestamp": 1578474892549,
        "duration": 28809
    },
    {
        "description": "checkout case for One time Address|CheckOut Verfication",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 11964,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed",
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "https://archway-forduaw-qa.azurewebsites.net/cart - [DOM] Found 2 elements with non-unique id #quantity: (More info: https://goo.gl/9p2vKq) %o %o",
                "timestamp": 1578474923838,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://archway-forduaw-qa.azurewebsites.net/main.8135115ee1375ec49609.js 0:1503642 \"\\n      It looks like you're using the disabled attribute with a reactive form directive. If you set disabled to true\\n      when you set up this control in your component class, the disabled attribute will actually be set in the DOM for\\n      you. We recommend using this approach to avoid 'changed after checked' errors.\\n       \\n      Example: \\n      form = new FormGroup({\\n        first: new FormControl({value: 'Nancy', disabled: true}, Validators.required),\\n        last: new FormControl('Drew', Validators.required)\\n      });\\n    \"",
                "timestamp": 1578474924031,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://archway-forduaw-qa.azurewebsites.net/main.8135115ee1375ec49609.js 0:1503642 \"\\n      It looks like you're using the disabled attribute with a reactive form directive. If you set disabled to true\\n      when you set up this control in your component class, the disabled attribute will actually be set in the DOM for\\n      you. We recommend using this approach to avoid 'changed after checked' errors.\\n       \\n      Example: \\n      form = new FormGroup({\\n        first: new FormControl({value: 'Nancy', disabled: true}, Validators.required),\\n        last: new FormControl('Drew', Validators.required)\\n      });\\n    \"",
                "timestamp": 1578474924077,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://archway-forduaw-qa.azurewebsites.net/checkout - [DOM] Found 2 elements with non-unique id #search-addon: (More info: https://goo.gl/9p2vKq) %o %o",
                "timestamp": 1578474929129,
                "type": ""
            }
        ],
        "screenShotFile": "006e000e-0003-00de-0037-007200cb006e.png",
        "timestamp": 1578474921802,
        "duration": 7321
    },
    {
        "description": "checkout process|CheckOut Verfication",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 11964,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "0032007a-00a4-00a1-00e4-002400300028.png",
        "timestamp": 1578474929508,
        "duration": 17400
    },
    {
        "description": "Verify order has submitted|CheckOut Verfication",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 11964,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00460031-00dc-00b4-00d5-00db00e600a8.png",
        "timestamp": 1578474947310,
        "duration": 49
    },
    {
        "description": "Verify submited order Number |CheckOut Verfication",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 11964,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "003f0017-0037-0017-005e-00b400b3005b.png",
        "timestamp": 1578474947737,
        "duration": 59
    },
    {
        "description": "Shipping Method Text is present when order is confirmed|CheckOut Verfication",
        "passed": false,
        "pending": true,
        "os": "Windows",
        "instanceId": 11964,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Temporarily disabled with xit",
        "browserLogs": [],
        "screenShotFile": "00940091-00e7-00ca-00e8-00c6002a00e6.png",
        "timestamp": 1578474948208,
        "duration": 0
    },
    {
        "description": " vrify Shipping Method  is same that user has selected while palcing the order|CheckOut Verfication",
        "passed": false,
        "pending": true,
        "os": "Windows",
        "instanceId": 11964,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Temporarily disabled with xit",
        "browserLogs": [],
        "screenShotFile": "005f0051-0016-005f-0072-001400d000d6.png",
        "timestamp": 1578474948279,
        "duration": 0
    },
    {
        "description": "Subtotal Text is present when order is confirmed|CheckOut Verfication",
        "passed": false,
        "pending": true,
        "os": "Windows",
        "instanceId": 11964,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Temporarily disabled with xit",
        "browserLogs": [],
        "screenShotFile": "001a0086-00af-005f-0099-00f400ee0014.png",
        "timestamp": 1578474948328,
        "duration": 0
    },
    {
        "description": " verify Subtotal value is correct|CheckOut Verfication",
        "passed": false,
        "pending": true,
        "os": "Windows",
        "instanceId": 11964,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Temporarily disabled with xit",
        "browserLogs": [],
        "screenShotFile": "00670097-00ad-0076-0073-004a0099001d.png",
        "timestamp": 1578474948376,
        "duration": 0
    },
    {
        "description": " verify print option|CheckOut Verfication",
        "passed": false,
        "pending": true,
        "os": "Windows",
        "instanceId": 11964,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Temporarily disabled with xit",
        "browserLogs": [],
        "screenShotFile": "000300cf-009a-0088-0097-005800380060.png",
        "timestamp": 1578474948424,
        "duration": 0
    },
    {
        "description": "User should log out successfully from application|Log out ",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 11964,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "004600d3-0014-003c-0031-006c001f0099.png",
        "timestamp": 1578474948482,
        "duration": 9231
    },
    {
        "description": "verify successfull Logout|Log out ",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 11964,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00e2003c-0075-0075-0012-001900fe0099.png",
        "timestamp": 1578474958163,
        "duration": 37
    },
    {
        "description": "should login the user|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 4748,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "0006001d-004a-00f9-00c8-00da008f0029.png",
        "timestamp": 1578487042047,
        "duration": 16129
    },
    {
        "description": "Forgot password link present on the Login page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 4748,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00b70013-0027-0001-00a2-006c0049002e.png",
        "timestamp": 1578487059493,
        "duration": 89
    },
    {
        "description": "Create Account link present on the Login page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 4748,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "007700b0-00da-004c-00ac-003e0051003a.png",
        "timestamp": 1578487059977,
        "duration": 43
    },
    {
        "description": "Contact Us  link present on the Login Page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 4748,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00b100a7-0018-005b-008c-0008001700a6.png",
        "timestamp": 1578487060435,
        "duration": 42
    },
    {
        "description": "Verify comapny copyright text at the footer of the login page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 4748,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "009d00eb-00d9-00b2-0051-00c5008a00d3.png",
        "timestamp": 1578487060861,
        "duration": 24
    },
    {
        "description": "Verify Username labeling is preseet|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 4748,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00e9002a-00cb-0000-0096-001600950032.png",
        "timestamp": 1578487061271,
        "duration": 4
    },
    {
        "description": "Verify password label is present|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 4748,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "002a003e-0049-0017-00c2-000800a6008d.png",
        "timestamp": 1578487061681,
        "duration": 3
    },
    {
        "description": "Verify Remember Me check box|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 4748,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "005b009b-00ce-007a-00ce-005500880061.png",
        "timestamp": 1578487062066,
        "duration": 212
    },
    {
        "description": "verify the title of the Page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 4748,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "006100f7-0058-00ae-00dc-00cf007200d6.png",
        "timestamp": 1578487062669,
        "duration": 12
    },
    {
        "description": "veriy all links present on page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 4748,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "00010047-0016-000d-00f7-00e50010001a.png",
        "timestamp": 1578487063070,
        "duration": 59
    },
    {
        "description": "User Login successfully |Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 4748,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "005400e3-0092-0012-00d8-004800670066.png",
        "timestamp": 1578487063507,
        "duration": 16650
    },
    {
        "description": "Quick Add : Enter product and quantity successfully|Add Item to cart by  Quick Add and verify contents present on page ",
        "passed": false,
        "pending": false,
        "os": "Windows",
        "instanceId": 4748,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": [
            "Failed: browser.actions(...).mouseMMove is not a function"
        ],
        "trace": [
            "TypeError: browser.actions(...).mouseMMove is not a function\n    at UserContext.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars_Byer\\specs\\AddItem\\AddItem_quickadd_spec.js:52:23)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2974:25\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\n    at processTicksAndRejections (internal/process/task_queues.js:93:5)\nFrom: Task: Run it(\"Quick Add : Enter product and quantity successfully\") in control flow\n    at UserContext.<anonymous> (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:94:19)\n    at attempt (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4297:26)\n    at QueueRunner.run (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4217:20)\n    at runNext (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4257:20)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4264:13\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4172:9\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:64:48\n    at ControlFlow.emit (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\events.js:62:21)\n    at ControlFlow.shutdown_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2674:10)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2599:53\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars_Byer\\specs\\AddItem\\AddItem_quickadd_spec.js:39:6)\n    at addSpecsToSuite (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars_Byer\\specs\\AddItem\\AddItem_quickadd_spec.js:16:1)\n    at Module._compile (internal/modules/cjs/loader.js:956:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:973:10)\n    at Module.load (internal/modules/cjs/loader.js:812:32)\n    at Function.Module._load (internal/modules/cjs/loader.js:724:14)"
        ],
        "browserLogs": [],
        "screenShotFile": "00300064-0080-007f-0031-00800013007b.png",
        "timestamp": 1578487080565,
        "duration": 142
    },
    {
        "description": "should pan plots when you click and drag|Add Item to cart by  Quick Add and verify contents present on page ",
        "passed": false,
        "pending": true,
        "os": "Windows",
        "instanceId": 4748,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Temporarily disabled with xit",
        "browserLogs": [],
        "screenShotFile": "006e00be-00a2-00e1-0029-00c100e900f9.png",
        "timestamp": 1578487081110,
        "duration": 0
    },
    {
        "description": "verify Sort option is present on Add To Cart screen |Add Item to cart by  Quick Add and verify contents present on page ",
        "passed": false,
        "pending": false,
        "os": "Windows",
        "instanceId": 4748,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": [
            "Failed: No element found using locator: By(xpath, //label[@class='pt-1 pr-1 d-none d-md-block'][contains(text(),'Sort By')])"
        ],
        "trace": [
            "NoSuchElementError: No element found using locator: By(xpath, //label[@class='pt-1 pr-1 d-none d-md-block'][contains(text(),'Sort By')])\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:814:27\n    at ManagedPromise.invokeCallback_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\n    at processTicksAndRejections (internal/process/task_queues.js:93:5)Error\n    at ElementArrayFinder.applyAction_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:459:27)\n    at ElementArrayFinder.<computed> [as isDisplayed] (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:91:29)\n    at ElementFinder.<computed> [as isDisplayed] (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:831:22)\n    at UserContext.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars_Byer\\specs\\AddItem\\AddItem_quickadd_spec.js:72:21)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\nFrom: Task: Run it(\"verify Sort option is present on Add To Cart screen \") in control flow\n    at UserContext.<anonymous> (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:94:19)\n    at attempt (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4297:26)\n    at QueueRunner.run (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4217:20)\n    at runNext (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4257:20)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4264:13\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4172:9\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:64:48\n    at ControlFlow.emit (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\events.js:62:21)\n    at ControlFlow.shutdown_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2674:10)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2599:53\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars_Byer\\specs\\AddItem\\AddItem_quickadd_spec.js:67:3)\n    at addSpecsToSuite (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars_Byer\\specs\\AddItem\\AddItem_quickadd_spec.js:16:1)\n    at Module._compile (internal/modules/cjs/loader.js:956:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:973:10)\n    at Module.load (internal/modules/cjs/loader.js:812:32)\n    at Function.Module._load (internal/modules/cjs/loader.js:724:14)"
        ],
        "browserLogs": [],
        "screenShotFile": "003a002c-003a-0049-005e-00e1009a009c.png",
        "timestamp": 1578487081159,
        "duration": 40
    },
    {
        "description": "verify Refine By text on Add To Cart screen|Add Item to cart by  Quick Add and verify contents present on page ",
        "passed": false,
        "pending": false,
        "os": "Windows",
        "instanceId": 4748,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": [
            "Failed: No element found using locator: By(xpath, //strong[contains(text(),'Refine By')])"
        ],
        "trace": [
            "NoSuchElementError: No element found using locator: By(xpath, //strong[contains(text(),'Refine By')])\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:814:27\n    at ManagedPromise.invokeCallback_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\n    at processTicksAndRejections (internal/process/task_queues.js:93:5)Error\n    at ElementArrayFinder.applyAction_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:459:27)\n    at ElementArrayFinder.<computed> [as isDisplayed] (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:91:29)\n    at ElementFinder.<computed> [as isDisplayed] (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:831:22)\n    at UserContext.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars_Byer\\specs\\AddItem\\AddItem_quickadd_spec.js:95:20)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\nFrom: Task: Run it(\"verify Refine By text on Add To Cart screen\") in control flow\n    at UserContext.<anonymous> (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:94:19)\n    at attempt (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4297:26)\n    at QueueRunner.run (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4217:20)\n    at runNext (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4257:20)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4264:13\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4172:9\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:64:48\n    at ControlFlow.emit (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\events.js:62:21)\n    at ControlFlow.shutdown_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2674:10)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2599:53\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars_Byer\\specs\\AddItem\\AddItem_quickadd_spec.js:90:6)\n    at addSpecsToSuite (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars_Byer\\specs\\AddItem\\AddItem_quickadd_spec.js:16:1)\n    at Module._compile (internal/modules/cjs/loader.js:956:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:973:10)\n    at Module.load (internal/modules/cjs/loader.js:812:32)\n    at Function.Module._load (internal/modules/cjs/loader.js:724:14)"
        ],
        "browserLogs": [],
        "screenShotFile": "005a00cf-001d-0022-00da-00bd001800ae.png",
        "timestamp": 1578487081574,
        "duration": 26
    },
    {
        "description": "verify My Favorites link|Add Item to cart by  Quick Add and verify contents present on page ",
        "passed": false,
        "pending": false,
        "os": "Windows",
        "instanceId": 4748,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": [
            "Failed: No element found using locator: By(xpath, //label[contains(text(),'My Favorites')])"
        ],
        "trace": [
            "NoSuchElementError: No element found using locator: By(xpath, //label[contains(text(),'My Favorites')])\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:814:27\n    at ManagedPromise.invokeCallback_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\n    at processTicksAndRejections (internal/process/task_queues.js:93:5)Error\n    at ElementArrayFinder.applyAction_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:459:27)\n    at ElementArrayFinder.<computed> [as isDisplayed] (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:91:29)\n    at ElementFinder.<computed> [as isDisplayed] (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:831:22)\n    at UserContext.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars_Byer\\specs\\AddItem\\AddItem_quickadd_spec.js:117:20)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\nFrom: Task: Run it(\"verify My Favorites link\") in control flow\n    at UserContext.<anonymous> (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:94:19)\n    at attempt (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4297:26)\n    at QueueRunner.run (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4217:20)\n    at runNext (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4257:20)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4264:13\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4172:9\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:64:48\n    at ControlFlow.emit (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\events.js:62:21)\n    at ControlFlow.shutdown_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2674:10)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2599:53\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars_Byer\\specs\\AddItem\\AddItem_quickadd_spec.js:112:6)\n    at addSpecsToSuite (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars_Byer\\specs\\AddItem\\AddItem_quickadd_spec.js:16:1)\n    at Module._compile (internal/modules/cjs/loader.js:956:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:973:10)\n    at Module.load (internal/modules/cjs/loader.js:812:32)\n    at Function.Module._load (internal/modules/cjs/loader.js:724:14)"
        ],
        "browserLogs": [],
        "screenShotFile": "006800d2-002d-00d1-00a6-006a00090096.png",
        "timestamp": 1578487081967,
        "duration": 25
    },
    {
        "description": "Verify Quick Add Header label text|Add Item to cart by  Quick Add and verify contents present on page ",
        "passed": false,
        "pending": false,
        "os": "Windows",
        "instanceId": 4748,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": [
            "Failed: No element found using locator: By(xpath, //div[@class='col-md-4 col-lg-3 d-md-block d-sm-none d-none']//strong[contains(text(),'Quick Add')])"
        ],
        "trace": [
            "NoSuchElementError: No element found using locator: By(xpath, //div[@class='col-md-4 col-lg-3 d-md-block d-sm-none d-none']//strong[contains(text(),'Quick Add')])\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:814:27\n    at ManagedPromise.invokeCallback_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\n    at processTicksAndRejections (internal/process/task_queues.js:93:5)Error\n    at ElementArrayFinder.applyAction_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:459:27)\n    at ElementArrayFinder.<computed> [as getText] (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:91:29)\n    at ElementFinder.<computed> [as getText] (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:831:22)\n    at UserContext.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars_Byer\\specs\\AddItem\\AddItem_quickadd_spec.js:140:24)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\nFrom: Task: Run it(\"Verify Quick Add Header label text\") in control flow\n    at UserContext.<anonymous> (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:94:19)\n    at attempt (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4297:26)\n    at QueueRunner.run (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4217:20)\n    at runNext (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4257:20)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4264:13\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4172:9\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:64:48\n    at ControlFlow.emit (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\events.js:62:21)\n    at ControlFlow.shutdown_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2674:10)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2599:53\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars_Byer\\specs\\AddItem\\AddItem_quickadd_spec.js:135:6)\n    at addSpecsToSuite (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars_Byer\\specs\\AddItem\\AddItem_quickadd_spec.js:16:1)\n    at Module._compile (internal/modules/cjs/loader.js:956:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:973:10)\n    at Module.load (internal/modules/cjs/loader.js:812:32)\n    at Function.Module._load (internal/modules/cjs/loader.js:724:14)"
        ],
        "browserLogs": [],
        "screenShotFile": "00900030-0042-0003-00e6-006200c9007f.png",
        "timestamp": 1578487082383,
        "duration": 23
    },
    {
        "description": "Verify lable of item |Add Item to cart by  Quick Add and verify contents present on page ",
        "passed": false,
        "pending": false,
        "os": "Windows",
        "instanceId": 4748,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": [
            "Expected false to be truthy.",
            "Failed: No element found using locator: By(xpath, //div[@class='col-md-4 col-lg-3 d-md-block d-sm-none d-none']//b[contains(text(),'Item')])"
        ],
        "trace": [
            "Error: Failed expectation\n    at UserContext.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars_Byer\\specs\\AddItem\\AddItem_quickadd_spec.js:177:37)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2974:25\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7",
            "NoSuchElementError: No element found using locator: By(xpath, //div[@class='col-md-4 col-lg-3 d-md-block d-sm-none d-none']//b[contains(text(),'Item')])\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:814:27\n    at ManagedPromise.invokeCallback_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\n    at processTicksAndRejections (internal/process/task_queues.js:93:5)Error\n    at ElementArrayFinder.applyAction_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:459:27)\n    at ElementArrayFinder.<computed> [as getText] (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:91:29)\n    at ElementFinder.<computed> [as getText] (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:831:22)\n    at UserContext.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars_Byer\\specs\\AddItem\\AddItem_quickadd_spec.js:179:17)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\nFrom: Task: Run it(\"Verify lable of item \") in control flow\n    at UserContext.<anonymous> (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:94:19)\n    at attempt (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4297:26)\n    at QueueRunner.run (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4217:20)\n    at runNext (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4257:20)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4264:13\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4172:9\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:64:48\n    at ControlFlow.emit (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\events.js:62:21)\n    at ControlFlow.shutdown_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2674:10)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2599:53\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars_Byer\\specs\\AddItem\\AddItem_quickadd_spec.js:173:2)\n    at addSpecsToSuite (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars_Byer\\specs\\AddItem\\AddItem_quickadd_spec.js:16:1)\n    at Module._compile (internal/modules/cjs/loader.js:956:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:973:10)\n    at Module.load (internal/modules/cjs/loader.js:812:32)\n    at Function.Module._load (internal/modules/cjs/loader.js:724:14)"
        ],
        "browserLogs": [],
        "screenShotFile": "00e8005d-00c4-00ee-00a8-00ac004300de.png",
        "timestamp": 1578487082805,
        "duration": 35
    },
    {
        "description": "Verify lable of qty |Add Item to cart by  Quick Add and verify contents present on page ",
        "passed": false,
        "pending": false,
        "os": "Windows",
        "instanceId": 4748,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": [
            "Expected false to be truthy.",
            "Failed: No element found using locator: By(xpath, //div[@class='col-md-4 col-lg-3 d-md-block d-sm-none d-none']//b[contains(text(),'Qty')])"
        ],
        "trace": [
            "Error: Failed expectation\n    at UserContext.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars_Byer\\specs\\AddItem\\AddItem_quickadd_spec.js:193:32)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2974:25\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7",
            "NoSuchElementError: No element found using locator: By(xpath, //div[@class='col-md-4 col-lg-3 d-md-block d-sm-none d-none']//b[contains(text(),'Qty')])\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:814:27\n    at ManagedPromise.invokeCallback_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\n    at processTicksAndRejections (internal/process/task_queues.js:93:5)Error\n    at ElementArrayFinder.applyAction_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:459:27)\n    at ElementArrayFinder.<computed> [as getText] (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:91:29)\n    at ElementFinder.<computed> [as getText] (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:831:22)\n    at UserContext.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars_Byer\\specs\\AddItem\\AddItem_quickadd_spec.js:195:12)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\nFrom: Task: Run it(\"Verify lable of qty \") in control flow\n    at UserContext.<anonymous> (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:94:19)\n    at attempt (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4297:26)\n    at QueueRunner.run (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4217:20)\n    at runNext (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4257:20)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4264:13\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4172:9\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:64:48\n    at ControlFlow.emit (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\events.js:62:21)\n    at ControlFlow.shutdown_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2674:10)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2599:53\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars_Byer\\specs\\AddItem\\AddItem_quickadd_spec.js:189:2)\n    at addSpecsToSuite (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars_Byer\\specs\\AddItem\\AddItem_quickadd_spec.js:16:1)\n    at Module._compile (internal/modules/cjs/loader.js:956:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:973:10)\n    at Module.load (internal/modules/cjs/loader.js:812:32)\n    at Function.Module._load (internal/modules/cjs/loader.js:724:14)"
        ],
        "browserLogs": [],
        "screenShotFile": "001b00b0-001e-0089-0083-0006005500b7.png",
        "timestamp": 1578487083221,
        "duration": 37
    },
    {
        "description": "TC_004:Verify Add to Cart button is present on the page|Add Item to cart by  Quick Add and verify contents present on page ",
        "passed": false,
        "pending": false,
        "os": "Windows",
        "instanceId": 4748,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": [
            "Expected false to be truthy."
        ],
        "trace": [
            "Error: Failed expectation\n    at UserContext.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars_Byer\\specs\\AddItem\\AddItem_quickadd_spec.js:209:34)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2974:25\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7"
        ],
        "browserLogs": [],
        "screenShotFile": "004d0098-00b1-0050-00f3-005a00db00fa.png",
        "timestamp": 1578487083649,
        "duration": 21
    },
    {
        "description": "Verify Add item and Quantity and click on checkout|Add Item to cart by  Quick Add and verify contents present on page ",
        "passed": false,
        "pending": false,
        "os": "Windows",
        "instanceId": 4748,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": [
            "Failed: No element found using locator: By(xpath, //input[@id='typeahead-basic'])"
        ],
        "trace": [
            "NoSuchElementError: No element found using locator: By(xpath, //input[@id='typeahead-basic'])\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:814:27\n    at ManagedPromise.invokeCallback_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\n    at processTicksAndRejections (internal/process/task_queues.js:93:5)Error\n    at ElementArrayFinder.applyAction_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:459:27)\n    at ElementArrayFinder.<computed> [as clear] (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:91:29)\n    at ElementFinder.<computed> [as clear] (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:831:22)\n    at addtoCart.enterItem (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars_Byer\\pageobjects\\AddItem\\AddItem.js:692:8)\n    at UserContext.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars_Byer\\specs\\AddItem\\AddItem_quickadd_spec.js:372:20)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\nFrom: Task: Run it(\"Verify Add item and Quantity and click on checkout\") in control flow\n    at UserContext.<anonymous> (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:94:19)\n    at attempt (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4297:26)\n    at QueueRunner.run (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4217:20)\n    at runNext (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4257:20)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4264:13\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4172:9\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:64:48\n    at ControlFlow.emit (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\events.js:62:21)\n    at ControlFlow.shutdown_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2674:10)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2599:53\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars_Byer\\specs\\AddItem\\AddItem_quickadd_spec.js:217:2)\n    at addSpecsToSuite (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars_Byer\\specs\\AddItem\\AddItem_quickadd_spec.js:16:1)\n    at Module._compile (internal/modules/cjs/loader.js:956:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:973:10)\n    at Module.load (internal/modules/cjs/loader.js:812:32)\n    at Function.Module._load (internal/modules/cjs/loader.js:724:14)"
        ],
        "browserLogs": [],
        "screenShotFile": "0066003b-002b-003a-008a-00a7005800dc.png",
        "timestamp": 1578487084065,
        "duration": 60
    },
    {
        "description": "should login the user|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 11772,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "000300ce-0087-009d-0035-00f1009500ed.png",
        "timestamp": 1578487095310,
        "duration": 14822
    },
    {
        "description": "Forgot password link present on the Login page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 11772,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00b800b9-0042-0025-00bf-00b500e1004d.png",
        "timestamp": 1578487110596,
        "duration": 69
    },
    {
        "description": "Create Account link present on the Login page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 11772,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00900027-001a-0054-00b7-00c5005d0054.png",
        "timestamp": 1578487111074,
        "duration": 74
    },
    {
        "description": "Contact Us  link present on the Login Page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 11772,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00140097-00f8-007a-00ff-00be00ad0061.png",
        "timestamp": 1578487111544,
        "duration": 38
    },
    {
        "description": "Verify comapny copyright text at the footer of the login page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 11772,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "00c00037-002d-009b-00bf-004500cc0098.png",
        "timestamp": 1578487112021,
        "duration": 22
    },
    {
        "description": "Verify Username labeling is preseet|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 11772,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "007a0088-00dd-009d-00ba-0020006c00c6.png",
        "timestamp": 1578487112406,
        "duration": 3
    },
    {
        "description": "Verify password label is present|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 11772,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00e600cd-00ce-0012-0035-009c00d9008d.png",
        "timestamp": 1578487112809,
        "duration": 3
    },
    {
        "description": "Verify Remember Me check box|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 11772,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "006b007f-00ad-003e-00f1-000b00080004.png",
        "timestamp": 1578487113189,
        "duration": 46
    },
    {
        "description": "verify the title of the Page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 11772,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "003b0076-00e7-0071-0055-0040006a0006.png",
        "timestamp": 1578487113618,
        "duration": 13
    },
    {
        "description": "veriy all links present on page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 11772,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "00fb0053-00f7-00a6-0088-00f800bc003a.png",
        "timestamp": 1578487114012,
        "duration": 44
    },
    {
        "description": "User Login successfully |Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 11772,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "004100e1-000f-00da-00c0-00720058006e.png",
        "timestamp": 1578487114442,
        "duration": 16606
    },
    {
        "description": "Quick Add : Enter product and quantity successfully|Add Item to cart by  Quick Add and verify contents present on page ",
        "passed": false,
        "pending": false,
        "os": "Windows",
        "instanceId": 11772,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": [
            "Failed: browser.actions(...).mouseMMove is not a function"
        ],
        "trace": [
            "TypeError: browser.actions(...).mouseMMove is not a function\n    at UserContext.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars_Byer\\specs\\AddItem\\AddItem_quickadd_spec.js:52:23)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2974:25\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\n    at processTicksAndRejections (internal/process/task_queues.js:93:5)\nFrom: Task: Run it(\"Quick Add : Enter product and quantity successfully\") in control flow\n    at UserContext.<anonymous> (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:94:19)\n    at attempt (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4297:26)\n    at QueueRunner.run (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4217:20)\n    at runNext (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4257:20)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4264:13\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4172:9\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:64:48\n    at ControlFlow.emit (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\events.js:62:21)\n    at ControlFlow.shutdown_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2674:10)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2599:53\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars_Byer\\specs\\AddItem\\AddItem_quickadd_spec.js:39:6)\n    at addSpecsToSuite (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars_Byer\\specs\\AddItem\\AddItem_quickadd_spec.js:16:1)\n    at Module._compile (internal/modules/cjs/loader.js:956:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:973:10)\n    at Module.load (internal/modules/cjs/loader.js:812:32)\n    at Function.Module._load (internal/modules/cjs/loader.js:724:14)"
        ],
        "browserLogs": [],
        "screenShotFile": "00c8009e-003c-00c0-0086-007d00d90092.png",
        "timestamp": 1578487131460,
        "duration": 10
    },
    {
        "description": "should pan plots when you click and drag|Add Item to cart by  Quick Add and verify contents present on page ",
        "passed": false,
        "pending": true,
        "os": "Windows",
        "instanceId": 11772,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Temporarily disabled with xit",
        "browserLogs": [],
        "screenShotFile": "00380022-0017-00a3-00d1-00a90032004e.png",
        "timestamp": 1578487131864,
        "duration": 0
    },
    {
        "description": "verify Sort option is present on Add To Cart screen |Add Item to cart by  Quick Add and verify contents present on page ",
        "passed": false,
        "pending": false,
        "os": "Windows",
        "instanceId": 11772,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": [
            "Failed: No element found using locator: By(xpath, //label[@class='pt-1 pr-1 d-none d-md-block'][contains(text(),'Sort By')])"
        ],
        "trace": [
            "NoSuchElementError: No element found using locator: By(xpath, //label[@class='pt-1 pr-1 d-none d-md-block'][contains(text(),'Sort By')])\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:814:27\n    at ManagedPromise.invokeCallback_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\n    at processTicksAndRejections (internal/process/task_queues.js:93:5)Error\n    at ElementArrayFinder.applyAction_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:459:27)\n    at ElementArrayFinder.<computed> [as isDisplayed] (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:91:29)\n    at ElementFinder.<computed> [as isDisplayed] (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:831:22)\n    at UserContext.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars_Byer\\specs\\AddItem\\AddItem_quickadd_spec.js:72:21)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\nFrom: Task: Run it(\"verify Sort option is present on Add To Cart screen \") in control flow\n    at UserContext.<anonymous> (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:94:19)\n    at attempt (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4297:26)\n    at QueueRunner.run (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4217:20)\n    at runNext (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4257:20)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4264:13\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4172:9\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:64:48\n    at ControlFlow.emit (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\events.js:62:21)\n    at ControlFlow.shutdown_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2674:10)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2599:53\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars_Byer\\specs\\AddItem\\AddItem_quickadd_spec.js:67:3)\n    at addSpecsToSuite (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars_Byer\\specs\\AddItem\\AddItem_quickadd_spec.js:16:1)\n    at Module._compile (internal/modules/cjs/loader.js:956:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:973:10)\n    at Module.load (internal/modules/cjs/loader.js:812:32)\n    at Function.Module._load (internal/modules/cjs/loader.js:724:14)"
        ],
        "browserLogs": [],
        "screenShotFile": "007100ef-0060-002f-0053-000500b4009b.png",
        "timestamp": 1578487131923,
        "duration": 42
    },
    {
        "description": "verify Refine By text on Add To Cart screen|Add Item to cart by  Quick Add and verify contents present on page ",
        "passed": false,
        "pending": false,
        "os": "Windows",
        "instanceId": 11772,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": [
            "Failed: No element found using locator: By(xpath, //strong[contains(text(),'Refine By')])"
        ],
        "trace": [
            "NoSuchElementError: No element found using locator: By(xpath, //strong[contains(text(),'Refine By')])\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:814:27\n    at ManagedPromise.invokeCallback_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\n    at processTicksAndRejections (internal/process/task_queues.js:93:5)Error\n    at ElementArrayFinder.applyAction_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:459:27)\n    at ElementArrayFinder.<computed> [as isDisplayed] (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:91:29)\n    at ElementFinder.<computed> [as isDisplayed] (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:831:22)\n    at UserContext.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars_Byer\\specs\\AddItem\\AddItem_quickadd_spec.js:95:20)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\nFrom: Task: Run it(\"verify Refine By text on Add To Cart screen\") in control flow\n    at UserContext.<anonymous> (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:94:19)\n    at attempt (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4297:26)\n    at QueueRunner.run (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4217:20)\n    at runNext (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4257:20)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4264:13\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4172:9\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:64:48\n    at ControlFlow.emit (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\events.js:62:21)\n    at ControlFlow.shutdown_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2674:10)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2599:53\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars_Byer\\specs\\AddItem\\AddItem_quickadd_spec.js:90:6)\n    at addSpecsToSuite (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars_Byer\\specs\\AddItem\\AddItem_quickadd_spec.js:16:1)\n    at Module._compile (internal/modules/cjs/loader.js:956:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:973:10)\n    at Module.load (internal/modules/cjs/loader.js:812:32)\n    at Function.Module._load (internal/modules/cjs/loader.js:724:14)"
        ],
        "browserLogs": [],
        "screenShotFile": "009300e8-00c9-000e-00b8-00440099001a.png",
        "timestamp": 1578487132414,
        "duration": 28
    },
    {
        "description": "verify My Favorites link|Add Item to cart by  Quick Add and verify contents present on page ",
        "passed": false,
        "pending": false,
        "os": "Windows",
        "instanceId": 11772,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": [
            "Failed: No element found using locator: By(xpath, //label[contains(text(),'My Favorites')])"
        ],
        "trace": [
            "NoSuchElementError: No element found using locator: By(xpath, //label[contains(text(),'My Favorites')])\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:814:27\n    at ManagedPromise.invokeCallback_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\n    at processTicksAndRejections (internal/process/task_queues.js:93:5)Error\n    at ElementArrayFinder.applyAction_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:459:27)\n    at ElementArrayFinder.<computed> [as isDisplayed] (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:91:29)\n    at ElementFinder.<computed> [as isDisplayed] (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:831:22)\n    at UserContext.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars_Byer\\specs\\AddItem\\AddItem_quickadd_spec.js:117:20)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\nFrom: Task: Run it(\"verify My Favorites link\") in control flow\n    at UserContext.<anonymous> (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:94:19)\n    at attempt (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4297:26)\n    at QueueRunner.run (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4217:20)\n    at runNext (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4257:20)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4264:13\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4172:9\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:64:48\n    at ControlFlow.emit (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\events.js:62:21)\n    at ControlFlow.shutdown_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2674:10)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2599:53\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars_Byer\\specs\\AddItem\\AddItem_quickadd_spec.js:112:6)\n    at addSpecsToSuite (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars_Byer\\specs\\AddItem\\AddItem_quickadd_spec.js:16:1)\n    at Module._compile (internal/modules/cjs/loader.js:956:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:973:10)\n    at Module.load (internal/modules/cjs/loader.js:812:32)\n    at Function.Module._load (internal/modules/cjs/loader.js:724:14)"
        ],
        "browserLogs": [],
        "screenShotFile": "00f400fd-0091-0020-00c5-00f600ff0075.png",
        "timestamp": 1578487132864,
        "duration": 26
    },
    {
        "description": "Verify Quick Add Header label text|Add Item to cart by  Quick Add and verify contents present on page ",
        "passed": false,
        "pending": false,
        "os": "Windows",
        "instanceId": 11772,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": [
            "Failed: No element found using locator: By(xpath, //div[@class='col-md-4 col-lg-3 d-md-block d-sm-none d-none']//strong[contains(text(),'Quick Add')])"
        ],
        "trace": [
            "NoSuchElementError: No element found using locator: By(xpath, //div[@class='col-md-4 col-lg-3 d-md-block d-sm-none d-none']//strong[contains(text(),'Quick Add')])\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:814:27\n    at ManagedPromise.invokeCallback_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\n    at processTicksAndRejections (internal/process/task_queues.js:93:5)Error\n    at ElementArrayFinder.applyAction_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:459:27)\n    at ElementArrayFinder.<computed> [as getText] (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:91:29)\n    at ElementFinder.<computed> [as getText] (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:831:22)\n    at UserContext.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars_Byer\\specs\\AddItem\\AddItem_quickadd_spec.js:140:24)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\nFrom: Task: Run it(\"Verify Quick Add Header label text\") in control flow\n    at UserContext.<anonymous> (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:94:19)\n    at attempt (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4297:26)\n    at QueueRunner.run (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4217:20)\n    at runNext (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4257:20)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4264:13\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4172:9\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:64:48\n    at ControlFlow.emit (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\events.js:62:21)\n    at ControlFlow.shutdown_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2674:10)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2599:53\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars_Byer\\specs\\AddItem\\AddItem_quickadd_spec.js:135:6)\n    at addSpecsToSuite (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars_Byer\\specs\\AddItem\\AddItem_quickadd_spec.js:16:1)\n    at Module._compile (internal/modules/cjs/loader.js:956:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:973:10)\n    at Module.load (internal/modules/cjs/loader.js:812:32)\n    at Function.Module._load (internal/modules/cjs/loader.js:724:14)"
        ],
        "browserLogs": [],
        "screenShotFile": "00ff00e9-0070-009d-003f-00b90028007f.png",
        "timestamp": 1578487133285,
        "duration": 26
    },
    {
        "description": "Verify lable of item |Add Item to cart by  Quick Add and verify contents present on page ",
        "passed": false,
        "pending": false,
        "os": "Windows",
        "instanceId": 11772,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": [
            "Expected false to be truthy.",
            "Failed: No element found using locator: By(xpath, //div[@class='col-md-4 col-lg-3 d-md-block d-sm-none d-none']//b[contains(text(),'Item')])"
        ],
        "trace": [
            "Error: Failed expectation\n    at UserContext.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars_Byer\\specs\\AddItem\\AddItem_quickadd_spec.js:177:37)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2974:25\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7",
            "NoSuchElementError: No element found using locator: By(xpath, //div[@class='col-md-4 col-lg-3 d-md-block d-sm-none d-none']//b[contains(text(),'Item')])\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:814:27\n    at ManagedPromise.invokeCallback_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\n    at processTicksAndRejections (internal/process/task_queues.js:93:5)Error\n    at ElementArrayFinder.applyAction_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:459:27)\n    at ElementArrayFinder.<computed> [as getText] (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:91:29)\n    at ElementFinder.<computed> [as getText] (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:831:22)\n    at UserContext.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars_Byer\\specs\\AddItem\\AddItem_quickadd_spec.js:179:17)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\nFrom: Task: Run it(\"Verify lable of item \") in control flow\n    at UserContext.<anonymous> (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:94:19)\n    at attempt (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4297:26)\n    at QueueRunner.run (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4217:20)\n    at runNext (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4257:20)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4264:13\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4172:9\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:64:48\n    at ControlFlow.emit (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\events.js:62:21)\n    at ControlFlow.shutdown_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2674:10)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2599:53\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars_Byer\\specs\\AddItem\\AddItem_quickadd_spec.js:173:2)\n    at addSpecsToSuite (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars_Byer\\specs\\AddItem\\AddItem_quickadd_spec.js:16:1)\n    at Module._compile (internal/modules/cjs/loader.js:956:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:973:10)\n    at Module.load (internal/modules/cjs/loader.js:812:32)\n    at Function.Module._load (internal/modules/cjs/loader.js:724:14)"
        ],
        "browserLogs": [],
        "screenShotFile": "00bd0053-0016-004c-006e-0023009200f6.png",
        "timestamp": 1578487133755,
        "duration": 52
    },
    {
        "description": "Verify lable of qty |Add Item to cart by  Quick Add and verify contents present on page ",
        "passed": false,
        "pending": false,
        "os": "Windows",
        "instanceId": 11772,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": [
            "Expected false to be truthy.",
            "Failed: No element found using locator: By(xpath, //div[@class='col-md-4 col-lg-3 d-md-block d-sm-none d-none']//b[contains(text(),'Qty')])"
        ],
        "trace": [
            "Error: Failed expectation\n    at UserContext.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars_Byer\\specs\\AddItem\\AddItem_quickadd_spec.js:193:32)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2974:25\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7",
            "NoSuchElementError: No element found using locator: By(xpath, //div[@class='col-md-4 col-lg-3 d-md-block d-sm-none d-none']//b[contains(text(),'Qty')])\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:814:27\n    at ManagedPromise.invokeCallback_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\n    at processTicksAndRejections (internal/process/task_queues.js:93:5)Error\n    at ElementArrayFinder.applyAction_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:459:27)\n    at ElementArrayFinder.<computed> [as getText] (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:91:29)\n    at ElementFinder.<computed> [as getText] (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:831:22)\n    at UserContext.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars_Byer\\specs\\AddItem\\AddItem_quickadd_spec.js:195:12)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\nFrom: Task: Run it(\"Verify lable of qty \") in control flow\n    at UserContext.<anonymous> (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:94:19)\n    at attempt (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4297:26)\n    at QueueRunner.run (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4217:20)\n    at runNext (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4257:20)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4264:13\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4172:9\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:64:48\n    at ControlFlow.emit (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\events.js:62:21)\n    at ControlFlow.shutdown_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2674:10)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2599:53\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars_Byer\\specs\\AddItem\\AddItem_quickadd_spec.js:189:2)\n    at addSpecsToSuite (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars_Byer\\specs\\AddItem\\AddItem_quickadd_spec.js:16:1)\n    at Module._compile (internal/modules/cjs/loader.js:956:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:973:10)\n    at Module.load (internal/modules/cjs/loader.js:812:32)\n    at Function.Module._load (internal/modules/cjs/loader.js:724:14)"
        ],
        "browserLogs": [],
        "screenShotFile": "004e005e-008c-003c-0014-00e200ab0029.png",
        "timestamp": 1578487134205,
        "duration": 40
    },
    {
        "description": "TC_004:Verify Add to Cart button is present on the page|Add Item to cart by  Quick Add and verify contents present on page ",
        "passed": false,
        "pending": false,
        "os": "Windows",
        "instanceId": 11772,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": [
            "Expected false to be truthy."
        ],
        "trace": [
            "Error: Failed expectation\n    at UserContext.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars_Byer\\specs\\AddItem\\AddItem_quickadd_spec.js:209:34)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2974:25\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7"
        ],
        "browserLogs": [],
        "screenShotFile": "008000d6-0002-00b2-0092-00d500e500e9.png",
        "timestamp": 1578487134657,
        "duration": 24
    },
    {
        "description": "Verify Add item and Quantity and click on checkout|Add Item to cart by  Quick Add and verify contents present on page ",
        "passed": false,
        "pending": false,
        "os": "Windows",
        "instanceId": 11772,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": [
            "Failed: No element found using locator: By(xpath, //input[@id='typeahead-basic'])"
        ],
        "trace": [
            "NoSuchElementError: No element found using locator: By(xpath, //input[@id='typeahead-basic'])\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:814:27\n    at ManagedPromise.invokeCallback_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\n    at processTicksAndRejections (internal/process/task_queues.js:93:5)Error\n    at ElementArrayFinder.applyAction_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:459:27)\n    at ElementArrayFinder.<computed> [as clear] (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:91:29)\n    at ElementFinder.<computed> [as clear] (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:831:22)\n    at addtoCart.enterItem (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars_Byer\\pageobjects\\AddItem\\AddItem.js:692:8)\n    at UserContext.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars_Byer\\specs\\AddItem\\AddItem_quickadd_spec.js:372:20)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\nFrom: Task: Run it(\"Verify Add item and Quantity and click on checkout\") in control flow\n    at UserContext.<anonymous> (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:94:19)\n    at attempt (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4297:26)\n    at QueueRunner.run (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4217:20)\n    at runNext (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4257:20)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4264:13\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4172:9\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:64:48\n    at ControlFlow.emit (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\events.js:62:21)\n    at ControlFlow.shutdown_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2674:10)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2599:53\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars_Byer\\specs\\AddItem\\AddItem_quickadd_spec.js:217:2)\n    at addSpecsToSuite (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars_Byer\\specs\\AddItem\\AddItem_quickadd_spec.js:16:1)\n    at Module._compile (internal/modules/cjs/loader.js:956:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:973:10)\n    at Module.load (internal/modules/cjs/loader.js:812:32)\n    at Function.Module._load (internal/modules/cjs/loader.js:724:14)"
        ],
        "browserLogs": [],
        "screenShotFile": "00a300b2-00a9-003c-0071-00c200c80088.png",
        "timestamp": 1578487135090,
        "duration": 64
    },
    {
        "description": "should login the user|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 9632,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "00900031-0083-00e4-0050-00700018006e.png",
        "timestamp": 1578487161624,
        "duration": 14275
    },
    {
        "description": "Forgot password link present on the Login page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 9632,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00a800f5-00f6-00b9-00bd-00ec00dc0008.png",
        "timestamp": 1578487176416,
        "duration": 67
    },
    {
        "description": "Create Account link present on the Login page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 9632,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00eb0008-000f-0096-008b-00880068002b.png",
        "timestamp": 1578487176906,
        "duration": 68
    },
    {
        "description": "Contact Us  link present on the Login Page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 9632,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "0034008e-0071-008e-006b-0052005500ae.png",
        "timestamp": 1578487177439,
        "duration": 52
    },
    {
        "description": "Verify comapny copyright text at the footer of the login page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 9632,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "00070001-001a-00eb-00ae-00120050002d.png",
        "timestamp": 1578487177890,
        "duration": 24
    },
    {
        "description": "Verify Username labeling is preseet|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 9632,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "002e009b-008d-0027-00c6-003a00e100a0.png",
        "timestamp": 1578487178340,
        "duration": 4
    },
    {
        "description": "Verify password label is present|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 9632,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00990079-00d4-00f8-0058-00b5001300ec.png",
        "timestamp": 1578487178731,
        "duration": 3
    },
    {
        "description": "Verify Remember Me check box|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 9632,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00e300ca-00be-0038-00df-009c0001001d.png",
        "timestamp": 1578487179124,
        "duration": 41
    },
    {
        "description": "verify the title of the Page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 9632,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00f50062-00fd-005f-009d-00f1009b00c5.png",
        "timestamp": 1578487179576,
        "duration": 13
    },
    {
        "description": "veriy all links present on page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 9632,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "00d0000e-0051-00f6-0047-003f00dd00a8.png",
        "timestamp": 1578487180003,
        "duration": 63
    },
    {
        "description": "User Login successfully |Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 9632,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00b50047-0096-0023-00c7-005700670034.png",
        "timestamp": 1578487180457,
        "duration": 16722
    },
    {
        "description": "Quick Add : Enter product and quantity successfully|Add Item to cart by  Quick Add and verify contents present on page ",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 9632,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed",
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "https://archway-forduaw-qa.azurewebsites.net/products?pageSize=15&sortBy=ID - [DOM] Found 15 elements with non-unique id #quantity: (More info: https://goo.gl/9p2vKq) %o %o %o %o %o %o %o %o %o %o %o %o %o %o %o",
                "timestamp": 1578487209775,
                "type": ""
            }
        ],
        "screenShotFile": "00920004-0064-00f1-00ab-001600d600cd.png",
        "timestamp": 1578487197588,
        "duration": 12178
    },
    {
        "description": "should pan plots when you click and drag|Add Item to cart by  Quick Add and verify contents present on page ",
        "passed": false,
        "pending": true,
        "os": "Windows",
        "instanceId": 9632,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Temporarily disabled with xit",
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "https://archway-forduaw-qa.azurewebsites.net/products?pageSize=15&sortBy=ID - [DOM] Found 15 elements with non-unique id #quantity: (More info: https://goo.gl/9p2vKq) %o %o %o %o %o %o %o %o %o %o %o %o %o %o %o",
                "timestamp": 1578487209876,
                "type": ""
            }
        ],
        "screenShotFile": "002c004c-00a1-00bc-0027-00f7001f00c0.png",
        "timestamp": 1578487210297,
        "duration": 0
    },
    {
        "description": "verify Sort option is present on Add To Cart screen |Add Item to cart by  Quick Add and verify contents present on page ",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 9632,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00fe0089-00a0-00ac-00e4-008200380014.png",
        "timestamp": 1578487210354,
        "duration": 121
    },
    {
        "description": "verify Refine By text on Add To Cart screen|Add Item to cart by  Quick Add and verify contents present on page ",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 9632,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "005800b8-00ff-0023-0025-006d00a100e6.png",
        "timestamp": 1578487210916,
        "duration": 154
    },
    {
        "description": "verify My Favorites link|Add Item to cart by  Quick Add and verify contents present on page ",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 9632,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "001100f0-00cd-002e-0022-0045008f007f.png",
        "timestamp": 1578487211531,
        "duration": 164
    },
    {
        "description": "Verify Quick Add Header label text|Add Item to cart by  Quick Add and verify contents present on page ",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 9632,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00a9003b-000c-0068-000d-001a007a006d.png",
        "timestamp": 1578487212123,
        "duration": 96
    },
    {
        "description": "Verify lable of item |Add Item to cart by  Quick Add and verify contents present on page ",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 9632,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "0093000d-0099-0046-0003-00ce009d007e.png",
        "timestamp": 1578487212674,
        "duration": 67
    },
    {
        "description": "Verify lable of qty |Add Item to cart by  Quick Add and verify contents present on page ",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 9632,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00f00058-0041-00c7-000b-00d7000700ea.png",
        "timestamp": 1578487213231,
        "duration": 103
    },
    {
        "description": "TC_004:Verify Add to Cart button is present on the page|Add Item to cart by  Quick Add and verify contents present on page ",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 9632,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "009e004c-0043-008f-00c2-00c6008e00e9.png",
        "timestamp": 1578487213834,
        "duration": 58
    },
    {
        "description": "Verify Add item and Quantity and click on checkout|Add Item to cart by  Quick Add and verify contents present on page ",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 9632,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "004f005d-0032-00f0-00f3-00f200dc00e4.png",
        "timestamp": 1578487214286,
        "duration": 28912
    },
    {
        "description": "should login the user|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 9768,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "00940020-00fc-0058-005f-004c0001009b.png",
        "timestamp": 1578489567280,
        "duration": 18212
    },
    {
        "description": "Forgot password link present on the Login page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 9768,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00d900a9-00d3-001d-00d4-00ff00220005.png",
        "timestamp": 1578489586072,
        "duration": 100
    },
    {
        "description": "Create Account link present on the Login page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 9768,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00c400e1-00fe-008b-0026-009100d700ce.png",
        "timestamp": 1578489586568,
        "duration": 64
    },
    {
        "description": "Contact Us  link present on the Login Page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 9768,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "001b0096-00d3-0056-00dc-00a1003c0015.png",
        "timestamp": 1578489587036,
        "duration": 54
    },
    {
        "description": "Verify comapny copyright text at the footer of the login page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 9768,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "00450033-00f9-0024-00bd-00040039005f.png",
        "timestamp": 1578489587478,
        "duration": 31
    },
    {
        "description": "Verify Username labeling is preseet|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 9768,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00090017-00f0-009c-001a-0071005d00de.png",
        "timestamp": 1578489587947,
        "duration": 4
    },
    {
        "description": "Verify password label is present|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 9768,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00dc006e-00e4-00bc-001c-004000d5006a.png",
        "timestamp": 1578489588306,
        "duration": 4
    },
    {
        "description": "Verify Remember Me check box|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 9768,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "001f00c5-0025-005c-00af-007c00ae00e7.png",
        "timestamp": 1578489588711,
        "duration": 52
    },
    {
        "description": "verify the title of the Page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 9768,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "0055001a-00ab-00bd-00d2-004e000800bb.png",
        "timestamp": 1578489589162,
        "duration": 23
    },
    {
        "description": "veriy all links present on page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 9768,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "006e00f2-001b-00c6-00d5-00c6005300f8.png",
        "timestamp": 1578489589579,
        "duration": 53
    },
    {
        "description": "should login the user|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 6000,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "0009005b-00e5-00dd-00df-00fc003700f3.png",
        "timestamp": 1578490357496,
        "duration": 14642
    },
    {
        "description": "Forgot password link present on the Login page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 6000,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "006200e5-00d1-0074-006a-006200cc002f.png",
        "timestamp": 1578490372650,
        "duration": 97
    },
    {
        "description": "Create Account link present on the Login page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 6000,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "0053003c-00a9-0022-00c0-00be001e0009.png",
        "timestamp": 1578490373156,
        "duration": 64
    },
    {
        "description": "Contact Us  link present on the Login Page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 6000,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00760058-003d-009a-001f-003400940096.png",
        "timestamp": 1578490373588,
        "duration": 58
    },
    {
        "description": "Verify comapny copyright text at the footer of the login page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 6000,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "007600e9-00e0-00bd-0002-00f0005200c3.png",
        "timestamp": 1578490374041,
        "duration": 24
    },
    {
        "description": "Verify Username labeling is preseet|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 6000,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00b4001f-0047-00eb-0051-001c00c80019.png",
        "timestamp": 1578490374468,
        "duration": 3
    },
    {
        "description": "Verify password label is present|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 6000,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "006000a0-00cd-00bf-00c4-0059009a0045.png",
        "timestamp": 1578490374875,
        "duration": 8
    },
    {
        "description": "Verify Remember Me check box|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 6000,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "0071009b-00de-0068-0017-00c100cc0051.png",
        "timestamp": 1578490375281,
        "duration": 55
    },
    {
        "description": "verify the title of the Page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 6000,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "001a00ac-0058-00ca-006c-00ff00280016.png",
        "timestamp": 1578490375743,
        "duration": 13
    },
    {
        "description": "veriy all links present on page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 6000,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "00a4007a-0045-0098-00b1-000300ec0089.png",
        "timestamp": 1578490376135,
        "duration": 204
    },
    {
        "description": "User Login successfully |Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 6000,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "https://archway-forduaw-qa.azurewebsites.net/main.85c1ca86202ad37951e9.js 0 /deep/ combinator is no longer supported in CSS dynamic profile. It is now effectively no-op, acting as if it were a descendant combinator. /deep/ combinator will be removed, and will be invalid at M65. You should remove it. See https://www.chromestatus.com/features/4964279606312960 for more details.",
                "timestamp": 1578490393377,
                "type": ""
            }
        ],
        "screenShotFile": "00e200fd-006a-00d3-00f8-0008000c00e1.png",
        "timestamp": 1578490376736,
        "duration": 16655
    },
    {
        "description": "Quick Add : Enter product and quantity successfully|Add Item to cart by  Quick Add and verify contents present on page ",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 6000,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed",
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "https://archway-forduaw-qa.azurewebsites.net/products?pageSize=15&sortBy=ID - [DOM] Found 15 elements with non-unique id #quantity: (More info: https://goo.gl/9p2vKq) %o %o %o %o %o %o %o %o %o %o %o %o %o %o %o",
                "timestamp": 1578490406002,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://archway-forduaw-qa.azurewebsites.net/products?pageSize=15&sortBy=ID - [DOM] Found 15 elements with non-unique id #quantity: (More info: https://goo.gl/9p2vKq) %o %o %o %o %o %o %o %o %o %o %o %o %o %o %o",
                "timestamp": 1578490406003,
                "type": ""
            }
        ],
        "screenShotFile": "00ee00a6-0022-00fe-004f-00ca0053004b.png",
        "timestamp": 1578490393798,
        "duration": 12193
    },
    {
        "description": "should pan plots when you click and drag|Add Item to cart by  Quick Add and verify contents present on page ",
        "passed": false,
        "pending": true,
        "os": "Windows",
        "instanceId": 6000,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Temporarily disabled with xit",
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "https://archway-forduaw-qa.azurewebsites.net/products?pageSize=15&sortBy=ID - [DOM] Found 15 elements with non-unique id #quantity: (More info: https://goo.gl/9p2vKq) %o %o %o %o %o %o %o %o %o %o %o %o %o %o %o",
                "timestamp": 1578490406293,
                "type": ""
            }
        ],
        "screenShotFile": "009f001e-0006-004a-0045-008600eb00fb.png",
        "timestamp": 1578490406532,
        "duration": 1
    },
    {
        "description": "verify Sort option is present on Add To Cart screen |Add Item to cart by  Quick Add and verify contents present on page ",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 6000,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00af00a9-0013-00b4-00bf-005700d90026.png",
        "timestamp": 1578490406595,
        "duration": 147
    },
    {
        "description": "verify Refine By text on Add To Cart screen|Add Item to cart by  Quick Add and verify contents present on page ",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 6000,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "003e0009-0078-00af-00c5-00be009400bc.png",
        "timestamp": 1578490407190,
        "duration": 173
    },
    {
        "description": "verify My Favorites link|Add Item to cart by  Quick Add and verify contents present on page ",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 6000,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00610020-008c-00cb-0011-0059000a005d.png",
        "timestamp": 1578490407816,
        "duration": 149
    },
    {
        "description": "Verify Quick Add Header label text|Add Item to cart by  Quick Add and verify contents present on page ",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 6000,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00e500c7-0000-00cd-0034-006900290078.png",
        "timestamp": 1578490408449,
        "duration": 85
    },
    {
        "description": "Verify lable of item |Add Item to cart by  Quick Add and verify contents present on page ",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 6000,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "004300c2-00a1-0098-0069-00fc004e00bc.png",
        "timestamp": 1578490408964,
        "duration": 111
    },
    {
        "description": "Verify lable of qty |Add Item to cart by  Quick Add and verify contents present on page ",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 6000,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "006e00a9-0051-0036-00fc-009400180077.png",
        "timestamp": 1578490409467,
        "duration": 73
    },
    {
        "description": "TC_004:Verify Add to Cart button is present on the page|Add Item to cart by  Quick Add and verify contents present on page ",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 6000,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00870084-003d-0056-00b2-007800d900b7.png",
        "timestamp": 1578490409946,
        "duration": 35
    },
    {
        "description": "Verify Add item and Quantity and click on checkout|Add Item to cart by  Quick Add and verify contents present on page ",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 6000,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "0031002d-0083-00ee-005e-004200fa0091.png",
        "timestamp": 1578490410396,
        "duration": 29014
    },
    {
        "description": "should login the user|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 10916,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "003e00cf-0017-00c8-00ab-0008002200aa.png",
        "timestamp": 1578492013742,
        "duration": 14584
    },
    {
        "description": "Forgot password link present on the Login page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 10916,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00a50013-0059-003b-00f1-008500bf00b1.png",
        "timestamp": 1578492028836,
        "duration": 71
    },
    {
        "description": "Create Account link present on the Login page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 10916,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00b900bf-00ac-003b-0092-0044001300d5.png",
        "timestamp": 1578492029355,
        "duration": 65
    },
    {
        "description": "Contact Us  link present on the Login Page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 10916,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00a800f8-0075-00e2-00a4-007e00b100ad.png",
        "timestamp": 1578492029856,
        "duration": 55
    },
    {
        "description": "Verify comapny copyright text at the footer of the login page|Verify Login",
        "passed": false,
        "pending": false,
        "os": "Windows",
        "instanceId": 10916,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": [
            "Error: Timeout - Async callback was not invoked within timeout specified by jasmine.DEFAULT_TIMEOUT_INTERVAL."
        ],
        "trace": [
            "Error: Timeout - Async callback was not invoked within timeout specified by jasmine.DEFAULT_TIMEOUT_INTERVAL.\n    at Timeout._onTimeout (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4281:23)\n    at listOnTimeout (internal/timers.js:531:17)\n    at processTimers (internal/timers.js:475:7)"
        ],
        "browserLogs": [],
        "screenShotFile": "00a8003c-00a9-00e8-00ff-000a0059006f.png",
        "timestamp": 1578492030330,
        "duration": 30034
    },
    {
        "description": "Verify Username labeling is preseet|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 10916,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00a000ed-004d-0091-002a-000400cc005e.png",
        "timestamp": 1578492060759,
        "duration": 3
    },
    {
        "description": "Verify password label is present|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 10916,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "004100cb-00a9-007d-0023-00a30078000d.png",
        "timestamp": 1578492061147,
        "duration": 3
    },
    {
        "description": "Verify Remember Me check box|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 10916,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "009a0084-0060-0010-0087-007c00be008c.png",
        "timestamp": 1578492061551,
        "duration": 34
    },
    {
        "description": "verify the title of the Page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 10916,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "0044000a-0081-0080-00ed-003400a800f3.png",
        "timestamp": 1578492061975,
        "duration": 11
    },
    {
        "description": "veriy all links present on page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 10916,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "00bd00e8-00e5-00bc-00c3-00ff001f0024.png",
        "timestamp": 1578492062376,
        "duration": 55
    },
    {
        "description": "User Login successfully |Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 10916,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "https://archway-forduaw-qa.azurewebsites.net/main.85c1ca86202ad37951e9.js 0 /deep/ combinator is no longer supported in CSS dynamic profile. It is now effectively no-op, acting as if it were a descendant combinator. /deep/ combinator will be removed, and will be invalid at M65. You should remove it. See https://www.chromestatus.com/features/4964279606312960 for more details.",
                "timestamp": 1578492079450,
                "type": ""
            }
        ],
        "screenShotFile": "00d10022-004a-00c7-00ef-00fc00b200d3.png",
        "timestamp": 1578492062844,
        "duration": 16617
    },
    {
        "description": "Quick Add : Enter product and quantity successfully|Add Item to cart by  Quick Add and verify contents present on page ",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 10916,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "002300b8-0085-00a0-00c3-008a00bb00f7.png",
        "timestamp": 1578492079879,
        "duration": 2372
    },
    {
        "description": "should pan plots when you click and drag|Add Item to cart by  Quick Add and verify contents present on page ",
        "passed": false,
        "pending": true,
        "os": "Windows",
        "instanceId": 10916,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Temporarily disabled with xit",
        "browserLogs": [],
        "screenShotFile": "00790014-00b7-0093-00b5-004d001700fd.png",
        "timestamp": 1578492082663,
        "duration": 0
    },
    {
        "description": "verify Sort option is present on Add To Cart screen |Add Item to cart by  Quick Add and verify contents present on page ",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 10916,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "https://archway-forduaw-qa.azurewebsites.net/products?pageSize=15&sortBy=ID - [DOM] Found 15 elements with non-unique id #quantity: (More info: https://goo.gl/9p2vKq) %o %o %o %o %o %o %o %o %o %o %o %o %o %o %o",
                "timestamp": 1578492088334,
                "type": ""
            }
        ],
        "screenShotFile": "00ac00f3-00fe-00ff-0052-003b007c0005.png",
        "timestamp": 1578492082722,
        "duration": 5900
    },
    {
        "description": "verify Refine By text on Add To Cart screen|Add Item to cart by  Quick Add and verify contents present on page ",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 10916,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "https://archway-forduaw-qa.azurewebsites.net/products?pageSize=15&sortBy=ID - [DOM] Found 15 elements with non-unique id #quantity: (More info: https://goo.gl/9p2vKq) %o %o %o %o %o %o %o %o %o %o %o %o %o %o %o",
                "timestamp": 1578492089196,
                "type": ""
            }
        ],
        "screenShotFile": "00e200e0-0022-00e1-0024-00a6001c002b.png",
        "timestamp": 1578492089087,
        "duration": 210
    },
    {
        "description": "verify My Favorites link|Add Item to cart by  Quick Add and verify contents present on page ",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 10916,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "009900c1-00fa-00ca-007d-000400a70098.png",
        "timestamp": 1578492089720,
        "duration": 150
    },
    {
        "description": "Verify Quick Add Header label text|Add Item to cart by  Quick Add and verify contents present on page ",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 10916,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00bb00dd-00b6-00c2-00d0-005f001800c7.png",
        "timestamp": 1578492090305,
        "duration": 95
    },
    {
        "description": "Verify lable of item |Add Item to cart by  Quick Add and verify contents present on page ",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 10916,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00da006b-00ac-0080-00e8-0094006b00c4.png",
        "timestamp": 1578492090844,
        "duration": 87
    },
    {
        "description": "Verify lable of qty |Add Item to cart by  Quick Add and verify contents present on page ",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 10916,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00a800c1-0076-00e8-0046-00e000de0066.png",
        "timestamp": 1578492091408,
        "duration": 96
    },
    {
        "description": "TC_004:Verify Add to Cart button is present on the page|Add Item to cart by  Quick Add and verify contents present on page ",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 10916,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "000a0019-00b7-00e5-00f8-001800540094.png",
        "timestamp": 1578492091945,
        "duration": 41
    },
    {
        "description": "Verify Add item and Quantity and click on checkout|Add Item to cart by  Quick Add and verify contents present on page ",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 10916,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "004200d5-00ca-001e-003a-00b10046003c.png",
        "timestamp": 1578492092393,
        "duration": 29062
    },
    {
        "description": "should login the user|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 4968,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "009300c1-0036-0005-0046-00760037008a.png",
        "timestamp": 1578492228902,
        "duration": 13312
    },
    {
        "description": "Forgot password link present on the Login page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 4968,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00a1008b-00ad-00d7-009f-00e700b0000c.png",
        "timestamp": 1578492242699,
        "duration": 59
    },
    {
        "description": "Create Account link present on the Login page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 4968,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "002c000e-0048-0069-00b3-00a3001e00b6.png",
        "timestamp": 1578492243188,
        "duration": 72
    },
    {
        "description": "Contact Us  link present on the Login Page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 4968,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00c600f7-008d-00fb-0082-0020004600fb.png",
        "timestamp": 1578492243829,
        "duration": 165
    },
    {
        "description": "Verify comapny copyright text at the footer of the login page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 4968,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "000f0028-00cc-00bb-0092-005c0082005e.png",
        "timestamp": 1578492244386,
        "duration": 24
    },
    {
        "description": "Verify Username labeling is preseet|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 4968,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "000d0098-0086-0087-0083-006900a400ad.png",
        "timestamp": 1578492244801,
        "duration": 4
    },
    {
        "description": "Verify password label is present|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 4968,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00f000a9-002e-00f9-0057-005d00f0009d.png",
        "timestamp": 1578492245207,
        "duration": 3
    },
    {
        "description": "Verify Remember Me check box|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 4968,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00560029-0020-00c1-005b-008c00000054.png",
        "timestamp": 1578492245621,
        "duration": 36
    },
    {
        "description": "verify the title of the Page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 4968,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00b300f2-007b-004f-0048-000100f500b7.png",
        "timestamp": 1578492246058,
        "duration": 12
    },
    {
        "description": "veriy all links present on page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 4968,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "00280078-00f6-00cd-00de-004b0076004e.png",
        "timestamp": 1578492246474,
        "duration": 50
    },
    {
        "description": "User Login successfully |Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 4968,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "https://archway-forduaw-qa.azurewebsites.net/main.85c1ca86202ad37951e9.js 0 /deep/ combinator is no longer supported in CSS dynamic profile. It is now effectively no-op, acting as if it were a descendant combinator. /deep/ combinator will be removed, and will be invalid at M65. You should remove it. See https://www.chromestatus.com/features/4964279606312960 for more details.",
                "timestamp": 1578492263515,
                "type": ""
            }
        ],
        "screenShotFile": "002d0092-007c-00cb-0007-005500770072.png",
        "timestamp": 1578492246905,
        "duration": 16623
    },
    {
        "description": "Verify if user can search product by Order Number successfully| Verify My Orders page Functionality",
        "passed": false,
        "pending": false,
        "os": "Windows",
        "instanceId": 4968,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": [
            "Failed: No element found using locator: By(xpath, //section[1]/shared-search[1]/form[1]/div[1]/input[1])"
        ],
        "trace": [
            "NoSuchElementError: No element found using locator: By(xpath, //section[1]/shared-search[1]/form[1]/div[1]/input[1])\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:814:27\n    at ManagedPromise.invokeCallback_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\n    at processTicksAndRejections (internal/process/task_queues.js:93:5)Error\n    at ElementArrayFinder.applyAction_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:459:27)\n    at ElementArrayFinder.<computed> [as clear] (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:91:29)\n    at ElementFinder.<computed> [as clear] (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:831:22)\n    at MyOrders.searchOrder (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars_Byer\\pageobjects\\MyOrders\\MyOrders.js:45:15)\n    at UserContext.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars_Byer\\specs\\MyOrders\\SearchAndReorder_spec.js:74:17)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\nFrom: Task: Run it(\"Verify if user can search product by Order Number successfully\") in control flow\n    at UserContext.<anonymous> (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:94:19)\n    at attempt (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4297:26)\n    at QueueRunner.run (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4217:20)\n    at runNext (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4257:20)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4264:13\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4172:9\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:64:48\n    at ControlFlow.emit (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\events.js:62:21)\n    at ControlFlow.shutdown_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2674:10)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2599:53\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars_Byer\\specs\\MyOrders\\SearchAndReorder_spec.js:43:1)\n    at addSpecsToSuite (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars_Byer\\specs\\MyOrders\\SearchAndReorder_spec.js:25:1)\n    at Module._compile (internal/modules/cjs/loader.js:956:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:973:10)\n    at Module.load (internal/modules/cjs/loader.js:812:32)\n    at Function.Module._load (internal/modules/cjs/loader.js:724:14)"
        ],
        "browserLogs": [],
        "screenShotFile": "00ac0025-00bb-00fa-008d-00680006005c.png",
        "timestamp": 1578492263985,
        "duration": 12463
    },
    {
        "description": " Verify Advance search(By Status and By date) than Re-order the product| Verify My Orders page Functionality",
        "passed": false,
        "pending": true,
        "os": "Windows",
        "instanceId": 4968,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Temporarily disabled with xit",
        "browserLogs": [],
        "screenShotFile": "00d900f8-003f-00fb-0005-0033009f00ff.png",
        "timestamp": 1578492276918,
        "duration": 0
    },
    {
        "description": "Verification of total=subtotal+shipping| Verify My Orders page Functionality",
        "passed": false,
        "pending": false,
        "os": "Windows",
        "instanceId": 4968,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": [
            "Failed: No element found using locator: By(xpath, //span[@class='float-right'][contains(text(),subtotalval)])"
        ],
        "trace": [
            "NoSuchElementError: No element found using locator: By(xpath, //span[@class='float-right'][contains(text(),subtotalval)])\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:814:27\n    at ManagedPromise.invokeCallback_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\n    at processTicksAndRejections (internal/process/task_queues.js:93:5)Error\n    at ElementArrayFinder.applyAction_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:459:27)\n    at ElementArrayFinder.<computed> [as getText] (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:91:29)\n    at ElementFinder.<computed> [as getText] (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:831:22)\n    at UserContext.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars_Byer\\specs\\MyOrders\\SearchAndReorder_spec.js:350:11)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\nFrom: Task: Run it(\"Verification of total=subtotal+shipping\") in control flow\n    at UserContext.<anonymous> (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:94:19)\n    at attempt (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4297:26)\n    at QueueRunner.run (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4217:20)\n    at runNext (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4257:20)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4264:13\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4172:9\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:64:48\n    at ControlFlow.emit (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\events.js:62:21)\n    at ControlFlow.shutdown_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2674:10)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2599:53\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars_Byer\\specs\\MyOrders\\SearchAndReorder_spec.js:343:1)\n    at addSpecsToSuite (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars_Byer\\specs\\MyOrders\\SearchAndReorder_spec.js:25:1)\n    at Module._compile (internal/modules/cjs/loader.js:956:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:973:10)\n    at Module.load (internal/modules/cjs/loader.js:812:32)\n    at Function.Module._load (internal/modules/cjs/loader.js:724:14)"
        ],
        "browserLogs": [],
        "screenShotFile": "00ba00c4-004a-00e5-0085-0043005100dc.png",
        "timestamp": 1578492276993,
        "duration": 27
    },
    {
        "description": "should login the user|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 9776,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "005900fd-00e6-0042-00df-008e00be00dc.png",
        "timestamp": 1578492356338,
        "duration": 12095
    },
    {
        "description": "Forgot password link present on the Login page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 9776,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "0020007a-00e0-00ab-0084-00a1005f009b.png",
        "timestamp": 1578492368913,
        "duration": 70
    },
    {
        "description": "Create Account link present on the Login page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 9776,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "003500ae-00e9-0046-0002-00fc009900cb.png",
        "timestamp": 1578492369380,
        "duration": 59
    },
    {
        "description": "Contact Us  link present on the Login Page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 9776,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00170065-00e8-004e-002d-00fa00e700f4.png",
        "timestamp": 1578492369894,
        "duration": 49
    },
    {
        "description": "Verify comapny copyright text at the footer of the login page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 9776,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "00b8003c-00b3-00c7-00e0-00df004e0041.png",
        "timestamp": 1578492370326,
        "duration": 22
    },
    {
        "description": "Verify Username labeling is preseet|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 9776,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "009c00bc-0004-009e-0027-00e500c20013.png",
        "timestamp": 1578492370769,
        "duration": 3
    },
    {
        "description": "Verify password label is present|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 9776,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "004c002c-00c2-0050-005c-00d500710045.png",
        "timestamp": 1578492371167,
        "duration": 4
    },
    {
        "description": "Verify Remember Me check box|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 9776,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00f9001d-0052-004c-00a1-00aa004700c8.png",
        "timestamp": 1578492371573,
        "duration": 37
    },
    {
        "description": "verify the title of the Page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 9776,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00d20045-00e4-00cb-0081-00a4004200b0.png",
        "timestamp": 1578492372039,
        "duration": 12
    },
    {
        "description": "veriy all links present on page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 9776,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "0033001d-003d-00be-00f4-004a004e00c8.png",
        "timestamp": 1578492372444,
        "duration": 53
    },
    {
        "description": "User Login successfully |Verify Login",
        "passed": false,
        "pending": false,
        "os": "Windows",
        "instanceId": 9776,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": [
            "Expected 'https://archway-forduaw-qa.azurewebsites.net/login' to contain 'https://archway-forduaw-qa.azurewebsites.net/home'."
        ],
        "trace": [
            "Error: Failed expectation\n    at UserContext.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars_Byer\\specs\\LoginPage\\LoginPage_spec.js:229:19)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2974:25\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7"
        ],
        "browserLogs": [],
        "screenShotFile": "008600db-002b-0087-000d-008b00e400ee.png",
        "timestamp": 1578492372873,
        "duration": 16567
    },
    {
        "description": "Verify if user can search product by Order Number successfully| Verify My Orders page Functionality",
        "passed": false,
        "pending": false,
        "os": "Windows",
        "instanceId": 9776,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": [
            "Failed: No element found using locator: By(xpath, //section[1]/shared-search[1]/form[1]/div[1]/input[1])"
        ],
        "trace": [
            "NoSuchElementError: No element found using locator: By(xpath, //section[1]/shared-search[1]/form[1]/div[1]/input[1])\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:814:27\n    at ManagedPromise.invokeCallback_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\n    at processTicksAndRejections (internal/process/task_queues.js:93:5)Error\n    at ElementArrayFinder.applyAction_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:459:27)\n    at ElementArrayFinder.<computed> [as clear] (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:91:29)\n    at ElementFinder.<computed> [as clear] (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:831:22)\n    at MyOrders.searchOrder (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars_Byer\\pageobjects\\MyOrders\\MyOrders.js:45:15)\n    at UserContext.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars_Byer\\specs\\MyOrders\\SearchAndReorder_spec.js:74:17)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\nFrom: Task: Run it(\"Verify if user can search product by Order Number successfully\") in control flow\n    at UserContext.<anonymous> (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:94:19)\n    at attempt (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4297:26)\n    at QueueRunner.run (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4217:20)\n    at runNext (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4257:20)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4264:13\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4172:9\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:64:48\n    at ControlFlow.emit (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\events.js:62:21)\n    at ControlFlow.shutdown_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2674:10)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2599:53\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars_Byer\\specs\\MyOrders\\SearchAndReorder_spec.js:43:1)\n    at addSpecsToSuite (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars_Byer\\specs\\MyOrders\\SearchAndReorder_spec.js:25:1)\n    at Module._compile (internal/modules/cjs/loader.js:956:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:973:10)\n    at Module.load (internal/modules/cjs/loader.js:812:32)\n    at Function.Module._load (internal/modules/cjs/loader.js:724:14)"
        ],
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "https://archway-forduaw-qa.azurewebsites.net/main.85c1ca86202ad37951e9.js 0 /deep/ combinator is no longer supported in CSS dynamic profile. It is now effectively no-op, acting as if it were a descendant combinator. /deep/ combinator will be removed, and will be invalid at M65. You should remove it. See https://www.chromestatus.com/features/4964279606312960 for more details.",
                "timestamp": 1578492389830,
                "type": ""
            }
        ],
        "screenShotFile": "002a004c-0094-005d-00a8-003800c000aa.png",
        "timestamp": 1578492389927,
        "duration": 15448
    },
    {
        "description": " Verify Advance search(By Status and By date) than Re-order the product| Verify My Orders page Functionality",
        "passed": false,
        "pending": true,
        "os": "Windows",
        "instanceId": 9776,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Temporarily disabled with xit",
        "browserLogs": [],
        "screenShotFile": "00b9001e-0061-00d1-0035-00fd00260006.png",
        "timestamp": 1578492405776,
        "duration": 0
    },
    {
        "description": "Verification of total=subtotal+shipping| Verify My Orders page Functionality",
        "passed": false,
        "pending": false,
        "os": "Windows",
        "instanceId": 9776,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": [
            "Failed: No element found using locator: By(xpath, //span[@class='float-right'][contains(text(),subtotalval)])"
        ],
        "trace": [
            "NoSuchElementError: No element found using locator: By(xpath, //span[@class='float-right'][contains(text(),subtotalval)])\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:814:27\n    at ManagedPromise.invokeCallback_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\n    at processTicksAndRejections (internal/process/task_queues.js:93:5)Error\n    at ElementArrayFinder.applyAction_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:459:27)\n    at ElementArrayFinder.<computed> [as getText] (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:91:29)\n    at ElementFinder.<computed> [as getText] (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:831:22)\n    at UserContext.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars_Byer\\specs\\MyOrders\\SearchAndReorder_spec.js:350:11)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\nFrom: Task: Run it(\"Verification of total=subtotal+shipping\") in control flow\n    at UserContext.<anonymous> (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:94:19)\n    at attempt (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4297:26)\n    at QueueRunner.run (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4217:20)\n    at runNext (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4257:20)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4264:13\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4172:9\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:64:48\n    at ControlFlow.emit (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\events.js:62:21)\n    at ControlFlow.shutdown_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2674:10)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2599:53\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars_Byer\\specs\\MyOrders\\SearchAndReorder_spec.js:343:1)\n    at addSpecsToSuite (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars_Byer\\specs\\MyOrders\\SearchAndReorder_spec.js:25:1)\n    at Module._compile (internal/modules/cjs/loader.js:956:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:973:10)\n    at Module.load (internal/modules/cjs/loader.js:812:32)\n    at Function.Module._load (internal/modules/cjs/loader.js:724:14)"
        ],
        "browserLogs": [],
        "screenShotFile": "00f90032-00a2-0052-00ea-005200fa002c.png",
        "timestamp": 1578492405838,
        "duration": 33
    },
    {
        "description": "should login the user|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 10828,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "0087002c-0090-00dd-0037-00b900080097.png",
        "timestamp": 1578556418308,
        "duration": 11215
    },
    {
        "description": "Forgot password link present on the Login page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 10828,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00e60050-0098-00a2-00f2-009600460013.png",
        "timestamp": 1578556431574,
        "duration": 131
    },
    {
        "description": "Create Account link present on the Login page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 10828,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "0029002e-00bc-0054-000c-00b2008a00f9.png",
        "timestamp": 1578556432714,
        "duration": 58
    },
    {
        "description": "Contact Us  link present on the Login Page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 10828,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00ae00da-004e-00bc-003e-0099003f00ab.png",
        "timestamp": 1578556433174,
        "duration": 44
    },
    {
        "description": "Verify comapny copyright text at the footer of the login page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 10828,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "004f008f-003a-00c7-009d-005b0087009a.png",
        "timestamp": 1578556433625,
        "duration": 20
    },
    {
        "description": "Verify Username labeling is preseet|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 10828,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "006600ad-006b-005b-00a1-00e7003500dd.png",
        "timestamp": 1578556434036,
        "duration": 3
    },
    {
        "description": "Verify password label is present|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 10828,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "004e0060-00d3-00fe-0020-001d0073004b.png",
        "timestamp": 1578556434676,
        "duration": 3
    },
    {
        "description": "Verify Remember Me check box|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 10828,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "000500cf-00ed-0020-0059-005300e3000e.png",
        "timestamp": 1578556435067,
        "duration": 254
    },
    {
        "description": "verify the title of the Page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 10828,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "009000e3-0075-00be-008d-00fe00b5008f.png",
        "timestamp": 1578556435727,
        "duration": 14
    },
    {
        "description": "veriy all links present on page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 10828,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "003700f7-00cb-000e-00c9-0050001000d4.png",
        "timestamp": 1578556436132,
        "duration": 361
    },
    {
        "description": "User Login successfully |Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 10828,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "https://archway-forduaw-qa.azurewebsites.net/main.85c1ca86202ad37951e9.js 0 /deep/ combinator is no longer supported in CSS dynamic profile. It is now effectively no-op, acting as if it were a descendant combinator. /deep/ combinator will be removed, and will be invalid at M65. You should remove it. See https://www.chromestatus.com/features/4964279606312960 for more details.",
                "timestamp": 1578556453675,
                "type": ""
            }
        ],
        "screenShotFile": "00a400ca-009a-0002-000e-00da00cf0019.png",
        "timestamp": 1578556436891,
        "duration": 16812
    },
    {
        "description": "Verify if user can search product by Order Number successfully| Verify My Orders page Functionality",
        "passed": false,
        "pending": false,
        "os": "Windows",
        "instanceId": 10828,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": [
            "Failed: No element found using locator: By(xpath, //section[1]/shared-search[1]/form[1]/div[1]/input[1])"
        ],
        "trace": [
            "NoSuchElementError: No element found using locator: By(xpath, //section[1]/shared-search[1]/form[1]/div[1]/input[1])\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:814:27\n    at ManagedPromise.invokeCallback_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\n    at processTicksAndRejections (internal/process/task_queues.js:93:5)Error\n    at ElementArrayFinder.applyAction_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:459:27)\n    at ElementArrayFinder.<computed> [as clear] (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:91:29)\n    at ElementFinder.<computed> [as clear] (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:831:22)\n    at MyOrders.searchOrder (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars_Byer\\pageobjects\\MyOrders\\MyOrders.js:45:15)\n    at UserContext.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars_Byer\\specs\\MyOrders\\SearchAndReorder_spec.js:74:17)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\nFrom: Task: Run it(\"Verify if user can search product by Order Number successfully\") in control flow\n    at UserContext.<anonymous> (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:94:19)\n    at attempt (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4297:26)\n    at QueueRunner.run (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4217:20)\n    at runNext (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4257:20)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4264:13\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4172:9\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:64:48\n    at ControlFlow.emit (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\events.js:62:21)\n    at ControlFlow.shutdown_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2674:10)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2599:53\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars_Byer\\specs\\MyOrders\\SearchAndReorder_spec.js:43:1)\n    at addSpecsToSuite (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars_Byer\\specs\\MyOrders\\SearchAndReorder_spec.js:25:1)\n    at Module._compile (internal/modules/cjs/loader.js:956:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:973:10)\n    at Module.load (internal/modules/cjs/loader.js:812:32)\n    at Function.Module._load (internal/modules/cjs/loader.js:724:14)"
        ],
        "browserLogs": [],
        "screenShotFile": "008400bd-008e-0034-0010-00b80091006d.png",
        "timestamp": 1578556454215,
        "duration": 15429
    },
    {
        "description": " Verify Advance search(By Status and By date) than Re-order the product| Verify My Orders page Functionality",
        "passed": false,
        "pending": true,
        "os": "Windows",
        "instanceId": 10828,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Temporarily disabled with xit",
        "browserLogs": [],
        "screenShotFile": "004d0036-0034-006e-005e-0047005800ae.png",
        "timestamp": 1578556470128,
        "duration": 0
    },
    {
        "description": "Verification of total=subtotal+shipping| Verify My Orders page Functionality",
        "passed": false,
        "pending": false,
        "os": "Windows",
        "instanceId": 10828,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": [
            "Failed: No element found using locator: By(xpath, //span[@class='float-right'][contains(text(),subtotalval)])"
        ],
        "trace": [
            "NoSuchElementError: No element found using locator: By(xpath, //span[@class='float-right'][contains(text(),subtotalval)])\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:814:27\n    at ManagedPromise.invokeCallback_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\n    at processTicksAndRejections (internal/process/task_queues.js:93:5)Error\n    at ElementArrayFinder.applyAction_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:459:27)\n    at ElementArrayFinder.<computed> [as getText] (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:91:29)\n    at ElementFinder.<computed> [as getText] (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:831:22)\n    at UserContext.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars_Byer\\specs\\MyOrders\\SearchAndReorder_spec.js:350:11)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\nFrom: Task: Run it(\"Verification of total=subtotal+shipping\") in control flow\n    at UserContext.<anonymous> (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:94:19)\n    at attempt (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4297:26)\n    at QueueRunner.run (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4217:20)\n    at runNext (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4257:20)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4264:13\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4172:9\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:64:48\n    at ControlFlow.emit (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\events.js:62:21)\n    at ControlFlow.shutdown_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2674:10)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2599:53\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars_Byer\\specs\\MyOrders\\SearchAndReorder_spec.js:343:1)\n    at addSpecsToSuite (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars_Byer\\specs\\MyOrders\\SearchAndReorder_spec.js:25:1)\n    at Module._compile (internal/modules/cjs/loader.js:956:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:973:10)\n    at Module.load (internal/modules/cjs/loader.js:812:32)\n    at Function.Module._load (internal/modules/cjs/loader.js:724:14)"
        ],
        "browserLogs": [],
        "screenShotFile": "00bc00a8-0066-0056-00da-0058000e0073.png",
        "timestamp": 1578556470202,
        "duration": 23
    },
    {
        "description": "should login the user|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 5824,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "00850054-0013-0049-00ab-008e001300b7.png",
        "timestamp": 1578558074151,
        "duration": 12746
    },
    {
        "description": "Forgot password link present on the Login page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 5824,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00d30098-0061-00ea-005e-004d00f900d2.png",
        "timestamp": 1578558087448,
        "duration": 63
    },
    {
        "description": "Create Account link present on the Login page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 5824,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "005f009d-002b-001d-00cd-007700460096.png",
        "timestamp": 1578558088035,
        "duration": 70
    },
    {
        "description": "Contact Us  link present on the Login Page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 5824,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "002c0051-0016-002f-0071-00f80005007e.png",
        "timestamp": 1578558088675,
        "duration": 53
    },
    {
        "description": "Verify comapny copyright text at the footer of the login page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 5824,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "00fe0094-0040-00b5-00b6-00eb002100cb.png",
        "timestamp": 1578558089200,
        "duration": 34
    },
    {
        "description": "Verify Username labeling is preseet|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 5824,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00570072-0031-00e4-00b2-00550031002c.png",
        "timestamp": 1578558089613,
        "duration": 3
    },
    {
        "description": "Verify password label is present|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 5824,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "007b0080-00a0-0000-005c-0067009800c7.png",
        "timestamp": 1578558090026,
        "duration": 4
    },
    {
        "description": "Verify Remember Me check box|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 5824,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00730012-005d-001a-00fe-00b200d9008b.png",
        "timestamp": 1578558090434,
        "duration": 51
    },
    {
        "description": "verify the title of the Page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 5824,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "001f008b-0085-00e6-0065-000800430042.png",
        "timestamp": 1578558090928,
        "duration": 15
    },
    {
        "description": "veriy all links present on page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 5824,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "008e009a-005a-0016-0043-007d00d500c5.png",
        "timestamp": 1578558091331,
        "duration": 58
    },
    {
        "description": "User Login successfully |Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 5824,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "https://archway-forduaw-qa.azurewebsites.net/main.85c1ca86202ad37951e9.js 0 /deep/ combinator is no longer supported in CSS dynamic profile. It is now effectively no-op, acting as if it were a descendant combinator. /deep/ combinator will be removed, and will be invalid at M65. You should remove it. See https://www.chromestatus.com/features/4964279606312960 for more details.",
                "timestamp": 1578558108452,
                "type": ""
            }
        ],
        "screenShotFile": "00f000f1-0080-0053-00a4-002e00640065.png",
        "timestamp": 1578558091794,
        "duration": 16676
    },
    {
        "description": "Verify if user can search product by Order Number successfully| Verify My Orders page Functionality",
        "passed": false,
        "pending": false,
        "os": "Windows",
        "instanceId": 5824,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": [
            "Failed: No element found using locator: By(xpath, //form[@class='ng-pristine ng-valid ng-touched']//input[@id='search-addon'])"
        ],
        "trace": [
            "NoSuchElementError: No element found using locator: By(xpath, //form[@class='ng-pristine ng-valid ng-touched']//input[@id='search-addon'])\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:814:27\n    at ManagedPromise.invokeCallback_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\n    at processTicksAndRejections (internal/process/task_queues.js:93:5)Error\n    at ElementArrayFinder.applyAction_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:459:27)\n    at ElementArrayFinder.<computed> [as clear] (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:91:29)\n    at ElementFinder.<computed> [as clear] (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:831:22)\n    at MyOrders.searchOrder (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars_Byer\\pageobjects\\MyOrders\\MyOrders.js:45:15)\n    at UserContext.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars_Byer\\specs\\MyOrders\\SearchAndReorder_spec.js:74:17)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\nFrom: Task: Run it(\"Verify if user can search product by Order Number successfully\") in control flow\n    at UserContext.<anonymous> (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:94:19)\n    at attempt (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4297:26)\n    at QueueRunner.run (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4217:20)\n    at runNext (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4257:20)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4264:13\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4172:9\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:64:48\n    at ControlFlow.emit (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\events.js:62:21)\n    at ControlFlow.shutdown_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2674:10)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2599:53\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars_Byer\\specs\\MyOrders\\SearchAndReorder_spec.js:43:1)\n    at addSpecsToSuite (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars_Byer\\specs\\MyOrders\\SearchAndReorder_spec.js:25:1)\n    at Module._compile (internal/modules/cjs/loader.js:956:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:973:10)\n    at Module.load (internal/modules/cjs/loader.js:812:32)\n    at Function.Module._load (internal/modules/cjs/loader.js:724:14)"
        ],
        "browserLogs": [],
        "screenShotFile": "00fd004c-00b8-0066-00ee-006400ad0042.png",
        "timestamp": 1578558108894,
        "duration": 15431
    },
    {
        "description": " Verify Advance search(By Status and By date) than Re-order the product| Verify My Orders page Functionality",
        "passed": false,
        "pending": true,
        "os": "Windows",
        "instanceId": 5824,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Temporarily disabled with xit",
        "browserLogs": [],
        "screenShotFile": "00e900b7-00df-0081-009d-009f00630076.png",
        "timestamp": 1578558124771,
        "duration": 1
    },
    {
        "description": "Verification of total=subtotal+shipping| Verify My Orders page Functionality",
        "passed": false,
        "pending": false,
        "os": "Windows",
        "instanceId": 5824,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": [
            "Failed: No element found using locator: By(xpath, //span[@class='float-right'][contains(text(),subtotalval)])"
        ],
        "trace": [
            "NoSuchElementError: No element found using locator: By(xpath, //span[@class='float-right'][contains(text(),subtotalval)])\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:814:27\n    at ManagedPromise.invokeCallback_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\n    at processTicksAndRejections (internal/process/task_queues.js:93:5)Error\n    at ElementArrayFinder.applyAction_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:459:27)\n    at ElementArrayFinder.<computed> [as getText] (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:91:29)\n    at ElementFinder.<computed> [as getText] (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:831:22)\n    at UserContext.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars_Byer\\specs\\MyOrders\\SearchAndReorder_spec.js:350:11)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\nFrom: Task: Run it(\"Verification of total=subtotal+shipping\") in control flow\n    at UserContext.<anonymous> (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:94:19)\n    at attempt (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4297:26)\n    at QueueRunner.run (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4217:20)\n    at runNext (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4257:20)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4264:13\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4172:9\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:64:48\n    at ControlFlow.emit (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\events.js:62:21)\n    at ControlFlow.shutdown_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2674:10)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2599:53\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars_Byer\\specs\\MyOrders\\SearchAndReorder_spec.js:343:1)\n    at addSpecsToSuite (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars_Byer\\specs\\MyOrders\\SearchAndReorder_spec.js:25:1)\n    at Module._compile (internal/modules/cjs/loader.js:956:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:973:10)\n    at Module.load (internal/modules/cjs/loader.js:812:32)\n    at Function.Module._load (internal/modules/cjs/loader.js:724:14)"
        ],
        "browserLogs": [],
        "screenShotFile": "000700b5-009a-00be-00b3-00e400c20076.png",
        "timestamp": 1578558124845,
        "duration": 22
    },
    {
        "description": "should login the user|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 12852,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "00d600a3-0067-0057-00dc-00ed0043001f.png",
        "timestamp": 1578561135540,
        "duration": 14906
    },
    {
        "description": "Forgot password link present on the Login page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 12852,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00a400c2-006e-00d2-005b-00660018008d.png",
        "timestamp": 1578561151376,
        "duration": 129
    },
    {
        "description": "Create Account link present on the Login page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 12852,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00180094-00a3-00dc-00c3-00bf00c70000.png",
        "timestamp": 1578561151937,
        "duration": 61
    },
    {
        "description": "Contact Us  link present on the Login Page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 12852,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "008b00cd-0058-0030-00e5-001200ea007f.png",
        "timestamp": 1578561152409,
        "duration": 43
    },
    {
        "description": "Verify comapny copyright text at the footer of the login page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 12852,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "00ac00ed-00e0-007c-0097-007f00430054.png",
        "timestamp": 1578561152918,
        "duration": 23
    },
    {
        "description": "Verify Username labeling is preseet|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 12852,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00a00055-002b-0021-00ce-00e3007d00ea.png",
        "timestamp": 1578561153342,
        "duration": 3
    },
    {
        "description": "Verify password label is present|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 12852,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00e600e5-0001-00c7-001c-00d70091001f.png",
        "timestamp": 1578561153782,
        "duration": 5
    },
    {
        "description": "Verify Remember Me check box|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 12852,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00d500e7-0064-00cf-00f0-0075005f0003.png",
        "timestamp": 1578561154207,
        "duration": 88
    },
    {
        "description": "verify the title of the Page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 12852,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00c90077-00c5-0071-007b-000400380057.png",
        "timestamp": 1578561154702,
        "duration": 13
    },
    {
        "description": "veriy all links present on page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 12852,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "002c007f-00ea-0041-0026-0085007600ff.png",
        "timestamp": 1578561155130,
        "duration": 148
    },
    {
        "description": "User Login successfully |Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 12852,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "https://archway-forduaw-qa.azurewebsites.net/main.85c1ca86202ad37951e9.js 0 /deep/ combinator is no longer supported in CSS dynamic profile. It is now effectively no-op, acting as if it were a descendant combinator. /deep/ combinator will be removed, and will be invalid at M65. You should remove it. See https://www.chromestatus.com/features/4964279606312960 for more details.",
                "timestamp": 1578561172323,
                "type": ""
            }
        ],
        "screenShotFile": "00390092-0046-00e6-0018-0092008700fb.png",
        "timestamp": 1578561155682,
        "duration": 16655
    },
    {
        "description": "Verify if user can search product by Order Number successfully| Verify My Orders page Functionality",
        "passed": false,
        "pending": false,
        "os": "Windows",
        "instanceId": 12852,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": [
            "Failed: No element found using locator: By(xpath, //form[@class='ng-pristine ng-valid ng-touched']//input[@id='search-addon'])"
        ],
        "trace": [
            "NoSuchElementError: No element found using locator: By(xpath, //form[@class='ng-pristine ng-valid ng-touched']//input[@id='search-addon'])\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:814:27\n    at ManagedPromise.invokeCallback_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\n    at processTicksAndRejections (internal/process/task_queues.js:93:5)Error\n    at ElementArrayFinder.applyAction_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:459:27)\n    at ElementArrayFinder.<computed> [as clear] (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:91:29)\n    at ElementFinder.<computed> [as clear] (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:831:22)\n    at MyOrders.searchOrder (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars_Byer\\pageobjects\\MyOrders\\MyOrders.js:45:15)\n    at UserContext.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars_Byer\\specs\\MyOrders\\SearchAndReorder_spec.js:74:17)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\nFrom: Task: Run it(\"Verify if user can search product by Order Number successfully\") in control flow\n    at UserContext.<anonymous> (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:94:19)\n    at attempt (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4297:26)\n    at QueueRunner.run (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4217:20)\n    at runNext (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4257:20)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4264:13\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4172:9\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:64:48\n    at ControlFlow.emit (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\events.js:62:21)\n    at ControlFlow.shutdown_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2674:10)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2599:53\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars_Byer\\specs\\MyOrders\\SearchAndReorder_spec.js:43:1)\n    at addSpecsToSuite (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars_Byer\\specs\\MyOrders\\SearchAndReorder_spec.js:25:1)\n    at Module._compile (internal/modules/cjs/loader.js:956:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:973:10)\n    at Module.load (internal/modules/cjs/loader.js:812:32)\n    at Function.Module._load (internal/modules/cjs/loader.js:724:14)"
        ],
        "browserLogs": [],
        "screenShotFile": "00ca0009-00dd-0083-0059-00a7001d006f.png",
        "timestamp": 1578561172785,
        "duration": 15518
    },
    {
        "description": " Verify Advance search(By Status and By date) than Re-order the product| Verify My Orders page Functionality",
        "passed": false,
        "pending": true,
        "os": "Windows",
        "instanceId": 12852,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Temporarily disabled with xit",
        "browserLogs": [],
        "screenShotFile": "006800b5-00f2-0088-004e-009000ad0020.png",
        "timestamp": 1578561188713,
        "duration": 0
    },
    {
        "description": "Verification of total=subtotal+shipping| Verify My Orders page Functionality",
        "passed": false,
        "pending": false,
        "os": "Windows",
        "instanceId": 12852,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": [
            "Failed: No element found using locator: By(xpath, //span[@class='float-right'][contains(text(),subtotalval)])"
        ],
        "trace": [
            "NoSuchElementError: No element found using locator: By(xpath, //span[@class='float-right'][contains(text(),subtotalval)])\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:814:27\n    at ManagedPromise.invokeCallback_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\n    at processTicksAndRejections (internal/process/task_queues.js:93:5)Error\n    at ElementArrayFinder.applyAction_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:459:27)\n    at ElementArrayFinder.<computed> [as getText] (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:91:29)\n    at ElementFinder.<computed> [as getText] (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:831:22)\n    at UserContext.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars_Byer\\specs\\MyOrders\\SearchAndReorder_spec.js:350:11)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\nFrom: Task: Run it(\"Verification of total=subtotal+shipping\") in control flow\n    at UserContext.<anonymous> (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:94:19)\n    at attempt (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4297:26)\n    at QueueRunner.run (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4217:20)\n    at runNext (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4257:20)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4264:13\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4172:9\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:64:48\n    at ControlFlow.emit (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\events.js:62:21)\n    at ControlFlow.shutdown_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2674:10)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2599:53\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars_Byer\\specs\\MyOrders\\SearchAndReorder_spec.js:343:1)\n    at addSpecsToSuite (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars_Byer\\specs\\MyOrders\\SearchAndReorder_spec.js:25:1)\n    at Module._compile (internal/modules/cjs/loader.js:956:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:973:10)\n    at Module.load (internal/modules/cjs/loader.js:812:32)\n    at Function.Module._load (internal/modules/cjs/loader.js:724:14)"
        ],
        "browserLogs": [],
        "screenShotFile": "00640025-0029-00aa-00e9-007100c20095.png",
        "timestamp": 1578561188789,
        "duration": 23
    },
    {
        "description": "should login the user|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 10788,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "001200bf-0060-00fa-0000-001d00b000c5.png",
        "timestamp": 1578561351559,
        "duration": 12395
    },
    {
        "description": "Forgot password link present on the Login page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 10788,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "008e00a1-00af-00f8-00b4-0039007400d0.png",
        "timestamp": 1578561364446,
        "duration": 54
    },
    {
        "description": "Create Account link present on the Login page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 10788,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "006c00ac-00d1-0015-00e0-006d000b009c.png",
        "timestamp": 1578561364920,
        "duration": 47
    },
    {
        "description": "Contact Us  link present on the Login Page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 10788,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00ea0050-0083-008d-000f-0045006b0027.png",
        "timestamp": 1578561365359,
        "duration": 43
    },
    {
        "description": "Verify comapny copyright text at the footer of the login page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 10788,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "006f0035-0044-00e3-0068-005e00b000a2.png",
        "timestamp": 1578561365824,
        "duration": 27
    },
    {
        "description": "Verify Username labeling is preseet|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 10788,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "003900e1-00e9-007b-006f-0033008e00d1.png",
        "timestamp": 1578561366276,
        "duration": 4
    },
    {
        "description": "Verify password label is present|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 10788,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00ad0095-0095-00b3-0063-000f00d5002b.png",
        "timestamp": 1578561366674,
        "duration": 4
    },
    {
        "description": "Verify Remember Me check box|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 10788,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00070082-002b-0002-006a-00510045001e.png",
        "timestamp": 1578561367103,
        "duration": 47
    },
    {
        "description": "verify the title of the Page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 10788,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00420016-0052-005d-00b9-00be00f60020.png",
        "timestamp": 1578561367604,
        "duration": 14
    },
    {
        "description": "veriy all links present on page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 10788,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "001f0068-00a6-001d-0064-0076008400ee.png",
        "timestamp": 1578561368048,
        "duration": 54
    },
    {
        "description": "User Login successfully |Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 10788,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "https://archway-forduaw-qa.azurewebsites.net/main.85c1ca86202ad37951e9.js 0 /deep/ combinator is no longer supported in CSS dynamic profile. It is now effectively no-op, acting as if it were a descendant combinator. /deep/ combinator will be removed, and will be invalid at M65. You should remove it. See https://www.chromestatus.com/features/4964279606312960 for more details.",
                "timestamp": 1578561385301,
                "type": ""
            }
        ],
        "screenShotFile": "00640029-00bf-001e-00fa-00bb00f90032.png",
        "timestamp": 1578561368677,
        "duration": 16636
    },
    {
        "description": "Verify if user can search product by Order Number successfully| Verify My Orders page Functionality",
        "passed": false,
        "pending": false,
        "os": "Windows",
        "instanceId": 10788,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": [
            "Failed: No element found using locator: By(xpath, //form[@class='ng-pristine ng-valid ng-touched']//input[@id='search-addon'])"
        ],
        "trace": [
            "NoSuchElementError: No element found using locator: By(xpath, //form[@class='ng-pristine ng-valid ng-touched']//input[@id='search-addon'])\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:814:27\n    at ManagedPromise.invokeCallback_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\n    at processTicksAndRejections (internal/process/task_queues.js:93:5)Error\n    at ElementArrayFinder.applyAction_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:459:27)\n    at ElementArrayFinder.<computed> [as clear] (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:91:29)\n    at ElementFinder.<computed> [as clear] (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:831:22)\n    at MyOrders.searchOrder (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars_Byer\\pageobjects\\MyOrders\\MyOrders.js:45:15)\n    at UserContext.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars_Byer\\specs\\MyOrders\\SearchAndReorder_spec.js:75:17)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\nFrom: Task: Run it(\"Verify if user can search product by Order Number successfully\") in control flow\n    at UserContext.<anonymous> (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:94:19)\n    at attempt (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4297:26)\n    at QueueRunner.run (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4217:20)\n    at runNext (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4257:20)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4264:13\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4172:9\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:64:48\n    at ControlFlow.emit (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\events.js:62:21)\n    at ControlFlow.shutdown_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2674:10)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2599:53\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars_Byer\\specs\\MyOrders\\SearchAndReorder_spec.js:43:1)\n    at addSpecsToSuite (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars_Byer\\specs\\MyOrders\\SearchAndReorder_spec.js:25:1)\n    at Module._compile (internal/modules/cjs/loader.js:956:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:973:10)\n    at Module.load (internal/modules/cjs/loader.js:812:32)\n    at Function.Module._load (internal/modules/cjs/loader.js:724:14)"
        ],
        "browserLogs": [],
        "screenShotFile": "00cc00d8-00c7-008e-005e-009400690088.png",
        "timestamp": 1578561385743,
        "duration": 15444
    },
    {
        "description": " Verify Advance search(By Status and By date) than Re-order the product| Verify My Orders page Functionality",
        "passed": false,
        "pending": true,
        "os": "Windows",
        "instanceId": 10788,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Temporarily disabled with xit",
        "browserLogs": [],
        "screenShotFile": "007700b9-0037-00d2-004d-00ce005300cd.png",
        "timestamp": 1578561401622,
        "duration": 0
    },
    {
        "description": "Verification of total=subtotal+shipping| Verify My Orders page Functionality",
        "passed": false,
        "pending": false,
        "os": "Windows",
        "instanceId": 10788,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": [
            "Failed: No element found using locator: By(xpath, //span[@class='float-right'][contains(text(),subtotalval)])"
        ],
        "trace": [
            "NoSuchElementError: No element found using locator: By(xpath, //span[@class='float-right'][contains(text(),subtotalval)])\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:814:27\n    at ManagedPromise.invokeCallback_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\n    at processTicksAndRejections (internal/process/task_queues.js:93:5)Error\n    at ElementArrayFinder.applyAction_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:459:27)\n    at ElementArrayFinder.<computed> [as getText] (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:91:29)\n    at ElementFinder.<computed> [as getText] (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:831:22)\n    at UserContext.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars_Byer\\specs\\MyOrders\\SearchAndReorder_spec.js:351:11)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\nFrom: Task: Run it(\"Verification of total=subtotal+shipping\") in control flow\n    at UserContext.<anonymous> (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:94:19)\n    at attempt (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4297:26)\n    at QueueRunner.run (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4217:20)\n    at runNext (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4257:20)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4264:13\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4172:9\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:64:48\n    at ControlFlow.emit (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\events.js:62:21)\n    at ControlFlow.shutdown_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2674:10)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2599:53\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars_Byer\\specs\\MyOrders\\SearchAndReorder_spec.js:344:1)\n    at addSpecsToSuite (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars_Byer\\specs\\MyOrders\\SearchAndReorder_spec.js:25:1)\n    at Module._compile (internal/modules/cjs/loader.js:956:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:973:10)\n    at Module.load (internal/modules/cjs/loader.js:812:32)\n    at Function.Module._load (internal/modules/cjs/loader.js:724:14)"
        ],
        "browserLogs": [],
        "screenShotFile": "00ca00c7-001d-00db-00e2-006600240082.png",
        "timestamp": 1578561401696,
        "duration": 23
    },
    {
        "description": "should login the user|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 8424,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "00be00dd-0030-005d-0002-00b8005d000b.png",
        "timestamp": 1578561604759,
        "duration": 11573
    },
    {
        "description": "Forgot password link present on the Login page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 8424,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "004000ff-00f6-003d-0087-00e60076008f.png",
        "timestamp": 1578561616854,
        "duration": 71
    },
    {
        "description": "Create Account link present on the Login page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 8424,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "009e00d7-00b8-00eb-00f9-004d00220006.png",
        "timestamp": 1578561617328,
        "duration": 61
    },
    {
        "description": "Contact Us  link present on the Login Page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 8424,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00e3004c-0020-00bd-00e1-0006001600b1.png",
        "timestamp": 1578561617798,
        "duration": 49
    },
    {
        "description": "Verify comapny copyright text at the footer of the login page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 8424,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "00c300c5-000c-00e6-00e5-00a60053001b.png",
        "timestamp": 1578561618252,
        "duration": 29
    },
    {
        "description": "Verify Username labeling is preseet|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 8424,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "005f005a-00c7-005f-001d-0078001e0054.png",
        "timestamp": 1578561618690,
        "duration": 4
    },
    {
        "description": "Verify password label is present|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 8424,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "005500e5-0026-0001-001e-00ff00bd002f.png",
        "timestamp": 1578561619106,
        "duration": 3
    },
    {
        "description": "Verify Remember Me check box|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 8424,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00d40062-0073-0059-005d-00ef00e10070.png",
        "timestamp": 1578561619517,
        "duration": 49
    },
    {
        "description": "verify the title of the Page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 8424,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00ba00e8-0007-006f-006b-003500b30094.png",
        "timestamp": 1578561619972,
        "duration": 14
    },
    {
        "description": "veriy all links present on page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 8424,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "00e50072-009e-00d3-00f8-009a003d0022.png",
        "timestamp": 1578561620386,
        "duration": 62
    },
    {
        "description": "User Login successfully |Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 8424,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "https://archway-forduaw-qa.azurewebsites.net/main.85c1ca86202ad37951e9.js 0 /deep/ combinator is no longer supported in CSS dynamic profile. It is now effectively no-op, acting as if it were a descendant combinator. /deep/ combinator will be removed, and will be invalid at M65. You should remove it. See https://www.chromestatus.com/features/4964279606312960 for more details.",
                "timestamp": 1578561637464,
                "type": ""
            }
        ],
        "screenShotFile": "00700014-00bd-00cd-00ec-00b400260004.png",
        "timestamp": 1578561620853,
        "duration": 16619
    },
    {
        "description": "Verify if user can search product by Order Number successfully| Verify My Orders page Functionality",
        "passed": false,
        "pending": false,
        "os": "Windows",
        "instanceId": 8424,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": [
            "Failed: No element found using locator: By(xpath, //form[@class='ng-pristine ng-valid ng-touched']//input[@id='search-addon'])"
        ],
        "trace": [
            "NoSuchElementError: No element found using locator: By(xpath, //form[@class='ng-pristine ng-valid ng-touched']//input[@id='search-addon'])\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:814:27\n    at ManagedPromise.invokeCallback_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\n    at processTicksAndRejections (internal/process/task_queues.js:93:5)Error\n    at ElementArrayFinder.applyAction_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:459:27)\n    at ElementArrayFinder.<computed> [as clear] (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:91:29)\n    at ElementFinder.<computed> [as clear] (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:831:22)\n    at MyOrders.searchOrder (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars_Byer\\pageobjects\\MyOrders\\MyOrders.js:45:15)\n    at UserContext.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars_Byer\\specs\\MyOrders\\SearchAndReorder_spec.js:75:17)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\nFrom: Task: Run it(\"Verify if user can search product by Order Number successfully\") in control flow\n    at UserContext.<anonymous> (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:94:19)\n    at attempt (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4297:26)\n    at QueueRunner.run (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4217:20)\n    at runNext (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4257:20)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4264:13\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4172:9\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:64:48\n    at ControlFlow.emit (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\events.js:62:21)\n    at ControlFlow.shutdown_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2674:10)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2599:53\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars_Byer\\specs\\MyOrders\\SearchAndReorder_spec.js:43:1)\n    at addSpecsToSuite (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars_Byer\\specs\\MyOrders\\SearchAndReorder_spec.js:25:1)\n    at Module._compile (internal/modules/cjs/loader.js:956:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:973:10)\n    at Module.load (internal/modules/cjs/loader.js:812:32)\n    at Function.Module._load (internal/modules/cjs/loader.js:724:14)"
        ],
        "browserLogs": [],
        "screenShotFile": "00df0006-00e1-00dd-00d7-0049001a00b2.png",
        "timestamp": 1578561637886,
        "duration": 18451
    },
    {
        "description": " Verify Advance search(By Status and By date) than Re-order the product| Verify My Orders page Functionality",
        "passed": false,
        "pending": true,
        "os": "Windows",
        "instanceId": 8424,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Temporarily disabled with xit",
        "browserLogs": [],
        "screenShotFile": "00c7006f-006c-0058-00ff-000300bd00ab.png",
        "timestamp": 1578561656740,
        "duration": 0
    },
    {
        "description": "Verification of total=subtotal+shipping| Verify My Orders page Functionality",
        "passed": false,
        "pending": false,
        "os": "Windows",
        "instanceId": 8424,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": [
            "Failed: No element found using locator: By(xpath, //span[@class='float-right'][contains(text(),subtotalval)])"
        ],
        "trace": [
            "NoSuchElementError: No element found using locator: By(xpath, //span[@class='float-right'][contains(text(),subtotalval)])\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:814:27\n    at ManagedPromise.invokeCallback_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\n    at processTicksAndRejections (internal/process/task_queues.js:93:5)Error\n    at ElementArrayFinder.applyAction_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:459:27)\n    at ElementArrayFinder.<computed> [as getText] (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:91:29)\n    at ElementFinder.<computed> [as getText] (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:831:22)\n    at UserContext.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars_Byer\\specs\\MyOrders\\SearchAndReorder_spec.js:351:11)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\nFrom: Task: Run it(\"Verification of total=subtotal+shipping\") in control flow\n    at UserContext.<anonymous> (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:94:19)\n    at attempt (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4297:26)\n    at QueueRunner.run (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4217:20)\n    at runNext (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4257:20)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4264:13\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4172:9\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:64:48\n    at ControlFlow.emit (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\events.js:62:21)\n    at ControlFlow.shutdown_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2674:10)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2599:53\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars_Byer\\specs\\MyOrders\\SearchAndReorder_spec.js:344:1)\n    at addSpecsToSuite (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars_Byer\\specs\\MyOrders\\SearchAndReorder_spec.js:25:1)\n    at Module._compile (internal/modules/cjs/loader.js:956:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:973:10)\n    at Module.load (internal/modules/cjs/loader.js:812:32)\n    at Function.Module._load (internal/modules/cjs/loader.js:724:14)"
        ],
        "browserLogs": [],
        "screenShotFile": "00b000e8-00bc-003e-00ee-009900b50096.png",
        "timestamp": 1578561656813,
        "duration": 22
    },
    {
        "description": "should login the user|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 12924,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "0036003a-005f-0069-0083-002600860024.png",
        "timestamp": 1578562394316,
        "duration": 15282
    },
    {
        "description": "Forgot password link present on the Login page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 12924,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "009300aa-003a-00e5-00ba-00ae00fd00f0.png",
        "timestamp": 1578562410150,
        "duration": 56
    },
    {
        "description": "Create Account link present on the Login page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 12924,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "007200fc-0089-0024-00fa-00b800c4004d.png",
        "timestamp": 1578562410696,
        "duration": 52
    },
    {
        "description": "Contact Us  link present on the Login Page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 12924,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00c40061-00a4-0092-002c-008f00590081.png",
        "timestamp": 1578562411168,
        "duration": 47
    },
    {
        "description": "Verify comapny copyright text at the footer of the login page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 12924,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "008b0021-00cf-00ed-00a7-0093007d003f.png",
        "timestamp": 1578562411625,
        "duration": 23
    },
    {
        "description": "Verify Username labeling is preseet|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 12924,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "006f004e-0085-0009-0034-009f0047000c.png",
        "timestamp": 1578562412059,
        "duration": 4
    },
    {
        "description": "Verify password label is present|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 12924,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00c100a0-00c4-006d-002d-005f00fa00f0.png",
        "timestamp": 1578562412484,
        "duration": 3
    },
    {
        "description": "Verify Remember Me check box|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 12924,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00ef0021-003d-00f9-00c2-000f008e00bd.png",
        "timestamp": 1578562412894,
        "duration": 47
    },
    {
        "description": "verify the title of the Page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 12924,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "009a00bf-0028-009b-0015-00eb004c003f.png",
        "timestamp": 1578562413333,
        "duration": 14
    },
    {
        "description": "veriy all links present on page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 12924,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "00f30079-009d-00af-00a2-00cc0002005e.png",
        "timestamp": 1578562413736,
        "duration": 64
    },
    {
        "description": "User Login successfully |Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 12924,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "https://archway-forduaw-qa.azurewebsites.net/main.85c1ca86202ad37951e9.js 0 /deep/ combinator is no longer supported in CSS dynamic profile. It is now effectively no-op, acting as if it were a descendant combinator. /deep/ combinator will be removed, and will be invalid at M65. You should remove it. See https://www.chromestatus.com/features/4964279606312960 for more details.",
                "timestamp": 1578562430870,
                "type": ""
            }
        ],
        "screenShotFile": "00800000-0048-003f-0027-003f00400047.png",
        "timestamp": 1578562414261,
        "duration": 16618
    },
    {
        "description": "Verify if user can search product by Order Number successfully| Verify My Orders page Functionality",
        "passed": false,
        "pending": false,
        "os": "Windows",
        "instanceId": 12924,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": [
            "Failed: No element found using locator: By(xpath, //form[@class='ng-pristine ng-valid ng-touched']//input[@id='search-addon'])"
        ],
        "trace": [
            "NoSuchElementError: No element found using locator: By(xpath, //form[@class='ng-pristine ng-valid ng-touched']//input[@id='search-addon'])\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:814:27\n    at ManagedPromise.invokeCallback_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\n    at processTicksAndRejections (internal/process/task_queues.js:93:5)Error\n    at ElementArrayFinder.applyAction_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:459:27)\n    at ElementArrayFinder.<computed> [as clear] (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:91:29)\n    at ElementFinder.<computed> [as clear] (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:831:22)\n    at MyOrders.searchOrder (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars_Byer\\pageobjects\\MyOrders\\MyOrders.js:45:15)\n    at UserContext.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars_Byer\\specs\\MyOrders\\SearchAndReorder_spec.js:75:17)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\nFrom: Task: Run it(\"Verify if user can search product by Order Number successfully\") in control flow\n    at UserContext.<anonymous> (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:94:19)\n    at attempt (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4297:26)\n    at QueueRunner.run (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4217:20)\n    at runNext (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4257:20)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4264:13\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4172:9\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:64:48\n    at ControlFlow.emit (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\events.js:62:21)\n    at ControlFlow.shutdown_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2674:10)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2599:53\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars_Byer\\specs\\MyOrders\\SearchAndReorder_spec.js:43:1)\n    at addSpecsToSuite (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars_Byer\\specs\\MyOrders\\SearchAndReorder_spec.js:25:1)\n    at Module._compile (internal/modules/cjs/loader.js:956:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:973:10)\n    at Module.load (internal/modules/cjs/loader.js:812:32)\n    at Function.Module._load (internal/modules/cjs/loader.js:724:14)"
        ],
        "browserLogs": [],
        "screenShotFile": "003d00cd-00f0-004d-00ea-007c00070081.png",
        "timestamp": 1578562431444,
        "duration": 18440
    },
    {
        "description": " Verify Advance search(By Status and By date) than Re-order the product| Verify My Orders page Functionality",
        "passed": false,
        "pending": true,
        "os": "Windows",
        "instanceId": 12924,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Temporarily disabled with xit",
        "browserLogs": [],
        "screenShotFile": "006400b4-0085-00e0-00c0-00f50007003b.png",
        "timestamp": 1578562450299,
        "duration": 0
    },
    {
        "description": "Verification of total=subtotal+shipping| Verify My Orders page Functionality",
        "passed": false,
        "pending": false,
        "os": "Windows",
        "instanceId": 12924,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": [
            "Failed: No element found using locator: By(xpath, //span[@class='float-right'][contains(text(),subtotalval)])"
        ],
        "trace": [
            "NoSuchElementError: No element found using locator: By(xpath, //span[@class='float-right'][contains(text(),subtotalval)])\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:814:27\n    at ManagedPromise.invokeCallback_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\n    at processTicksAndRejections (internal/process/task_queues.js:93:5)Error\n    at ElementArrayFinder.applyAction_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:459:27)\n    at ElementArrayFinder.<computed> [as getText] (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:91:29)\n    at ElementFinder.<computed> [as getText] (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:831:22)\n    at UserContext.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars_Byer\\specs\\MyOrders\\SearchAndReorder_spec.js:351:11)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\nFrom: Task: Run it(\"Verification of total=subtotal+shipping\") in control flow\n    at UserContext.<anonymous> (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:94:19)\n    at attempt (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4297:26)\n    at QueueRunner.run (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4217:20)\n    at runNext (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4257:20)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4264:13\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4172:9\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:64:48\n    at ControlFlow.emit (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\events.js:62:21)\n    at ControlFlow.shutdown_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2674:10)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2599:53\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars_Byer\\specs\\MyOrders\\SearchAndReorder_spec.js:344:1)\n    at addSpecsToSuite (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars_Byer\\specs\\MyOrders\\SearchAndReorder_spec.js:25:1)\n    at Module._compile (internal/modules/cjs/loader.js:956:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:973:10)\n    at Module.load (internal/modules/cjs/loader.js:812:32)\n    at Function.Module._load (internal/modules/cjs/loader.js:724:14)"
        ],
        "browserLogs": [],
        "screenShotFile": "00bf006b-000c-002f-00b9-00e0001b00fe.png",
        "timestamp": 1578562450371,
        "duration": 40
    },
    {
        "description": "should login the user|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 6028,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "008f007f-0006-00c2-0064-00bd00ef0072.png",
        "timestamp": 1578562875375,
        "duration": 11673
    },
    {
        "description": "Forgot password link present on the Login page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 6028,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00ff004e-0062-00b7-0061-00eb00c000fa.png",
        "timestamp": 1578562887575,
        "duration": 64
    },
    {
        "description": "Create Account link present on the Login page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 6028,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00cf00a7-00ea-0000-002a-006b00b000a9.png",
        "timestamp": 1578562888071,
        "duration": 57
    },
    {
        "description": "Contact Us  link present on the Login Page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 6028,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "004100e8-009a-004f-009b-00e0000600b3.png",
        "timestamp": 1578562888542,
        "duration": 57
    },
    {
        "description": "Verify comapny copyright text at the footer of the login page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 6028,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "00d200c0-00f6-00ff-0091-00ee00820063.png",
        "timestamp": 1578562888997,
        "duration": 26
    },
    {
        "description": "Verify Username labeling is preseet|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 6028,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00800093-0043-0096-001a-00eb008b00b5.png",
        "timestamp": 1578562889424,
        "duration": 3
    },
    {
        "description": "Verify password label is present|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 6028,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00570013-0038-00bb-001e-00ac000f007b.png",
        "timestamp": 1578562890327,
        "duration": 3
    },
    {
        "description": "Verify Remember Me check box|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 6028,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00e400b4-00b2-001f-008c-00f100f400b1.png",
        "timestamp": 1578562890729,
        "duration": 41
    },
    {
        "description": "verify the title of the Page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 6028,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "009a00a1-0072-0037-0092-00e6007f00fe.png",
        "timestamp": 1578562891165,
        "duration": 15
    },
    {
        "description": "veriy all links present on page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 6028,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "0059008a-00c0-00ce-00b8-0053001500a0.png",
        "timestamp": 1578562891572,
        "duration": 44
    },
    {
        "description": "User Login successfully |Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 6028,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "https://archway-forduaw-qa.azurewebsites.net/main.85c1ca86202ad37951e9.js 0 /deep/ combinator is no longer supported in CSS dynamic profile. It is now effectively no-op, acting as if it were a descendant combinator. /deep/ combinator will be removed, and will be invalid at M65. You should remove it. See https://www.chromestatus.com/features/4964279606312960 for more details.",
                "timestamp": 1578562908627,
                "type": ""
            }
        ],
        "screenShotFile": "00600043-00b7-00ec-00df-00c000940007.png",
        "timestamp": 1578562892009,
        "duration": 16631
    },
    {
        "description": "Verify if user can search product by Order Number successfully| Verify My Orders page Functionality",
        "passed": false,
        "pending": false,
        "os": "Windows",
        "instanceId": 6028,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": [
            "Failed: No element found using locator: By(xpath, //form[@class='ng-pristine ng-valid ng-touched']//input[@id='search-addon'])"
        ],
        "trace": [
            "NoSuchElementError: No element found using locator: By(xpath, //form[@class='ng-pristine ng-valid ng-touched']//input[@id='search-addon'])\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:814:27\n    at ManagedPromise.invokeCallback_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\n    at processTicksAndRejections (internal/process/task_queues.js:93:5)Error\n    at ElementArrayFinder.applyAction_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:459:27)\n    at ElementArrayFinder.<computed> [as clear] (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:91:29)\n    at ElementFinder.<computed> [as clear] (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:831:22)\n    at MyOrders.searchOrder (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars_Byer\\pageobjects\\MyOrders\\MyOrders.js:45:15)\n    at UserContext.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars_Byer\\specs\\MyOrders\\SearchAndReorder_spec.js:75:17)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\nFrom: Task: Run it(\"Verify if user can search product by Order Number successfully\") in control flow\n    at UserContext.<anonymous> (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:94:19)\n    at attempt (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4297:26)\n    at QueueRunner.run (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4217:20)\n    at runNext (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4257:20)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4264:13\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4172:9\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:64:48\n    at ControlFlow.emit (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\events.js:62:21)\n    at ControlFlow.shutdown_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2674:10)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2599:53\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars_Byer\\specs\\MyOrders\\SearchAndReorder_spec.js:43:1)\n    at addSpecsToSuite (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars_Byer\\specs\\MyOrders\\SearchAndReorder_spec.js:25:1)\n    at Module._compile (internal/modules/cjs/loader.js:956:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:973:10)\n    at Module.load (internal/modules/cjs/loader.js:812:32)\n    at Function.Module._load (internal/modules/cjs/loader.js:724:14)"
        ],
        "browserLogs": [],
        "screenShotFile": "00d000bf-0062-0011-00e7-00c000df0082.png",
        "timestamp": 1578562909110,
        "duration": 18469
    },
    {
        "description": " Verify Advance search(By Status and By date) than Re-order the product| Verify My Orders page Functionality",
        "passed": false,
        "pending": true,
        "os": "Windows",
        "instanceId": 6028,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Temporarily disabled with xit",
        "browserLogs": [],
        "screenShotFile": "000b0012-009e-004b-00fb-008000c5002d.png",
        "timestamp": 1578562927987,
        "duration": 0
    },
    {
        "description": "Verification of total=subtotal+shipping| Verify My Orders page Functionality",
        "passed": false,
        "pending": false,
        "os": "Windows",
        "instanceId": 6028,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": [
            "Failed: No element found using locator: By(xpath, //span[@class='float-right'][contains(text(),subtotalval)])"
        ],
        "trace": [
            "NoSuchElementError: No element found using locator: By(xpath, //span[@class='float-right'][contains(text(),subtotalval)])\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:814:27\n    at ManagedPromise.invokeCallback_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\n    at processTicksAndRejections (internal/process/task_queues.js:93:5)Error\n    at ElementArrayFinder.applyAction_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:459:27)\n    at ElementArrayFinder.<computed> [as getText] (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:91:29)\n    at ElementFinder.<computed> [as getText] (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:831:22)\n    at UserContext.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars_Byer\\specs\\MyOrders\\SearchAndReorder_spec.js:351:11)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\nFrom: Task: Run it(\"Verification of total=subtotal+shipping\") in control flow\n    at UserContext.<anonymous> (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:94:19)\n    at attempt (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4297:26)\n    at QueueRunner.run (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4217:20)\n    at runNext (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4257:20)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4264:13\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4172:9\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:64:48\n    at ControlFlow.emit (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\events.js:62:21)\n    at ControlFlow.shutdown_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2674:10)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2599:53\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars_Byer\\specs\\MyOrders\\SearchAndReorder_spec.js:344:1)\n    at addSpecsToSuite (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars_Byer\\specs\\MyOrders\\SearchAndReorder_spec.js:25:1)\n    at Module._compile (internal/modules/cjs/loader.js:956:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:973:10)\n    at Module.load (internal/modules/cjs/loader.js:812:32)\n    at Function.Module._load (internal/modules/cjs/loader.js:724:14)"
        ],
        "browserLogs": [],
        "screenShotFile": "009b004d-0076-00ed-0021-005200410047.png",
        "timestamp": 1578562928067,
        "duration": 40
    },
    {
        "description": "should login the user|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 4204,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "002200d1-006f-002c-004a-002f001000e8.png",
        "timestamp": 1578562952403,
        "duration": 12253
    },
    {
        "description": "Forgot password link present on the Login page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 4204,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "005a00af-0018-0003-0058-00f100ff0004.png",
        "timestamp": 1578562965167,
        "duration": 62
    },
    {
        "description": "Create Account link present on the Login page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 4204,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "0050003c-0044-0050-0087-00fc002e0016.png",
        "timestamp": 1578562965636,
        "duration": 53
    },
    {
        "description": "Contact Us  link present on the Login Page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 4204,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00f8006e-009d-0033-00e7-00c3004700f0.png",
        "timestamp": 1578562966120,
        "duration": 42
    },
    {
        "description": "Verify comapny copyright text at the footer of the login page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 4204,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "005a0062-0019-0001-0062-00f000140056.png",
        "timestamp": 1578562966671,
        "duration": 22
    },
    {
        "description": "Verify Username labeling is preseet|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 4204,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00ae00b7-0043-00a1-00a4-0071007600b0.png",
        "timestamp": 1578562967084,
        "duration": 4
    },
    {
        "description": "Verify password label is present|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 4204,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00eb0010-0068-0042-00dc-003a00890055.png",
        "timestamp": 1578562967488,
        "duration": 4
    },
    {
        "description": "Verify Remember Me check box|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 4204,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00d4000b-0020-005a-004f-00a000d30083.png",
        "timestamp": 1578562967876,
        "duration": 35
    },
    {
        "description": "verify the title of the Page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 4204,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00f60090-0091-004c-004e-00be004f00e2.png",
        "timestamp": 1578562968294,
        "duration": 12
    },
    {
        "description": "veriy all links present on page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 4204,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "003d00db-000e-001a-001c-00b30031005d.png",
        "timestamp": 1578562968706,
        "duration": 54
    },
    {
        "description": "User Login successfully |Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 4204,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "https://archway-forduaw-qa.azurewebsites.net/main.85c1ca86202ad37951e9.js 0 /deep/ combinator is no longer supported in CSS dynamic profile. It is now effectively no-op, acting as if it were a descendant combinator. /deep/ combinator will be removed, and will be invalid at M65. You should remove it. See https://www.chromestatus.com/features/4964279606312960 for more details.",
                "timestamp": 1578562985747,
                "type": ""
            }
        ],
        "screenShotFile": "00f100a7-00ac-0041-006c-00da00ad007e.png",
        "timestamp": 1578562969174,
        "duration": 16594
    },
    {
        "description": "Verify if user can search product by Order Number successfully| Verify My Orders page Functionality",
        "passed": false,
        "pending": false,
        "os": "Windows",
        "instanceId": 4204,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": [
            "Failed: No element found using locator: By(xpath, //form[@class='ng-pristine ng-valid ng-touched']//input[@id='search-addon'])"
        ],
        "trace": [
            "NoSuchElementError: No element found using locator: By(xpath, //form[@class='ng-pristine ng-valid ng-touched']//input[@id='search-addon'])\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:814:27\n    at ManagedPromise.invokeCallback_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\n    at processTicksAndRejections (internal/process/task_queues.js:93:5)Error\n    at ElementArrayFinder.applyAction_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:459:27)\n    at ElementArrayFinder.<computed> [as clear] (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:91:29)\n    at ElementFinder.<computed> [as clear] (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:831:22)\n    at MyOrders.searchOrder (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars_Byer\\pageobjects\\MyOrders\\MyOrders.js:45:15)\n    at UserContext.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars_Byer\\specs\\MyOrders\\SearchAndReorder_spec.js:75:17)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\nFrom: Task: Run it(\"Verify if user can search product by Order Number successfully\") in control flow\n    at UserContext.<anonymous> (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:94:19)\n    at attempt (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4297:26)\n    at QueueRunner.run (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4217:20)\n    at runNext (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4257:20)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4264:13\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4172:9\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:64:48\n    at ControlFlow.emit (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\events.js:62:21)\n    at ControlFlow.shutdown_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2674:10)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2599:53\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars_Byer\\specs\\MyOrders\\SearchAndReorder_spec.js:43:1)\n    at addSpecsToSuite (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars_Byer\\specs\\MyOrders\\SearchAndReorder_spec.js:25:1)\n    at Module._compile (internal/modules/cjs/loader.js:956:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:973:10)\n    at Module.load (internal/modules/cjs/loader.js:812:32)\n    at Function.Module._load (internal/modules/cjs/loader.js:724:14)"
        ],
        "browserLogs": [],
        "screenShotFile": "00a30054-00c9-00b2-00b5-0071007e0007.png",
        "timestamp": 1578562986271,
        "duration": 18471
    },
    {
        "description": " Verify Advance search(By Status and By date) than Re-order the product| Verify My Orders page Functionality",
        "passed": false,
        "pending": true,
        "os": "Windows",
        "instanceId": 4204,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Temporarily disabled with xit",
        "browserLogs": [],
        "screenShotFile": "00bf008d-003e-0094-00dc-001000890073.png",
        "timestamp": 1578563005154,
        "duration": 0
    },
    {
        "description": "Verification of total=subtotal+shipping| Verify My Orders page Functionality",
        "passed": false,
        "pending": false,
        "os": "Windows",
        "instanceId": 4204,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": [
            "Failed: No element found using locator: By(xpath, //span[@class='float-right'][contains(text(),subtotalval)])"
        ],
        "trace": [
            "NoSuchElementError: No element found using locator: By(xpath, //span[@class='float-right'][contains(text(),subtotalval)])\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:814:27\n    at ManagedPromise.invokeCallback_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\n    at processTicksAndRejections (internal/process/task_queues.js:93:5)Error\n    at ElementArrayFinder.applyAction_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:459:27)\n    at ElementArrayFinder.<computed> [as getText] (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:91:29)\n    at ElementFinder.<computed> [as getText] (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:831:22)\n    at UserContext.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars_Byer\\specs\\MyOrders\\SearchAndReorder_spec.js:351:11)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\nFrom: Task: Run it(\"Verification of total=subtotal+shipping\") in control flow\n    at UserContext.<anonymous> (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:94:19)\n    at attempt (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4297:26)\n    at QueueRunner.run (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4217:20)\n    at runNext (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4257:20)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4264:13\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4172:9\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:64:48\n    at ControlFlow.emit (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\events.js:62:21)\n    at ControlFlow.shutdown_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2674:10)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2599:53\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars_Byer\\specs\\MyOrders\\SearchAndReorder_spec.js:344:1)\n    at addSpecsToSuite (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars_Byer\\specs\\MyOrders\\SearchAndReorder_spec.js:25:1)\n    at Module._compile (internal/modules/cjs/loader.js:956:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:973:10)\n    at Module.load (internal/modules/cjs/loader.js:812:32)\n    at Function.Module._load (internal/modules/cjs/loader.js:724:14)"
        ],
        "browserLogs": [],
        "screenShotFile": "001d00f8-00c0-00db-00cd-004f00cd00ef.png",
        "timestamp": 1578563005230,
        "duration": 27
    },
    {
        "description": "should login the user|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 12204,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "004400eb-00af-00f4-007b-007e00b00021.png",
        "timestamp": 1578643129747,
        "duration": 9456
    },
    {
        "description": "Forgot password link present on the Login page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 12204,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "006e0010-0001-00dc-00b0-006100dc0003.png",
        "timestamp": 1578643141554,
        "duration": 114
    },
    {
        "description": "Create Account link present on the Login page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 12204,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "002900e2-0049-0051-0062-0053006f00e5.png",
        "timestamp": 1578643142244,
        "duration": 51
    },
    {
        "description": "Contact Us  link present on the Login Page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 12204,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "0000002d-0016-0053-004e-00e700170074.png",
        "timestamp": 1578643142760,
        "duration": 40
    },
    {
        "description": "Verify comapny copyright text at the footer of the login page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 12204,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "00500092-0061-00be-0080-00f000050002.png",
        "timestamp": 1578643143270,
        "duration": 26
    },
    {
        "description": "Verify Username labeling is preseet|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 12204,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "007c0039-0045-0057-000e-001f00e000b4.png",
        "timestamp": 1578643143746,
        "duration": 3
    },
    {
        "description": "Verify password label is present|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 12204,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00e4000c-002f-001d-002a-0077003e003c.png",
        "timestamp": 1578643144252,
        "duration": 3
    },
    {
        "description": "Verify Remember Me check box|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 12204,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "006e0022-0014-006b-0085-00a000bd00c8.png",
        "timestamp": 1578643144696,
        "duration": 84
    },
    {
        "description": "verify the title of the Page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 12204,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00ab0080-00d8-006d-007e-008b00e5008c.png",
        "timestamp": 1578643145459,
        "duration": 100
    },
    {
        "description": "veriy all links present on page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 12204,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "00e100a9-00cf-00c4-0015-00d100f8009b.png",
        "timestamp": 1578643146025,
        "duration": 94
    },
    {
        "description": "User Login successfully |Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 12204,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "https://archway-forduaw-qa.azurewebsites.net/main.7192b6576cf3603fd946.js 0 /deep/ combinator is no longer supported in CSS dynamic profile. It is now effectively no-op, acting as if it were a descendant combinator. /deep/ combinator will be removed, and will be invalid at M65. You should remove it. See https://www.chromestatus.com/features/4964279606312960 for more details.",
                "timestamp": 1578643163460,
                "type": ""
            }
        ],
        "screenShotFile": "00310076-0000-00df-00de-009000330057.png",
        "timestamp": 1578643146626,
        "duration": 16882
    },
    {
        "description": "Verify if user can search product by Order Number successfully| Verify My Orders page Functionality",
        "passed": false,
        "pending": false,
        "os": "Windows",
        "instanceId": 12204,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": [
            "Failed: No element found using locator: By(xpath, //form[@class='ng-pristine ng-valid ng-touched']//input[@id='search-addon'])"
        ],
        "trace": [
            "NoSuchElementError: No element found using locator: By(xpath, //form[@class='ng-pristine ng-valid ng-touched']//input[@id='search-addon'])\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:814:27\n    at ManagedPromise.invokeCallback_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\n    at processTicksAndRejections (internal/process/task_queues.js:93:5)Error\n    at ElementArrayFinder.applyAction_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:459:27)\n    at ElementArrayFinder.<computed> [as clear] (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:91:29)\n    at ElementFinder.<computed> [as clear] (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:831:22)\n    at MyOrders.searchOrder (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars_Byer\\pageobjects\\MyOrders\\MyOrders.js:45:15)\n    at UserContext.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars_Byer\\specs\\MyOrders\\SearchAndReorder_spec.js:75:17)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\nFrom: Task: Run it(\"Verify if user can search product by Order Number successfully\") in control flow\n    at UserContext.<anonymous> (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:94:19)\n    at attempt (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4297:26)\n    at QueueRunner.run (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4217:20)\n    at runNext (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4257:20)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4264:13\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4172:9\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:64:48\n    at ControlFlow.emit (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\events.js:62:21)\n    at ControlFlow.shutdown_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2674:10)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2599:53\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars_Byer\\specs\\MyOrders\\SearchAndReorder_spec.js:43:1)\n    at addSpecsToSuite (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars_Byer\\specs\\MyOrders\\SearchAndReorder_spec.js:25:1)\n    at Module._compile (internal/modules/cjs/loader.js:956:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:973:10)\n    at Module.load (internal/modules/cjs/loader.js:812:32)\n    at Function.Module._load (internal/modules/cjs/loader.js:724:14)"
        ],
        "browserLogs": [],
        "screenShotFile": "00da008c-00e6-00fc-00cf-008a0035008a.png",
        "timestamp": 1578643163951,
        "duration": 18463
    },
    {
        "description": " Verify Advance search(By Status and By date) than Re-order the product| Verify My Orders page Functionality",
        "passed": false,
        "pending": true,
        "os": "Windows",
        "instanceId": 12204,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Temporarily disabled with xit",
        "browserLogs": [],
        "screenShotFile": "004200c2-008d-00b4-0032-00530060009b.png",
        "timestamp": 1578643182914,
        "duration": 0
    },
    {
        "description": "Verification of total=subtotal+shipping| Verify My Orders page Functionality",
        "passed": false,
        "pending": false,
        "os": "Windows",
        "instanceId": 12204,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": [
            "Failed: No element found using locator: By(xpath, //span[@class='float-right'][contains(text(),subtotalval)])"
        ],
        "trace": [
            "NoSuchElementError: No element found using locator: By(xpath, //span[@class='float-right'][contains(text(),subtotalval)])\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:814:27\n    at ManagedPromise.invokeCallback_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\n    at processTicksAndRejections (internal/process/task_queues.js:93:5)Error\n    at ElementArrayFinder.applyAction_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:459:27)\n    at ElementArrayFinder.<computed> [as getText] (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:91:29)\n    at ElementFinder.<computed> [as getText] (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:831:22)\n    at UserContext.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars_Byer\\specs\\MyOrders\\SearchAndReorder_spec.js:351:11)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\nFrom: Task: Run it(\"Verification of total=subtotal+shipping\") in control flow\n    at UserContext.<anonymous> (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:94:19)\n    at attempt (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4297:26)\n    at QueueRunner.run (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4217:20)\n    at runNext (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4257:20)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4264:13\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4172:9\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:64:48\n    at ControlFlow.emit (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\events.js:62:21)\n    at ControlFlow.shutdown_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2674:10)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2599:53\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars_Byer\\specs\\MyOrders\\SearchAndReorder_spec.js:344:1)\n    at addSpecsToSuite (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars_Byer\\specs\\MyOrders\\SearchAndReorder_spec.js:25:1)\n    at Module._compile (internal/modules/cjs/loader.js:956:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:973:10)\n    at Module.load (internal/modules/cjs/loader.js:812:32)\n    at Function.Module._load (internal/modules/cjs/loader.js:724:14)"
        ],
        "browserLogs": [],
        "screenShotFile": "0094009f-00d5-00cc-002f-00ee00ce0065.png",
        "timestamp": 1578643182995,
        "duration": 23
    },
    {
        "description": "should login the user|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 7824,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "000200f4-00de-0058-0038-00ce00340050.png",
        "timestamp": 1578646943491,
        "duration": 10074
    },
    {
        "description": "Forgot password link present on the Login page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 7824,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "002e0098-00a2-003a-0098-009c00c000e2.png",
        "timestamp": 1578646954163,
        "duration": 114
    },
    {
        "description": "Create Account link present on the Login page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 7824,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "009300cc-00a9-0061-00f7-00db00e80071.png",
        "timestamp": 1578646954872,
        "duration": 66
    },
    {
        "description": "Contact Us  link present on the Login Page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 7824,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00d3002b-00ea-0059-0066-00e1009300ad.png",
        "timestamp": 1578646955420,
        "duration": 71
    },
    {
        "description": "Verify comapny copyright text at the footer of the login page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 7824,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "00a80048-0017-00af-003a-008400ce00e8.png",
        "timestamp": 1578646955957,
        "duration": 32
    },
    {
        "description": "Verify Username labeling is preseet|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 7824,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00860089-00e2-005c-00c4-0003006d00c0.png",
        "timestamp": 1578646956479,
        "duration": 4
    },
    {
        "description": "Verify password label is present|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 7824,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00fd0086-00cf-0019-0035-00a400b000f1.png",
        "timestamp": 1578646956953,
        "duration": 4
    },
    {
        "description": "Verify Remember Me check box|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 7824,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "009a008d-008c-00cb-0092-000000a70030.png",
        "timestamp": 1578646957434,
        "duration": 55
    },
    {
        "description": "verify the title of the Page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 7824,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00370027-0054-00ef-00c4-00bd001d0016.png",
        "timestamp": 1578646957913,
        "duration": 14
    },
    {
        "description": "veriy all links present on page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 7824,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "00bf005c-0084-00d9-0036-000500cd0072.png",
        "timestamp": 1578646958381,
        "duration": 62
    },
    {
        "description": "User Login successfully |Verify Login",
        "passed": false,
        "pending": false,
        "os": "Windows",
        "instanceId": 7824,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": [
            "Expected 'https://archway-forduaw-qa.azurewebsites.net/login' to contain 'https://archway-forduaw-qa.azurewebsites.net/home'."
        ],
        "trace": [
            "Error: Failed expectation\n    at UserContext.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars_Byer\\specs\\LoginPage\\LoginPage_spec.js:229:19)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2974:25\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7"
        ],
        "browserLogs": [],
        "screenShotFile": "00c40021-00c2-001f-005f-00ae00eb0019.png",
        "timestamp": 1578646958871,
        "duration": 16720
    },
    {
        "description": "Verify if user can search product by Order Number successfully| Verify My Orders page Functionality",
        "passed": false,
        "pending": false,
        "os": "Windows",
        "instanceId": 7824,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": [
            "Failed: No element found using locator: By(xpath, //*[@class=\"svg-inline--fa fa-user-circle fa-w-16\"])"
        ],
        "trace": [
            "NoSuchElementError: No element found using locator: By(xpath, //*[@class=\"svg-inline--fa fa-user-circle fa-w-16\"])\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:814:27\n    at ManagedPromise.invokeCallback_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\n    at processTicksAndRejections (internal/process/task_queues.js:93:5)Error\n    at ElementArrayFinder.applyAction_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:459:27)\n    at ElementArrayFinder.<computed> [as click] (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:91:29)\n    at ElementFinder.<computed> [as click] (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:831:22)\n    at UserMenu.clickOnUserCircle (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars_Byer\\pageobjects\\UserMenu\\UserMenu.js:65:17)\n    at UserContext.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars_Byer\\specs\\MyOrders\\SearchAndReorder_spec.js:45:14)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\nFrom: Task: Run it(\"Verify if user can search product by Order Number successfully\") in control flow\n    at UserContext.<anonymous> (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:94:19)\n    at attempt (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4297:26)\n    at QueueRunner.run (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4217:20)\n    at runNext (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4257:20)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4264:13\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4172:9\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:64:48\n    at ControlFlow.emit (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\events.js:62:21)\n    at ControlFlow.shutdown_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2674:10)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2599:53\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars_Byer\\specs\\MyOrders\\SearchAndReorder_spec.js:43:1)\n    at addSpecsToSuite (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars_Byer\\specs\\MyOrders\\SearchAndReorder_spec.js:25:1)\n    at Module._compile (internal/modules/cjs/loader.js:956:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:973:10)\n    at Module.load (internal/modules/cjs/loader.js:812:32)\n    at Function.Module._load (internal/modules/cjs/loader.js:724:14)"
        ],
        "browserLogs": [],
        "screenShotFile": "001c00fb-0067-00d3-003b-00fe00d600e8.png",
        "timestamp": 1578646976097,
        "duration": 79
    },
    {
        "description": " Verify Advance search(By Status and By date) than Re-order the product| Verify My Orders page Functionality",
        "passed": false,
        "pending": true,
        "os": "Windows",
        "instanceId": 7824,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Temporarily disabled with xit",
        "browserLogs": [],
        "screenShotFile": "00f800bc-00e4-0043-0007-004800130000.png",
        "timestamp": 1578646976600,
        "duration": 0
    },
    {
        "description": "Verification of total=subtotal+shipping| Verify My Orders page Functionality",
        "passed": false,
        "pending": false,
        "os": "Windows",
        "instanceId": 7824,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": [
            "Failed: No element found using locator: By(xpath, //span[@class='float-right'][contains(text(),subtotalval)])"
        ],
        "trace": [
            "NoSuchElementError: No element found using locator: By(xpath, //span[@class='float-right'][contains(text(),subtotalval)])\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:814:27\n    at ManagedPromise.invokeCallback_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\n    at processTicksAndRejections (internal/process/task_queues.js:93:5)Error\n    at ElementArrayFinder.applyAction_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:459:27)\n    at ElementArrayFinder.<computed> [as getText] (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:91:29)\n    at ElementFinder.<computed> [as getText] (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:831:22)\n    at UserContext.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars_Byer\\specs\\MyOrders\\SearchAndReorder_spec.js:351:11)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\nFrom: Task: Run it(\"Verification of total=subtotal+shipping\") in control flow\n    at UserContext.<anonymous> (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:94:19)\n    at attempt (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4297:26)\n    at QueueRunner.run (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4217:20)\n    at runNext (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4257:20)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4264:13\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4172:9\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:64:48\n    at ControlFlow.emit (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\events.js:62:21)\n    at ControlFlow.shutdown_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2674:10)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2599:53\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars_Byer\\specs\\MyOrders\\SearchAndReorder_spec.js:344:1)\n    at addSpecsToSuite (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars_Byer\\specs\\MyOrders\\SearchAndReorder_spec.js:25:1)\n    at Module._compile (internal/modules/cjs/loader.js:956:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:973:10)\n    at Module.load (internal/modules/cjs/loader.js:812:32)\n    at Function.Module._load (internal/modules/cjs/loader.js:724:14)"
        ],
        "browserLogs": [],
        "screenShotFile": "009e000d-004b-0051-0021-0046000e0062.png",
        "timestamp": 1578646976669,
        "duration": 30
    },
    {
        "description": "should login the user|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 12764,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "00e9009c-001a-0094-002a-009000f10039.png",
        "timestamp": 1578651903506,
        "duration": 9663
    },
    {
        "description": "Forgot password link present on the Login page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 12764,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00030020-00f5-003f-0052-00f6009c00a6.png",
        "timestamp": 1578651913755,
        "duration": 64
    },
    {
        "description": "Create Account link present on the Login page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 12764,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "0007003c-00f9-0072-00ad-003700970056.png",
        "timestamp": 1578651914250,
        "duration": 53
    },
    {
        "description": "Contact Us  link present on the Login Page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 12764,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "000b0039-0096-004c-007b-0055000300d2.png",
        "timestamp": 1578651914838,
        "duration": 54
    },
    {
        "description": "Verify comapny copyright text at the footer of the login page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 12764,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "008c0034-001e-00aa-0083-007400da002c.png",
        "timestamp": 1578651915356,
        "duration": 28
    },
    {
        "description": "Verify Username labeling is preseet|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 12764,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "000f0091-0017-00b9-00a0-0060003700b3.png",
        "timestamp": 1578651915860,
        "duration": 3
    },
    {
        "description": "Verify password label is present|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 12764,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "007f0055-0083-0047-0054-005500b500ce.png",
        "timestamp": 1578651916297,
        "duration": 4
    },
    {
        "description": "Verify Remember Me check box|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 12764,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00f300ab-00f8-004b-0006-00a0008100e5.png",
        "timestamp": 1578651916799,
        "duration": 47
    },
    {
        "description": "verify the title of the Page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 12764,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00c100c3-003f-00d5-0019-004e00380048.png",
        "timestamp": 1578651917389,
        "duration": 18
    },
    {
        "description": "veriy all links present on page|Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 12764,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "000000a8-00ac-0014-00ca-00db002700f6.png",
        "timestamp": 1578651917908,
        "duration": 62
    },
    {
        "description": "User Login successfully |Verify Login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 12764,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00ef0015-00d7-00d8-0007-005200630055.png",
        "timestamp": 1578651918420,
        "duration": 16752
    },
    {
        "description": "Verify if user can search product by Order Number successfully| Verify My Orders page Functionality",
        "passed": false,
        "pending": false,
        "os": "Windows",
        "instanceId": 12764,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": [
            "Failed: No element found using locator: By(xpath, //form[@class='ng-pristine ng-valid ng-touched']//input[@id='search-addon'])"
        ],
        "trace": [
            "NoSuchElementError: No element found using locator: By(xpath, //form[@class='ng-pristine ng-valid ng-touched']//input[@id='search-addon'])\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:814:27\n    at ManagedPromise.invokeCallback_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\n    at processTicksAndRejections (internal/process/task_queues.js:93:5)Error\n    at ElementArrayFinder.applyAction_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:459:27)\n    at ElementArrayFinder.<computed> [as clear] (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:91:29)\n    at ElementFinder.<computed> [as clear] (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:831:22)\n    at MyOrders.searchOrder (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars_Byer\\pageobjects\\MyOrders\\MyOrders.js:45:15)\n    at UserContext.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars_Byer\\specs\\MyOrders\\SearchAndReorder_spec.js:75:17)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\nFrom: Task: Run it(\"Verify if user can search product by Order Number successfully\") in control flow\n    at UserContext.<anonymous> (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:94:19)\n    at attempt (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4297:26)\n    at QueueRunner.run (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4217:20)\n    at runNext (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4257:20)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4264:13\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4172:9\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:64:48\n    at ControlFlow.emit (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\events.js:62:21)\n    at ControlFlow.shutdown_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2674:10)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2599:53\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars_Byer\\specs\\MyOrders\\SearchAndReorder_spec.js:43:1)\n    at addSpecsToSuite (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars_Byer\\specs\\MyOrders\\SearchAndReorder_spec.js:25:1)\n    at Module._compile (internal/modules/cjs/loader.js:956:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:973:10)\n    at Module.load (internal/modules/cjs/loader.js:812:32)\n    at Function.Module._load (internal/modules/cjs/loader.js:724:14)"
        ],
        "browserLogs": [],
        "screenShotFile": "003f00fa-0028-0036-00a8-0074002e0071.png",
        "timestamp": 1578651935717,
        "duration": 18453
    },
    {
        "description": " Verify Advance search(By Status and By date) than Re-order the product| Verify My Orders page Functionality",
        "passed": false,
        "pending": true,
        "os": "Windows",
        "instanceId": 12764,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": "Temporarily disabled with xit",
        "browserLogs": [],
        "screenShotFile": "00e8006a-00d7-00db-0051-005800bb00cc.png",
        "timestamp": 1578651954759,
        "duration": 0
    },
    {
        "description": "Verification of total=subtotal+shipping| Verify My Orders page Functionality",
        "passed": false,
        "pending": false,
        "os": "Windows",
        "instanceId": 12764,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.88"
        },
        "message": [
            "Failed: No element found using locator: By(xpath, //span[@class='float-right'][contains(text(),subtotalval)])"
        ],
        "trace": [
            "NoSuchElementError: No element found using locator: By(xpath, //span[@class='float-right'][contains(text(),subtotalval)])\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:814:27\n    at ManagedPromise.invokeCallback_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\n    at processTicksAndRejections (internal/process/task_queues.js:93:5)Error\n    at ElementArrayFinder.applyAction_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:459:27)\n    at ElementArrayFinder.<computed> [as getText] (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:91:29)\n    at ElementFinder.<computed> [as getText] (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:831:22)\n    at UserContext.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars_Byer\\specs\\MyOrders\\SearchAndReorder_spec.js:351:11)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\nFrom: Task: Run it(\"Verification of total=subtotal+shipping\") in control flow\n    at UserContext.<anonymous> (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:94:19)\n    at attempt (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4297:26)\n    at QueueRunner.run (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4217:20)\n    at runNext (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4257:20)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4264:13\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4172:9\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:64:48\n    at ControlFlow.emit (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\events.js:62:21)\n    at ControlFlow.shutdown_ (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2674:10)\n    at C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2599:53\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars_Byer\\specs\\MyOrders\\SearchAndReorder_spec.js:344:1)\n    at addSpecsToSuite (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\NareshS\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\Users\\NareshS\\eclipse-workspace\\protrract\\Mars_Byer\\specs\\MyOrders\\SearchAndReorder_spec.js:25:1)\n    at Module._compile (internal/modules/cjs/loader.js:956:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:973:10)\n    at Module.load (internal/modules/cjs/loader.js:812:32)\n    at Function.Module._load (internal/modules/cjs/loader.js:724:14)"
        ],
        "browserLogs": [],
        "screenShotFile": "003100f9-00b5-00b7-0085-00c300c90075.png",
        "timestamp": 1578651954857,
        "duration": 30
    }
];

    this.sortSpecs = function () {
        this.results = results.sort(function sortFunction(a, b) {
    if (a.sessionId < b.sessionId) return -1;else if (a.sessionId > b.sessionId) return 1;

    if (a.timestamp < b.timestamp) return -1;else if (a.timestamp > b.timestamp) return 1;

    return 0;
});

    };

    this.setTitle = function () {
        var title = $('.report-title').text();
        titleService.setTitle(title);
    };

    // is run after all test data has been prepared/loaded
    this.afterLoadingJobs = function () {
        this.sortSpecs();
        this.setTitle();
    };

    this.loadResultsViaAjax = function () {

        $http({
            url: './combined.json',
            method: 'GET'
        }).then(function (response) {
                var data = null;
                if (response && response.data) {
                    if (typeof response.data === 'object') {
                        data = response.data;
                    } else if (response.data[0] === '"') { //detect super escaped file (from circular json)
                        data = CircularJSON.parse(response.data); //the file is escaped in a weird way (with circular json)
                    } else {
                        data = JSON.parse(response.data);
                    }
                }
                if (data) {
                    results = data;
                    that.afterLoadingJobs();
                }
            },
            function (error) {
                console.error(error);
            });
    };


    if (clientDefaults.useAjax) {
        this.loadResultsViaAjax();
    } else {
        this.afterLoadingJobs();
    }

}]);

app.filter('bySearchSettings', function () {
    return function (items, searchSettings) {
        var filtered = [];
        if (!items) {
            return filtered; // to avoid crashing in where results might be empty
        }
        var prevItem = null;

        for (var i = 0; i < items.length; i++) {
            var item = items[i];
            item.displaySpecName = false;

            var isHit = false; //is set to true if any of the search criteria matched
            countLogMessages(item); // modifies item contents

            var hasLog = searchSettings.withLog && item.browserLogs && item.browserLogs.length > 0;
            if (searchSettings.description === '' ||
                (item.description && item.description.toLowerCase().indexOf(searchSettings.description.toLowerCase()) > -1)) {

                if (searchSettings.passed && item.passed || hasLog) {
                    isHit = true;
                } else if (searchSettings.failed && !item.passed && !item.pending || hasLog) {
                    isHit = true;
                } else if (searchSettings.pending && item.pending || hasLog) {
                    isHit = true;
                }
            }
            if (isHit) {
                checkIfShouldDisplaySpecName(prevItem, item);

                filtered.push(item);
                prevItem = item;
            }
        }

        return filtered;
    };
});

//formats millseconds to h m s
app.filter('timeFormat', function () {
    return function (tr, fmt) {
        if(tr == null){
            return "NaN";
        }

        switch (fmt) {
            case 'h':
                var h = tr / 1000 / 60 / 60;
                return "".concat(h.toFixed(2)).concat("h");
            case 'm':
                var m = tr / 1000 / 60;
                return "".concat(m.toFixed(2)).concat("min");
            case 's' :
                var s = tr / 1000;
                return "".concat(s.toFixed(2)).concat("s");
            case 'hm':
            case 'h:m':
                var hmMt = tr / 1000 / 60;
                var hmHr = Math.trunc(hmMt / 60);
                var hmMr = hmMt - (hmHr * 60);
                if (fmt === 'h:m') {
                    return "".concat(hmHr).concat(":").concat(hmMr < 10 ? "0" : "").concat(Math.round(hmMr));
                }
                return "".concat(hmHr).concat("h ").concat(hmMr.toFixed(2)).concat("min");
            case 'hms':
            case 'h:m:s':
                var hmsS = tr / 1000;
                var hmsHr = Math.trunc(hmsS / 60 / 60);
                var hmsM = hmsS / 60;
                var hmsMr = Math.trunc(hmsM - hmsHr * 60);
                var hmsSo = hmsS - (hmsHr * 60 * 60) - (hmsMr*60);
                if (fmt === 'h:m:s') {
                    return "".concat(hmsHr).concat(":").concat(hmsMr < 10 ? "0" : "").concat(hmsMr).concat(":").concat(hmsSo < 10 ? "0" : "").concat(Math.round(hmsSo));
                }
                return "".concat(hmsHr).concat("h ").concat(hmsMr).concat("min ").concat(hmsSo.toFixed(2)).concat("s");
            case 'ms':
                var msS = tr / 1000;
                var msMr = Math.trunc(msS / 60);
                var msMs = msS - (msMr * 60);
                return "".concat(msMr).concat("min ").concat(msMs.toFixed(2)).concat("s");
        }

        return tr;
    };
});


function PbrStackModalController($scope, $rootScope) {
    var ctrl = this;
    ctrl.rootScope = $rootScope;
    ctrl.getParent = getParent;
    ctrl.getShortDescription = getShortDescription;
    ctrl.convertTimestamp = convertTimestamp;
    ctrl.isValueAnArray = isValueAnArray;
    ctrl.toggleSmartStackTraceHighlight = function () {
        var inv = !ctrl.rootScope.showSmartStackTraceHighlight;
        ctrl.rootScope.showSmartStackTraceHighlight = inv;
    };
    ctrl.applySmartHighlight = function (line) {
        if ($rootScope.showSmartStackTraceHighlight) {
            if (line.indexOf('node_modules') > -1) {
                return 'greyout';
            }
            if (line.indexOf('  at ') === -1) {
                return '';
            }

            return 'highlight';
        }
        return '';
    };
}


app.component('pbrStackModal', {
    templateUrl: "pbr-stack-modal.html",
    bindings: {
        index: '=',
        data: '='
    },
    controller: PbrStackModalController
});

function PbrScreenshotModalController($scope, $rootScope) {
    var ctrl = this;
    ctrl.rootScope = $rootScope;
    ctrl.getParent = getParent;
    ctrl.getShortDescription = getShortDescription;

    /**
     * Updates which modal is selected.
     */
    this.updateSelectedModal = function (event, index) {
        var key = event.key; //try to use non-deprecated key first https://developer.mozilla.org/de/docs/Web/API/KeyboardEvent/keyCode
        if (key == null) {
            var keyMap = {
                37: 'ArrowLeft',
                39: 'ArrowRight'
            };
            key = keyMap[event.keyCode]; //fallback to keycode
        }
        if (key === "ArrowLeft" && this.hasPrevious) {
            this.showHideModal(index, this.previous);
        } else if (key === "ArrowRight" && this.hasNext) {
            this.showHideModal(index, this.next);
        }
    };

    /**
     * Hides the modal with the #oldIndex and shows the modal with the #newIndex.
     */
    this.showHideModal = function (oldIndex, newIndex) {
        const modalName = '#imageModal';
        $(modalName + oldIndex).modal("hide");
        $(modalName + newIndex).modal("show");
    };

}

app.component('pbrScreenshotModal', {
    templateUrl: "pbr-screenshot-modal.html",
    bindings: {
        index: '=',
        data: '=',
        next: '=',
        previous: '=',
        hasNext: '=',
        hasPrevious: '='
    },
    controller: PbrScreenshotModalController
});

app.factory('TitleService', ['$document', function ($document) {
    return {
        setTitle: function (title) {
            $document[0].title = title;
        }
    };
}]);


app.run(
    function ($rootScope, $templateCache) {
        //make sure this option is on by default
        $rootScope.showSmartStackTraceHighlight = true;
        
  $templateCache.put('pbr-screenshot-modal.html',
    '<div class="modal" id="imageModal{{$ctrl.index}}" tabindex="-1" role="dialog"\n' +
    '     aria-labelledby="imageModalLabel{{$ctrl.index}}" ng-keydown="$ctrl.updateSelectedModal($event,$ctrl.index)">\n' +
    '    <div class="modal-dialog modal-lg m-screenhot-modal" role="document">\n' +
    '        <div class="modal-content">\n' +
    '            <div class="modal-header">\n' +
    '                <button type="button" class="close" data-dismiss="modal" aria-label="Close">\n' +
    '                    <span aria-hidden="true">&times;</span>\n' +
    '                </button>\n' +
    '                <h6 class="modal-title" id="imageModalLabelP{{$ctrl.index}}">\n' +
    '                    {{$ctrl.getParent($ctrl.data.description)}}</h6>\n' +
    '                <h5 class="modal-title" id="imageModalLabel{{$ctrl.index}}">\n' +
    '                    {{$ctrl.getShortDescription($ctrl.data.description)}}</h5>\n' +
    '            </div>\n' +
    '            <div class="modal-body">\n' +
    '                <img class="screenshotImage" ng-src="{{$ctrl.data.screenShotFile}}">\n' +
    '            </div>\n' +
    '            <div class="modal-footer">\n' +
    '                <div class="pull-left">\n' +
    '                    <button ng-disabled="!$ctrl.hasPrevious" class="btn btn-default btn-previous" data-dismiss="modal"\n' +
    '                            data-toggle="modal" data-target="#imageModal{{$ctrl.previous}}">\n' +
    '                        Prev\n' +
    '                    </button>\n' +
    '                    <button ng-disabled="!$ctrl.hasNext" class="btn btn-default btn-next"\n' +
    '                            data-dismiss="modal" data-toggle="modal"\n' +
    '                            data-target="#imageModal{{$ctrl.next}}">\n' +
    '                        Next\n' +
    '                    </button>\n' +
    '                </div>\n' +
    '                <a class="btn btn-primary" href="{{$ctrl.data.screenShotFile}}" target="_blank">\n' +
    '                    Open Image in New Tab\n' +
    '                    <span class="glyphicon glyphicon-new-window" aria-hidden="true"></span>\n' +
    '                </a>\n' +
    '                <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>\n' +
    '            </div>\n' +
    '        </div>\n' +
    '    </div>\n' +
    '</div>\n' +
     ''
  );

  $templateCache.put('pbr-stack-modal.html',
    '<div class="modal" id="modal{{$ctrl.index}}" tabindex="-1" role="dialog"\n' +
    '     aria-labelledby="stackModalLabel{{$ctrl.index}}">\n' +
    '    <div class="modal-dialog modal-lg m-stack-modal" role="document">\n' +
    '        <div class="modal-content">\n' +
    '            <div class="modal-header">\n' +
    '                <button type="button" class="close" data-dismiss="modal" aria-label="Close">\n' +
    '                    <span aria-hidden="true">&times;</span>\n' +
    '                </button>\n' +
    '                <h6 class="modal-title" id="stackModalLabelP{{$ctrl.index}}">\n' +
    '                    {{$ctrl.getParent($ctrl.data.description)}}</h6>\n' +
    '                <h5 class="modal-title" id="stackModalLabel{{$ctrl.index}}">\n' +
    '                    {{$ctrl.getShortDescription($ctrl.data.description)}}</h5>\n' +
    '            </div>\n' +
    '            <div class="modal-body">\n' +
    '                <div ng-if="$ctrl.data.trace.length > 0">\n' +
    '                    <div ng-if="$ctrl.isValueAnArray($ctrl.data.trace)">\n' +
    '                        <pre class="logContainer" ng-repeat="trace in $ctrl.data.trace track by $index"><div ng-class="$ctrl.applySmartHighlight(line)" ng-repeat="line in trace.split(\'\\n\') track by $index">{{line}}</div></pre>\n' +
    '                    </div>\n' +
    '                    <div ng-if="!$ctrl.isValueAnArray($ctrl.data.trace)">\n' +
    '                        <pre class="logContainer"><div ng-class="$ctrl.applySmartHighlight(line)" ng-repeat="line in $ctrl.data.trace.split(\'\\n\') track by $index">{{line}}</div></pre>\n' +
    '                    </div>\n' +
    '                </div>\n' +
    '                <div ng-if="$ctrl.data.browserLogs.length > 0">\n' +
    '                    <h5 class="modal-title">\n' +
    '                        Browser logs:\n' +
    '                    </h5>\n' +
    '                    <pre class="logContainer"><div class="browserLogItem"\n' +
    '                                                   ng-repeat="logError in $ctrl.data.browserLogs track by $index"><div><span class="label browserLogLabel label-default"\n' +
    '                                                                                                                             ng-class="{\'label-danger\': logError.level===\'SEVERE\', \'label-warning\': logError.level===\'WARNING\'}">{{logError.level}}</span><span class="label label-default">{{$ctrl.convertTimestamp(logError.timestamp)}}</span><div ng-repeat="messageLine in logError.message.split(\'\\\\n\') track by $index">{{ messageLine }}</div></div></div></pre>\n' +
    '                </div>\n' +
    '            </div>\n' +
    '            <div class="modal-footer">\n' +
    '                <button class="btn btn-default"\n' +
    '                        ng-class="{active: $ctrl.rootScope.showSmartStackTraceHighlight}"\n' +
    '                        ng-click="$ctrl.toggleSmartStackTraceHighlight()">\n' +
    '                    <span class="glyphicon glyphicon-education black"></span> Smart Stack Trace\n' +
    '                </button>\n' +
    '                <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>\n' +
    '            </div>\n' +
    '        </div>\n' +
    '    </div>\n' +
    '</div>\n' +
     ''
  );

    });

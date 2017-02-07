var http = require("https");
var requestImage = "/bing/v5.0/images/search";
var mongo = require("mongodb").MongoClient;
var db_url = "mongodb://localhost:27017/";
var database;

var options = {
    headers: {
        'Ocp-Apim-Subscription-Key': 'GET YOUR OWN API KEY',
        'Content-Type': 'multipart/form-data'
    },
    host: "api.cognitive.microsoft.com",
    path: ""
};

module.exports = function(app) {

    app.get('/', function(req, res) {
        console.log("Working");
        res.end("Hello");
    });

    app.get('/api/latest/imagesearch', function(req, res) {
        var coll = database.collection("searches");
        coll.find().toArray(function(err, data) {
            if (err) console.log(" Error : " + err);
            for (var i = 0; i < data.length; i++) {
                var obj = data[i];
                obj.when = Date(obj._id);
                delete obj._id;
            }
            res.end(JSON.stringify(data));
        });
    });

    app.get('/api/imagesearch/*?', function(req, res) {

        var offsetVal = req.query.offset;
        var imageCategory = req.params['0'];
        options['path'] = requestImage + "/?q=" + encodeURIComponent(imageCategory);
        if (offsetVal) options['path'] += '&offset=' + offsetVal + '&count=50';

        http.get(options, function(response_bing) {
            var data = '';
            response_bing.on('data', function(urls) {
                data += (urls);
            });
            response_bing.on('end', function() {
                var value = JSON.parse(data)['value'];
                res.end(JSON.stringify(value, null, 2));
            });
        });

        insertSearchQuery(imageCategory);
    });

    mongo.connect(db_url, function(err, db) {
        if (err) console.log(" Error : " + err);
        database = db;
        db.createCollection("searches");
    });
};

function insertSearchQuery(searchQuery) {
    var coll = database.collection("searches");
    coll.find().count(function(err, data) {
        if (err) console.log(" Error is : " + err);
        if (data >= 10) {
            coll.aggregate([
                {
                    $group: {
                        _id: {},
                        minim: {
                            $min: "$_id"
                        }
                    }
                }]).toArray(function(err, data) {
                if (err) console.log(" Error is : " + err);
                var deleteId = data['0']['minim'];
                coll.remove({
                    _id: deleteId
                });
            });
        }
        coll.insert({
            _id: (+new Date()),
            query: searchQuery
        });
    });
}

var router = require('./router'),
    fs = require('fs');

router.get('/', function (req, res) {
    fs.readFile('index.html', 'utf8', function (err, data) {
        if (err) {
            console.log(err);
            res.writeHead(500, {'Content-Type': 'text/html'});
            res.write('Internal server error');
            res.end();
        } else {
            res.writeHead(200, {'Content-Type': 'text/html'});
            res.write(data);
            res.end();
        }
    });
});

module.exports = router;
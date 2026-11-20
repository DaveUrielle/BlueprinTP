var express = require('express');
var bodyParser = require("body-parser");
var app = express();

const { enrollStudent } = require('./utils/Mohamed_Asraf_EnrollStudentUtil');
const { viewDashboard, editRecord } = require('./utils/DaveUrielleUnabiaUtil');
app.get('/view-dashboard', viewDashboard);
app.put('/edit-record/:id', editRecord);
app.post('/enroll', enrollStudent);

const PORT = process.env.PORT || 5050;
var startPage = "index.html";

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static("./public"));

app.get('/', (req, res) => {
    res.sendFile(__dirname + "/public/" + startPage);
})

server = app.listen(PORT, function () {
    const address = server.address();
    const baseUrl = `http://${address.address == "::" ? 'localhost' : address.address}:${address.port}`;
    console.log(`Demo project at: ${baseUrl}`);
});

module.exports = {app, server}
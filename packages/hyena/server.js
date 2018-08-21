let path = require("path");
let express = require("express");

let app = express();
app.use(express.static(path.join(__dirname)));

app.listen(5500, _ => {
    console.log("listening on *:5500");
});
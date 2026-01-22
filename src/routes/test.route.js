'use strict';

module.exports = app => {

    const test = require("../controllers/test.controller");

    var router = require("express").Router();

    router.post("/test", test.testfunction);

    app.use("/", router);
}
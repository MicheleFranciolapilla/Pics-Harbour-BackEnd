const express = require("express");
const router = express.Router();

const picturesCtrl = require("../controller/picturesPrivateController");

router.post("/", picturesCtrl.store);

module.exports = router;
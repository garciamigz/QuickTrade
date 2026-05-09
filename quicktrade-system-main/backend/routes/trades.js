const express = require("express");
const router = express.Router();
const tradeController = require("../controllers/tradeController");

router.post("/offer", tradeController.createTrade);
router.post("/respond", tradeController.respondTrade);
router.post("/cancel", tradeController.cancelTrade);
router.get("/reports", tradeController.getReports);
router.get("/user/:user_id", tradeController.getUserTrades);

module.exports = router;

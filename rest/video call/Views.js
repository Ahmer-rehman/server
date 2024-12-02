const express = require("express");
const router = express.Router();
const { fetchUser } = require('../authentication/Controllers');
const { createRoom } = require('./Controllers');

//login required
router.post("/create-room", fetchUser, async (req, res) => {
    createRoom(req, res);
});

//login required
router.get("/get-all", fetchUser, async (req, res) => {
    getAllRooms(req, res);
});

module.exports = router;

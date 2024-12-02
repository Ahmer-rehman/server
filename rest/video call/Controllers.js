const {
    Room,
    RoomParticipant,
} = require("../../models/video call/Models");
const crypto = require('crypto');


let createRoom = async (req, res) => {
    try {
        const { name } = req.body;

        if (!name) {
            return res.status(400).json({ error: "Please include a room name" });
        }

        // Generate a unique connection string
        const connection_string = crypto.randomBytes(16).toString('hex');

        // Create a new room with the name, user ID, and connection string
        const room = new Room({
            name,
            createdBy: req.user.id,
            connection_string
        });

        // Create a new room with the name and user ID
        const roomParticipant = new RoomParticipant({
            room: room._id,
            user: req.user.id, // Assuming the user's ID is stored in req.user._id
            name: req.user.username || '' // Use username if available
        });

        // Save the room participant to the database
        await roomParticipant.save();

        // Save the room to the database
        await room.save();

        // Fetch all rooms created by the user
        const userRooms = await Room.find({ createdBy: req.user.id });

        // Return a success response with the new room and all user's rooms
        res.json({
            message: "Room created successfully!",
            newRoom: room,
            userRooms
        });


    } catch (error) {
        console.error("Error while creating room:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
}

module.exports = {
    createRoom,
};

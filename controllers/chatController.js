const ChatMessage = require("../models/ChatMessage");
const activityController = require("../controllers/activityLogController");

exports.sendMessage = async (req, res) => {
  const { receiverId, message } = req.body;
  const senderId = req.user.id;

  await activityController.createActivityLog(
    senderId,
    `Sent message to user ${receiverId}`
  );

  if (senderId === receiverId) {
    return res
      .status(400)
      .json({ message: "Sender and receiver cannot be the same" });
  }

  try {
    const newMessage = new ChatMessage({
      sender: senderId,
      receiver: receiverId,
      message,
    });
    await newMessage.save();

    await activityController.createActivityLog(
      senderId,
      `Sent message to user ${receiverId}`
    );

    return res
      .status(201)
      .json({ message: "Message sent successfully", data: newMessage });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
};

exports.getMessages = async (req, res) => {
  const { recipientId } = req.query;
  const senderId = req.user.id;

  console.log("Sender ID Type:", senderId);
  console.log("Recipient ID Type:", recipientId);

  try {
    const messages = await ChatMessage.find({
      $or: [
        { sender: senderId, receiver: recipientId },
        { sender: recipientId, receiver: senderId },
      ],
    }).populate("sender receiver", "username email");

    if (messages.length === 0) {
      return res.status(404).json({ message: "No messages found" });
    }

    await activityController.createActivityLog(senderId, `Viewed All Messages`);
    console.log("Messages found:", messages);
    return res.status(200).json({ messages });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
};




const Friend = require("../models/Friend");
const User = require("../models/User");
const activityController = require("../controllers/activityLogController");

exports.sendFriendRequest = async (req, res) => {
  const { friendId } = req.body;
  const userId = req.user.id;

  try {
    if (userId === friendId) {
      return res
        .status(400)
        .json({ message: "You cannot send a friend request to yourself" });
    }

    const existingRequest = await Friend.findOne({ userId, friendId });
    if (existingRequest) {
      return res.status(400).json({ message: "Friend request already sent" });
    }

    const newRequest = new Friend({ userId, friendId, status: "pending" });
    await newRequest.save();

    res.status(201).json({ message: "Friend request sent", data: newRequest });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.acceptFriendRequest = async (req, res) => {
  const { requestId } = req.params;

  try {
    const friendRequest = await Friend.findById(requestId);
    if (!friendRequest) {
      return res.status(404).json({ message: "Friend request not found" });
    }

    if (friendRequest.status !== "pending") {
      return res.status(400).json({ message: "Request is already processed" });
    }

    friendRequest.status = "accepted";
    await friendRequest.save();

    const user1 = await User.findById(friendRequest.userId);
    const user2 = await User.findById(friendRequest.friendId);

    // Add both users to each other's friend lists
    user1.friends.push(friendRequest.friendId);
    user2.friends.push(friendRequest.userId);

    await user1.save();
    await user2.save();

    await activityController.createActivityLog(
      friendRequest._id,
      `Accepted friend request from user ${friendRequest.userId}`
    );

    return res.status(200).json({ message: "Friend request accepted" });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
};

exports.getFriends = async (req, res) => {
  const userId = req.params.userId;
  console.log("userId:", userId);

  try {
    const user = await User.findById(userId).populate(
      "friends",
      "username email"
    );
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await activityController.createActivityLog(userId, `Viewed friends list`);
    return res.status(200).json({ friends: user.friends });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
};

// exports.declineFriendRequest = async (req, res) => {
//   const { requestId } = req.params;

//   try {
//     const friendRequest = await Friend.findById(requestId);
//     if (!friendRequest) {
//       return res.status(404).json({ message: "Friend request not found" });
//     }

//     if (friendRequest.status !== "pending") {
//       return res.status(400).json({ message: "Request is already processed" });
//     }

//     friendRequest.status = "declined";
//     await friendRequest.save();

//     res.status(200).json({ message: "Friend request declined" });
//   } catch (error) {
//     res.status(500).json({ message: "Server error" });
//   }
// };

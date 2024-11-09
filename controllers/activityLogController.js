const ActivityLog = require('../models/ActivityLog');

exports.createActivityLog = async (userId, activity) => {
  const activityLog = new ActivityLog({
    userId,
    activity
  });
  await activityLog.save();
};

exports.getUserActivity = async (req, res) => {
  try {
    const activityLogs = await ActivityLog.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json(activityLogs);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

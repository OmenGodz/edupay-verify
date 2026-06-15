const teacherOnly = (req, res, next) => {
  if (req.user.role !== "teacher") {
    return res.status(403).json({
      message: "Access Denied",
    });
  }

  next();
};

module.exports = teacherOnly;

const mongoose = require('mongoose');

const validateObjectId = (paramNames = ['id']) => {
  return (req, res, next) => {
    const names = Array.isArray(paramNames) ? paramNames : [paramNames];
    for (const name of names) {
      const val = req.params[name];
      if (val && !mongoose.Types.ObjectId.isValid(val)) {
        return res.status(400).json({ message: `Invalid ID format for parameter: ${name}` });
      }
    }
    next();
  };
};

module.exports = validateObjectId;

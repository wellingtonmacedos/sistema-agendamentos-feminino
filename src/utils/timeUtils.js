const { addMinutes, parse, format, isBefore, isAfter, isEqual, set } = require('date-fns');

// Helper to convert "HH:mm" to a Date object on a specific day
const parseTimeOnDate = (timeStr, baseDate) => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return set(baseDate, { hours, minutes, seconds: 0, milliseconds: 0 });
};

module.exports = {
  parseTimeOnDate
};

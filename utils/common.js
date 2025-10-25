var crypto = require("crypto");
var base64url = require("base64url");

exports.isEmpty = (obj) => {
  for (var prop in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, prop)) {
      return false;
    }
  }
  

  return JSON.stringify(obj) === JSON.stringify({});
};

exports.getWeekDate = (numberOfWeek) => {
  const now = new Date();
  return now.setDate(now.getDate() + numberOfWeek * 7);
};

exports.updateObj = (arr) => {
  let a = {};
  arr.map((e) => {
    if (e.value) {
      a[e.name] = e.value;
    }
    return e;
  });
  return a;
};

exports.getHours = (initialDate, hours) => {
  var theAdd = new Date(
    1900,
    0,
    1,
    initialDate.split(":")[0],
    initialDate.split(":")[1]
  );
  //theAdd.setMinutes(theAdd.getMinutes() + 30);
  theAdd.setHours(theAdd.getHours() + hours);
  return theAdd.getHours() + ":" + theAdd.getMinutes();
};

exports.range = (start, end) => {
  const arr = new Int8Array(end - start + 1).map((curr, i) => curr + i + start);
  return arr;
};

/** Sync */
exports.randomStringAsBase64Url = (size) => {
  return base64url(crypto.randomBytes(size));
};

exports.getDatesBetween = (startDate, endDate, includeEndDate) => {
  const dates = [];
  startDate = new Date(startDate);
  endDate = new Date(endDate);
  const currentDate = startDate;
  while (currentDate < endDate) {
    dates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }
  if (includeEndDate) dates.push(endDate);
  return dates;
};

const msToTime = (msDuration) => {
  const h = Math.floor(msDuration / 1000 / 60 / 60);
  const m = Math.floor((msDuration / 1000 / 60 / 60 - h) * 60);
  const s = Math.floor(((msDuration / 1000 / 60 / 60 - h) * 60 - m) * 60);

  // To get time format 00:00:00
  const seconds = s < 10 ? `0${s}` : `${s}`;
  const minutes = m < 10 ? `0${m}` : `${m}`;
  const hours = h < 10 ? `0${h}` : `${h}`;

  if (hours == "00" && minutes == "00" && seconds == "00") {
    return "On Time";
  }

  const hr = parseInt(hours) % 24;
  const day = Math.floor(parseInt(hours) / 24);
  let daycal = day > 1 ? day + " days " : day > 0 ? day + " day " : "";
  let hh =
    daycal + "" + (hr > 1 ? hr + " hours " : hr > 0 ? hr + " hour " : "");
  let mm =
    parseInt(minutes) > 1
      ? minutes + " minutes "
      : parseInt(minutes) > 0
      ? minutes + " minute "
      : "";
  let ss =
    parseInt(seconds) > 1
      ? seconds + " seconds"
      : parseInt(seconds) > 0
      ? seconds + " second"
      : "";
  return hh + "" + mm;
};

const msToTimeReEdited = (msDuration) => {
  const h = Math.floor(msDuration / 1000 / 60 / 60);
  const m = Math.floor((msDuration / 1000 / 60 / 60 - h) * 60);
  const s = Math.floor(((msDuration / 1000 / 60 / 60 - h) * 60 - m) * 60);

  // To get time format 00:00:00
  const seconds = s < 10 ? `0${s}` : `${s}`;
  const minutes = m < 10 ? `0${m}` : `${m}`;
  const hours = h < 10 ? `0${h}` : `${h}`;

  if (hours == "00" && minutes == "00" && seconds == "00") {
    return "On Time";
  }

  const hr = parseInt(hours) % 24;
  const day = Math.floor(parseInt(hours) / 24);
  let daycal = day > 1 ? day + " day " : day > 0 ? day + " day " : "";
  let hh = daycal + "" + (hr > 1 ? hr + " hrs " : hr > 0 ? hr + " hrs " : "");
  let mm =
    parseInt(minutes) > 1
      ? minutes + " min "
      : parseInt(minutes) > 0
      ? minutes + " min "
      : "";
  let ss =
    parseInt(seconds) > 1
      ? seconds + " sec"
      : parseInt(seconds) > 0
      ? seconds + " sec"
      : "";
  return hh + "" + mm;
};

exports.getDateTimeDifference = (
  delivery_date,
  slot_from,
  dispatch_date_time
) => {
  const delivery_date_time = new Date(delivery_date + " " + slot_from);
  dispatch_date_time = new Date(dispatch_date_time);
  let timer = delivery_date_time - dispatch_date_time;
  return msToTimeReEdited(timer).trim();
};

exports.getDateTimeDifference_without_slotfrom = (
  delivery_date_time,
  dispatch_date_time
) => {
  delivery_date_time = new Date(delivery_date_time);
  dispatch_date_time = new Date(dispatch_date_time);
  let timer = delivery_date_time - dispatch_date_time;
  return msToTimeReEdited(timer).trim();
};

exports.compareWithCurrentTime = (
  delivery_date,
  slot_from,
  dispatch_date_time
) => {
  const delivery_date_time = new Date(delivery_date + " " + slot_from);
  dispatch_date_time = new Date(dispatch_date_time);

  const cur_date_time = new Date();
  //let cur_date_time = cur_date.getFullYear()+'-'+cur_date.getMonth()+'-'+cur_date.getDate()+' '+cur_date.getHours().toLocaleString()+':'+cur_date.getMinutes().toLocaleString()+':'+cur_date.getSeconds().toLocaleString();

  if (dispatch_date_time > cur_date_time) {
    const eta = this.getDateTimeDifference_without_slotfrom(
      delivery_date_time,
      dispatch_date_time
    );
    return { eta, live_eta_update: false };
  } else if (
    dispatch_date_time <= cur_date_time &&
    cur_date_time < delivery_date_time
  ) {
    const eta = this.getDateTimeDifference_without_slotfrom(
      delivery_date_time,
      cur_date_time
    );
    return { eta, live_eta_update: true };
  } else {
    return { eta: "00:00", live_eta_update: false };
  }
};

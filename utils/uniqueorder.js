exports.uniqueorder = () => {
  const d = new Date();
  const uniq = Math.floor(Math.random() * (999 - 100 + 1) + 100);
  let dt = d.getDate();
  let mt = d.getMonth();
  let yr = d.getFullYear();
  let ms = d.getMilliseconds();
  let mn = d.getMinutes();
  let hr = d.getHours();
  let sc = d.getSeconds();
  return (
    "ODR-" +
    ms +
    "R" +
    yr.toString().slice(2, 3) +
    "A" +
    sc +
    "M" +
    mn +
    "D" +
    hr +
    "H" +
    dt +
    "M" +
    mt +
    "S" +
    uniq
  );
};

const months = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

type DateTimeFull = {
  second: string;
  minute: string;
  hour: string;
  day: number;
  month: string;
  year: number;
};

const formatUnixTimestamp = (unix_timestamp: number): DateTimeFull => {
  const date = new Date(unix_timestamp * 1000);

  const second =
    date.getSeconds().toString().split("").length > 1
      ? date.getSeconds().toString()
      : "0" + date.getSeconds();

  const minute =
    date.getMinutes().toString().split("").length > 1
      ? date.getMinutes().toString()
      : "0" + date.getMinutes();

  const hour =
    date.getHours().toString().split("").length > 1
      ? date.getHours().toString()
      : "0" + date.getHours();

  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();

  return { second, minute, hour, day, month, year };
};

export const formatUnixDate = (unix_timestamp: number): string => {
  const { day, month } = formatUnixTimestamp(unix_timestamp);

  return day + " " + month;
};

export const formatUnixDateTime = (unix_timestamp: number): string => {
  const { minute, hour, day, month } = formatUnixTimestamp(unix_timestamp);

  return day + " " + month + ", " + hour + ":" + minute;
};

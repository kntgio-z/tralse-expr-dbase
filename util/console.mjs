export const log = (header, message) => {
  console.log("\x1b[38;2;255;165;0m%s\x1b[0m", `[${header}] ${message}`);
};

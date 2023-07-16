


export function deepFreeze (o) {
  Object.freeze(o);
  if (o === undefined) {
    return o;
  }

  Object.getOwnPropertyNames(o).forEach(function (prop) {
    if (o[prop] !== null
    && (typeof o[prop] === "object" || typeof o[prop] === "function")
    && !Object.isFrozen(o[prop])) {
      deepFreeze(o[prop]);
    }
  });

  return o;
};

export function colorLog(text) {
  console.log('%c' + text, 'background: #222; color: #bada55');
}


export function isUpperCase(string) {
  if (string.toUpperCase() === string) {
  return true;
} else
  return false;
}
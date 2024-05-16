import crypto from 'crypto';

export const randomString = (bytesSize = 32) =>
  crypto.randomBytes(bytesSize).toString('hex');

export const numbersInRangeObject = (begin, end) => {
  if (end < begin) {
    throw Error (`Invalid range because ${end} < ${begin}`);
  }
  let sum = 0;
  let count = 0;
  for (let i = begin; i <= end ; i++) {
      sum += i;
      count++;
  }
  return { sum, count };
};

export const extractPrefixedColumns = ({ prefixedObject, prefix }) => {
  const prefixRegex = new RegExp(`^${prefix}_(.*)`); // "prefix_"로 시작하는 열을 찾기 위한 정규식
  return Object.entries(prefixedObject).reduce((acc, [key, value]) => {
    const match = key.match(prefixRegex);
    if (match) {
      acc[match[1]] = value; // 열 이름에서 접두사를 제거하고 객체에 추가
    }
    return acc;
  }, 
  {},
  );
};


import { describe, expect, test } from '@jest/globals';
import { parseDataVersion, parseAppVersion } from '../src/utils';

describe('parseDataVersion', () => {
  test('220801', () => expect(parseDataVersion('220801')).toEqual(220801));
  test('210000', () => expect(parseDataVersion('210000')).toEqual(210000));
  test('500000', () => expect(parseDataVersion('500000')).toEqual(500000));
  test('200000', () => expect(parseDataVersion('200000')).toEqual(null));
  test('500001', () => expect(parseDataVersion('500001')).toEqual(null));
  test('garbage', () => expect(parseDataVersion('garbage')).toEqual(null));
  test('', () => expect(parseDataVersion('')).toEqual(null));
  test('', () => expect(parseDataVersion(null)).toEqual(null));
});

describe('parseAppVersion', () => {
  test('2022.08.01-1', () => expect(parseAppVersion('2022.08.01-1')).toEqual({ code: 220801, build: 1 }));
  test('2022.08.01-1-Google', () =>
    expect(parseAppVersion('2022.08.01-1-Google')).toEqual({ code: 220801, build: 1, flavor: 'google' }));
  // -debug is ignored
  test('2022.08.01-1-Google-debug', () =>
    expect(parseAppVersion('2022.08.01-1-Google-debug')).toEqual({ code: 220801, build: 1, flavor: 'google' }));
  test('2022.1.1-0', () => expect(parseAppVersion('2022.1.2-0')).toEqual({ code: 220102, build: 0 }));
  test('2099.12.31-999999999', () =>
    expect(parseAppVersion('2099.12.31-999999999')).toEqual({ code: 991231, build: 999999999 }));
  test('2021.01.31-1', () => expect(parseAppVersion('2021.01.31-1')).toEqual(null));
  test('2100.01.31-1', () => expect(parseAppVersion('2100.01.31-1')).toEqual(null));
  test('2022.00.31-1', () => expect(parseAppVersion('2022.00.31-1')).toEqual(null));
  test('2022.13.31-1', () => expect(parseAppVersion('2022.13.31-1')).toEqual(null));
  test('2022.01.00-1', () => expect(parseAppVersion('2022.01.00-1')).toEqual(null));
  test('2022.01.32-1', () => expect(parseAppVersion('2022.01.32-1')).toEqual(null));
  test('202.01.31-1', () => expect(parseAppVersion('2100.01.31-1')).toEqual(null));
  test('2022..31-11', () => expect(parseAppVersion('2100.01.31-1')).toEqual(null));
  test('garbage', () => expect(parseAppVersion('garbage')).toEqual(null));
  test('', () => expect(parseAppVersion('')).toEqual(null));
  test('null', () => expect(parseAppVersion('null')).toEqual(null));
});

import {
  isWebUrl, isFolderLink, getFolderName, isAbsoluteFolderPath, getPathBasename, getFileBadge, buildUri, stripQuotes,
} from './fileLinks';

test('folder paths: Windows, network and Unix are folders; files, links and browser folders are not', () => {
  expect(isAbsoluteFolderPath('C:\\Work\\Clients\\כור סקר')).toBe(true);
  expect(isAbsoluteFolderPath('\\\\Server\\d\\WORK')).toBe(true);
  expect(isAbsoluteFolderPath('/home/office')).toBe(true);
  expect(isAbsoluteFolderPath('C:\\Work\\offer.docx')).toBe(false);
  expect(isAbsoluteFolderPath('https://drive.google.com/x')).toBe(false);
  expect(isAbsoluteFolderPath('folder:כור סקר')).toBe(false);
  expect(isAbsoluteFolderPath('')).toBe(false);
});

test('names and kinds', () => {
  expect(getPathBasename('\\\\Server\\d\\WORK\\fahem\\20340\\')).toBe('20340');
  expect(isFolderLink('folder:x')).toBe(true);
  expect(getFolderName('folder:כור סקר')).toBe('כור סקר');
  expect(isWebUrl('  https://example.com  ')).toBe(true);
  expect(stripQuotes('"C:\\a.docx"')).toBe('C:\\a.docx');
});

test('how a link opens', () => {
  expect(getFileBadge('https://example.com').label).toBe('קישור — נפתח בדפדפן');
  expect(getFileBadge('"C:\\a\\b.xlsx"').label).toBe('Excel — נפתח ב-Excel');
  expect(buildUri('"C:\\a\\b.docx"')).toBe('ms-word:ofe|u|file:///C:/a/b.docx');
  expect(buildUri('https://example.com/x')).toBe('https://example.com/x');
});

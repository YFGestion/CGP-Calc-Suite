import { describe, it, expect, vi } from 'vitest';
import { exportCsv } from '../csv';

describe('exportCsv', () => {
  it('should generate and download a CSV file', () => {
    const mockRows = [
      ['Header1', 'Header2'],
      ['Value1', 'Value2'],
      ['Value3', 'Value4'],
    ];
    const filename = 'test.csv';

    // Mock window.URL.createObjectURL and window.URL.revokeObjectURL
    const createObjectURLMock = vi.fn(() => 'blob:http://localhost/mock-url');
    const revokeObjectURLMock = vi.fn();
    Object.defineProperty(window, 'URL', {
      value: {
        createObjectURL: createObjectURLMock,
        revokeObjectURL: revokeObjectURLMock,
      },
      writable: true,
    });

    // Mock document.createElement('a') and its methods
    const mockLink = {
      href: '',
      download: '',
      style: { visibility: '' },
      click: vi.fn(),
      setAttribute: vi.fn((attr, value) => {
        if (attr === 'href') mockLink.href = value;
        if (attr === 'download') mockLink.download = value;
      }),
    };
    const createElementMock = vi.fn((tagName) => {
      if (tagName === 'a') return mockLink;
      return document.createElement(tagName); // Fallback for other elements
    });
    const appendChildMock = vi.fn();
    const removeChildMock = vi.fn();

    Object.defineProperty(document, 'createElement', {
      value: createElementMock,
      writable: true,
    });
    Object.defineProperty(document.body, 'appendChild', {
      value: appendChildMock,
      writable: true,
    });
    Object.defineProperty(document.body, 'removeChild', {
      value: removeChildMock,
      writable: true,
    });

    exportCsv(filename, mockRows);

    // Check if Blob was created correctly
    expect(createObjectURLMock).toHaveBeenCalledOnce();
    const blob = createObjectURLMock.mock.calls[0][0];
    expect(blob).toBeInstanceOf(Blob);
    // Check for UTF-8 BOM and content
    expect(blob.size).toBe(37); // 3 bytes for BOM + 34 bytes for content "Header1;Header2\nValue1;Value2\nValue3;Value4"
    expect(blob.type).toBe('text/csv;charset=utf-8;');

    // Check if link was created and attributes set
    expect(createElementMock).toHaveBeenCalledWith('a');
    expect(mockLink.setAttribute).toHaveBeenCalledWith('href', 'blob:http://localhost/mock-url');
    expect(mockLink.setAttribute).toHaveBeenCalledWith('download', filename);
    expect(appendChildMock).toHaveBeenCalledWith(mockLink);
    expect(mockLink.click).toHaveBeenCalledOnce();
    expect(removeChildMock).toHaveBeenCalledWith(mockLink);
    expect(revokeObjectURLMock).toHaveBeenCalledWith('blob:http://localhost/mock-url');
  });
});
/**
 * Extract text from various file formats - SERVER SIDE ONLY
 * This module should only be imported in API routes or server components
 */
export async function extractTextFromFile(
  file: Uint8Array,
  mimeType: string
): Promise<string> {
  if (mimeType === 'application/pdf') {
    // Dynamic import to avoid initialization issues
    const pdfParse = (await import('pdf-parse')).default;
    const data = await pdfParse(Buffer.from(file));
    return data.text;
  } else if (mimeType === 'text/plain') {
    return new TextDecoder().decode(file);
  } else if (
    mimeType === 'application/msword' ||
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    // For DOC/DOCX, we'll use the raw text extraction for now
    // In production, you might want to use a proper library like mammoth
    return new TextDecoder().decode(file);
  }
  throw new Error('Unsupported file type');
}
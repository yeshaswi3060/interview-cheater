import Tesseract from 'tesseract.js';

export const extractTextFromImage = async (imageBase64: string): Promise<string> => {
    try {
        const result = await Tesseract.recognize(
            imageBase64,
            'eng',
            {
                logger: m => console.log(m)
            }
        );
        return result.data.text;
    } catch (error) {
        console.error('OCR Error:', error);
        throw new Error('Failed to extract text from image');
    }
};

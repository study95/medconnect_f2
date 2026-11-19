import { useState, useEffect, useRef } from 'react';

/**
 * Custom hook to create a smooth typewriter effect for placeholders
 * @param {string[]} words - Array of strings to cycle through
 * @param {number} typingSpeed - Speed of typing each character in ms
 * @param {number} deletingSpeed - Speed of backspacing each character in ms
 * @param {number} delayBetweenWords - Pause duration when full phrase is typed in ms
 * @param {boolean} showCursor - Whether to append a typing cursor '|'
 */
export function useTypewriter(
  words = [], 
  typingSpeed = 70, 
  deletingSpeed = 30, 
  delayBetweenWords = 1800,
  showCursor = false
) {
  const [index, setIndex] = useState(0);
  const [subIndex, setSubIndex] = useState(0);
  const [reverse, setReverse] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isEmptyPaused, setIsEmptyPaused] = useState(false);

  const wordsKey = Array.isArray(words) ? words.join('~|~') : '';
  const prevWordsKeyRef = useRef(wordsKey);

  // Reset indices smoothly when the words list changes
  useEffect(() => {
    if (prevWordsKeyRef.current !== wordsKey) {
      prevWordsKeyRef.current = wordsKey;
      setIndex(0);
      setSubIndex(0);
      setReverse(false);
      setIsPaused(false);
      setIsEmptyPaused(false);
    }
  }, [wordsKey]);

  useEffect(() => {
    if (!words || words.length === 0) return;

    const currentWord = words[index % words.length] || '';

    // 1. Full word typed: pause so user can read it
    if (isPaused) {
      const timer = setTimeout(() => {
        setIsPaused(false);
        setReverse(true);
      }, delayBetweenWords);
      return () => clearTimeout(timer);
    }

    // 2. Word fully deleted: pause briefly before typing next word
    if (isEmptyPaused) {
      const timer = setTimeout(() => {
        setIsEmptyPaused(false);
        setReverse(false);
        setIndex((prev) => (prev + 1) % words.length);
      }, 400);
      return () => clearTimeout(timer);
    }

    // Reached the end of word typing
    if (subIndex === currentWord.length && !reverse) {
      setIsPaused(true);
      return;
    }

    // Reached empty after deleting
    if (subIndex === 0 && reverse) {
      setIsEmptyPaused(true);
      return;
    }

    // Typing or deleting next character
    const timeout = setTimeout(() => {
      setSubIndex((prev) => prev + (reverse ? -1 : 1));
    }, reverse ? deletingSpeed : typingSpeed);

    return () => clearTimeout(timeout);
  }, [subIndex, index, reverse, isPaused, isEmptyPaused, wordsKey, typingSpeed, deletingSpeed, delayBetweenWords]);

  if (!words || words.length === 0) return '';
  const currentWord = words[index % words.length] || '';
  const cursor = showCursor ? (isPaused ? '' : '|') : '';
  const text = `${currentWord.substring(0, subIndex)}${cursor}`;
  // Return whitespace when text is empty to prevent callers with `text || fallback` from flashing the fallback
  return text || ' ';
}

export default useTypewriter;
